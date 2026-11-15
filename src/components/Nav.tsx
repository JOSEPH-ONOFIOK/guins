"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X_HANDLE, X_URL } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";

const LINKS = [
  { href: "/#gang", label: "gang" },
  { href: "/rpeng", label: "$RPENG" },
  { href: "/#colony", label: "the colony" },
];

// The brand mark: a little Guin peeking out of a soft tile
export function PenguinMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span aria-hidden className={`relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-xl bg-[linear-gradient(160deg,#e9e4ff,#c9f3ff)] ring-1 ring-black/10 ${className}`}>
      <HoodguinArt className="h-[92%] w-auto translate-y-[6%]" />
    </span>
  );
}

export function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3">
      <nav className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-surface/80 bg-surface/75 px-3 pl-3 backdrop-blur-xl transition-shadow duration-300 ${solid || open ? "shadow-[0_12px_40px_-16px_rgba(116,69,245,.45)]" : "shadow-[0_4px_20px_-12px_rgba(23,18,61,.25)]"}`}>
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
          <PenguinMark />
          <span className="grad-text">Guins</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 font-mono text-xs tracking-widest text-dim uppercase transition hover:bg-violet/10 hover:text-violet">
              {l.label}
            </Link>
          ))}
          <a href={X_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm ml-2 !px-2.5" aria-label="Guins on X">
            <XIcon />
          </a>
          <Link href="/#colony" className="btn btn-neon btn-sm">Join the colony</Link>
        </div>
        <button className="btn btn-ghost btn-sm md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "close" : "menu"}
        </button>
      </nav>
      {open && (
        <div className="pop-in mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl border border-surface/80 bg-surface/90 p-3 shadow-[0_12px_40px_-16px_rgba(116,69,245,.45)] backdrop-blur-xl md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 font-display text-2xl font-bold hover:bg-violet/10">
              {l.label}
            </Link>
          ))}
          <a href={X_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 px-3 font-mono text-xs text-dim">
            <XIcon /> @{X_HANDLE}
          </a>
        </div>
      )}
    </header>
  );
}
