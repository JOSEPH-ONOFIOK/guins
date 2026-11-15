import Link from "next/link";
import { HoodguinArt } from "./HoodguinArt";

const WORD = "Guins";

// Token and collection facts stay placeholders until they're announced.
const STATS = [
  ["ticker", "$RPENG"],
  ["chain", "TBA"],
  ["supply", "TBA"],
  ["mint", "soon"],
];

// Full-screen intro sitting over the living glacier world (see Scene).
export function Hero() {
  return (
    <section id="top" className="relative">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center px-4 pt-32 text-center sm:px-8 sm:pt-40">
        <h1 className="relative mx-auto w-fit font-display text-[clamp(4rem,16vw,10rem)] leading-[0.9] font-black tracking-[-0.04em] drop-shadow-[0_8px_30px_rgba(116,69,245,.3)]" aria-label="Guins">
          {WORD.split("").map((c, i) => (
            <span key={i} aria-hidden className="rise grad-letter" style={{ animationDelay: `${120 + i * 70}ms`, backgroundSize: `${WORD.length * 100}% 100%`, backgroundPosition: `${(i / (WORD.length - 1)) * 100}% 0` }}>{c}</span>
          ))}
        </h1>

        <p className="legible pop-in mx-auto mt-6 max-w-lg text-lg font-semibold text-fg [animation-delay:.7s] sm:text-xl">
          The most unbothered little penguins on-chain. Collect the gang, earn your place in the colony.
        </p>
        <div className="pop-in mt-8 flex flex-wrap justify-center gap-3 [animation-delay:.85s]">
          <a href="#colony" className="btn btn-neon text-base">
            Join the colony
            <span aria-hidden className="-my-2 inline-flex"><HoodguinArt className="h-7 w-auto drop-shadow-[0_2px_4px_rgba(0,0,0,.25)]" /></span>
          </a>
          <a href="#gang" className="btn btn-ghost text-base">Explore the gang</a>
        </div>

        <dl className="glass pop-in mt-12 grid w-full max-w-2xl grid-cols-2 !rounded-2xl [animation-delay:1s] sm:grid-cols-4 sm:divide-x sm:divide-line">
          {STATS.map(([k, v]) => (
            <div key={k} className="px-4 py-3.5 text-left sm:text-center">
              <dt className="label">{k}</dt>
              <dd className={`mt-0.5 font-mono text-base font-semibold ${v === "soon" ? "text-mint" : "text-fg"}`}>
                {k === "ticker" ? <Link href="/rpeng" className="text-amber underline decoration-amber/40 underline-offset-4 hover:decoration-amber">{v} ↗</Link> : v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
