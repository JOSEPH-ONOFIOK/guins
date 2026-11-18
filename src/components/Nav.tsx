"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X_HANDLE, X_URL } from "@/lib/entry";
import { MODES, onModeChange, readMode, setMode, type Mode } from "@/lib/theme";
import { HoodguinArt } from "./HoodguinArt";

const LINKS = [
  { href: "/#gang", label: "Gang" },
  { href: "/waddle", label: "Waddle" },
  { href: "/rpeng", label: "$RPENG" },
  { href: "/rpeng/wiki", label: "Wiki" },
];

// The brand mark: a little Guin peeking out of a round gold badge
export function PenguinMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span aria-hidden className={`relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-accent ring-2 ring-accent/30 ${className}`}>
      <HoodguinArt className="h-[88%] w-auto translate-y-[8%]" />
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

export function ArrowIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

const THEME_LABEL: Record<Mode, string> = { dark: "Dark theme", light: "Light theme" };

function ThemeIcon({ mode }: { mode: Mode }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (mode === "light")
    return (
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden {...p}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

// Switches Dark ↔ Light
function ThemeToggle() {
  const [mode, setLocal] = useState<Mode>("dark");
  useEffect(() => {
    const sync = () => setLocal(readMode());
    queueMicrotask(sync);
    return onModeChange(sync);
  }, []);
  const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  return (
    <button className="icon-btn" onClick={() => setMode(next)} aria-label={`${THEME_LABEL[mode]}. Switch to ${THEME_LABEL[next].toLowerCase()}.`} title={THEME_LABEL[mode]}>
      <ThemeIcon mode={mode} />
    </button>
  );
}

export function Nav() {
  const path = usePathname();
  // Which pill link is the page you're on (the gang lives on the home page)
  const current = (href: string) => (href === "/rpeng" || href === "/waddle" ? path === href : href === "/rpeng/wiki" ? path.startsWith("/rpeng/wiki") : false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid || open ? "border-b border-line bg-void" : "border-b border-transparent bg-gradient-to-b from-void/75 to-transparent"}`}>
      <nav className="mx-auto grid h-20 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-3 justify-self-start font-display text-xl font-bold" aria-label="Guins home">
          <PenguinMark />
          <span className="hidden sm:inline">Guins</span>
        </Link>

        {/* Centre pill */}
        <div className="hidden items-center rounded-full border border-[var(--ghost-line)] bg-void/60 p-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current(l.href) ? "page" : undefined}
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-[0.14em] uppercase transition ${current(l.href) ? "bg-accent text-accent-ink" : "hover:bg-fg/10"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <a href={X_URL} target="_blank" rel="noreferrer" className="icon-btn hidden sm:inline-grid" aria-label={`Guins on X (@${X_HANDLE})`}>
            <XIcon />
          </a>
          <ThemeToggle />
          <Link href="/#colony" className="btn btn-accent btn-sm hidden sm:inline-flex">
            Join the colony <ArrowIcon />
          </Link>
          <button className="icon-btn md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="pop-in mx-auto flex max-w-6xl flex-col gap-1 px-4 pb-5 md:hidden">
          {[...LINKS, { href: "/#colony", label: "Join the colony" }].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} aria-current={current(l.href) ? "page" : undefined} className={`flex items-center justify-between rounded-xl px-3 py-3 font-display text-2xl font-bold uppercase hover:bg-[var(--ghost)] ${current(l.href) ? "text-accent" : ""}`}>
              {l.label} <ArrowIcon className="h-5 w-5 text-accent" />
            </Link>
          ))}
          <a href={X_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 px-3 text-xs font-bold tracking-widest text-dim uppercase">
            <XIcon /> @{X_HANDLE}
          </a>
        </div>
      )}
    </header>
  );
}
