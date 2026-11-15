"use client";

import { useState } from "react";
import { rand } from "@/lib/rpeng";
import { HoodguinArt } from "../HoodguinArt";
import type { GameProps } from "./types";

type Side = "heads" | "beak";
export const FLIP_PAYS = 1.95;

export function CoinFlip({ busy, start, settle }: GameProps) {
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const call = (pick: Side) => {
    if (!start()) return;
    const land: Side = rand() < 0.5 ? "heads" : "beak";
    const base = Math.ceil(rot / 360) * 360 + 360 * 5;
    setSpinning(true);
    setRot(base + (land === "beak" ? 180 : 0));
    setTimeout(() => {
      setSpinning(false);
      const name = land === "heads" ? "$RPENG" : "Beak";
      settle(land === pick ? FLIP_PAYS : 0, land === pick ? `${name}! Called it.` : `${name}. House wins this one.`);
    }, 1600);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mt-2" style={{ perspective: "1000px" }}>
        <div aria-hidden className="halo absolute -inset-4 rounded-full" />
        <div
          className="coin-3d relative h-40 w-40 sm:h-48 sm:w-48"
          style={{ transform: `rotateY(${rot}deg)`, transition: spinning ? "transform 1.6s cubic-bezier(.15,.75,.25,1)" : "none" }}
        >
          <div
            className="coin-face absolute inset-0 rounded-full border-2 border-gold/80 shadow-[0_0_40px_rgba(255,207,63,.5)]"
            style={{ backgroundImage: "url(/hg/coin.jpg)", backgroundSize: "125.6% auto", backgroundPosition: "56.5% 45.5%" }}
            role="img"
            aria-label="The $RPENG coin"
          />
          <div className="coin-face absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border-2 border-gold/80 bg-[radial-gradient(circle_at_35%_30%,#fff6c2,#ffd25e_55%,#f0b53a)] [transform:rotateY(180deg)]">
            <div className="absolute inset-[9%] rounded-full border-2 border-dashed border-black/20" />
            <HoodguinArt className="relative mt-8 w-[74%]" />
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm text-dim">Call it. Pays {FLIP_PAYS}×.</p>
      <div className="mt-3 flex gap-3">
        <button className="btn btn-gold" disabled={busy} onClick={() => call("heads")}>$RPENG</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => call("beak")}>Beak</button>
      </div>
    </div>
  );
}
