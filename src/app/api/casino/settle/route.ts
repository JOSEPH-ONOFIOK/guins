import { bad } from "@/lib/api";
import { clientIp } from "@/lib/auth";
import { croupierReady, settleBet, topUpCommits } from "@/lib/croupier";
import { store } from "@/lib/store";

// POST { betId } → reveals the croupier's seed for that bet and settles it on chain.
// Anyone may ask: it only ever reveals the one seed that bet was tied to.
export async function POST(req: Request) {
  if (!croupierReady) return bad("Real-$RPENG play isn't set up.", 503);
  if (!(await store.limit(`casino:${clientIp(req)}`, 30, 60))) return bad("Too many requests. Wait a moment.", 429);
  const body = (await req.json().catch(() => ({}))) as { betId?: unknown };
  const raw = String(body.betId ?? "");
  if (!/^\d{1,20}$/.test(raw)) return bad("Unknown bet.");
  try {
    const r = await settleBet(BigInt(raw));
    // Keep commits stocked for the next players (doesn't hold up this answer if it fails)
    await topUpCommits().catch((e) => console.error("commit top-up failed", e));
    return Response.json({ ok: true, alreadySettled: r.done, tx: r.done ? null : r.hash });
  } catch (e) {
    console.error("casino settle failed", raw, e);
    return bad("Couldn't settle that bet right now. If it isn't settled in time, you can claim it.", 502);
  }
}
