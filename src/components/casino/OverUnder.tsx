"use client";

import { useRef, useState } from "react";
import { rand } from "@/lib/rpeng";
import type { GameProps } from "./types";

type Pick = "under" | "seven" | "over";
export const OU_PAYS: Record<Pick, number> = { under: 2.3, seven: 5, over: 2.3 };
const LABEL: Record<Pick, string> = { under: "Under 7", seven: "Lucky 7", over: "Over 7" };

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const roll = () => 1 + Math.floor(rand() * 6);

function Die({ n, rolling }: { n: number; rolling: boolean }) {
  return (
    <div className={`grid h-20 w-20 grid-cols-3 grid-rows-3 gap-1 rounded-2xl bg-[linear-gradient(160deg,#ffffff,#e9e4ff)] p-3 shadow-[0_8px_0_#c9c0f0,0_14px_30px_rgba(0,0,0,.4)] sm:h-24 sm:w-24 ${rolling ? "animate-[shake_.15s_linear_infinite]" : "pop-in"}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto h-3 w-3 rounded-full sm:h-3.5 sm:w-3.5 ${PIPS[n].includes(i) ? (n === 1 ? "bg-flame" : "bg-[#17123d]") : ""}`} />
      ))}
    </div>
  );
}

export function OverUnder({ busy, start, settle }: GameProps) {
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const play = (pick: Pick) => {
    if (!start()) return;
    setRolling(true);
    timer.current = setInterval(() => setDice([roll(), roll()]), 70);
    setTimeout(() => {
      clearInterval(timer.current);
      const a = roll(), b = roll(), sum = a + b;
      setDice([a, b]);
      setRolling(false);
      const hit = pick === "seven" ? sum === 7 : pick === "under" ? sum < 7 : sum > 7;
      settle(hit ? OU_PAYS[pick] : 0, `Rolled ${sum}. ${hit ? `${LABEL[pick]} hits!` : `${LABEL[pick]} misses.`}`);
    }, 900);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex h-44 items-center gap-5 sm:h-52">
        <Die n={dice[0]} rolling={rolling} />
        <Die n={dice[1]} rolling={rolling} />
      </div>
      <p className="mt-2 font-mono text-sm text-dim">total <span className="text-lg font-bold text-fg">{rolling ? "…" : dice[0] + dice[1]}</span></p>
      <div className="mt-3 grid w-full max-w-sm grid-cols-3 gap-2">
        {(["under", "seven", "over"] as const).map((p) => (
          <button key={p} className={`btn flex-col !gap-0 !px-2 ${p === "seven" ? "btn-gold" : "btn-ghost"}`} disabled={busy} onClick={() => play(p)}>
            <span>{LABEL[p]}</span>
            <span className="font-mono text-[11px] opacity-70">{OU_PAYS[p]}×</span>
          </button>
        ))}
      </div>
    </div>
  );
}
