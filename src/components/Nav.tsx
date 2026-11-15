"use client";

import { useEffect, useState } from "react";
import { X_URL } from "@/lib/entry";

const LINKS = [
  { href: "#gang", label: "gang" },
  { href: "#stash", label: "$RPENG" },
  { href: "#crew", label: "join" },
];

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
      <nav className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border-[3px] px-3 pl-5 transition-all duration-300 border-outline bg-white/90 backdrop-blur ${solid || open ? "shadow-[0_4px_0_#121212]" : ""}`}>
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="h-3 w-3 rounded-full border-2 border-outline bg-beak" />
          hoodguins
        </a>
        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-semibold text-soft transition hover:text-flame">
              {l.label}
            </a>
          ))}
          <a href={X_URL} target="_blank" rel="noreferrer" className="btn btn-ink !px-3 !py-2 !shadow-[0_3px_0_#121212]" aria-label="Hoodguins on X">
            <XIcon />
          </a>
        </div>
        <button className="btn btn-white !px-4 !py-1.5 text-sm md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "close" : "menu"}
        </button>
      </nav>
      {open && (
        <div className="pop-in mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-[28px] border-[3px] border-outline bg-white p-4 shadow-[0_4px_0_#121212] md:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-3 py-2 font-display text-2xl font-bold hover:bg-mist">
              {l.label}
            </a>
          ))}
          <a href={X_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 px-3 font-semibold text-sm text-soft">
            <XIcon /> @hoodguins
          </a>
        </div>
      )}
    </header>
  );
}
