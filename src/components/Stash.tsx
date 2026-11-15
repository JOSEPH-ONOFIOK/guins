"use client";

import { useEffect, useState } from "react";
import { HoodguinArt } from "./HoodguinArt";

type Side = "heads" | "beak";

// Token facts stay placeholders until they're announced.
const FACTS = [
  ["ticker", "$RPENG"],
  ["chain", "TBA"],
  ["contract", "soon"],
];

const WIN = ["Lucky. Don't get used to it.", "Clean. Again?", "Okay, okay. We see you."];
const LOSE = ["House always wins.", "Aw. Here's a pat on the head.", "Nah. Try again."];
const BEST_KEY = "hg_best_streak";

export function Stash() {
  const [rot, setRot] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; win: boolean } | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    let saved = 0;
    try {
      saved = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}
    queueMicrotask(() => setBest(saved));
  }, []);

  const call = (pick: Side) => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const land: Side = Math.random() < 0.5 ? "heads" : "beak";
    const base = Math.ceil(rot / 360) * 360 + 360 * 5;
    setRot(base + (land === "beak" ? 180 : 0));
    setTimeout(() => {
      const win = land === pick;
      const list = win ? WIN : LOSE;
      setMsg({ text: `${land === "heads" ? "$RPENG" : "Beak"}! ${list[Math.floor(Math.random() * list.length)]}`, win });
      const n = win ? streak + 1 : 0;
      setStreak(n);
      if (n > best) {
        setBest(n);
        try {
          localStorage.setItem(BEST_KEY, String(n));
        } catch {}
      }
      setBusy(false);
    }, 1600);
  };

  return (
    <div id="stash" className="mochi flex scroll-mt-24 flex-col items-center bg-white p-6 text-center sm:p-8">
      <h2 className="font-display text-4xl font-bold sm:text-5xl">$RPENG</h2>
      <p className="mt-2 max-w-xs text-soft">The Hood runs on gold. Flip one while you wait.</p>

      <div className="relative mt-6" style={{ perspective: "1000px" }}>
        <div
          className="coin-3d relative h-44 w-44 sm:h-52 sm:w-52"
          style={{ transform: `rotateY(${rot}deg)`, transition: busy ? "transform 1.6s cubic-bezier(.15,.75,.25,1)" : "none" }}
        >
          <div
            className="coin-face absolute inset-0 rounded-full border-[3.5px] border-outline shadow-[0_6px_0_#121212]"
            style={{ backgroundImage: "url(/hg/coin.jpg)", backgroundSize: "125.6% auto", backgroundPosition: "56.5% 45.5%" }}
            role="img"
            aria-label="The $RPENG coin"
          />
          <div className="coin-face absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border-[3.5px] border-outline bg-[radial-gradient(circle_at_35%_30%,#fff6c2,#ffd25e_55%,#f0b53a)] [transform:rotateY(180deg)]">
            <div className="absolute inset-[9%] rounded-full border-[3px] border-dashed border-outline/30" />
            <HoodguinArt fit="none" className="relative mt-8 w-[74%]" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="btn btn-beak" disabled={busy} onClick={() => call("heads")}>$RPENG</button>
        <button className="btn btn-ink" disabled={busy} onClick={() => call("beak")}>Beak</button>
      </div>
      <div className="mt-4 min-h-12" aria-live="polite">
        {msg && <p key={msg.text + streak} className={`pop-in font-display text-lg font-bold ${msg.win ? "text-ink" : "text-flame"}`}>{msg.text}</p>}
        <p className="mt-0.5 font-semibold text-xs text-soft">streak {streak} · best {best}</p>
      </div>

      <dl className="mt-auto grid w-full grid-cols-3 gap-2 pt-4">
        {FACTS.map(([k, v]) => (
          <div key={k} className="rounded-2xl border-[2.5px] border-outline bg-mist px-2 py-2">
            <dt className="font-semibold text-[11px] text-soft">{k}</dt>
            <dd className="font-display text-sm font-bold sm:text-base">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
