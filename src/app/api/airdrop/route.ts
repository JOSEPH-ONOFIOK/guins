import { connection } from "next/server";
import { authed, bad } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { HANDLE, WALLET, X_HANDLE, toPublic } from "@/lib/entry";
import { adApply, adStats } from "@/lib/airdropStore";
import { store } from "@/lib/store";
import { verifyAirdropQrt } from "@/lib/xpost";
import { getLinks, postId } from "@/lib/links";
import { AIRDROP_OPEN } from "@/lib/airdrop";

// $RPENG airdrop application. Steps must go in order:
//   follow                             clicked follow on our X account
//   engage  { action: comment|repost } clicked comment or retweet on the airdrop post
//   qrt     { link }                   quote of the airdrop post with their invite link (verified)
//   wallet  { wallet, ref? }           EVM wallet, one per X account; completes the application
// GET → { applied, invites } (invites: friends the signed-in account brought)

export async function GET() {
  await connection();
  const s = await getSession();
  try {
    return Response.json(await adStats(s?.h), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("airdrop stats failed", e);
    return Response.json({ applied: 0, invites: 0 }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    return await run(req);
  } catch (e) {
    console.error("airdrop failed", e);
    return bad("Something went wrong. Please try again.", 500);
  }
}

async function run(req: Request) {
  if (!AIRDROP_OPEN) return bad("The airdrop application is closed for now.", 403);
  const a = await authed(req);
  if ("error" in a) return a.error;
  const { entry, body } = a;
  const ad = (entry.ad ??= {});
  const me = entry.handle.toLowerCase();
  if (ad.appliedAt) return Response.json({ entry: toPublic(entry) });

  const needFollow = () => (!ad.followed ? bad(`Follow @${X_HANDLE} first.`) : null);
  const needEngage = () => needFollow() ?? (!ad.commented || !ad.reposted ? bad("Comment on and retweet the airdrop post first.") : null);
  const needQrt = () => needEngage() ?? (!ad.qrtLink ? bad("Quote the airdrop post with your invite link first.") : null);

  switch (body.step) {
    case "follow":
      ad.followed = true;
      break;

    case "engage": {
      const no = needFollow();
      if (no) return no;
      if (body.action === "comment") ad.commented = true;
      else if (body.action === "repost") ad.reposted = true;
      else return bad("Unknown action.");
      break;
    }

    case "qrt": {
      const no = needEngage();
      if (no) return no;
      const r = await verifyAirdropQrt(String(body.link ?? ""), entry.handle, postId((await getLinks()).airdropPost));
      if (!r.ok) return bad(r.error);
      ad.qrtLink = r.link;
      break;
    }

    case "wallet": {
      const no = needQrt();
      if (no) return no;
      const wallet = String(body.wallet ?? "").trim();
      if (!WALLET.test(wallet)) return bad("That isn't a valid EVM address. It starts with 0x followed by 40 characters.");
      // Whoever invited them, if that's another account (checked again where it's stored)
      const raw = String(body.ref ?? "").replace(/^@/, "").toLowerCase();
      const ref = HANDLE.test(raw) && raw !== me ? raw : "";
      const r = await adApply(entry.handle, wallet, ref, ad.qrtLink ?? "", async () => !!ref && !!(await store.get(ref))).catch((e) => {
        console.error("airdrop apply failed", entry.handle, e);
        return null;
      });
      // Busy sheet: their steps are saved, so they only need to press the button again
      if (!r) return bad("Lots of people are applying right now. Your steps are saved: try again in a few seconds.", 503);
      if (!r.ok) return bad("That wallet is already used for the airdrop by another account.");
      ad.wallet = wallet;
      ad.appliedAt = Date.now();
      if (r.invitedBy) ad.invitedBy = r.invitedBy;
      break;
    }

    default:
      return bad("Unknown step.");
  }

  entry.updatedAt = Date.now();
  // The sheet shows the quote link and the finished application; other steps skip the copy
  await store.put(entry, { mirror: body.step === "qrt" || !!ad.appliedAt });
  return Response.json({ entry: toPublic(entry) });
}
