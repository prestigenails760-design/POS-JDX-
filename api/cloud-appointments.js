export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
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
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      });
    }

    const start =
      req.query.start ||
      new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const end =
      req.query.end ||
      new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

    const query =
      `appointments?select=id,service_name,start_time,end_time,status,notes,customers(name,phone)` +
      `&start_time=gte.${encodeURIComponent(start)}` +
      `&start_time=lte.${encodeURIComponent(end)}` +
      `&order=start_time.asc`;

    const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data
      });
    }

    return res.status(200).json({
      ok: true,
      appointments: data
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
