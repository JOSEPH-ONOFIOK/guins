import { connection } from "next/server";
import { authMode, getSession } from "@/lib/auth";
import { toPublic } from "@/lib/entry";
import { wlRecordEarlier } from "@/lib/holdings";
import { getLinks, toPublic as publicLinks } from "@/lib/links";
import { store } from "@/lib/store";

export async function GET() {
  // Answer at request time: sign in mode and storage come from runtime settings
  await connection();
  const s = await getSession();
  const [entry, links] = await Promise.all([s ? store.get(s.h).catch(() => null) : null, getLinks()]);
  // Claimed before claims were kept on the sheet: add it now, once
  const wl = entry?.wl;
  if (entry && wl?.claimedAt && !wl.spot && wl.wallet && wl.community) {
    const r = await wlRecordEarlier(entry.handle, wl.wallet, wl.community, wl.claimedAt).catch((e) => {
      console.error("Recording an earlier Waddle claim failed", entry.handle, e);
      return null;
    });
    if (r?.ok) {
      wl.spot = r.spot;
      entry.updatedAt = Date.now();
      await store.put(entry);
    }
  }
  // links: the current pinned and airdrop posts (an admin can change them at /admin)
  return Response.json({ entry: entry ? toPublic(entry) : null, auth: authMode, links: publicLinks(links) });
}
