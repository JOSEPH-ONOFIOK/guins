// $RPENG airdrop application (/rpeng). Shared by the API and the UI.

import { SITE_URL } from "./site";

// The airdrop application on /rpeng. false = hidden everywhere and the API takes no
// new applications; anything already saved is kept. Set to true to bring it back.
export const AIRDROP_OPEN = false;

// The airdrop announcement people comment on, retweet and quote. This is the
// fallback: an admin can set or change it at /admin (src/lib/links.ts).
export const AIRDROP_POST = "";

// How much of the supply goes back to the community. Placeholder until announced.
export const AIRDROP_SHARE = "1%";

const host = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "");
export const refLink = (handle: string) => `${host}/rpeng?ref=${handle}`;

// Filled in for their quote post
// hasPost: they're quoting the airdrop post, so no need to tag us in the text
export const qrtText = (handle: string, xHandle: string, hasPost: boolean) =>
  `$RPENG Airdrop Application is Live 🐧\n\n${AIRDROP_SHARE} of $RPENG goes back to the colony.\n\nRegister → ${refLink(handle)}\n\nDrop your wallets.${hasPost ? "" : `\n\n@${xHandle}`}`;

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
