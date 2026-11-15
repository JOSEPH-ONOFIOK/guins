import { X_HANDLE, X_URL } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";
import { XIcon } from "./Nav";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-surface/70 bg-surface/70 backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,#7445f5,#0aa9c9,#e03fb4,transparent)]">
      {/* A sleepy one peeking up from the bottom */}
      <div aria-hidden className="pointer-events-none absolute -bottom-16 right-4 w-28 sm:right-[8%] sm:-bottom-20 sm:w-40">
        <HoodguinArt asleep fit="beanie" />
        <span className="zzz absolute top-4 right-2 font-display text-2xl font-bold text-cyan">z</span>
        <span className="zzz absolute top-4 right-2 font-display text-xl font-bold text-violet [animation-delay:1.2s]">z</span>
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pr-56">
        <div>
          <p className="grad-text font-display text-3xl font-bold tracking-tight">stay unbothered.</p>
          <p className="label mt-1">wagmi · ngmi · zzz</p>
        </div>
        <div className="flex items-center gap-4">
          <a href={X_URL} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            <XIcon /> @{X_HANDLE}
          </a>
          <span className="font-mono text-xs text-dim">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
