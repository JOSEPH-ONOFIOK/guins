"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

// Stop the clock at exactly 4.00 seconds. The clock hides after 1.5s, so it's all feel.
export const TARGET = 4;
const VISIBLE_FOR = 1.5;
const GIVE_UP = 8;
export const FOUR_TIERS = [
  { within: 0.05, pays: 10, name: "Perfect" },
  { within: 0.15, pays: 3, name: "Sharp" },
  { within: 0.3, pays: 1.5, name: "Close" },
  { within: 0.5, pays: 1, name: "Push" },
];

export function FourSeconds({ busy, start, settle }: GameProps) {
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const [final, setFinal] = useState<number | null>(null);
  const t0 = useRef(0);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const finish = (t: number) => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    setFinal(t);
    setShown(t);
    const d = Math.abs(t - TARGET);
    const tier = FOUR_TIERS.find((x) => d <= x.within);
    settle(tier ? tier.pays : 0, tier ? `${t.toFixed(2)}s. ${tier.name}!` : `${t.toFixed(2)}s. Off by ${d.toFixed(2)}s.`);
  };

  const go = () => {
    if (running) return finish((performance.now() - t0.current) / 1000);
    if (!start()) return;
    setFinal(null);
    setRunning(true);
    t0.current = performance.now();
    const tick = (now: number) => {
      const t = (now - t0.current) / 1000;
      if (t >= GIVE_UP) return finish(t);
      setShown(t < VISIBLE_FOR ? t : null);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const hidden = running && shown === null;
  const off = final !== null ? Math.abs(final - TARGET) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-44 w-full max-w-sm items-center justify-center rounded-2xl border border-gold/30 bg-black/40 shadow-[inset_0_0_40px_rgba(0,0,0,.6)] sm:h-52">
        <span className={`font-mono text-7xl font-bold tabular-nums transition sm:text-8xl ${hidden ? "text-white/20 blur-md" : off === null ? "text-white" : off <= 0.3 ? "text-mint" : "text-flame"}`}>
          {hidden ? "?.??" : (shown ?? 0).toFixed(2)}
        </span>
        <span className="label absolute top-3 left-4">target 4.00s</span>
        {running && <span className="label absolute top-3 right-4 animate-pulse !text-gold">● live</span>}
      </div>
      <p className="mt-6 text-sm text-dim">Start, count in your head, stop on 4.00.</p>
      <button className={`btn mt-3 min-w-40 ${running ? "btn-gold" : "btn-neon"}`} disabled={busy && !running} onClick={go}>
        {running ? "STOP" : "Start the clock"}
      </button>
    </div>
  );
}
