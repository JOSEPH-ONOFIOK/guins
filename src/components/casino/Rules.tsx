"use client";

import { Icon, type IconName } from "../Icon";
import { MIN_BET, RATE, START_CHIPS, fmtTok, fmtUsd } from "@/lib/rpeng";
import { FLIP_PAYS } from "./CoinFlip";
import { FOUR_TIERS } from "./FourSeconds";
import { OU_PAYS } from "./OverUnder";
import { PAIR_PAYS, SYMBOLS } from "./Slots";

// How every game works, with the payouts read straight from the game code.
const GAMES = [
  {
    icon: "coin" as IconName,
    name: "Coin Flip",
    how: "Pick a side, $RPENG or Beak, and flip. Land on your side and you win.",
    pays: [[`Your side lands`, `${FLIP_PAYS}×`], ["Other side", "lose bet"]],
  },
  {
    icon: "timer" as IconName,
    name: "4 Seconds",
    how: "Hit Start, then Stop when you think exactly 4.00 seconds have passed. The clock hides after 1.5s, so you're counting in your head. The closer you stop, the more you win. It stops itself at 8s.",
    pays: [...FOUR_TIERS.map((t) => [`${t.name}: within ±${t.within.toFixed(2)}s`, t.pays === 1 ? "bet back" : `${t.pays}×`]), ["Further off", "lose bet"]],
  },
  {
    icon: "dice" as IconName,
    name: "Over / Under 7",
    how: "Two dice are rolled and added up. Call it before the roll: under 7 (2 to 6), exactly 7, or over 7 (8 to 12).",
    pays: [["Under 7", `${OU_PAYS.under}×`], ["Lucky 7", `${OU_PAYS.seven}×`], ["Over 7", `${OU_PAYS.over}×`]],
  },
  {
    icon: "slots" as IconName,
    name: "Guin Slots",
    how: "Pull the lever and three reels spin. Match symbols to win. Rarer symbols pay more.",
    pays: [...SYMBOLS.map((s) => [`${s.s}${s.s}${s.s}`, `${s.three}×`]), ["Any pair", `${PAIR_PAYS}×`]],
  },
];

// The "How to play" article in the wiki
export function Rules() {
  return (
    <div>
      <ol className="well grid gap-3 p-5 text-sm sm:text-base">
        {[
          `Everyone starts with ${fmtTok(START_CHIPS)} play chips (≈ ${fmtUsd(START_CHIPS)}).`,
          `Pick a game, choose your bet with the chips under the table (min ${fmtTok(MIN_BET)}), then play.`,
          "Your bet comes off your balance when the round starts. A win pays your bet × the payout, so a 2× win on 10M gives back 20M (10M profit).",
          `Run out? Top back up to ${fmtTok(START_CHIPS)} any time your balance drops under ${fmtTok(MIN_BET)}.`,
          `Dollar values use the reference rate ${RATE.tokens.toLocaleString("en-US")} $RPENG = ${fmtUsd(RATE.tokens)}. It's for display only.`,
          "Every outcome is decided by your browser's secure random number generator. 4 Seconds is the only one where skill counts.",
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-mono text-gold">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-fg/90">{t}</span>
          </li>
        ))}
      </ol>

      <h4 className="mt-6 mb-3 font-display text-base font-bold text-gold">Payouts at a glance</h4>
      <div className="grid gap-3 xl:grid-cols-2">
        {GAMES.map((g) => (
          <div key={g.name} className="well p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-ink"><Icon name={g.icon} className="h-5 w-5" /></span>
              <h3 className="font-display text-xl font-bold">{g.name}</h3>
            </div>
            <p className="mt-2 text-sm text-dim">{g.how}</p>
            <dl className="mt-3 grid gap-1">
              {g.pays.map(([k, v]) => (
                <div key={k} className="well flex items-center justify-between !rounded-lg px-3 py-1.5 text-sm">
                  <dt>{k}</dt>
                  <dd className={`font-mono font-semibold ${v === "lose bet" ? "text-flame" : "text-gold"}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-dim">
        Play chips are just for fun. They aren&apos;t $RPENG, can&apos;t be bought, and can&apos;t be withdrawn, swapped or cashed out. Your balance is saved in this browser only.
      </p>
    </div>
  );
}
