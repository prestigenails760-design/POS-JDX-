export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  return res.status(200).json({
    ok: true,
    ready: Boolean(
      process.env.GHL_API_TOKEN &&
      process.env.GHL_LOCATION_ID
    ),
    hasToken: Boolean(process.env.GHL_API_TOKEN),
    hasLocationId: Boolean(process.env.GHL_LOCATION_ID)
  });
}
