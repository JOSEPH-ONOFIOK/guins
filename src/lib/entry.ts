// One colony sign-up and its tasks. Shared by the API routes and the UI.

import type { Airdrop } from "./airdrop";
import type { WaddleList } from "./waddle";

export type TaskId = "follow" | "engage" | "comment" | "wallet" | "post";

export type Entry = {
  handle: string;
  xid?: string;
  createdAt: number;
  updatedAt: number;
  // When each task was completed
  done: Partial<Record<TaskId, number>>;
  wallet?: string;
  // Like and repost are tracked separately; "engage" completes when both are clicked
  liked?: boolean;
  reposted?: boolean;
  ip?: string;
  // $RPENG airdrop application (/rpeng), separate from the colony tasks
  ad?: Airdrop;
  // Waddle List community claim (/waddle), separate again
  wl?: WaddleList;
};

export const TASK_ORDER: TaskId[] = ["follow", "engage", "comment", "wallet", "post"];
export const isComplete = (e: Pick<Entry, "done">) => TASK_ORDER.every((t) => e.done[t]);

export type PublicEntry = Omit<Entry, "xid" | "ip">;
export function toPublic(e: Entry): PublicEntry {
  const copy = { ...e };
  delete copy.xid;
  delete copy.ip;
  return copy;
}

export const WALLET = /^0x[0-9a-fA-F]{40}$/;
export const HANDLE = /^\w{1,15}$/;

export const X_HANDLE = "hoodguins";
export const X_URL = `https://x.com/${X_HANDLE}`;

// The post people like, repost and reply to. This is the fallback: an admin can
// set or change it at /admin (src/lib/links.ts). Empty = the buttons open the profile.
export const PINNED_POST = "https://x.com/hoodguins/status/2123816618396614944?a=yDdXrOQLnTtByu3zWAQ&s=20";

export type SignupRow = ReturnType<typeof signupRow>;

export function signupRow(e: Entry) {
  const iso = (t?: number) => (t ? new Date(t).toISOString() : "");
  return {
    handle: e.handle,
    wallet: e.wallet ?? "",
    complete: isComplete(e) ? "yes" : "no",
    followed: iso(e.done.follow),
    liked_reposted: iso(e.done.engage),
    tagged_commented: iso(e.done.comment),
    wallet_at: iso(e.done.wallet),
    posted: iso(e.done.post),
    joined_at: iso(e.createdAt),
    updated_at: iso(e.updatedAt),
    airdrop_wallet: e.ad?.appliedAt ? (e.ad.wallet ?? "") : "",
    airdrop_qrt: e.ad?.qrtLink ?? "",
    airdrop_invited_by: e.ad?.invitedBy ?? "",
    airdrop_at: iso(e.ad?.appliedAt),
    waddle_wallet: e.wl?.claimedAt ? (e.wl.wallet ?? "") : "",
    waddle_community: e.wl?.claimedAt ? (e.wl.community ?? "") : "",
    waddle_spot: e.wl?.spot ? String(e.wl.spot) : "",
    waddle_comment: e.wl?.commentLink ?? "",
    waddle_at: iso(e.wl?.claimedAt),
  };
}
