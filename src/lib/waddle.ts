// Waddle List: GTD free-mint spots for holders of partner collections (/waddle).
// Shared by the API and the UI.

import { X_HANDLE } from "./entry";

// The Waddle List post: claimers like, repost and comment on it, and the comment is
// checked against it. Separate from the whitelist's pinned post.
export const WADDLE_POST = "https://x.com/hoodguins/status/2123092860836958534";
export const WADDLE_POST_ID = "2123092860836958534";

export type Chain = "ethereum" | "robinhood";
export const CHAIN_NAMES: Record<Chain, string> = { ethereum: "Ethereum", robinhood: "Robinhood Chain" };

// og: Penguin Frens, the OG NFT communities, shown first and featured
// community: every other partner community
export type Group = "og" | "community";

// contract "" = not checked yet: holders can't claim through it until the address is added
// limit: how many Waddle List spots that community gets
// x: its X account, tagged in the claim comment (Argonauts is tagged through its artist)
// logo: art in public/communities. None yet = its initials on its tint.
export type Community = { name: string; x: string; group: Group; chain: Chain; contract: string; limit: number; logo?: string; tint: string };

export const COMMUNITIES: Community[] = [
  // Penguin Frens / OG NFT communities
  { name: "Pudgy Penguins", x: "pudgypenguins", group: "og", chain: "ethereum", contract: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8", limit: 100, logo: "/communities/pudgy-penguins.jpg", tint: "#9fd8ff" },
  { name: "Lil Pudgys", x: "LilPudgys", group: "og", chain: "ethereum", contract: "0x524cab2ec69124574082676e6f654a18df49a048", limit: 100, logo: "/communities/lil-pudgys.jpg", tint: "#bfe9ff" },
  { name: "Sappy Seals", x: "sappyseals", group: "og", chain: "ethereum", contract: "0x364c828ee171616a39897688a831c2499ad972ec", limit: 100, logo: "/communities/sappy-seals.jpg", tint: "#b69bff" },

  // Waddle communities
  { name: "Souls.club", x: "SoulsClubInc", group: "community", chain: "robinhood", contract: "0xd6889961584a42dc5d8196bd82a4c6d0f2b684c5", limit: 150, logo: "/communities/soul-club.jpg", tint: "#ff8fe0" }, // Digital Humans
  { name: "JPEGZ", x: "JPEGZart", group: "community", chain: "ethereum", contract: "0x9c0da87bbbe41a813461422e0521bc12f5386e28", limit: 100, logo: "/communities/jpegz.jpg", tint: "#ffcf3f" },
  { name: "Original Blokyz", x: "OriginalBlokyz", group: "community", chain: "ethereum", contract: "0x86ffb7988913e85a5a07d459a5165ab1273cfe62", limit: 100, logo: "/communities/blokyz.jpg", tint: "#4fe3ff" },
  { name: "Argonauts", x: "lphaCentauriKid", group: "community", chain: "ethereum", contract: "0x387c41b0b2f1128de44db1bcf8baad085f26392c", limit: 30, logo: "/communities/argonauts.jpg", tint: "#3ee6a8" },
  { name: "Vaultlings", x: "VaultlingsNFT", group: "community", chain: "robinhood", contract: "0x23708e501cbeaa92f45183197c673fdabf993484", limit: 100, logo: "/communities/vaultlings.jpg", tint: "#b69bff" },
  { name: "WIF Outlaws", x: "RobinWifHat", group: "community", chain: "robinhood", contract: "0x12a4c7659a4b7c4a2870b5167c4f8b014c7fa690", limit: 100, logo: "/communities/wif-outlaws.jpg", tint: "#ff6b7d" }, // RobinWifHat
  { name: "Clay StonKz", x: "ClayStonKz", group: "community", chain: "robinhood", contract: "0xde0acefc89d4cf5f4ce45a4fb8a51aa355091b44", limit: 70, logo: "/communities/clay-stonks.jpg", tint: "#ffb169" },
  { name: "CCFF00", x: "CCFF00club", group: "community", chain: "robinhood", contract: "0x505a22ffed8d37ebe580ffd98d2cdb0021189146", limit: 200, logo: "/communities/ccff00.svg", tint: "#ccff00" },
  { name: "TMO Initiates", x: "TMO_RH", group: "community", chain: "robinhood", contract: "0x0d58589536f442da1c192c89232448c23d8b41bb", limit: 50, logo: "/communities/tmo.jpg", tint: "#9fd8ff" },
  { name: "Vamps", x: "vampsonchain", group: "community", chain: "robinhood", contract: "0x93a3ecadfe057b695fe3a98bbd4fd3e4557ca55d", limit: 50, logo: "/communities/vamps.jpg", tint: "#ff6b7d" },
  { name: "Companions by Wfit", x: "CompanionsWfit", group: "community", chain: "robinhood", contract: "0x9224ab1dac093a8062119457c94a6c439e595a4c", limit: 50, logo: "/communities/companions.jpg", tint: "#3ee6a8" },
  { name: "Cash Grab RH", x: "RealCashpig", group: "community", chain: "robinhood", contract: "0x66de4a428a3b890abee81968bcfdb385fe80d22d", limit: 50, logo: "/communities/cash-grab.jpg", tint: "#ffcf3f" },
  { name: "Suited Ape Society", x: "TheSuitedApes", group: "community", chain: "robinhood", contract: "0xe638f58c87258ece6c0eddc46f70327663635c69", limit: 100, logo: "/communities/suited-ape-society.jpg", tint: "#b69bff" },
  { name: "Yield Field Deeds", x: "YieldFields_RH", group: "community", chain: "robinhood", contract: "0x231142e88f523b0a4f46d2d79faab2ce1828e43a", limit: 50, logo: "/communities/yield-field-deeds.jpg", tint: "#3ee6a8" },
  { name: "The Goat Ranch Club", x: "goatranchclub", group: "community", chain: "robinhood", contract: "0x95a85681e28988b4ef503369470b4da7681c4bc8", limit: 150, logo: "/communities/goat-ranch-club.jpg", tint: "#ffb169" },
  { name: "Freedz", x: "freedznft", group: "community", chain: "ethereum", contract: "0x993873f58f0ce4728bbd68dd5fabcb75ef48e7c4", limit: 70, logo: "/communities/freedz.jpg", tint: "#4fe3ff" },
  { name: "Normies", x: "normiesART", group: "community", chain: "ethereum", contract: "0x9eb6e2025b64f340691e424b7fe7022ffde12438", limit: 70, logo: "/communities/normies.jpg", tint: "#f5f3ff" },
];

export const OG = COMMUNITIES.filter((c) => c.group === "og");
export const WADDLE = COMMUNITIES.filter((c) => c.group === "community");

// Every community's spots added up
export const WL_CAP = COMMUNITIES.reduce((n, c) => n + c.limit, 0);

// Claims pause once this many spots are taken (WL_CAP or more = no pause). Raise it to reopen.
export const PAUSE_AT = WL_CAP;
// The most spots that can be claimed right now
export const OPEN_CAP = Math.min(WL_CAP, PAUSE_AT);
export const PAUSED_MSG = `Claims are paused at ${OPEN_CAP.toLocaleString("en-US")} spots for now. Follow @${X_HANDLE} for when they reopen.`;

export const limitOf = (name: string) => COMMUNITIES.find((c) => c.name === name)?.limit ?? 0;
export const communityOf = (name?: string) => COMMUNITIES.find((c) => c.name === name);
export function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : name.slice(0, 2)).toUpperCase();
}

// Public numbers for the meter
// pausedAt: claims stop at this count for now (see PAUSE_AT)
export type WlStats = { claimed: number; cap: number; pausedAt?: number; by: Record<string, number> };

// Filled in for their comment on the pinned post
// How the community is tagged: "@pudgypenguins", or "Argonauts by @lphaCentauriKid" when the handle is the artist's
export const tagOf = (c: Community) => (c.name === "Argonauts" ? `Argonauts by @${c.x}` : `@${c.x}`);
export const claimText = (c: Community) => `Just claimed my Waddle List spot through ${tagOf(c)} 🐧\n\nSee you at the free mint, @${X_HANDLE}`;

export type WaddleList = {
  wallet?: string;
  // The eligible community found in the wallet
  community?: string;
  followed?: boolean;
  liked?: boolean;
  reposted?: boolean;
  commentLink?: string;
  claimedAt?: number;
  // Their place in the queue, 1 to WL_CAP
  spot?: number;
};

// In order: wallet, follow, like and repost, comment
export const wlTasksDone = (w?: WaddleList) => !!(w?.community && w.followed && w.liked && w.reposted && w.commentLink);
