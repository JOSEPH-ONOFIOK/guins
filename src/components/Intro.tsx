import type { ReactNode } from "react";
import { ArrowIcon } from "./Nav";

// The opening screen: just the glacier art and a name written in the sky.
// It stays pinned while you scroll, and the Scene flies you through the ice frame
// into the page (the Scene sets --intro from 0 to 1 as you go).
export function Intro({
  eyebrow = "The",
  title = "GUINS",
  tagline = "The most unbothered penguins on-chain",
  art,
  next = "#colony",
  cta,
}: {
  eyebrow?: string;
  title?: string;
  tagline?: string;
  art?: ReactNode;
  next?: string;
  // Optional main button under the tagline, e.g. Get a Guin → the whitelist
  cta?: { label: string; href: string };
}) {
  return (
    <section id="top" aria-label={title} className="relative h-[120svh] overflow-x-clip">
      <div
        className="sticky top-0 flex h-[100svh] flex-col items-center justify-center px-4 pt-16 pb-[16vh] text-center will-change-[transform,opacity]"
        style={{ opacity: "calc(1 - var(--intro, 0) * 1.8)", transform: "translateY(calc(var(--intro, 0) * -12vh)) scale(calc(1 + var(--intro, 0) * 0.18))" }}
      >
        {art}
        <p className="cloud-type pop-in text-[clamp(1rem,2.6vw,1.9rem)] tracking-[0.3em] uppercase">{eyebrow}</p>
        <h1 className="cloud-type pop-in -mt-1 text-[clamp(4rem,16vw,13rem)] leading-[0.85] [animation-delay:.15s]">{title}</h1>
        <p className="pop-in mt-6 max-w-[90vw] rounded-full bg-black/45 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-white uppercase [animation-delay:.4s] sm:text-xs">
          {tagline}
        </p>
        {cta && (
          <a href={cta.href} className="btn btn-accent pop-in mt-6 !px-7 !py-4 text-sm [animation-delay:.5s] sm:text-base">
            {cta.label} <ArrowIcon />
          </a>
        )}
        <a
          href={next}
          className="pop-in mt-[clamp(1.5rem,5vh,3rem)] flex flex-col items-center gap-1 text-[10px] font-bold tracking-[0.24em] text-white uppercase [animation-delay:.6s]"
          style={{ opacity: "calc(1 - var(--intro, 0) * 4)" }}
        >
          Scroll
          <span className="scroll-hint block h-8 w-[2px] rounded-full bg-white/80" />
        </a>
      </div>
    </section>
  );
}
