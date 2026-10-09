# IT Helpdesk

A small IT ticketing tool built with Next.js and Postgres, ready for Vercel.

- `/` – employees raise a ticket and get a ticket number (IT-0001, IT-0002, …)
- `/track` – employees check status and reply, using ticket number + email
- `/admin` – IT team dashboard (password protected): filter, search, assign, change status/priority, post updates, export CSV, delete

## Deploy on Vercel

1. On vercel.com choose **Add New > Project** and import this repository. Click **Deploy**.
2. Set up storage: Google Sheets (below) or Postgres.
3. In **Settings > Environment Variables** add `ADMIN_PASSWORD` with a strong password for the IT team.
4. Open **Deployments** and **Redeploy** so the new variables are used.

Without storage the app runs in demo mode: tickets are held in memory and are lost. Do not use demo mode for real tickets.

## Save tickets in Google Sheets

Tickets and updates are stored in a Google Sheet in your own Google account. The sheet is the live data: a status you change in the sheet shows in the app too.

1. Create a new Google Sheet (sheets.new) and name it, for example, "IT Helpdesk Tickets".
2. In the sheet open **Extensions > Apps Script**. Delete the sample code and paste everything from `google-sheets/Code.gs`.
3. On the `SECRET` line near the top, replace the placeholder with a long random secret of your own. Save.
4. Click **Deploy > New deployment**, choose type **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**. Allow the permissions Google asks for.
5. Copy the **Web app URL** (it ends in `/exec`).
6. In Vercel add two environment variables and redeploy:
   - `SHEETS_WEBAPP_URL` = the web app URL
   - `SHEETS_SECRET` = the same secret you put in the script

The `Tickets` and `Comments` tabs are created automatically when the first ticket is raised.

Notes:
- If you edit the script later, use **Deploy > Manage deployments > Edit > New version**, otherwise the old code keeps running.
- Do not rename the tabs, reorder the columns or edit the "Ticket No" column.
- Keep the secret private. Anyone with both the URL and the secret can read and change tickets.
- On a company Google Workspace account the "Anyone" option can be disabled by the administrator. In that case use a personal Google account for the sheet, or ask the administrator to allow it.

## Postgres instead of Google Sheets

Leave the two `SHEETS_` variables empty. In Vercel open **Storage > Create Database > Neon (Postgres)** and connect it; this adds `DATABASE_URL`. Tables are created automatically.

## Run locally

```
npm install
cp .env.example .env.local   # fill in the two values
npm run dev
```

## Customise

- Categories, priorities and statuses: `lib/constants.js`
- Colours and layout: `app/globals.css`
- Site name: `app/layout.js`
