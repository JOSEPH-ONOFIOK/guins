"use client";

import { useRef, useState } from "react";
import { rand } from "@/lib/rpeng";
import type { GameProps } from "./types";

// Weighted reel: rarer symbols pay more. Weights add up to 20.
export const SYMBOLS = [
  { s: "💎", w: 1, three: 50 },
  { s: "🐧", w: 3, three: 20 },
  { s: "🪙", w: 2, three: 15 },
  { s: "🐟", w: 4, three: 8 },
  { s: "❄️", w: 5, three: 5 },
  { s: "🧊", w: 5, three: 5 },
];
export const PAIR_PAYS = 1.4;
const TOTAL = SYMBOLS.reduce((t, x) => t + x.w, 0);

function spinOne() {
  let r = rand() * TOTAL;
  for (const x of SYMBOLS) if ((r -= x.w) < 0) return x.s;
  return SYMBOLS[SYMBOLS.length - 1].s;
}

export function payFor(reels: string[]) {
  const [a, b, c] = reels;
  if (a === b && b === c) return { mult: SYMBOLS.find((x) => x.s === a)!.three, note: `Three ${a}! Jackpot line.` };
  if (a === b || b === c || a === c) return { mult: PAIR_PAYS, note: "A pair. Small win." };
  return { mult: 0, note: "No match. Spin again?" };
}

export function Slots({ busy, start, settle }: GameProps) {
  const [reels, setReels] = useState(["🐧", "💎", "🐧"]);
  const [stopped, setStopped] = useState([true, true, true]);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  const spin = () => {
    if (!start()) return;
    const result = [spinOne(), spinOne(), spinOne()];
    setStopped([false, false, false]);
    timers.current = [0, 1, 2].map((i) =>
      setInterval(() => setReels((r) => r.map((v, k) => (k === i ? SYMBOLS[Math.floor(rand() * SYMBOLS.length)].s : v))), 60),
    );
    [0, 1, 2].forEach((i) =>
      setTimeout(() => {
        clearInterval(timers.current[i]);
        setReels((r) => r.map((v, k) => (k === i ? result[i] : v)));
        setStopped((s) => s.map((v, k) => (k === i ? true : v)));
        if (i === 2) {
          const { mult, note } = payFor(result);
          settle(mult, note);
        }
      }, 700 + i * 350),
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bulbs relative rounded-3xl bg-[linear-gradient(180deg,#3a1d6e,#1d0f3d)] p-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,.6)]">
        <div className="flex gap-2 rounded-2xl bg-black/50 p-2 sm:gap-3 sm:p-3">
          {reels.map((s, i) => (
            <div key={i} className="flex h-24 w-20 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#ffffff,#ece6ff_45%,#d4c9ff)] shadow-[inset_0_6px_10px_rgba(0,0,0,.25),inset_0_-6px_10px_rgba(0,0,0,.2)] sm:h-28 sm:w-24">
              <span className={`text-5xl sm:text-6xl ${stopped[i] ? "pop-in" : "blur-[1.5px]"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-sm text-dim">Three of a kind pays big. Any pair pays {PAIR_PAYS}×.</p>
      <button className="btn btn-gold mt-3 min-w-40" disabled={busy} onClick={spin}>
        Pull the lever
      </button>
    </div>
  );
}
