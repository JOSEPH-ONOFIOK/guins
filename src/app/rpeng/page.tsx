import type { Metadata } from "next";
import { Airdrop } from "@/components/Airdrop";
import { ColorWash } from "@/components/ColorWash";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Casino } from "@/components/casino/Casino";
import Link from "next/link";
import { RATE, fmtTok, fmtUsd } from "@/lib/rpeng";

export const metadata: Metadata = {
  title: "$RPENG",
  description: "The colony casino and $RPENG airdrop. Flip, roll, spin and stop the clock with play chips, then claim your airdrop.",
};

const FACTS = [
  ["ticker", "$RPENG"],
  ["chain", "TBA"],
  ["contract", "soon"],
  ["rate", `${fmtTok(RATE.tokens)} ≈ ${fmtUsd(RATE.tokens)}`],
];

export default function RpengPage() {
  return (
    <>
      <Nav />
      <div className="casino relative isolate overflow-hidden">
        <ColorWash className="-z-10 fixed" strength={0.3} />
        <main className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-8 sm:pt-32">
          {/* Marquee sign */}
          <header className="text-center">
            <div className="bulbs relative mx-auto inline-block rounded-[28px] bg-[linear-gradient(180deg,#2a1458,#14082e)] px-8 py-6 shadow-[0_30px_80px_-20px_rgba(255,79,216,.45)] sm:px-14 sm:py-8">
              <p className="label !text-gold">the colony casino</p>
              <h1 className="mt-1 bg-[linear-gradient(180deg,#fff6c9,#ffcf3f_45%,#ff9d2e)] bg-clip-text font-display text-6xl font-bold tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(255,191,46,.55)] sm:text-8xl">
                $RPENG
              </h1>
              <p className="mt-1 font-mono text-xs tracking-[0.3em] text-pink uppercase">flip · stop · roll · spin</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#play" className="btn btn-gold">🎰 Play now</a>
              <a href="#airdrop" className="btn btn-ghost">🪂 Claim airdrop</a>
              <Link href="/rpeng/wiki" className="btn btn-ghost">📖 Wiki &amp; how to play</Link>
            </div>
            <dl className="glass mx-auto mt-8 grid max-w-2xl grid-cols-2 !rounded-2xl sm:grid-cols-4 sm:divide-x sm:divide-line">
              {FACTS.map(([k, v]) => (
                <div key={k} className="px-4 py-3">
                  <dt className="label">{k}</dt>
                  <dd className={`mt-0.5 font-mono text-sm font-semibold ${k === "ticker" ? "text-gold" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </header>

          <section id="play" className="mt-14 scroll-mt-24">
            <Casino />
          </section>

          <section id="airdrop" className="mt-20 scroll-mt-24">
            <Airdrop />
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
