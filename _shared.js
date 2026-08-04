const API_BASE = 'https://services.leadconnectorhq.com';

export function setCors(req, res) {
  const configured = process.env.ALLOWED_ORIGIN || '*';
  const origin = req.headers.origin || '';
  const allowed = configured.split(',').map((v) => v.trim()).filter(Boolean);
  const allowOrigin = configured === '*' ? '*' : (allowed.includes(origin) ? origin : allowed[0]);
  res.setHeader('Access-Control-Allow-Origin', allowOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
}

export function requireConfig(res) {
  if (!process.env.GHL_API_TOKEN || !process.env.GHL_LOCATION_ID) {
    res.status(500).json({
      error: 'Missing Vercel environment variables.',
      required: ['GHL_API_TOKEN', 'GHL_LOCATION_ID']
    });
    return false;
  }
  return true;
}

export async function ghlFetch(path, params = {}) {
  const url = new URL(path, API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GHL_API_TOKEN}`,
      Version: '2021-07-28',
      Accept: 'application/json'
    }
  });

  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!response.ok) {
    const error = new Error(`HighLevel API returned ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}
