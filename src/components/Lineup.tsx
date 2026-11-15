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
    bg: "bg-white",
    note: "Doesn't raise his voice. Still sleeps with a nightlight.",
    traits: [["Fit", "Bow tie"], ["Mood", "In charge"]],
    tilt: "-2deg",
  },
  {
    no: "#0137",
    name: "Stripes",
    img: "/hg/convict.jpg",
    pos: "object-center",
    bg: "bg-white",
    note: "Escaped twice. Came back both times for snacks.",
    traits: [["Hat", "Tricorn"], ["Fit", "Stripes"]],
    tilt: "1.5deg",
  },
  {
    no: "#0420",
    name: "Cosmo",
    img: "/hg/astro.jpg",
    pos: "object-center",
    bg: "bg-white",
    note: "Left the Hood. Came back with moon rocks and an attitude.",
    traits: [["Helmet", "Violet visor"], ["Suit", "Moonwalker"]],
    tilt: "-1deg",
  },
  {
    no: "#0069",
    name: "Pinky",
    img: "/hg/pink.jpg",
    pos: "object-center",
    bg: "bg-white",
    note: "Drooling in public. Repeat offender. Too cute to charge.",
    traits: [["Skin", "Bubblegum"], ["Mouth", "Drool"]],
    tilt: "2deg",
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
            <span key={k} className="heart-pop absolute text-2xl text-flame" style={{ ["--dx" as string]: dx, ["--rot" as string]: `${(k - 1) * 18}deg`, animationDelay: `${k * 80}ms` }}>♥</span>
          ))}
        </span>
      ))}
      <div className="squish-hover" style={{ ["--tilt" as string]: g.tilt }}>
        <button onClick={toggle} className={`flip-card relative block aspect-[4/5] w-full text-left ${flipped ? "is-flipped" : ""}`} aria-label={`${g.name}: ${flipped ? "hide" : "show"} file`}>
          {/* Front */}
          <div className={`flip-face mochi absolute inset-0 flex flex-col overflow-hidden p-2 ${g.bg}`}>
            <div className="relative flex-1 overflow-hidden rounded-[22px] border-[3px] border-outline">
              <Image src={g.img} alt={`${g.name}, a Hoodguin`} fill sizes="(min-width: 1024px) 22vw, 45vw" className={`object-cover ${g.pos}`} />
            </div>
            <div className="flex items-baseline justify-between px-2 pt-2 pb-0.5">
              <span className="font-display text-lg font-bold sm:text-xl">{g.name}</span>
              <span className="font-semibold text-xs text-soft">{g.no}</span>
            </div>
          </div>

          {/* Back */}
          <div className={`flip-face flip-back mochi absolute inset-0 flex flex-col p-4 sm:p-5 ${g.bg}`}>
            <div className="flex items-center justify-between font-semibold text-xs text-soft">
              <span>file {g.no}</span>
              <span>♥</span>
            </div>
            <div className="mt-2 font-display text-2xl font-bold sm:text-3xl">{g.name}</div>
            <p className="mt-2 text-sm leading-snug font-medium sm:text-base">{g.note}</p>
            <dl className="mt-auto grid gap-1.5">
              {g.traits.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-full border-[2.5px] border-outline bg-white px-3 py-1">
                  <dt className="font-semibold text-xs text-soft">{k}</dt>
                  <dd className="text-sm font-bold">{v}</dd>
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
          <h2 className="sticker font-display text-[clamp(2.4rem,6vw,4rem)] leading-none font-bold">meet the gang</h2>
          <p className="mx-auto mt-4 w-fit rounded-full border-[2.5px] border-outline bg-white px-4 py-1 font-medium">Tap one to read their file. They won&apos;t like it.</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {GANG.map((g, i) => <Card key={g.no} g={g} index={i} />)}
        </div>
      </div>
    </section>
  );
}
