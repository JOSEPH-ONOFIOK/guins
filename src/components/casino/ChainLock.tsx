// Two chains crossed over the casino with a gold padlock in the middle.
// Drawn in the site's cartoon style: thick dark outline, light steel links.

const INK = "#121212";

// Links along a line: an open oval, then one seen edge-on, and so on
function Chain({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const step = 30;
  const links = Math.ceil(len / step);
  return (
    <g transform={`translate(${x1} ${y1}) rotate(${angle})`}>
      {Array.from({ length: links }, (_, i) => {
        const x = i * step;
        return i % 2 ? (
          <g key={i}>
            <rect x={x - 19} y={-5} width={38} height={10} rx={5} fill="#aab2c0" stroke={INK} strokeWidth={3} />
            <rect x={x - 13} y={-1.5} width={26} height={3} rx={1.5} fill="#e6eaf1" />
          </g>
        ) : (
          <g key={i}>
            <ellipse cx={x} cy={0} rx={22} ry={13} fill="none" stroke={INK} strokeWidth={11} />
            <ellipse cx={x} cy={0} rx={22} ry={13} fill="none" stroke="#c9d0db" strokeWidth={5} />
            <path d={`M${x - 14},${-8} q8,-5 18,-2`} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
}

export function ChainLock({ title = "Coming soon", note = "The tables open with $RPENG." }: { title?: string; note?: string }) {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-[inherit]">
      {/* dim + blur whatever is underneath */}
      <div className="absolute inset-0 bg-[#0b0a12]/70 backdrop-blur-[3px]" />
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <Chain x1={-80} y1={80} x2={1080} y2={920} />
        <Chain x1={-80} y1={920} x2={1080} y2={80} />
      </svg>

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        {/* padlock */}
        <svg viewBox="0 0 120 140" className="float w-24 drop-shadow-[0_12px_30px_rgba(255,207,63,.45)] sm:w-28" aria-hidden>
          <path d="M30,62 V42 a30,30 0 0 1 60,0 V62" fill="none" stroke={INK} strokeWidth="18" strokeLinecap="round" />
          <path d="M30,62 V42 a30,30 0 0 1 60,0 V62" fill="none" stroke="#c9d0db" strokeWidth="9" strokeLinecap="round" />
          <rect x="12" y="58" width="96" height="74" rx="16" fill="#ffcf3f" stroke={INK} strokeWidth="5" />
          <rect x="20" y="66" width="80" height="14" rx="7" fill="#ffe48a" />
          <circle cx="60" cy="94" r="10" fill={INK} />
          <path d="M55,98 L52,118 H68 L65,98 Z" fill={INK} />
        </svg>
        <p className="mt-5 rounded-full border border-accent/50 bg-[#0b0a12]/85 px-4 py-1.5 text-[11px] font-bold tracking-[0.24em] text-accent uppercase">Locked</p>
        <h3 className="mt-3 font-display text-[clamp(2.4rem,7vw,4rem)] leading-none font-bold text-white uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,.8)]">{title}</h3>
        <p className="mt-3 max-w-xs rounded-xl bg-[#0b0a12]/80 px-4 py-2 text-sm text-white/85">{note}</p>
      </div>
    </div>
  );
}
