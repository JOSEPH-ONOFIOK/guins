import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ArrowIcon, Nav } from "@/components/Nav";
import { Scene } from "@/components/Scene";
import { Wiki } from "@/components/casino/Wiki";

const DESC = "How to play every game in the colony casino: rules, odds, payouts, tips, glossary and FAQ.";
const SHARE = { url: "/og-rpeng.png", width: 1200, height: 630, alt: "$RPENG: the colony's gold" };
export const metadata: Metadata = {
  title: "Game wiki",
  description: DESC,
  alternates: { canonical: "/rpeng/wiki" },
  openGraph: { type: "article", url: "/rpeng/wiki", siteName: "Guins", title: "Game wiki · Guins", description: DESC, images: [SHARE] },
  twitter: { card: "summary_large_image", site: "@hoodguins", title: "Game wiki · Guins", description: DESC, images: [SHARE] },
};

// Same night world as the rest of the site, already dimmed: this page is all reading.
export default function WikiPage() {
  return (
    <>
      <Scene dark calm moon={[0.86, 0.06]} />
      <Nav />
      <div className="casino">
        <main className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-8 sm:pt-32">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/rpeng" className="chip transition hover:border-accent">← Back to the casino</Link>
            <Link href="/rpeng#play" className="btn btn-accent btn-sm">
              Games coming soon <ArrowIcon />
            </Link>
          </div>
          <header className="mt-10">
            <p className="label label-accent">Colony knowledge</p>
            <h1 className="mt-3 font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.88] font-bold uppercase">
              Game wiki<span className="text-accent">.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-dim">How to play, odds, payouts, tips and the fine print for every table in the casino.</p>
          </header>
          <div className="mt-10">
            <Wiki />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
