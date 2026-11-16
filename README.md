# Guins

The Guins site: [www.hoodguin.xyz](https://www.hoodguin.xyz). Whitelist application
(sign in with X, then the tasks), the gang line-up, and `/rpeng` with the $RPENG
airdrop, the colony casino (locked for now) and the game wiki.

```bash
npm install
npm run dev     # http://localhost:3000
```

Locally, without X keys, "Sign in with X" becomes a box where you type any handle
(dev mode). That never happens in production.

## Settings

Set these in Vercel (**Project → Settings → Environment Variables**) and in
`.env.local` for local work. Redeploy after changing them.

| Name | Needed for | Value |
| --- | --- | --- |
| `X_CLIENT_ID` | Sign in with X | From the X developer portal (below) |
| `X_CLIENT_SECRET` | Sign in with X | From the X developer portal (below) |
| `SESSION_SECRET` | Sign in with X | Any long random string, e.g. `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | Sign-in redirects, links | `https://www.hoodguin.xyz` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | A shared list of applicants, invite counts, one wallet per account | From an Upstash Redis database. Without these, progress lives in each visitor's browser cookie. |
| `GOOGLE_SHEETS_WEBAPP_URL` | A copy of every application in a Google Sheet, and the admin post links | See [scripts/apps-script/README.md](scripts/apps-script/README.md) |
| `ADMIN_KEY` | CSV export at `/api/admin/export?key=…` | Any long random string |

Sign in with X switches on only when `X_CLIENT_ID` **and** `SESSION_SECRET` are set.
Until then the site shows "Sign-in opens soon".

## Setting up Sign in with X

The site only asks to **read** profiles (scopes `users.read tweet.read`). It can't
post, follow, like or message for anyone.

1. Go to <https://developer.x.com/en/portal/dashboard> and sign in with the
   @hoodguins account (or whichever account should own the app).
2. Open your project's app, or create one (**Projects & Apps → Add App**).
3. In the app, find **User authentication settings** and press **Set up** (or **Edit**).
4. Fill it in like this:
   - **App permissions:** Read
   - **Type of App:** Web App, Automated App or Bot (a *confidential client*)
   - **Callback URI / Redirect URL:** `https://www.hoodguin.xyz/api/auth/x/callback`
   - Add a second one for local testing if you want it: `http://localhost:3000/api/auth/x/callback`
   - **Website URL:** `https://www.hoodguin.xyz`
   - Terms of service and privacy policy links are optional.
5. Save. X shows the **OAuth 2.0 Client ID** and **Client Secret** once. Copy both.
   (Lost the secret? **Keys and tokens → OAuth 2.0 Client ID and Client Secret → Regenerate**.)
6. In Vercel, add `X_CLIENT_ID`, `X_CLIENT_SECRET`, `SESSION_SECRET` and
   `NEXT_PUBLIC_SITE_URL=https://www.hoodguin.xyz`, then redeploy.
7. Open the site and press **Sign in with X**. You should come back to the
   whitelist card on step 02.

The callback must match **exactly**, including `www` and `https`. If the site is
also reachable without `www`, redirect that to `www` in Vercel (**Settings →
Domains**) so everyone signs in on the same address.

| What you see | Cause |
| --- | --- |
| X says "Something went wrong" / redirect mismatch | The callback in the X portal doesn't exactly match `https://www.hoodguin.xyz/api/auth/x/callback` |
| Back on the site with "X didn't answer" | Wrong client secret, or the app isn't set to *Web App* (confidential client) |
| "That took too long" | More than 10 minutes on the X screen, or cookies blocked |
| Still says "Sign-in opens soon" | `X_CLIENT_ID` or `SESSION_SECRET` missing, or not redeployed |

## Admin: changing the post links

Go to **[hoodguin.xyz/admin](https://www.hoodguin.xyz/admin)**, enter the `ADMIN_KEY`, paste
the **pinned post** (whitelist like / repost / reply) and the **airdrop post**
(comment / retweet / quote), and press **Save links**. It's live straight away, no
redeploy. Any X post link works, including share links with `?s=…`. Clear a box and
save to point the buttons back at the @hoodguins profile. The same page has a
**Download sign-ups (CSV)** button.

The links are saved on the **Settings** tab of the Google Sheet
(`GOOGLE_SHEETS_WEBAPP_URL`), or in Upstash if that's connected. Every server
re-reads them within 30 seconds. The sheet needs `Code.gs` version 2 deployed
(see [scripts/apps-script/README.md](scripts/apps-script/README.md)).

## Things to fill in

- Post links: use `/admin` (above). The values in the code are only the fallback:
  `PINNED_POST` in [src/lib/entry.ts](src/lib/entry.ts) and `AIRDROP_POST` in [src/lib/airdrop.ts](src/lib/airdrop.ts).
- `AIRDROP_SHARE` in [src/lib/airdrop.ts](src/lib/airdrop.ts): how much of $RPENG the airdrop gives back.
- `GAMES_LOCKED` in [src/components/casino/Casino.tsx](src/components/casino/Casino.tsx): set to `false` to open the casino.
- `RATE` in [src/lib/rpeng.ts](src/lib/rpeng.ts): the $RPENG ↔ dollar reference rate.

## Sharing and icons

- Favicon and home-screen icons: `src/app/favicon.ico`, `icon.png`, `apple-icon.png`.
- Share cards: `public/og.png` (site) and `public/og-rpeng.png` ($RPENG and the wiki).
- Titles and descriptions: `metadata` in `src/app/layout.tsx` and each page.
