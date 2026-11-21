"use client";

import { fmtLeft, useNow } from "@/lib/clock";
import { CASINO_OPENS, CASINO_POSTPONED, POSTPONED_LABEL } from "@/lib/rpeng";

// "The Colony Casino · opens in 00:23:51" until it opens, then "· open now"
export function CasinoLabel() {
  const now = useNow();
  const status = CASINO_POSTPONED ? POSTPONED_LABEL.toLowerCase() : !now ? "" : now < CASINO_OPENS ? `opens in ${fmtLeft(CASINO_OPENS - now)}` : "open now";
  return (
    <p className="label label-accent">
      The Colony Casino{status && <> · <span className="tabular-nums">{status}</span></>}
    </p>
  );
}
