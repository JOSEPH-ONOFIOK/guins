import type { Metadata } from "next";
import Link from "next/link";
import { ColorWash } from "@/components/ColorWash";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Wiki } from "@/components/casino/Wiki";

export const metadata: Metadata = {
  title: "Game wiki",
  description: "How to play every game in the colony casino: rules, odds, payouts, tips, glossary and FAQ.",
};

export default function WikiPage() {
  return (
    <>
      <Nav />
      <div className="casino relative isolate min-h-[100svh] overflow-hidden">
        <ColorWash className="-z-10 fixed" strength={0.3} />
        <main className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-8 sm:pt-32">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/rpeng" className="chip transition hover:text-gold">← back to the casino</Link>
            <Link href="/rpeng#play" className="btn btn-gold btn-sm">🎰 Play now</Link>
          </div>
          <header className="mt-8 text-center">
            <p className="chip">colony knowledge</p>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-gold sm:text-6xl">Game wiki</h1>
            <p className="mx-auto mt-3 max-w-lg text-dim">How to play, odds, payouts, tips and the fine print for every table in the casino.</p>
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
