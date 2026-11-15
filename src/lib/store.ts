import { cookies } from "next/headers";
import { cookieBase, sign, unsign } from "./auth";
import type { Entry } from "./entry";
import { queueMirror } from "./mirror";

// Storage:
//   Upstash Redis   when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
//                   (shared list, CSV export, one wallet per account across the site).
//   Browser cookie  otherwise: each visitor's progress lives in a signed cookie.

interface Store {
  get(handle: string): Promise<Entry | null>;
  put(entry: Entry): Promise<void>;
  all(): Promise<Entry[]>;
  walletOwner(wallet: string): Promise<string | null>;
  claimWallet(wallet: string, handle: string, previous?: string): Promise<void>;
  // Fixed-window rate limit. Returns true when the call is allowed.
  limit(key: string, max: number, windowSec: number): Promise<boolean>;
}

const key = (h: string) => h.toLowerCase();
const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redis<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result as T;
}

const upstash: Store = {
  async get(handle) {
    const v = await redis<string | null>("GET", `hg:e:${key(handle)}`);
    return v ? (JSON.parse(v) as Entry) : null;
  },
  async put(entry) {
    await redis("SET", `hg:e:${key(entry.handle)}`, JSON.stringify(entry));
    await redis("SADD", "hg:entries", key(entry.handle));
  },
  async all() {
    const handles = await redis<string[]>("SMEMBERS", "hg:entries");
    if (!handles.length) return [];
    const vals = await redis<(string | null)[]>("MGET", ...handles.map((h) => `hg:e:${h}`));
    return vals.filter(Boolean).map((v) => JSON.parse(v!) as Entry);
  },
  walletOwner: (wallet) => redis<string | null>("GET", `hg:w:${wallet.toLowerCase()}`),
  async claimWallet(wallet, handle, previous) {
    if (previous) await redis("DEL", `hg:w:${previous.toLowerCase()}`);
    await redis("SET", `hg:w:${wallet.toLowerCase()}`, key(handle));
  },
  async limit(k, max, windowSec) {
    const n = await redis<number>("INCR", `hg:rl:${k}`);
    if (n === 1) await redis("EXPIRE", `hg:rl:${k}`, windowSec);
    return n <= max;
  },
};

const ENTRY_COOKIE = "hg_entry";
const windows = new Map<string, { n: number; reset: number }>();

const cookie: Store = {
  async get(handle) {
    const e = unsign<Entry>((await cookies()).get(ENTRY_COOKIE)?.value);
    return e && key(e.handle) === key(handle) ? e : null;
  },
  async put(entry) {
    (await cookies()).set({ name: ENTRY_COOKIE, value: sign(entry), ...cookieBase, maxAge: 180 * 86400 });
  },
  async all() {
    return [];
  },
  async walletOwner() {
    return null;
  },
  async claimWallet() {},
  async limit(k, max, windowSec) {
    const now = Date.now();
    const w = windows.get(k);
    if (!w || w.reset < now) {
      windows.set(k, { n: 1, reset: now + windowSec * 1000 });
      return true;
    }
    return ++w.n <= max;
  },
};

export const hasDatabase = !!(URL_ && TOKEN);
const base: Store = hasDatabase ? upstash : cookie;

// Every save is also copied to the Google Sheet, when one is set up
export const store: Store = {
  ...base,
  async put(entry) {
    await base.put(entry);
    queueMirror(entry);
  },
};
