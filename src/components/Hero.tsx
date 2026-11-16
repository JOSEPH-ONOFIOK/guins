import { authMode } from "@/lib/auth";
import { Crew } from "./Crew";
import { ArrowIcon } from "./Nav";
import { Reveal } from "./Reveal";

// Split intro: the pitch on the left, the whitelist application on the right.
export function Hero() {
  const open = authMode !== "off";
  return (
    <section id="apply" className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,34rem)] lg:gap-16">
        <Reveal>
          <p className="chip">
            <span className="glow-dot h-1.5 w-1.5 rounded-full bg-accent" />
            {open ? "Applications open" : "Applications opening soon"}
          </p>
          <h2 className="mt-6 font-display text-[clamp(3.6rem,9vw,6.5rem)] leading-[0.88] font-bold tracking-tight uppercase">
            Free mint<span className="text-accent">.</span>
          </h2>
          <p className="mt-3 font-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[0.95] font-bold text-accent uppercase">
            Join the
            <br />
            colony.
          </p>
          <p className="mt-6 max-w-sm text-lg text-dim">Get on the whitelist. Sign in with X, complete the tasks, submit your wallet.</p>

          <div className="mt-10 max-w-sm border-t border-line pt-6">
            <a href="#colony" className="group inline-flex items-center gap-4">
              <span>
                <span className="block text-sm text-dim">Already applied?</span>
                <span className="block font-bold">Check your status</span>
              </span>
              <span className="icon-btn transition group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink">
                <ArrowIcon />
              </span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="scroll-mt-28">
          <div id="colony" className="scroll-mt-28">
            <Crew />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
