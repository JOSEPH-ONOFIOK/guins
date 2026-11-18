// Server only: which Waddle List communities a wallet holds, read live from each chain,
// and the claimed-spot counts.

import { CHAIN_NAMES, COMMUNITIES, WL_CAP, limitOf, type Chain, type WlStats } from "./waddle";
import { hasDatabase, redis } from "./store";

const RPC: Record<Chain, string> = {
  ethereum: process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com",
  robinhood: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
};

// ERC-721 balanceOf(address)
async function balanceOf(chain: Chain, contract: string, wallet: string) {
  const data = "0x70a08231" + wallet.slice(2).toLowerCase().padStart(64, "0");
  const res = await fetch(RPC[chain], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: contract, data }, "latest"] }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const j = await res.json();
  if (j.error || typeof j.result !== "string") throw new Error(j.error?.message ?? `rpc ${res.status}`);
  return BigInt(j.result === "0x" ? 0 : j.result);
}

const once = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch {
    return fn(); // one retry: public RPCs drop the odd request
  }
};

// held: communities with at least one NFT, in list order (OG first). down: chains we couldn't read.
export async function checkHoldings(wallet: string) {
  const live = COMMUNITIES.filter((c) => c.contract);
  const results = await Promise.allSettled(live.map((c) => once(() => balanceOf(c.chain, c.contract, wallet))));
  const held: string[] = [];
  const down = new Set<string>();
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      if (r.value > BigInt(0)) held.push(live[i].name);
    } else down.add(CHAIN_NAMES[live[i].chain]);
  });
  return { held, down: [...down] };
}

const ALL = "hg:wl";
const byKey = (community: string) => `hg:wl:c:${community}`;
const walletKey = (wallet: string) => `hg:wl:w:${wallet.toLowerCase()}`;

// One Waddle List wallet per X account. A wallet is only reserved once its spot is confirmed.
export async function wlWalletOwner(wallet: string) {
  return hasDatabase ? redis<string | null>("GET", walletKey(wallet)) : null;
}

export async function wlClaimedCount() {
  return hasDatabase ? redis<number>("SCARD", ALL) : 0;
}

type Confirm = { ok: true; spot: number; community: string } | { ok: false; reason: "full" | "wallet" | "community" };

// Takes a spot in the first of `candidates` (communities they hold, best first) that
// still has room, and reserves the wallet. Never goes past WL_CAP or a community's
// limit, even when several people confirm at the same moment.
export async function wlConfirm(handle: string, wallet: string, candidates: string[]): Promise<Confirm> {
  if (!hasDatabase) return { ok: true, spot: 0, community: candidates[0] };
  const h = handle.toLowerCase();
  const w = walletKey(wallet);
  const took = (await redis<string | null>("SET", w, h, "NX")) === "OK";
  if (!took && (await redis<string | null>("GET", w)) !== h) return { ok: false, reason: "wallet" };
  const release = async () => {
    if (took) await redis("DEL", w);
  };

  // Community first, then the total: the per-community counts are never behind the total
  let community = "";
  for (const c of candidates) {
    await redis("SADD", byKey(c), h);
    if ((await redis<number>("SCARD", byKey(c))) <= limitOf(c)) {
      community = c;
      break;
    }
    await redis("SREM", byKey(c), h);
  }
  if (!community) {
    await release();
    return { ok: false, reason: "community" };
  }
  await redis("SADD", ALL, h);
  const spot = await redis<number>("SCARD", ALL);
  if (spot > WL_CAP) {
    await redis("SREM", ALL, h);
    await redis("SREM", byKey(community), h);
    await release();
    return { ok: false, reason: "full" };
  }
  return { ok: true, spot, community };
}

// Spots claimed per community, for the communities given
export async function wlCommunityCounts(names: string[]) {
  if (!hasDatabase) return names.map(() => 0);
  return Promise.all(names.map((n) => redis<number>("SCARD", byKey(n))));
}

// Claimed spots in total and per community
export async function wlStats(): Promise<WlStats> {
  if (!hasDatabase) return { claimed: 0, cap: WL_CAP, by: {} };
  const [claimed, counts] = await Promise.all([wlClaimedCount(), wlCommunityCounts(COMMUNITIES.map((c) => c.name))]);
  return { claimed, cap: WL_CAP, by: Object.fromEntries(COMMUNITIES.map((c, i) => [c.name, counts[i]])) };
}
