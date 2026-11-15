"use client";

import Image from "next/image";
import { useState } from "react";
import { Reveal } from "./Reveal";

// Placeholder names, numbers and files until the real traits are in.
const GANG = [
  {
    no: "#0001",
    name: "The Don",
    img: "/hg/boss.jpg",
    pos: "object-[52%_30%]",
    note: "Doesn't raise his voice. Still sleeps with a nightlight.",
    traits: [["Fit", "Bow tie"], ["Mood", "In charge"]],
  },
  {
    no: "#0137",
    name: "Stripes",
    img: "/hg/convict.jpg",
    pos: "object-center",
    note: "Escaped twice. Came back both times for snacks.",
    traits: [["Hat", "Tricorn"], ["Fit", "Stripes"]],
  },
  {
    no: "#0420",
    name: "Cosmo",
    img: "/hg/astro.jpg",
    pos: "object-center",
    note: "Left the Hood. Came back with moon rocks and an attitude.",
    traits: [["Helmet", "Violet visor"], ["Suit", "Moonwalker"]],
  },
  {
    no: "#0069",
    name: "Pinky",
    img: "/hg/pink.jpg",
    pos: "object-center",
    note: "Drooling in public. Repeat offender. Too cute to charge.",
    traits: [["Skin", "Bubblegum"], ["Mouth", "Drool"]],
  },
] as const;

function Card({ g, index }: { g: (typeof GANG)[number]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);

  const toggle = () => {
    const id = Date.now();
    setHearts((h) => [...h, id]);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1000);
    setFlipped(!flipped);
  };

  return (
    <Reveal delay={index * 90} className="flip-scene relative">
      {hearts.map((id) => (
        <span key={id} aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 z-30">
          {["-26px", "0px", "24px"].map((dx, k) => (
            <span key={k} className="heart-pop absolute text-2xl text-violet drop-shadow-[0_0_8px_rgba(116,69,245,.6)]" style={{ ["--dx" as string]: dx, ["--rot" as string]: `${(k - 1) * 18}deg`, animationDelay: `${k * 80}ms` }}>✦</span>
          ))}
        </span>
      ))}
      <div className="lift">
        <button onClick={toggle} className={`flip-card relative block aspect-[4/5] w-full text-left ${flipped ? "is-flipped" : ""}`} aria-label={`${g.name}: ${flipped ? "hide" : "show"} file`}>
          {/* Front */}
          <div className="flip-face glass holo absolute inset-0 flex flex-col p-2">
            <div className="relative flex-1 overflow-hidden rounded-[18px] border border-line">
              <Image src={g.img} alt={`${g.name}, a Guin`} fill sizes="(min-width: 1024px) 22vw, 45vw" className={`object-cover ${g.pos}`} />
              <span className="chip absolute top-2 left-2 !bg-surface/85 !px-2 !py-0.5 !text-[10px] !text-fg">{g.no}</span>
            </div>
            <div className="flex items-end justify-between gap-2 px-2 pt-2.5 pb-1">
              <div className="min-w-0">
                <div className="label !text-[10px]">guin</div>
                <div className="truncate font-display text-base font-bold sm:text-lg">{g.name}</div>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-cyan">view file ↻</span>
            </div>
          </div>

          {/* Back */}
          <div className="flip-face flip-back glass absolute inset-0 flex flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="label">token {g.no}</span>
              <span className="glow-dot h-2 w-2 rounded-full bg-mint" />
            </div>
            <div className="grad-text mt-2 font-display text-2xl font-bold sm:text-3xl">{g.name}</div>
            <p className="mt-2 text-sm leading-snug font-medium text-fg/85 sm:text-base">{g.note}</p>
            <dl className="mt-auto grid gap-1.5">
              {g.traits.map(([k, v]) => (
                <div key={k} className="well flex items-center justify-between !rounded-xl px-3 py-1.5">
                  <dt className="label !text-[10px]">{k}</dt>
                  <dd className="text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </button>
      </div>
    </Reveal>
  );
}

export function Lineup() {
  return (
    <section id="gang" className="relative scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Reveal className="text-center">
          <p className="chip">the collection</p>
          <h2 className="grad-text mt-4 font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-none font-bold tracking-tight">meet the gang</h2>
          <p className="legible mx-auto mt-4 w-fit max-w-md font-semibold text-fg">Tap one to read their on-chain file. They won&apos;t like it.</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {GANG.map((g, i) => <Card key={g.no} g={g} index={i} />)}
        </div>
      </div>
    </section>
  );
}
