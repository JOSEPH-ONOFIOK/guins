import { connection } from "next/server";
import { authed, bad } from "@/lib/api";
import { cached } from "@/lib/cache";
import { WALLET, X_HANDLE, toPublic } from "@/lib/entry";
import { checkHoldings, wlClaimedCount, wlCommunityCounts, wlConfirm, wlStats, wlWalletOwner } from "@/lib/holdings";
import { getLinks, postId } from "@/lib/links";
import { store } from "@/lib/store";
import { WL_CAP, limitOf, wlTasksDone } from "@/lib/waddle";
import { verifyClaimComment } from "@/lib/xpost";

// GET → { claimed, cap, by } for the meter
export async function GET() {
  await connection();
  try {
    // Same numbers for everyone: cached here for 15 s, and by the CDN for 15 s
    return Response.json(await cached("wlStats", 15_000, wlStats), {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (e) {
    console.error("waddle stats failed", e);
    return bad("Couldn't load the count.", 500);
  }
}

const FULL = `All ${WL_CAP.toLocaleString("en-US")} Waddle List spots are taken.`;
const fullMsg = (names: string[]) => `${names.join(" and ")} ${names.length > 1 ? "are" : "is"} fully claimed.`;
const downMsg = (down: string[]) => `We couldn't reach ${down.join(" and ")} just now. Try again in a minute.`;

// The communities they hold that still have room, in list order
async function withRoom(names: string[]) {
  const counts = await wlCommunityCounts(names);
  return names.filter((n, i) => counts[i] < limitOf(n));
}

// POST { step, ... } moves the signed-in account through the Waddle List claim.
//   wallet   { wallet }                 checks it holds an NFT from a partner community
//   follow                              clicked follow on our X account
//   engage   { action: like|repost }    clicked like or repost on the pinned post
//   comment  { link }                   comment on the pinned post saying they claimed (checked on X)
//   claim                               retry the final check, if a chain was down
// Once every step is done, the wallet is checked again and the spot is confirmed.
// Only then is the wallet reserved and sent to the sheet.
export async function POST(req: Request) {
  try {
    return await run(req);
  } catch (e) {
    console.error("waddle failed", e);
    return bad("Something went wrong. Please try again.", 500);
  }
}

async function run(req: Request) {
  const a = await authed(req);
  if ("error" in a) return a.error;
  const { entry, body } = a;
  const wl = (entry.wl ??= {});

  if (wl.claimedAt) return Response.json({ entry: toPublic(entry) });

  switch (body.step) {
    case "wallet": {
      const wallet = String(body.wallet ?? "").trim();
      if (!WALLET.test(wallet)) return bad("That isn't a valid EVM address. It starts with 0x followed by 40 characters.");
      const owner = await wlWalletOwner(wallet);
      if (owner && owner !== entry.handle.toLowerCase()) return bad("That wallet already claimed a Waddle List spot on another account.");
      if ((await wlClaimedCount()) >= WL_CAP) return bad(FULL);
      if (!(await store.limit(`wlcheck:${entry.handle.toLowerCase()}`, 10, 600))) return bad("Too many checks. Try again in a few minutes.", 429);

      const { held, down } = await checkHoldings(wallet);
      if (!held.length) {
        if (down.length) return bad(downMsg(down), 503);
        return bad("This wallet doesn't hold an NFT from a partner community.");
      }
      wl.wallet = wallet;
      const open = await withRoom(held);
      if (!open.length) return bad(fullMsg(held));
      wl.community = open[0];
      break;
    }

    case "follow":
      if (!wl.community) return bad("Check your wallet first.");
      wl.followed = true;
      break;

    case "engage":
      if (!wl.community) return bad("Check your wallet first.");
      if (!wl.followed) return bad(`Follow @${X_HANDLE} first.`);
      if (body.action === "like") wl.liked = true;
      else if (body.action === "repost") wl.reposted = true;
      else return bad("Unknown action.");
      break;

    case "comment": {
      if (!wl.community) return bad("Check your wallet first.");
      if (!wl.followed) return bad(`Follow @${X_HANDLE} first.`);
      if (!wl.liked || !wl.reposted) return bad("Like and repost the post first.");
      const { pinnedPost } = await getLinks();
      const r = await verifyClaimComment(String(body.link ?? ""), entry.handle, postId(pinnedPost));
      if (!r.ok) return bad(r.error);
      wl.commentLink = r.link;
      break;
    }

    case "claim":
      if (!wlTasksDone(wl)) return bad("Finish every step first.");
      break;

    default:
      return bad("Unknown step.");
  }

  // Everything done: make sure they still hold before confirming
  if (wlTasksDone(wl) && wl.wallet) {
    const { held, down } = await checkHoldings(wl.wallet);
    let error = "";
    let status = 400;
    if (held.length) {
      // Their checked community first, then anything else they hold
      const candidates = [...held.filter((h) => h === wl.community), ...held.filter((h) => h !== wl.community)];
      const r = await wlConfirm(entry.handle, wl.wallet, candidates);
      if (r.ok) {
        wl.community = r.community;
        wl.claimedAt = Date.now();
        if (r.spot) wl.spot = r.spot;
      } else
        error =
          r.reason === "full"
            ? FULL
            : r.reason === "community"
              ? fullMsg(held)
              : "That wallet was just used by another account. Check another wallet in step 1.";
    } else {
      error = down.length ? downMsg(down) : "Your wallet no longer holds an NFT from a partner community. Check another wallet in step 1.";
      if (down.length) status = 503;
    }
    if (error) {
      // Keep the step they just finished, so they can retry with Confirm my spot
      entry.updatedAt = Date.now();
      await store.put(entry);
      return Response.json({ error, entry: toPublic(entry) }, { status });
    }
  }

  entry.updatedAt = Date.now();
  await store.put(entry);
  return Response.json({ entry: toPublic(entry) });
}
