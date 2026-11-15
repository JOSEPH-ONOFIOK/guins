import type { Metadata } from "next";
import Link from "next/link";
import { Airdrop } from "@/components/Airdrop";
import { Footer } from "@/components/Footer";
import { GoldMedallion } from "@/components/GoldMedallion";
import { Intro } from "@/components/Intro";
import { ArrowIcon, Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Scene } from "@/components/Scene";
import { Casino } from "@/components/casino/Casino";
import { RATE, fmtTok, fmtUsd } from "@/lib/rpeng";

export const metadata: Metadata = {
  title: "$RPENG",
  description: "The colony casino and $RPENG airdrop. Flip, roll, spin and stop the clock with play chips, then claim your airdrop.",
  openGraph: { images: ["/hg/gold.png"] },
};

const FACTS = [
  ["Ticker", "$RPENG"],
  ["Chain", "TBA"],
  ["Contract", "Soon"],
  ["Rate", `${fmtTok(RATE.tokens)} ≈ ${fmtUsd(RATE.tokens)}`],
];

// Same world as the home page: art first, fly through the ice, then the casino.
export default function RpengPage() {
  return (
    <>
      <Scene dark moon={[0.14, 0.06]} />
      <Nav />
      <main>
        <Intro eyebrow="The colony's gold" title="$RPENG" tagline="Flip · Stop · Roll · Spin" next="#casino" art={<GoldMedallion className="mb-[3vh] w-[clamp(7rem,min(20vw,22vh),15rem)]" />} />

        <div className="casino">
          <section id="casino" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-10 sm:px-8">
            <Reveal className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="chip">
                  <span className="glow-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  The colony casino
                </p>
                <h2 className="mt-6 font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.88] font-bold uppercase">
                  $RPENG<span className="text-accent">.</span>
                </h2>
                <p className="mt-3 font-display text-[clamp(1.6rem,3.6vw,2.6rem)] leading-[0.95] font-bold text-accent uppercase">Flip. Stop. Roll. Spin.</p>
                <p className="mt-5 max-w-md text-lg text-dim">Four games and an airdrop. The tables open soon; the airdrop application is below.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#play" className="btn btn-accent">Games coming soon <ArrowIcon /></a>
                <a href="#airdrop" className="btn btn-ghost">Claim airdrop</a>
                <Link href="/rpeng/wiki" className="btn btn-ghost">Wiki &amp; how to play</Link>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <dl className="mt-10 grid grid-cols-2 border-y border-line sm:grid-cols-4">
                {FACTS.map(([k, v], i) => (
                  <div key={k} className={`px-1 py-5 sm:px-5 ${i % 2 ? "pl-4 sm:pl-5" : ""} ${i > 0 ? "sm:border-l sm:border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""}`}>
                    <dt className="label">{k}</dt>
                    <dd className={`mt-1 font-mono text-base font-semibold sm:text-lg ${k === "Ticker" ? "text-accent" : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </section>

          <section id="play" className="mx-auto mt-14 max-w-5xl scroll-mt-24 px-4 sm:px-8">
            <Reveal>
              <Casino />
            </Reveal>
          </section>

          <section id="airdrop" className="mx-auto mt-24 max-w-5xl scroll-mt-24 px-4 pb-24 sm:px-8">
            <Reveal>
              <Airdrop />
            </Reveal>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
