// The two X posts the site points people at: the pinned post (whitelist tasks) and
// the airdrop announcement. An admin can change them at /admin without a redeploy.
// Where they're kept: Upstash if it's set up, otherwise the Google Sheet's
// "Settings" tab. Empty there (or neither set up) = the links typed into the code:
// PINNED_POST in entry.ts, AIRDROP_POST in airdrop.ts.

import { AIRDROP_POST } from "./airdrop";
import { PINNED_POST } from "./entry";
import { SHEET_URL, sheetCall } from "./sheet";
import { hasDatabase, redis } from "./store";

export type Links = { pinnedPost: string; airdropPost: string };
export type PublicLinks = Links & { pinnedId: string; airdropId: string };

const KEY = "hg:links";
const DEFAULTS: Links = { pinnedPost: PINNED_POST, airdropPost: AIRDROP_POST };

export const postId = (url: string) => /\/status(?:es)?\/(\d+)/.exec(url)?.[1] ?? "";

// Accepts x.com / twitter.com status links (with or without https, www, ?s=…)
// and returns a clean https://x.com/<user>/status/<id>. "" clears it, null = not a post link.
export function cleanPostLink(raw: unknown): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  const m = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/(\w{1,15})\/status(?:es)?\/(\d{5,25})(?:[/?#].*)?$/i.exec(v);
  return m ? `https://x.com/${m[1]}/status/${m[2]}` : null;
}

export const canSaveLinks = hasDatabase || !!SHEET_URL;

// A saved empty value means "use the one in the code"
const merge = (saved: Partial<Links>): Links => ({
  pinnedPost: saved.pinnedPost || DEFAULTS.pinnedPost,
  airdropPost: saved.airdropPost || DEFAULTS.airdropPost,
});

// The sheet answers in about a second, and every visitor asks: keep its answer
// for 30s per server. A save updates it straight away on the server that saved.
const SHEET_TTL = 30_000;
let sheetCache: { at: number; links: Partial<Links> } | null = null;

export async function getLinks(): Promise<Links> {
  try {
    if (hasDatabase) return merge(JSON.parse((await redis<string | null>("GET", KEY)) ?? "{}"));
    if (SHEET_URL) {
      if (!sheetCache || Date.now() - sheetCache.at > SHEET_TTL) {
        const { links } = await sheetCall<{ links: Partial<Links> }>(undefined, "?links");
        sheetCache = { at: Date.now(), links };
      }
      return merge(sheetCache.links);
    }
  } catch (e) {
    console.error("Couldn't read the post links", e);
    if (sheetCache) return merge(sheetCache.links); // last known beats the defaults
  }
  return DEFAULTS;
}

export async function saveLinks(next: Links) {
  if (hasDatabase) return void (await redis("SET", KEY, JSON.stringify(next)));
  const { links } = await sheetCall<{ links: Partial<Links> }>({ action: "links", ...next });
  sheetCache = { at: Date.now(), links };
}

export const toPublic = (l: Links): PublicLinks => ({ ...l, pinnedId: postId(l.pinnedPost), airdropId: postId(l.airdropPost) });
