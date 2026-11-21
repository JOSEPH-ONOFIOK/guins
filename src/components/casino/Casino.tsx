"use client";

import Link from "next/link";
import { Icon, type IconName } from "../Icon";
import { ChainLock } from "./ChainLock";
import { useEffect, useRef, useState } from "react";
import { CASINO_OPENS, CASINO_POSTPONED, MIN_BET, RATE_KNOWN, START_CHIPS, fmtTok, fmtUsd } from "@/lib/rpeng";
import { fmtLeft, useNow } from "@/lib/clock";
import { CoinFlip, FLIP_PAYS } from "./CoinFlip";
import { FOUR_TIERS, FourSeconds } from "./FourSeconds";
import { OU_PAYS, OverUnder } from "./OverUnder";
import { PAIR_PAYS, SYMBOLS, Slots } from "./Slots";
import type { GameProps } from "./types";

// brief: the short explainer shown when a game is picked. wiki: its full guide.
const GAMES = [
  { id: "flip", wiki: "flip", name: "Coin Flip", icon: "coin" as IconName, Game: CoinFlip, tag: "50/50 luck", brief: `Call $RPENG or Beak, then flip. Land on your side and win ${FLIP_PAYS}× your bet.` },
  { id: "four", wiki: "four", name: "4 Seconds", icon: "timer" as IconName, Game: FourSeconds, tag: "pure skill", brief: `Start the clock and stop it on exactly 4.00s. It hides after 1.5s. Nail it for ${FOUR_TIERS[0].pays}×, get close for ${FOUR_TIERS[1].pays}× or ${FOUR_TIERS[2].pays}×.` },
  { id: "dice", wiki: "dice", name: "Over / Under 7", icon: "dice" as IconName, Game: OverUnder, tag: "dice luck", brief: `Two dice get added up. Call under 7 or over 7 for ${OU_PAYS.under}×, or exactly 7 for ${OU_PAYS.seven}×.` },
  { id: "slots", wiki: "slots", name: "Guin Slots", icon: "slots" as IconName, Game: Slots, tag: "reel luck", brief: `Pull the lever. Three of a kind pays up to ${SYMBOLS[0].three}× on 💎💎💎, and any pair pays ${PAIR_PAYS}×.` },
] as const;

const CHIPS = [1_000_000, 5_000_000, 10_000_000, 25_000_000, 100_000_000];
const CHIP_COLOR: Record<number, string> = {
  1_000_000: "bg-[#e9e4ff] text-[#3d2bb8]",
  5_000_000: "bg-[#ff6b7d] text-white",
  10_000_000: "bg-[#36c8ff] text-[#062236]",
  25_000_000: "bg-[#4dd9a0] text-[#06301f]",
  100_000_000: "bg-[#17123d] text-[#ffcf3f]",
};

// Locked until CASINO_OPENS (lib/rpeng.ts); set FORCE_LOCK to true to chain the tables up again
const FORCE_LOCK = CASINO_POSTPONED;

const KEY = "guins_casino_v1";
type Result = { id: number; game: string; bet: number; net: number; note: string };

export function Casino() {
  // Chained up until it opens (and while the clock hasn't started, so nothing is playable on first paint)
  const now = useNow();
  const GAMES_LOCKED = FORCE_LOCK || !now || now < CASINO_OPENS;
  const [balance, setBalance] = useState(START_CHIPS);
  const [loaded, setLoaded] = useState(false);
  const [bet, setBet] = useState(5_000_000);
  const [game, setGame] = useState<(typeof GAMES)[number]["id"]>("flip");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Result[]>([]);
  const [flash, setFlash] = useState<Result | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const staked = useRef({ bet: 0, game: "" });

  // Balance lives in this browser only
  useEffect(() => {
    let saved: number | null = null;
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (typeof v?.balance === "number" && v.balance >= 0) saved = v.balance;
    } catch {}
    queueMicrotask(() => {
      if (saved !== null) setBalance(saved);
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ balance }));
    } catch {}
  }, [balance, loaded]);

  const current = GAMES.find((g) => g.id === game)!;

  const start: GameProps["start"] = () => {
    if (busy || GAMES_LOCKED) return false;
    if (bet < MIN_BET) return setWarn(`Minimum bet is ${fmtTok(MIN_BET)}.`), false;
    if (bet > balance) return setWarn("Not enough chips for that bet. Lower it or top up."), false;
    setWarn(null);
    setFlash(null);
    staked.current = { bet, game: current.name };
    setBalance((b) => b - bet);
    setBusy(true);
    return true;
  };

  const settle: GameProps["settle"] = (mult, note) => {
    const { bet: b, game: g } = staked.current;
    const payout = Math.floor(b * mult);
    setBalance((x) => x + payout);
    const r = { id: Date.now(), game: g, bet: b, net: payout - b, note };
    setFlash(r);
    setHistory((h) => [r, ...h].slice(0, 8));
    setBusy(false);
  };

  const broke = loaded && balance < MIN_BET && !busy;
  const Game = current.Game;

  return (
    <div className="glass relative overflow-hidden !rounded-3xl">
      {/* Balance bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-black/20 px-5 py-4 sm:px-7">
        <div>
          <div className="label">your chips</div>
          <div key={balance} className="pop-in font-mono text-3xl font-bold text-gold tabular-nums sm:text-4xl">{fmtTok(balance)}</div>
          <div className="font-mono text-xs text-dim">{RATE_KNOWN ? `≈ ${fmtUsd(balance)} · ` : ""}{balance.toLocaleString("en-US")} play chips</div>
        </div>
        {broke ? (
          <button className="btn btn-accent btn-sm" onClick={() => setBalance(START_CHIPS)}>
            Top up to {fmtTok(START_CHIPS)}
          </button>
        ) : (
          <span className="chip">Free play chips</span>
        )}
      </div>

      {/* Game picker */}
      <div role="tablist" aria-label="Games" className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
        {GAMES.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={g.id === game}
            disabled={busy}
            onClick={() => (setGame(g.id), setFlash(null), setWarn(null))}
            className={`rounded-2xl border px-3 py-3 text-left transition disabled:opacity-50 ${g.id === game ? "border-gold/70 bg-gold/15 shadow-[0_0_24px_-6px_rgba(255,207,63,.6)]" : "border-line bg-white/5 hover:bg-white/10"}`}
          >
            <Icon name={g.icon} className="h-6 w-6 text-accent" />
            <span className="mt-1 block font-display text-sm font-bold">{g.name}</span>
          </button>
        ))}
      </div>

      {/* Short brief for the picked game */}
      <div key={current.id} className="pop-in mx-3 mb-3 flex flex-col gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 sm:mx-4 sm:flex-row sm:items-center sm:gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink"><Icon name={current.icon} className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-display font-bold">
            {current.name}
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-dim uppercase">{current.tag}</span>
          </p>
          <p className="text-sm text-fg/90">{current.brief}</p>
        </div>
        <Link href={`/rpeng/wiki#${current.wiki}`} className="shrink-0 font-mono text-xs text-gold underline underline-offset-4 hover:text-fg">
          full guide →
        </Link>
      </div>

      {/* The table */}
      <div className="felt relative mx-3 rounded-[22px] px-4 py-6 sm:mx-4 sm:px-8">
        {GAMES_LOCKED && <ChainLock label={!FORCE_LOCK && now && now < CASINO_OPENS ? `Opens in ${fmtLeft(CASINO_OPENS - now)}` : "Coming soon"} />}
        {/* While locked the game shows but its buttons are off */}
        <Game bet={bet} busy={busy || GAMES_LOCKED} start={start} settle={settle} />
        {GAMES_LOCKED && <p className="sr-only">This game isn&apos;t open yet.</p>}
        <div className="mt-5 min-h-14 text-center" aria-live="polite">
          {warn && <p className="pop-in font-mono text-sm text-flame">{warn}</p>}
          {flash && (
            <div key={flash.id} className="pop-in">
              <p className={`font-display text-2xl font-bold ${flash.net > 0 ? "text-mint" : flash.net === 0 ? "text-fg" : "text-flame"}`}>
                {flash.net > 0 ? `+${fmtTok(flash.net)}` : flash.net === 0 ? "Push" : `−${fmtTok(-flash.net)}`}
                <span className="ml-2 font-mono text-sm opacity-70">{RATE_KNOWN && flash.net !== 0 && `(${flash.net > 0 ? "+" : "−"}${fmtUsd(Math.abs(flash.net))})`}</span>
              </p>
              <p className="text-sm text-dim">{flash.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bet controls */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="label">bet</div>
          <div className="font-mono text-xl font-bold">
            {fmtTok(bet)} {RATE_KNOWN && <span className="text-sm font-normal text-dim">≈ {fmtUsd(bet)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              disabled={busy || GAMES_LOCKED}
              onClick={() => setBet(c)}
              aria-label={`Bet ${fmtTok(c)}`}
              className={`casino-chip ${CHIP_COLOR[c]} ${bet === c ? "ring-2 ring-gold ring-offset-2 ring-offset-[#1a1236]" : ""}`}
            >
              {fmtTok(c)}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" disabled={busy || GAMES_LOCKED} onClick={() => setBet((b) => Math.max(MIN_BET, Math.floor(b / 2)))}>½</button>
          <button className="btn btn-ghost btn-sm" disabled={busy || GAMES_LOCKED} onClick={() => setBet((b) => Math.max(MIN_BET, Math.min(balance, b * 2)))}>2×</button>
          <button className="btn btn-ghost btn-sm" disabled={busy || GAMES_LOCKED || balance < MIN_BET} onClick={() => setBet(balance)}>Max</button>
        </div>
      </div>

      {/* Recent results */}
      {history.length > 0 && (
        <div className="border-t border-line px-4 py-3 sm:px-6">
          <div className="label mb-2">recent</div>
          <ul className="flex flex-wrap gap-1.5">
            {history.map((r) => (
              <li key={r.id} title={`${r.game}: ${r.note}`} className={`rounded-lg px-2 py-1 font-mono text-xs ${r.net > 0 ? "bg-mint/15 text-mint" : r.net === 0 ? "bg-white/10 text-dim" : "bg-flame/15 text-flame"}`}>
                {r.net > 0 ? "+" : r.net < 0 ? "−" : "±"}
                {fmtTok(Math.abs(r.net))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
