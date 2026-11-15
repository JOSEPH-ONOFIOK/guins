// $RPENG airdrop application (/rpeng). Shared by the API and the UI.

import { SITE_URL } from "./site";

// The airdrop announcement people comment on, retweet and quote. Empty until the post
// is up: paste its status link here and every step switches to that post.
export const AIRDROP_POST = "";
export const AIRDROP_POST_ID = /\/status(?:es)?\/(\d+)/.exec(AIRDROP_POST)?.[1] ?? "";

// How much of the supply goes back to the community. Placeholder until announced.
export const AIRDROP_SHARE = "1%";

const host = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "");
export const refLink = (handle: string) => `${host}/rpeng?ref=${handle}`;

// Filled in for their quote post
export const qrtText = (handle: string, xHandle: string) =>
  `$RPENG Airdrop Application is Live 🐧\n\n${AIRDROP_SHARE} of $RPENG goes back to the colony.\n\nRegister → ${refLink(handle)}\n\nDrop your wallets.${AIRDROP_POST_ID ? "" : `\n\n@${xHandle}`}`;

export type Airdrop = {
  followed?: boolean;
  commented?: boolean;
  reposted?: boolean;
  qrtLink?: string;
  wallet?: string;
  // Who sent them, and when the application was complete
  invitedBy?: string;
  appliedAt?: number;
};
