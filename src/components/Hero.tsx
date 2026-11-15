const WORD = "hoodguins";

// Full-screen intro sitting over the living glacier world (see Scene).
export function Hero() {
  return (
    <section id="top" className="relative">
      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center px-4 pt-28 text-center sm:px-8 sm:pt-32">
        <p className="pop-in mx-auto inline-flex items-center gap-2 rounded-full border-[2.5px] border-outline bg-white px-4 py-1.5 font-semibold text-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-beak ring-2 ring-outline" />
          sleepy · grumpy · secretly soft
        </p>

        <h1 className="sticker relative isolate mx-auto mt-5 w-fit font-display text-[clamp(3.8rem,14vw,10rem)] leading-[0.85] font-bold tracking-tight" aria-label={WORD}>
          {WORD.split("").map((c, i) => (
            <span key={i} aria-hidden className="rise" style={{ animationDelay: `${120 + i * 55}ms` }}>{c}</span>
          ))}
          <svg aria-hidden viewBox="0 0 600 40" preserveAspectRatio="none" className="absolute -bottom-[0.18em] left-[2%] -z-10 h-[0.24em] w-[96%]">
            <path className="draw" d="M6,28 C150,6 420,4 594,22" fill="none" stroke="#ffcf3f" strokeWidth="14" strokeLinecap="round" />
          </svg>
        </h1>

        <p className="pop-in mx-auto mt-7 max-w-md rounded-full border-[2.5px] border-outline bg-white px-5 py-1.5 text-lg font-medium [animation-delay:.9s] sm:text-xl">
          The most unbothered little penguins on the block.
        </p>
        <div className="pop-in mt-7 flex flex-wrap justify-center gap-3 [animation-delay:1.05s]">
          <a href="#crew" className="btn btn-beak text-lg">Join the crew</a>
          <a href="#gang" className="btn btn-white text-lg">Meet the gang</a>
        </div>
      </div>
    </section>
  );
}
