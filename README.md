# IT Helpdesk

A small IT ticketing tool built with Next.js and Postgres, ready for Vercel.

- `/` – employees raise a ticket and get a ticket number (IT-0001, IT-0002, …)
- `/track` – employees check status and reply, using ticket number + email
- `/admin` – IT team dashboard (password protected): filter, search, assign, change status/priority, post updates, export CSV, delete

## Deploy on Vercel

1. Put this folder in a GitHub repository (github.com > New repository > upload files).
2. On vercel.com choose **Add New > Project** and import that repository. Click **Deploy**.
3. In the project open **Storage > Create Database > Neon (Postgres)** and connect it to the project. This adds `DATABASE_URL` automatically.
4. In **Settings > Environment Variables** add `ADMIN_PASSWORD` with a strong password for the IT team.
5. Open **Deployments** and **Redeploy** so the new variables are used.

Tables are created automatically on first use.

Without `DATABASE_URL` the app runs in demo mode: tickets are held in memory and are lost. Do not use demo mode for real tickets.

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
