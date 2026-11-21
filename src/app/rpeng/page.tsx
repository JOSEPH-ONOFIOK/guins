import type { Metadata } from "next";
import Link from "next/link";
import { Airdrop } from "@/components/Airdrop";
import { QuotePost } from "@/components/QuotePost";
import { AIRDROP_OPEN } from "@/lib/airdrop";
import { Footer } from "@/components/Footer";
import { GoldMedallion } from "@/components/GoldMedallion";
import { ArrowIcon, Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { Scene } from "@/components/Scene";
import { Casino } from "@/components/casino/Casino";
import { CasinoLabel } from "@/components/casino/CasinoLabel";

const DESC = AIRDROP_OPEN
  ? "The colony's gold. Apply for the $RPENG airdrop and play The Colony Casino: Coin Flip, 4 Seconds, Over/Under 7 and Guin Slots."
  : "The colony's gold. Play The Colony Casino: Coin Flip, 4 Seconds, Over/Under 7 and Guin Slots.";
const SHARE = { url: "/og-rpeng.png", width: 1200, height: 630, alt: "$RPENG: the colony's gold" };
export const metadata: Metadata = {
  title: AIRDROP_OPEN ? "$RPENG · Airdrop & The Colony Casino" : "$RPENG · The Colony Casino",
  description: DESC,
  alternates: { canonical: "/rpeng" },
  openGraph: { type: "website", url: "/rpeng", siteName: "Guins", title: "$RPENG · The colony's gold", description: DESC, images: [SHARE] },
  twitter: { card: "summary_large_image", site: "@hoodguins", title: "$RPENG · The colony's gold", description: DESC, images: [SHARE] },
};

// Same world as the home page, without the big intro: gold Guins up top, then the
// quote task, the airdrop (when open) and the casino.
export default function RpengPage() {
  return (
    <>
      <Scene dark calm moon={[0.14, 0.06]} />
      <Nav />
      <main>
        <h1 className="sr-only">$RPENG, the colony&apos;s gold</h1>

        <div className="casino">
          {/* The gold Guins: a big one flanked by two smaller ones, each bobbing on its own beat */}
          <div aria-hidden className="mx-auto flex max-w-5xl items-end justify-center gap-[clamp(1rem,5vw,3.5rem)] px-4 pt-28 pb-10 sm:px-8 sm:pt-32">
            <GoldMedallion delay={1.6} tilt={-4} className="mb-4 w-[clamp(4.5rem,15vw,8.5rem)]" />
            <GoldMedallion priority className="w-[clamp(7rem,24vw,12rem)]" />
            <GoldMedallion delay={3.1} tilt={5} className="mb-4 w-[clamp(4.5rem,15vw,8.5rem)]" />
          </div>

          {/* Quick links to each part of the page */}
          <section id="casino" className="mx-auto max-w-5xl scroll-mt-24 px-4 sm:px-8">
            <Reveal className="flex justify-center border-y border-line py-4">
              <div className="flex flex-wrap justify-center gap-2">
                {AIRDROP_OPEN ? (
                  <>
                    <a href="#airdrop" className="btn btn-accent btn-sm">Claim airdrop <ArrowIcon /></a>
                    <a href="#play" className="btn btn-ghost btn-sm">Games</a>
                  </>
                ) : (
                  <>
                    <a href="#quote" className="btn btn-accent btn-sm">Quote the post <ArrowIcon /></a>
                    <a href="#play" className="btn btn-ghost btn-sm">Games</a>
                  </>
                )}
                <Link href="/rpeng/wiki" className="btn btn-ghost btn-sm">Wiki</Link>
              </div>
            </Reveal>
          </section>

          {/* The one $RPENG task while the airdrop is closed: quote the post */}
          {!AIRDROP_OPEN && (
          <section id="quote" className="mx-auto mt-10 max-w-5xl scroll-mt-24 px-4 sm:px-8">
            <Reveal>
              <QuotePost />
            </Reveal>
          </section>
          )}

          {/* The airdrop first: it's the thing you can do today (hidden while closed) */}
          {AIRDROP_OPEN && (
          <section id="airdrop" className="mx-auto mt-10 max-w-5xl scroll-mt-24 px-4 sm:px-8">
            <Reveal>
              <Airdrop />
            </Reveal>
          </section>
          )}

          <section id="play" className="mx-auto mt-12 max-w-5xl scroll-mt-24 px-4 pb-16 sm:px-8">
            <Reveal className="mb-6 flex items-center justify-between gap-6">
              <div>
                <CasinoLabel />
                <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] leading-none font-bold uppercase">Flip. Stop. Roll. Spin.</h2>
              </div>
              <GoldMedallion delay={2.4} tilt={-3} className="hidden w-24 shrink-0 sm:block" />
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
