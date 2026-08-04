export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

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
      headers: {
        apikey: supabaseKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    return res.status(200).json({
      ok: true,
      appointments: data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
