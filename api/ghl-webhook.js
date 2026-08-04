function pick(obj, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], obj);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

async function supabaseRequest(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status}: ${text}`);
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const payload = req.body || {};

    const salons = await supabaseRequest(
      "salons?select=id&name=eq.Prestige%20Non-Toxic%20Nail%20Spa&limit=1"
    );

    const salonId = salons?.[0]?.id;

    if (!salonId) {
      throw new Error("Prestige salon record not found");
    }

    const customerName =
      pick(payload, [
        "customerName",
        "contact.name",
        "contact.full_name",
        "full_name",
        "name"
      ]) || "New Customer";

    const phone = pick(payload, [
      "phone",
      "contact.phone"
    ]);

    const email = pick(payload, [
      "email",
      "contact.email"
    ]);

    const serviceName =
      pick(payload, [
        "serviceName",
        "service.name",
        "appointment.serviceName",
        "booking.serviceName",
        "service"
      ]) || "Service Booking";

    const staffName =
      pick(payload, [
        "staffName",
        "staff.name",
        "assignedUser.name",
        "calendar.user.name"
      ]) || "Unassigned";

    const startTime = pick(payload, [
      "startTime",
      "start_time",
      "appointment.startTime",
      "booking.startTime",
      "calendar.startTime"
    ]);

    const endTime = pick(payload, [
      "endTime",
      "end_time",
      "appointment.endTime",
      "booking.endTime",
      "calendar.endTime"
    ]);

    const bookingId = pick(payload, [
      "bookingId",
      "appointmentId",
      "id",
      "appointment.id",
      "booking.id"
    ]);

    if (!startTime) {
      console.log("GHL payload missing startTime:", payload);

      return res.status(400).json({
        ok: false,
        error: "Webhook received, but startTime was not found",
        receivedKeys: Object.keys(payload)
      });
    }

    let customerId = null;

    if (phone) {
      const existing = await supabaseRequest(
        `customers?select=id&salon_id=eq.${salonId}&phone=eq.${encodeURIComponent(phone)}&limit=1`
      );

      customerId = existing?.[0]?.id || null;
    }

    if (!customerId) {
      const created = await supabaseRequest("customers", {
        method: "POST",
        body: JSON.stringify({
          salon_id: salonId,
          name: customerName,
          phone,
          email
        })
      });

      customerId = created?.[0]?.id || null;
    }

    const calculatedEnd =
      endTime ||
      new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

    const appointment = {
      salon_id: salonId,
      customer_id: customerId,
      ghl_appointment_id: bookingId || null,
      service_name: serviceName,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(calculatedEnd).toISOString(),
      status: "New",
      source: "GHL Service Booking",
      notes: `Staff: ${staffName}`
    };

    const saved = await supabaseRequest("appointments", {
      method: "POST",
      headers: bookingId
        ? { Prefer: "resolution=merge-duplicates,return=representation" }
        : { Prefer: "return=representation" },
      body: JSON.stringify(appointment)
    });

    console.log("GHL appointment saved:", saved);

    return res.status(200).json({
      ok: true,
      message: "Booking saved to Supabase",
      appointment: saved?.[0] || appointment
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
