import { authed, bad } from "@/lib/api";
import { ipHash } from "@/lib/auth";
import { TASK_ORDER, WALLET, toPublic, type TaskId } from "@/lib/entry";
import { store } from "@/lib/store";

// POST { task, ... } completes one task for the signed-in account.
//   follow                           clicked follow
//   engage  { action: like|repost }  done once both are clicked
//   comment                          tagged friends + commented on the pinned post
//   wallet  { wallet }               EVM address, one per account
//   post                             shared their Guin on X
export async function POST(req: Request) {
  try {
    const a = await authed(req);
    if ("error" in a) return a.error;
    const { entry, body } = a;
    const task = body.task as TaskId;
    if (!TASK_ORDER.includes(task)) return bad("Unknown task.");
    const now = Date.now();

    if (task === "follow") entry.done.follow ??= now;

    if (task === "engage") {
      if (body.action === "like") entry.liked = true;
      else if (body.action === "repost") entry.reposted = true;
      else return bad("Unknown action.");
      if (entry.liked && entry.reposted) entry.done.engage ??= now;
    }

    if (task === "comment") {
      if (!entry.done.engage) return bad("Like and repost the pinned post first.");
      entry.done.comment ??= now;
    }

    if (task === "wallet") {
      if (!entry.done.follow || !entry.done.engage || !entry.done.comment) return bad("Finish the earlier tasks first.");
      const wallet = String(body.wallet ?? "").trim();
      if (!WALLET.test(wallet)) return bad("That isn't a valid EVM address. It starts with 0x followed by 40 characters.");
      const owner = await store.walletOwner(wallet);
      if (owner && owner !== entry.handle.toLowerCase()) return bad("That wallet already belongs to another colony member.");
      await store.claimWallet(wallet, entry.handle, entry.wallet);
      entry.wallet = wallet;
      if (!entry.done.wallet) {
        entry.done.wallet = now;
        entry.ip = ipHash(req);
      }
    }

    if (task === "post") {
      if (!entry.done.wallet) return bad("Add your wallet first.");
      entry.done.post ??= now;
    }

    entry.updatedAt = now;
    await store.put(entry);
    return Response.json({ entry: toPublic(entry) });
  } catch (e) {
    console.error("task failed", e);
    return bad("Something went wrong. Please try again.", 500);
  }
}
