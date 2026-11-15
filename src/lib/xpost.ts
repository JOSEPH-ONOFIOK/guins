// Reads a public X post through X's public embed data (the source X's own embeds use).
// No API key needed, but it only sees public posts.

import { X_HANDLE } from "./entry";

const US = X_HANDLE.toLowerCase();
const POST_LINK = /(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/(\w{1,15})\/status(?:es)?\/(\d+)/i;

type PublicPost = { author: string; text: string; quoted?: string; urls: string[] };
type Result = { ok: true; link: string } | { ok: false; error: string };

// The embed endpoint expects a token derived from the post id
const tokenFor = (id: string) => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");

async function fetchPost(id: string): Promise<PublicPost | null> {
  const res = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${tokenFor(id)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const j = await res.json().catch(() => null);
  if (!j?.user?.screen_name || typeof j.text !== "string") return null; // deleted, private or withheld
  return {
    author: String(j.user.screen_name),
    text: j.text,
    quoted: j.quoted_tweet?.id_str ?? undefined,
    // Links in the text show as t.co; these are where they really go
    urls: (j.entities?.urls ?? []).map((u: { expanded_url?: string }) => String(u.expanded_url ?? "")),
  };
}

// A quote of the airdrop post (or, with no post yet, a post tagging us) that includes
// their own invite link
export async function verifyAirdropQrt(link: string, handle: string, postId: string): Promise<Result> {
  const m = POST_LINK.exec(link.trim());
  if (!m) return { ok: false, error: "Paste the link to your post. It looks like x.com/you/status/123…" };
  let post: PublicPost | null;
  try {
    post = await fetchPost(m[2]);
  } catch {
    return { ok: false, error: "We couldn't reach X just now. Try again in a minute." };
  }
  if (!post) return { ok: false, error: "We couldn't find that post. Make sure your account is public and the link is right." };
  if (post.author.toLowerCase() !== handle.toLowerCase()) {
    return { ok: false, error: `That post is from @${post.author}. Post from your own account, @${handle}.` };
  }
  if (postId) {
    if (post.quoted !== postId) return { ok: false, error: "That isn't a quote of our airdrop post. Use the Quote button on it." };
  } else if (!new RegExp(`@${US}\\b`, "i").test(post.text)) {
    return { ok: false, error: `Your post needs to tag @${X_HANDLE}.` };
  }
  const mine = new RegExp(`rpeng\\?ref=${handle}\\b`, "i");
  if (![post.text, ...post.urls].some((t) => mine.test(t))) return { ok: false, error: "Your post needs your own invite link (shown above)." };
  return { ok: true, link: `https://x.com/${post.author}/status/${m[2]}` };
}
