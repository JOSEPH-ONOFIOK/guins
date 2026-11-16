import { connection } from "next/server";
import { authMode, getSession } from "@/lib/auth";
import { toPublic } from "@/lib/entry";
import { getLinks, toPublic as publicLinks } from "@/lib/links";
import { store } from "@/lib/store";

export async function GET() {
  // Answer at request time: sign in mode and storage come from runtime settings
  await connection();
  const s = await getSession();
  const [entry, links] = await Promise.all([s ? store.get(s.h).catch(() => null) : null, getLinks()]);
  // links: the current pinned and airdrop posts (an admin can change them at /admin)
  return Response.json({ entry: entry ? toPublic(entry) : null, auth: authMode, links: publicLinks(links) });
}
