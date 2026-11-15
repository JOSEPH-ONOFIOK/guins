// Two chains strung across the felt in a shallow X, with a gold padlock and a
// "Coming soon" tag hanging where they cross. Purely decorative: the game stays
// visible underneath, and the Casino disables its controls.

const INK = "#121212";

// One repeat of the chain: an open oval link, then one seen edge-on
const LINK = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30"><ellipse cx="15" cy="15" rx="14" ry="9" fill="none" stroke="${INK}" stroke-width="8"/><ellipse cx="15" cy="15" rx="14" ry="9" fill="none" stroke="#c9d0db" stroke-width="3.5"/><path d="M6 10 q6 -4 13 -2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/><rect x="27" y="11.5" width="33" height="7" rx="3.5" fill="#aab2c0" stroke="${INK}" stroke-width="2.5"/><rect x="31" y="14" width="25" height="2" rx="1" fill="#e6eaf1"/></svg>`;
const CHAIN = { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LINK)}")`, backgroundSize: "60px 30px", backgroundRepeat: "repeat-x" };

export function ChainLock({ label = "Coming soon" }: { label?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]">
      <div className="absolute top-1/2 -left-[10%] h-[30px] w-[120%] -translate-y-1/2 rotate-[9deg] drop-shadow-[0_6px_6px_rgba(0,0,0,.45)]" style={CHAIN} />
      <div className="absolute top-1/2 -left-[10%] h-[30px] w-[120%] -translate-y-1/2 -rotate-[9deg] drop-shadow-[0_6px_6px_rgba(0,0,0,.45)]" style={CHAIN} />

      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-[38%] flex-col items-center">
        <svg viewBox="0 0 120 140" className="w-16 drop-shadow-[0_10px_24px_rgba(0,0,0,.55)] sm:w-20">
          <path d="M30,62 V42 a30,30 0 0 1 60,0 V62" fill="none" stroke={INK} strokeWidth="18" strokeLinecap="round" />
          <path d="M30,62 V42 a30,30 0 0 1 60,0 V62" fill="none" stroke="#c9d0db" strokeWidth="9" strokeLinecap="round" />
          <rect x="12" y="58" width="96" height="74" rx="16" fill="#ffcf3f" stroke={INK} strokeWidth="5" />
          <rect x="20" y="66" width="80" height="14" rx="7" fill="#ffe48a" />
          <circle cx="60" cy="94" r="10" fill={INK} />
          <path d="M55,98 L52,118 H68 L65,98 Z" fill={INK} />
        </svg>
        <span className="-mt-1 rotate-[-4deg] rounded-md border-2 border-[#121212] bg-accent px-3 py-1 text-xs font-bold tracking-[0.18em] text-accent-ink uppercase shadow-[0_4px_0_#121212]">
          {label}
        </span>
      </div>
    </div>
  );
}
