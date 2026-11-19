// $RPENG airdrop application (/rpeng). Shared by the API and the UI.

import { SITE_URL } from "./site";

// The airdrop application on /rpeng. false = hidden everywhere and the API takes no
// new applications; anything already saved is kept. Set to true to bring it back.
export const AIRDROP_OPEN = true;

// The airdrop announcement people comment on, retweet and quote. This is the
// fallback: an admin can set or change it at /admin (src/lib/links.ts).
export const AIRDROP_POST = "https://x.com/hoodguins/status/2122698823612960934";

// How much of the supply goes back to the community. Placeholder until announced.
export const AIRDROP_SHARE = "3%";

const host = SITE_URL.replace(/^https?:\/\//, "").replace(/^www\./, "");
export const refLink = (handle: string) => `${host}/rpeng?ref=${handle}`;

// Filled in for their quote post. It must keep their invite link: the quote is checked for it.
// hasPost: they're quoting the airdrop post, so no need to tag us in the text
export const qrtText = (handle: string, xHandle: string, hasPost: boolean) =>
  `Just secured my share of $RPENG 🐧\n\n${AIRDROP_SHARE} of the supply goes back to The Colony. Four steps and a wallet, that's it.\n\nGet yours → ${refLink(handle)}${hasPost ? "" : `\n\n@${xHandle}`}`;

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
