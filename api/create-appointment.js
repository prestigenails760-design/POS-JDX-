export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        ok: false,
        error: "Missing Supabase environment variables"
      });
    }

    const body = req.body || {};

    if (!body.customerName || !body.phone || !body.startTime || !body.endTime) {
      return res.status(400).json({
        ok: false,
        error: "Customer name, phone, start time, and end time are required"
      });
    }

    const salonResponse = await fetch(
      `${supabaseUrl}/rest/v1/salons?select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );

    const salons = await salonResponse.json();
    const salonId = salons?.[0]?.id;

    if (!salonId) {
      return res.status(500).json({
        ok: false,
        error: "Salon record not found"
      });
    }

    let customerId = null;

    const customerLookup = await fetch(
      `${supabaseUrl}/rest/v1/customers?select=id&salon_id=eq.${salonId}&phone=eq.${encodeURIComponent(body.phone)}&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      }
    );

    const existingCustomers = await customerLookup.json();
    customerId = existingCustomers?.[0]?.id || null;

    if (!customerId) {
      const createCustomer = await fetch(
        `${supabaseUrl}/rest/v1/customers`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            salon_id: salonId,
            name: body.customerName,
            phone: body.phone,
            email: body.email || null,
            birth_month: body.birthMonth || null,
            birth_day: body.birthDay || null
          })
        }
      );

      const createdCustomer = await createCustomer.json();
      customerId = createdCustomer?.[0]?.id;
    }

    const appointmentResponse = await fetch(
      `${supabaseUrl}/rest/v1/appointments`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          salon_id: salonId,
          customer_id: customerId,
          service_name: body.serviceName || "Service",
          start_time: body.startTime,
          end_time: body.endTime,
          duration_minutes: body.durationMinutes || 60,
          buffer_minutes: body.bufferMinutes || 0,
          status: body.status || "Scheduled",
          source: "POS",
          deposit: body.deposit || 0,
          notes: body.notes || null
        })
      }
    );

    const appointment = await appointmentResponse.json();

    if (!appointmentResponse.ok) {
      return res.status(appointmentResponse.status).json({
        ok: false,
        error: appointment
      });
    }

    return res.status(200).json({
      ok: true,
      appointment: appointment?.[0]
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
