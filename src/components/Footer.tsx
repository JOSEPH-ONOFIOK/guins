import Link from "next/link";
import { X_HANDLE, X_URL } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";
import { ArrowIcon, PenguinMark, XIcon } from "./Nav";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/rpeng", label: "$RPENG" },
  { href: "/rpeng/wiki", label: "Wiki", accent: true },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-void">
      {/* A sleepy one peeking up from the bottom */}
      <div aria-hidden className="pointer-events-none absolute right-4 -bottom-5 w-20 sm:right-8 sm:-bottom-7 sm:w-24">
        <HoodguinArt asleep fit="beanie" />
        <span className="zzz absolute -top-2 right-0 font-display text-2xl font-bold text-accent">z</span>
        <span className="zzz absolute -top-2 right-0 font-display text-xl font-bold text-accent [animation-delay:1.2s]">z</span>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-24 sm:px-8 sm:pb-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="Guins home">
            <PenguinMark className="h-12 w-12" />
          </Link>
          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`group inline-flex items-center gap-2 font-display text-3xl font-bold uppercase transition hover:text-accent sm:text-4xl ${l.accent ? "text-accent" : ""}`}>
                {l.label}
                <ArrowIcon className="h-5 w-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </nav>
          <a href="#top" className="label label-accent inline-flex items-center gap-2 hover:text-fg">
            Back to top ↑
          </a>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 pr-24 sm:flex-row sm:items-center sm:justify-between sm:pr-32">
          <p className="label">© 2026 Guins. Stay unbothered.</p>
          <a href={X_URL} target="_blank" rel="noreferrer" className="label inline-flex items-center gap-2 hover:text-fg">
            <XIcon className="h-3.5 w-3.5" /> @{X_HANDLE}
          </a>
          <p className="label">Made in the colony.</p>
        </div>
      </div>
    </footer>
  );
}
