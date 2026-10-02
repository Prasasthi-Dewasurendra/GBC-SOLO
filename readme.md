# Galle Billiards Club Tournament

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

## Step 3 player registration

1. Run `supabase/capture_sessions.sql` in **Supabase Dashboard -> SQL Editor -> New query**. This adds short-lived, one-use sessions for remote phone photos.
2. Deploy `supabase/functions/capture-photo` as the `capture-photo` Edge Function. The function uses the Supabase service role key only in the hosted function environment; never add that key to frontend `.env` files.
3. Install the new frontend dependency and restart Vite:

```bash
npm install
npm run dev
```

4. Sign in at `/login`, open `/admin`, and register a player.
5. Test **Choose photo**, **Use camera**, **Edit**, **Delete**, and the `32`-player limit.
6. For phone capture, click **Phone QR** beside a player. The QR link expires after 10 minutes and can be used once.

For camera access, open the app over HTTPS in production or use `localhost` during development. A DroidCam or Camo phone camera appears in the same camera dropdown as any USB webcam.

## Step 4 draw and Step 5 scoring

1. Sync the latest files to the local checkout, then run `npm install`.
2. Run the pure logic tests:

```bash
npm test
```

3. Register exactly 32 players, open `/admin/draw`, preview or redraw the bracket, and choose **Confirm draw**.
4. Open `/admin/scoring`, select a match, and choose **Start match**.
5. Use **+1 Rack** for scoring and **Undo** only to correct the current live match. When a player reaches the race target, confirm the completion dialog.
6. The winner is advanced automatically. A completed match can only be reopened while its next-round match is still pending.

## Fixing a roster changed after draw confirmation

Run `supabase/lock_roster.sql` in **Supabase Dashboard -> SQL Editor** to prevent future player inserts or deletes after the draw is locked.

If a player was already deleted from a confirmed bracket, repair that rehearsal bracket before continuing:

```sql
update public.tournament set state = 'registration', live_match_id = null where id = 1;
delete from public.matches;
```

Then return to `/admin/draw`, redraw from the current 32-player roster, and confirm the new draw. This repair discards the old unplayed bracket, which is necessary because the deleted player can no longer be identified safely in its old match.

## Step 6 public display

Open `/display` on the club screen. It reads players, matches, and tournament state through Supabase Realtime, so a live match should replace the rotating bracket/up-next scenes within about a second. The display also includes a fullscreen button and a reconnect banner.

If Realtime does not update, check **Supabase Dashboard -> Database -> Publications -> supabase_realtime** and confirm `players`, `matches`, and `tournament` are enabled. Use `localhost` for a laptop test; use the deployed HTTPS URL for the TV or another device.

## Step 7 event safety

- Use **Export CSV** on `/admin` for the player list.
- Use **Export results** on `/admin/scoring` for match results.
- **Reset** requires two confirmations plus typing `RESET`. It clears matches and scores but keeps players.
- Run `supabase/seed_rehearsal.sql` in the Supabase SQL Editor for a fresh 32-player rehearsal roster. It removes only prior `Practice Player` rows and all matches.
- Admin, scoring, and display show an offline banner when the browser loses network access.

## Step 8 deployment

### Before deployment

1. Commit and push the repository to GitHub.
2. Confirm the production build locally:

```bash
npm install
npm test
npm run build
```

### Cloudflare Pages

1. Open **Cloudflare Dashboard -> Workers & Pages -> Create application -> Pages -> Connect to Git**.
2. Select this GitHub repository and the production branch.
3. Use these build settings:
	- Framework preset: `Vite`
	- Build command: `npm run build`
	- Build output directory: `dist`
4. Open **Settings -> Environment variables** and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production.
5. Deploy. Cloudflare's SPA handling keeps React routes such as `/admin/scoring` working after refresh.

Vercel and Netlify can use the same `npm run build` and `dist` settings. The included `vercel.json` provides the SPA rewrite for Vercel.

### Supabase production settings

1. Open **Supabase Dashboard -> Authentication -> URL Configuration**.
2. Set **Site URL** to the deployed HTTPS URL.
3. Add the deployed URL to **Redirect URLs**, including the exact URL used for admin login.
4. Confirm the `capture-photo` Edge Function is deployed and the `capture_sessions` migration is installed.

### Final event checklist

- Run a complete 32-player rehearsal from seed, draw, scoring, advancement, and final.
- Test webcam capture and remote phone capture over the venue Wi-Fi.
- Test the actual club screen in fullscreen at its real resolution.
- Open `/display` in a separate browser or TV device and verify live score updates without refresh.
- Export players and results before resetting any rehearsal data.
- Confirm the admin email, Supabase URL, anon key, Edge Function, and Auth redirect URL.
- Do not put a `service_role` key in frontend environment variables.
- Open the Supabase project a few days before the event because free projects may pause after about one week of inactivity.

## Four-table match operation

Run `supabase/multi_table_matches.sql` in **Supabase Dashboard -> SQL Editor** once for existing databases. New databases receive the same `table_number` column from `supabase/schema.sql`.

On `/admin/scoring`, select a pending match, choose **Table 1**, **Table 2**, **Table 3**, or **Table 4**, and start it. Each table can have one live match, and each live match has its own scoring controls. The database rejects duplicate live assignments to the same table.

The `/display` live scene shows all assigned live matches in a four-card grid with table labels, player photos, names, and rack scores. When no table is live, the display returns to the bracket/up-next rotation.
