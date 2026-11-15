import { X_URL } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";
import { XIcon } from "./Nav";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* A sleepy one peeking up from the bottom */}
      <div aria-hidden className="pointer-events-none absolute -bottom-16 right-4 w-28 sm:right-[8%] sm:-bottom-20 sm:w-40">
        <HoodguinArt asleep fit="beanie" />
        <span className="zzz absolute top-4 right-2 font-display text-2xl font-bold text-white">z</span>
        <span className="zzz absolute top-4 right-2 font-display text-xl font-bold text-white [animation-delay:1.2s]">z</span>
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pr-56">
        <p className="font-display text-3xl font-bold">stay unbothered<span className="text-beak">.</span></p>
        <div className="flex items-center gap-4">
          <a href={X_URL} target="_blank" rel="noreferrer" className="btn btn-white !py-2 text-sm">
            <XIcon /> @hoodguins
          </a>
          <span className="font-semibold text-xs text-white/50">© 2026</span>
        </div>
      </div>
    </footer>
  );
}
