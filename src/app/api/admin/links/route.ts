import { bad } from "@/lib/api";
import { isAdmin } from "@/lib/admin";
import { clientIp } from "@/lib/auth";
import { canSaveLinks, cleanPostLink, getLinks, saveLinks, toPublic } from "@/lib/links";
import { store } from "@/lib/store";

// POST { key }                              → current links
// POST { key, pinnedPost, airdropPost }     → saves them (in Upstash, or the Google Sheet)
export async function POST(req: Request) {
  // Slow down anyone guessing the key: 10 tries per 10 minutes per network
  if (!(await store.limit(`admin:${clientIp(req)}`, 10, 600))) return bad("Too many tries. Wait ten minutes.", 429);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!isAdmin(body.key)) return bad("Wrong admin key.", 401);

  const current = await getLinks();
  if (!("pinnedPost" in body) && !("airdropPost" in body)) {
    return Response.json({ links: toPublic(current), canSave: canSaveLinks });
  }

  if (!canSaveLinks) return bad("Saving needs the Google Sheet (GOOGLE_SHEETS_WEBAPP_URL) or Upstash. Until then, edit the links in the code.", 503);
  const pinnedPost = "pinnedPost" in body ? cleanPostLink(body.pinnedPost) : current.pinnedPost;
  const airdropPost = "airdropPost" in body ? cleanPostLink(body.airdropPost) : current.airdropPost;
  if (pinnedPost === null) return bad("The pinned post link isn't an X post link. It looks like x.com/hoodguins/status/123…");
  if (airdropPost === null) return bad("The airdrop post link isn't an X post link. It looks like x.com/hoodguins/status/123…");

  try {
    await saveLinks({ pinnedPost, airdropPost });
  } catch (e) {
    console.error("Saving post links failed", e);
    return bad("Couldn't save. If you just updated Code.gs, deploy it as a new version (see scripts/apps-script/README.md).", 502);
  }
  return Response.json({ links: toPublic(await getLinks()), canSave: true });
}
