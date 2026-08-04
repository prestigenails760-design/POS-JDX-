export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
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

    const customerName =
      body.customerName ||
      body.customer_name;

    const phone = body.phone;

    const birthMonth =
      body.birthMonth ||
      body.birthday_month ||
      null;

    const birthDay =
      body.birthDay ||
      body.birthday_day ||
      null;

    const serviceName =
      body.serviceName ||
      body.service_name ||
      "Service";

    const technician =
      body.technician ||
      "Any Technician";

    const date =
      body.date ||
      body.appointment_date;

    const time =
      body.time ||
      body.appointment_time;

    const durationMinutes = Number(
      body.durationMinutes ||
      body.duration ||
      60
    );

    const bufferMinutes = Number(
      body.bufferMinutes ||
      body.buffer ||
      0
    );

    const deposit = Number(body.deposit || 0);
    const status = body.status || "Scheduled";

    if (!customerName || !phone || !date || !time) {
      return res.status(400).json({
        ok: false,
        error: "Customer name, phone, date and time are required"
      });
    }

    const startDate = new Date(`${date}T${time}:00`);

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        ok: false,
        error: "Invalid appointment date or time"
      });
    }

    const endDate = new Date(
      startDate.getTime() +
      (durationMinutes + bufferMinutes) * 60000
    );

    const commonHeaders = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    };

    const salonResponse = await fetch(
      `${supabaseUrl}/rest/v1/salons?select=id&limit=1`,
      {
        headers: commonHeaders
      }
    );

    const salons = await salonResponse.json();

    if (!salonResponse.ok) {
      return res.status(salonResponse.status).json({
        ok: false,
        error: salons
      });
    }

    const salonId = salons?.[0]?.id;

    if (!salonId) {
      return res.status(500).json({
        ok: false,
        error: "Salon record not found"
      });
    }

    const customerSearchUrl =
      `${supabaseUrl}/rest/v1/customers` +
      `?select=id` +
      `&salon_id=eq.${salonId}` +
      `&phone=eq.${encodeURIComponent(phone)}` +
      `&limit=1`;

    const customerSearch = await fetch(customerSearchUrl, {
      headers: commonHeaders
    });

    const customers = await customerSearch.json();

    if (!customerSearch.ok) {
      return res.status(customerSearch.status).json({
        ok: false,
        error: customers
      });
    }

    let customerId = customers?.[0]?.id || null;

    if (!customerId) {
      const customerCreate = await fetch(
        `${supabaseUrl}/rest/v1/customers`,
        {
          method: "POST",
          headers: {
            ...commonHeaders,
            Prefer: "return=representation"
          },
          body: JSON.stringify({
            salon_id: salonId,
            name: customerName,
            phone,
            birth_month: birthMonth,
            birth_day: birthDay
          })
        }
      );

      const createdCustomers = await customerCreate.json();

      if (!customerCreate.ok) {
        return res.status(customerCreate.status).json({
          ok: false,
          error: createdCustomers
        });
      }

      customerId = createdCustomers?.[0]?.id;
    }

    const appointmentCreate = await fetch(
      `${supabaseUrl}/rest/v1/appointments`,
      {
        method: "POST",
        headers: {
          ...commonHeaders,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          salon_id: salonId,
          customer_id: customerId,
          service_name: serviceName,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          duration_minutes: durationMinutes,
          buffer_minutes: bufferMinutes,
          status,
          source: "POS",
          deposit,
          notes: `Technician: ${technician}`
        })
      }
    );

    const appointments = await appointmentCreate.json();

    if (!appointmentCreate.ok) {
      return res.status(appointmentCreate.status).json({
        ok: false,
        error: appointments
      });
    }

    return res.status(200).json({
      ok: true,
      appointment: appointments?.[0]
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
