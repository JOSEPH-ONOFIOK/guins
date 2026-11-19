// Server only: $RPENG airdrop applications and invite counts. In Upstash when it's
// set up, otherwise on the Google Sheet (scripts/apps-script/Code.gs, the "Airdrop" tab).

import { cached } from "./cache";
import { SHEET_URL, sheetCall } from "./sheet";
import { hasDatabase, redis } from "./store";

const useSheet = !hasDatabase && !!SHEET_URL;
// A sheet script older than version 8 doesn't know the airdrop
const oldScript = (e: unknown) => /unknown (request|action)/.test(String(e));

type Applied = { ok: true; invitedBy: string } | { ok: false; reason: "wallet" };

// Records a finished application: one wallet per X account, and credits the inviter.
// Throws when the sheet is busy, so the caller can keep their progress and let them retry.
export async function adApply(handle: string, wallet: string, ref: string, qrt: string, refIsReal: () => Promise<boolean>): Promise<Applied> {
  const me = handle.toLowerCase();
  if (useSheet) {
    try {
      return await sheetCall<Applied>({ action: "apply", handle, wallet, ref, qrt });
    } catch (e) {
      if (!oldScript(e)) throw e;
      return { ok: true, invitedBy: "" };
    }
  }
  if (!hasDatabase) return { ok: true, invitedBy: (await refIsReal()) ? ref : "" };
  const key = `hg:ad:w:${wallet.toLowerCase()}`;
  const took = (await redis<string | null>("SET", key, me, "NX")) === "OK";
  if (!took && (await redis<string | null>("GET", key)) !== me) return { ok: false, reason: "wallet" };
  let invitedBy = "";
  if (ref && (await refIsReal())) {
    invitedBy = ref;
    await redis("ZINCRBY", "hg:ad:invites", 1, ref);
  }
  await redis("SADD", "hg:ad:applied", me);
  return { ok: true, invitedBy };
}

// Applications in all, and how many friends `handle` brought
export async function adStats(handle?: string): Promise<{ applied: number; invites: number }> {
  if (useSheet) {
    try {
      const q = handle ? `?airdrop&handle=${encodeURIComponent(handle.toLowerCase())}` : "?airdrop";
      // The total is the same for everyone: share it for a few seconds
      return handle ? await sheetCall(undefined, q, 15_000) : await cached("adSheet", 5_000, () => sheetCall(undefined, q, 15_000));
    } catch (e) {
      if (oldScript(e)) return { applied: 0, invites: 0 };
      throw e;
    }
  }
  if (!hasDatabase) return { applied: 0, invites: 0 };
  const [applied, invites] = await Promise.all([
    redis<number>("SCARD", "hg:ad:applied"),
    handle ? redis<string | null>("ZSCORE", "hg:ad:invites", handle.toLowerCase()) : null,
  ]);
  return { applied, invites: Number(invites ?? 0) };
}
