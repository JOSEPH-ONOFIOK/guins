"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Reveal } from "./Reveal";

// The gallery as a police line-up: the gang stands against a height chart under
// spotlights. Pick a suspect and they step forward into the light while their
// case file opens. Placeholder names, numbers and files until the real traits are in.
const GANG = [
  {
    no: "0001",
    name: "Midas",
    img: "/hg/gold.png",
    pos: "object-[50%_40%]",
    height: "4'2\"",
    charge: "Touching everything",
    note: "Touched everything in the Hood. Now it's all gold, including him. Won't take the shades off indoors.",
    traits: [["Skin", "Molten gold"], ["Eyes", "Shades"], ["Fit", "Gold tie"]],
  },
  {
    no: "0137",
    name: "Stripes",
    img: "/hg/convict.jpg",
    pos: "object-center",
    height: "3'9\"",
    charge: "Escaping (twice)",
    note: "Escaped twice. Came back both times for snacks.",
    traits: [["Hat", "Tricorn"], ["Fit", "Stripes"]],
  },
  {
    no: "0420",
    name: "Cosmo",
    img: "/hg/astro.jpg",
    pos: "object-center",
    height: "4'0\"",
    charge: "Leaving orbit",
    note: "Left the Hood. Came back with moon rocks and an attitude.",
    traits: [["Helmet", "Violet visor"], ["Suit", "Moonwalker"]],
  },
  {
    no: "0069",
    name: "Pinky",
    img: "/hg/pink.jpg",
    pos: "object-center",
    height: "3'6\"",
    charge: "Drooling in public",
    note: "Drooling in public. Repeat offender. Too cute to charge.",
    traits: [["Skin", "Bubblegum"], ["Mouth", "Drool"]],
  },
] as const;

// Height chart marks, top to bottom
const MARKS = ["6'", "5'", "4'", "3'", "2'", "1'"];

export function Lineup() {
  const [pick, setPick] = useState(0);
  const row = useRef<HTMLDivElement>(null);
  const g = GANG[pick];

  const choose = (i: number) => {
    const n = (i + GANG.length) % GANG.length;
    setPick(n);
    // On phones the line scrolls sideways: slide the chosen one to the middle
    const r = row.current;
    const card = r?.children[n] as HTMLElement | undefined;
    if (r && card && r.scrollWidth > r.clientWidth) r.scrollTo({ left: card.offsetLeft - (r.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <section id="gang" className="relative scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label label-accent">The original four</p>
            <h2 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-none font-bold uppercase">Meet the gang.</h2>
            <p className="mt-4 max-w-md text-dim">Line-up&apos;s ready. Pick a suspect to step them into the light and open their file.</p>
          </div>
          <div className="flex gap-2">
            <button className="icon-btn" onClick={() => choose(pick - 1)} aria-label="Previous suspect">←</button>
            <button className="icon-btn" onClick={() => choose(pick + 1)} aria-label="Next suspect">→</button>
          </div>
        </Reveal>

        <Reveal delay={80} className="mt-10 grid gap-5 lg:grid-cols-[1fr_20rem]">
          {/* The wall */}
          <div className="relative overflow-hidden rounded-3xl border border-line bg-[#15141e]">
            {/* height chart */}
            <div aria-hidden className="absolute inset-0">
              {MARKS.map((m, i) => (
                <div key={m} className="absolute inset-x-0 border-t border-white/10" style={{ top: `${8 + i * 13}%` }}>
                  <span className="absolute top-1 left-3 font-mono text-[10px] text-white/35">{m}</span>
                  <span className="absolute top-1 right-3 font-mono text-[10px] text-white/35">{m}</span>
                </div>
              ))}
              <div className="absolute inset-x-0 top-0 h-[8%] bg-[repeating-linear-gradient(90deg,transparent_0_23px,rgba(255,255,255,.07)_23px_24px)]" />
            </div>

            {/* spotlights: the chosen one's beam is bright */}
            <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-4 max-md:hidden">
              {GANG.map((x, i) => (
                <div key={x.no} className="relative">
                  <div
                    className="absolute top-0 left-1/2 h-full w-[140%] -translate-x-1/2 transition-opacity duration-500"
                    style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(255,231,160,.22) 172deg, rgba(255,231,160,.3) 180deg, rgba(255,231,160,.22) 188deg, transparent 200deg)", opacity: i === pick ? 1 : 0.15 }}
                  />
                </div>
              ))}
            </div>

            {/* the line */}
            <div
              ref={row}
              className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pt-10 pb-6 [scrollbar-width:none] md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-6 md:pt-14 [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="The gang"
            >
              {GANG.map((x, i) => {
                const on = i === pick;
                return (
                  <button
                    key={x.no}
                    role="tab"
                    aria-selected={on}
                    onClick={() => choose(i)}
                    className={`group relative w-[62%] shrink-0 snap-center text-left transition duration-500 ease-[cubic-bezier(.2,1.2,.3,1)] sm:w-[40%] md:w-auto ${on ? "z-10 -translate-y-2 scale-[1.04]" : "opacity-55 saturate-50 hover:opacity-85 hover:saturate-100"}`}
                  >
                    <div className={`relative aspect-[3/4] overflow-hidden rounded-2xl border-2 transition ${on ? "border-accent shadow-[0_24px_60px_-20px_rgba(255,207,63,.55)]" : "border-white/10"}`}>
                      <Image src={x.img} alt={`${x.name}, Guin #${x.no}`} fill sizes="(min-width: 1024px) 18vw, (min-width: 768px) 22vw, 60vw" className={`object-cover ${x.pos}`} />
                    </div>
                    {/* booking placard */}
                    <div className="relative mx-auto -mt-5 w-[86%] rounded-lg border border-black/40 bg-[#0e0d14] px-3 py-2 text-center shadow-[0_10px_20px_-8px_rgba(0,0,0,.8)]">
                      <p className="text-[8px] font-bold tracking-[0.2em] text-white/50 uppercase">Colony P.D.</p>
                      <p className={`font-mono text-lg leading-tight font-bold ${on ? "text-accent" : "text-white"}`}>#{x.no}</p>
                      <p className="truncate text-xs font-bold text-white/80 uppercase">{x.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* floor */}
            <div aria-hidden className="relative h-6 border-t border-white/10 bg-[linear-gradient(to_bottom,rgba(0,0,0,.35),transparent)]" />
          </div>

          {/* The case file */}
          <aside key={g.no} className="glass pop-in relative overflow-hidden p-6" aria-live="polite">
            <span aria-hidden className="absolute top-5 right-5 rotate-12 rounded-md border-2 border-flame/60 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.2em] text-flame/80 uppercase">
              Unbothered
            </span>
            <p className="label label-accent">Case file · #{g.no}</p>
            <h3 className="mt-3 font-display text-4xl leading-none font-bold uppercase">{g.name}</h3>
            <dl className="mt-5 grid grid-cols-2 gap-2">
              <div className="well px-3 py-2">
                <dt className="label !text-[10px]">Height</dt>
                <dd className="font-mono font-semibold">{g.height}</dd>
              </div>
              <div className="well px-3 py-2">
                <dt className="label !text-[10px]">Charge</dt>
                <dd className="text-sm font-semibold leading-tight">{g.charge}</dd>
              </div>
            </dl>
            <p className="mt-5 text-dim">{g.note}</p>
            <dl className="mt-5 grid gap-1.5 border-t border-line pt-4">
              {g.traits.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <dt className="text-dim">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-center justify-between text-xs font-bold tracking-widest text-dim uppercase">
              <button onClick={() => choose(pick - 1)} className="hover:text-accent">← Prev</button>
              <span>
                {pick + 1} / {GANG.length}
              </span>
              <button onClick={() => choose(pick + 1)} className="hover:text-accent">Next →</button>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
