import { ghlFetch, requireConfig, setCors } from './_shared.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireConfig(res)) return;

  try {
    const data = await ghlFetch('/calendars/', {
      locationId: process.env.GHL_LOCATION_ID
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message, details: error.details || null });
  }
}
