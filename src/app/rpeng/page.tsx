import type { Metadata } from "next";
import Link from "next/link";
import { Airdrop } from "@/components/Airdrop";
import { AIRDROP_OPEN } from "@/lib/airdrop";
import { Footer } from "@/components/Footer";
import { GoldMedallion } from "@/components/GoldMedallion";
import { Intro } from "@/components/Intro";
import { ArrowIcon, Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Scene } from "@/components/Scene";
import { Casino } from "@/components/casino/Casino";
import { RATE, RATE_KNOWN, fmtTok, fmtUsd } from "@/lib/rpeng";

const DESC = AIRDROP_OPEN
  ? "The colony's gold. Apply for the $RPENG airdrop and preview the colony casino: Coin Flip, 4 Seconds, Over/Under 7 and Guin Slots, coming soon."
  : "The colony's gold. Preview the colony casino: Coin Flip, 4 Seconds, Over/Under 7 and Guin Slots, coming soon.";
const SHARE = { url: "/og-rpeng.png", width: 1200, height: 630, alt: "$RPENG: the colony's gold" };
export const metadata: Metadata = {
  title: AIRDROP_OPEN ? "$RPENG · Airdrop & casino" : "$RPENG · The colony casino",
  description: DESC,
  alternates: { canonical: "/rpeng" },
  openGraph: { type: "website", url: "/rpeng", siteName: "Guins", title: "$RPENG · The colony's gold", description: DESC, images: [SHARE] },
  twitter: { card: "summary_large_image", site: "@hoodguins", title: "$RPENG · The colony's gold", description: DESC, images: [SHARE] },
};

const FACTS = [
  ["Ticker", "$RPENG"],
  ["Chain", "TBA"],
  ["Contract", "Soon"],
  ["Rate", RATE_KNOWN ? `${fmtTok(RATE.tokens)} ≈ ${fmtUsd(RATE.tokens)}` : "Soon"],
];

// Same world as the home page: art first, fly through the ice, then the airdrop (when open) and the casino.
export default function RpengPage() {
  return (
    <>
      <Scene dark moon={[0.14, 0.06]} />
      <Nav />
      <main>
        <Intro eyebrow="The colony's gold" title="$RPENG" tagline={AIRDROP_OPEN ? "Airdrop · Casino · Wiki" : "Casino · Wiki · Coming soon"} next="#casino" art={<GoldMedallion className="mb-[3vh] w-[clamp(7rem,min(20vw,22vh),15rem)]" />} />

        <div className="casino">
          {/* One compact bar instead of a second big heading: the intro already said it */}
          <section id="casino" className="mx-auto max-w-5xl scroll-mt-24 px-4 sm:px-8">
            <Reveal className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
              <dl className="flex flex-wrap gap-x-6 gap-y-2">
                {FACTS.map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <dt className="label !text-[10px]">{k}</dt>
                    <dd className={`font-mono text-sm font-semibold ${k === "Ticker" ? "text-accent" : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                {AIRDROP_OPEN ? (
                  <>
                    <a href="#airdrop" className="btn btn-accent btn-sm">Claim airdrop <ArrowIcon /></a>
                    <a href="#play" className="btn btn-ghost btn-sm">Games</a>
                  </>
                ) : (
                  <a href="#play" className="btn btn-accent btn-sm">See the games <ArrowIcon /></a>
                )}
                <Link href="/rpeng/wiki" className="btn btn-ghost btn-sm">Wiki</Link>
              </div>
            </Reveal>
          </section>

          {/* The airdrop first: it's the thing you can do today (hidden while closed) */}
          {AIRDROP_OPEN && (
          <section id="airdrop" className="mx-auto mt-12 max-w-5xl scroll-mt-24 px-4 sm:px-8">
            <Reveal>
              <Airdrop />
            </Reveal>
          </section>
          )}

          <section id="play" className="mx-auto mt-12 max-w-5xl scroll-mt-24 px-4 pb-16 sm:px-8">
            <Reveal className="mb-6">
              <p className="label label-accent">The colony casino · coming soon</p>
              <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] leading-none font-bold uppercase">Flip. Stop. Roll. Spin.</h2>
            </Reveal>
            <Reveal>
              <Casino />
            </Reveal>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
