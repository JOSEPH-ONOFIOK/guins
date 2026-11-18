# Guins whitelist sheet: deploy guide

`Code.gs` is a Google Apps Script web app that keeps a readable list of every
whitelist application in a Google Sheet. One row per X handle, covering the
colony tasks on the home page and the $RPENG airdrop on `/rpeng`.

It also stores the two post links you set at `/admin` (pinned post, airdrop post)
on a **Settings** tab, so the site doesn't need any other database for them.

The site saves to its own storage first (Upstash, or a signed cookie before
Upstash is connected) and then copies the row here in the background. Visitors
never wait for the sheet, and if it goes down the site keeps working. Without
Upstash, this sheet is the only shared list of applicants.

## 1. Make the spreadsheet

1. Go to <https://sheets.new> and name it something like `Guins Whitelist`.
2. Leave it empty. The script creates its `Whitelist` tab on the first save.

## 2. Add the script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the placeholder `myFunction` code.
3. Paste the whole contents of [Code.gs](Code.gs).
4. Save (⌘S / Ctrl+S).

## 3. Check it works

In the editor, pick `selfTest` in the function dropdown, press **Run**, allow
the permissions Google asks for, then open **Execution log**. The last line
should read:

```
PASS. Delete the "selftest" row before going live.
```

Delete the `selftest` row from the `Whitelist` tab.

## 4. Deploy it

1. **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. **Deploy**, then **Authorize access**. Google warns the app is unverified;
   that's expected for your own script. Choose **Advanced → Go to (project name)**.
5. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy.../exec`.

"Anyone" is required because the site calls the URL from its server without
Google credentials. There's no secret, so anyone who has this URL can add rows.
Keep it out of the repo and out of anything public. The sheet itself stays private.

## 5. Point the site at it

Add this to the site's environment variables (Vercel: **Project → Settings →
Environment Variables**, or `.env.local` when running locally), then redeploy:

```
GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/AKfy.../exec
```

To check, open the web app URL with `?version` on the end. It shows the script
version. `?stats` shows how many have applied, finished the whitelist, and
applied for the airdrop.

## Re-deploying after an edit (do this now for version 2)

Pasting new code into the editor isn't enough: the live URL keeps running the
old version until you deploy. A *new deployment* gets a *new URL*, so update
the existing one instead:

1. Paste the whole new `Code.gs` over the old one and save.
2. **Deploy → Manage deployments → pencil icon (edit) → Version: New version → Deploy**.
3. Check: open the web app URL with `?version` on the end. It should say `{"version":5}`.
4. Open `https://www.hoodguin.xyz/api/admin/resync?key=ADMIN_KEY` once. It sends
   every saved row again, so rows saved while the old script was live get the
   new columns (such as Waddle claims made before the update).

The URL stays the same, so nothing changes in Vercel.

## What lands in the sheet

| Column | Value |
| --- | --- |
| X Handle | Their X username |
| Wallet | The EVM wallet from the whitelist tasks (updates if they change it) |
| Whitelisted | `yes` once all whitelist tasks are done. Stays `yes`. |
| Followed, Liked + Reposted, Tagged + Commented, Wallet Added, Posted Guin | When they did each task (UTC) |
| Joined At, Updated At | When they first connected X, and their latest change (UTC) |
| $RPENG Airdrop Wallet, $RPENG Airdrop At | Wallet and time of a complete airdrop application |
| $RPENG Airdrop QRT | Link to their verified quote post |
| $RPENG Airdrop Invited By | Who invited them to the airdrop |
| Waddle Wallet, Waddle Community | The wallet that claimed a Waddle List spot, and the partner community it holds |
| Waddle Spot | Their place in the Waddle List queue |
| Waddle Comment, Waddle Claimed At | Link to their claim comment on the pinned post, and when the spot was confirmed (UTC) |

Sorting or filtering the tab is safe: rows are found by handle, never by
position. Filled-in cells are kept, so someone who clears their browser and
starts again keeps their row. Values that start like a formula (`=`, `+`, `-`,
`@`) are stripped, so nobody can plant a formula in your sheet.

**Waddle List** has one row per claimed spot: Spot, X Handle, Wallet, Community,
Claimed At. When Upstash isn't set up, the site counts claims from this tab (the
progress bar and each community's limit) and refuses a wallet that is already on
it. Claims go through one at a time, so the limits are never passed. Deleting a
row frees that spot.

Claims made before this tab existed are added two ways. Run
`importEarlierClaims` once from the Apps Script editor (pick it in the function
menu, then Run) to copy any saved on the Whitelist tab. Claims that only lived in
someone's browser are added the next time they open the site. Both count even if
a community is already full, since those spots were already promised.

**Settings** has the post links from `/admin`: `pinnedPost` and `airdropPost`,
each with when it was last changed. Only X post links can be saved there. The
site re-reads them every 30 seconds, so a change made straight in the sheet
also shows up within half a minute.

For exact invite counts, use the CSV export at `/api/admin/export?key=...`,
which reads the site's own storage.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Sheets web app returned 401/403` in the server logs | Access isn't "Anyone", or the deployment was never authorised |
| Edits to `Code.gs` have no effect | Saved but not deployed as a new version |
| Nothing arrives at all | `GOOGLE_SHEETS_WEBAPP_URL` missing, or the site wasn't redeployed after adding it |
