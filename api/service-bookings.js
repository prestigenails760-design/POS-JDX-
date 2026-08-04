import { ghlFetch, requireConfig, setCors } from "./_shared.js";

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  if (!requireConfig(res)) return;

  const { startTime, endTime, serviceLocationId } = req.query;

  if (!startTime || !endTime) {
    return res.status(400).json({
      ok: false,
      error: "startTime and endTime are required"
    });
  }

  try {
    const params = {
      locationId: process.env.GHL_LOCATION_ID,
      startTime,
      endTime
    };

    if (serviceLocationId) {
      params.serviceLocationId = serviceLocationId;
    }

    const data = await ghlFetch(
      "/calendars/services/bookings",
      params
    );

    return res.status(200).json({
      ok: true,
      source: "GoHighLevel Service Menu",
      data
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      error: error.message,
      details: error.details || null
    });
  }
}
