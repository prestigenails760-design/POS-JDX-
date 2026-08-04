export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const payload = req.body || {};

    console.log("GHL webhook received:", payload);

    return res.status(200).json({
      ok: true,
      message: "Webhook received"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
