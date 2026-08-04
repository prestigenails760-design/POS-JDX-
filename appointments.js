import { ghlFetch, requireConfig, setCors } from './_shared.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireConfig(res)) return;

  const { startTime, endTime } = req.query;
  const calendarId = req.query.calendarId || process.env.GHL_ANN_CALENDAR_ID;

  if (!startTime || !endTime) {
    return res.status(400).json({ error: 'startTime and endTime are required.' });
  }
  if (!calendarId) {
    return res.status(400).json({ error: 'calendarId is required. Set GHL_ANN_CALENDAR_ID or pass calendarId.' });
  }

  try {
    const data = await ghlFetch('/calendars/events', {
      locationId: process.env.GHL_LOCATION_ID,
      calendarId,
      startTime,
      endTime
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
