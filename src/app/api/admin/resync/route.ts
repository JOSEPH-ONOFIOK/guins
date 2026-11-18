import { bad } from "@/lib/api";
import { isAdmin } from "@/lib/admin";
import { clientIp } from "@/lib/auth";
import { signupRow } from "@/lib/entry";
import { SHEET_URL, sheetCall } from "@/lib/sheet";
import { store } from "@/lib/store";

// The sheet gets a few hundred rows per run, a batch at a time
export const maxDuration = 300;

const BATCH = 50;

// GET /api/admin/resync?key=ADMIN_KEY → sends every saved row to the Google Sheet again.
// Run it once after deploying a new Code.gs, so rows saved while the old script
// was live pick up the new columns (like the Waddle claims). Filled cells are kept.
export async function GET(req: Request) {
  if (!(await store.limit(`admin:${clientIp(req)}`, 10, 600))) return bad("Too many tries. Wait ten minutes.", 429);
  if (!isAdmin(new URL(req.url).searchParams.get("key"))) return new Response("Not found", { status: 404 });
  if (!SHEET_URL) return bad("GOOGLE_SHEETS_WEBAPP_URL isn't set.", 503);

  const { version } = await sheetCall<{ version?: number }>(undefined, "?version");
  const rows = (await store.all()).map(signupRow);
  let saved = 0;
  try {
    for (let i = 0; i < rows.length; i += BATCH) {
      const r = await sheetCall<{ saved: number }>({ action: "bulk", rows: rows.slice(i, i + BATCH) }, "", 120_000);
      saved += r.saved;
    }
  } catch (e) {
    console.error("Sheet resync failed", e);
    return Response.json({ error: String(e), scriptVersion: version, rows: rows.length, saved }, { status: 502 });
  }
  const claims = rows.filter((r) => r.waddle_at).length;
  return Response.json({ scriptVersion: version, rows: rows.length, saved, waddleClaims: claims });
}
