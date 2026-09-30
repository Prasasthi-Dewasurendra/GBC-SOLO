# GBC Solo Tournament

React + Vite + TypeScript foundation for the Billiard Tournament Management System.

## Step 1 setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase project URL and anon key to `.env.local`.
4. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The initial routes are `/display`, `/login`, `/admin`, and `/capture/:playerId`.

The admin route uses Supabase email/password authentication. The database tables and admin account are created in Step 2.

## Step 2 database setup

1. Open the Supabase Dashboard and select your project.
2. Open **SQL Editor** and choose **New query**.
3. Open `supabase/schema.sql` in this repository, copy the complete file, paste it into the SQL Editor, and choose **Run**.
4. Confirm that the query finishes successfully. It creates the tables, security policies, Realtime configuration, photo bucket, and scoring function.
5. Open **Authentication -> Users -> Add user -> Create new user**.
6. Enter the club administrator email and a strong password. Keep **Auto Confirm User** enabled, then choose **Create user**.
7. Use that email and password at `/login` to test the protected `/admin` route.

The frontend may contain the Supabase anon key, but never place a `service_role` key in `.env.local` or browser code.
