// One crew sign-up and its tasks. Shared by the API routes and the UI.

export type TaskId = "follow" | "engage" | "wallet";

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
};

export const TASK_ORDER: TaskId[] = ["follow", "engage", "wallet"];
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

// The post people like and repost. Empty until it's up: the buttons open the
// profile instead. Paste the post's status link here and they switch to it.
export const PINNED_POST = "";
export const PINNED_ID = /\/status(?:es)?\/(\d+)/.exec(PINNED_POST)?.[1] ?? "";

export function signupRow(e: Entry) {
  const iso = (t?: number) => (t ? new Date(t).toISOString() : "");
  return {
    handle: e.handle,
    wallet: e.wallet ?? "",
    complete: isComplete(e) ? "yes" : "no",
    followed: iso(e.done.follow),
    liked_reposted: iso(e.done.engage),
    wallet_at: iso(e.done.wallet),
    joined_at: iso(e.createdAt),
  };
}
