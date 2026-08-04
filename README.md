# JDX Salon POS — Live GoHighLevel Calendar

This project is ready to deploy to Vercel. It keeps the HighLevel Private Integration Token on the server and loads Ann's live appointments into the touchscreen.

## Before using it
The token was visible in a screenshot. Regenerate it in HighLevel and use the new token.

## Deploy
1. Extract the ZIP.
2. In Vercel, choose **Browse / Folder** and select the extracted `salon-pos-vercel` folder.
3. Deploy.
4. Open the Vercel project: **Settings → Environment Variables**.
5. Add:
   - `GHL_API_TOKEN` = new Private Integration Token
   - `GHL_LOCATION_ID` = the salon sub-account Location ID
   - `GHL_ANN_CALENDAR_ID` = Ann's calendar ID (recommended)
   - `ALLOWED_ORIGIN` = `*` for the first test
6. Save and redeploy.

## Test URLs
- `/api/status` — confirms whether the environment variables exist without revealing them
- `/api/calendars` — lists calendars
- `/api/appointments?calendarId=CALENDAR_ID&startTime=START_MS&endTime=END_MS` — loads events
- `/` — touchscreen

## Required HighLevel scopes
- View Calendars — `calendars.readonly`
- View Calendar Events — `calendars/events.readonly`

## What works now
- Opens Ann's booking widget
- Reads Ann's live appointments from HighLevel
- Shows appointments on the touchscreen
- Refreshes every 30 seconds
- Refreshes after closing the booking window

## Not included yet
Creating, editing, canceling, check-in, checkout, payments, and multi-technician live calendars require the next release and additional write scopes.
