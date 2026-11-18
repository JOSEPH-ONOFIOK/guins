import { CHAIN_NAMES, initials, type Community } from "@/lib/waddle";

// A partner community's art: its logo, or (no logo yet) its initials on its tint
// tiny: a small pfp, initials sized to fit
export function CommunityArt({ c, className = "", big, tiny }: { c: Community; className?: string; big?: boolean; tiny?: boolean }) {
  if (c.logo)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={c.logo} alt="" loading="lazy" decoding="async" className={`object-cover ${className}`} />
    );
  return (
    <div
      aria-hidden
      className={`grid place-items-center ${tiny ? "" : "pb-[30%]"} ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 25%, color-mix(in srgb, ${c.tint} 90%, white), ${c.tint} 45%, color-mix(in srgb, ${c.tint} 45%, #0b0a12))`,
      }}
    >
      <span className={`font-display font-bold text-[#17130a]/80 ${tiny ? "text-[10px]" : big ? "text-[clamp(3rem,9vw,6rem)]" : "text-[clamp(2rem,6vw,3.5rem)]"}`}>{initials(c.name)}</span>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

// One community: its art as the whole card's background, name and spots on top.
// featured: the bigger OG card. mine: the community their wallet claims through.
export function CommunityCard({ c, claimed, featured, mine, loaded }: { c: Community; claimed: number; featured?: boolean; mine?: boolean; loaded: boolean }) {
  const n = Math.min(claimed, c.limit);
  const full = loaded && n >= c.limit;
  const soon = !c.contract;
  return (
    <article
      className={`group relative isolate overflow-hidden rounded-[22px] border text-white shadow-[var(--shadow)] transition duration-500 hover:-translate-y-1 ${
        featured ? "aspect-[4/5]" : "aspect-square"
      } ${mine ? "border-accent ring-2 ring-accent/60" : "border-white/10"}`}
    >
      <CommunityArt c={c} big={featured} className="absolute inset-0 -z-10 h-full w-full transition duration-700 ease-out group-hover:scale-110" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/0" />

      <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
        {featured ? (
          <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-accent-ink uppercase shadow">OG fren</span>
        ) : (
          <span />
        )}
        {mine ? (
          <span className="pop-in rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-accent-ink uppercase">Yours ✦</span>
        ) : full ? (
          <span className="rounded-full bg-mint px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#07261b] uppercase">Full ✓</span>
        ) : soon ? (
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] uppercase backdrop-blur">Checker soon</span>
        ) : null}
      </div>

      <div className={`absolute inset-x-0 bottom-0 ${featured ? "p-5" : "p-3.5 sm:p-4"}`}>
        {/* pfp with the name beside it */}
        <div className="flex items-center gap-2.5">
          <span className={`relative shrink-0 overflow-hidden rounded-full border-2 ${featured ? "h-12 w-12 border-accent" : "h-9 w-9 border-white/70"}`}>
            <CommunityArt c={c} tiny className="h-full w-full" />
          </span>
          <div className="min-w-0">
            <h3 className={`font-display leading-[1.05] font-bold ${featured ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"}`}>{c.name}</h3>
            <p className="text-[10px] font-bold tracking-[0.16em] text-white/65 uppercase">{CHAIN_NAMES[c.chain]}</p>
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2 font-mono text-xs">
          <span className="font-semibold text-accent">{fmt(c.limit)} spots</span>
          <span className="text-white/70 tabular-nums">{loaded ? `${fmt(n)} claimed` : "…"}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className={`h-full rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${full ? "bg-mint" : "bg-accent"}`}
            style={{ width: loaded ? `${(n / c.limit) * 100}%` : "0%" }}
          />
        </div>
      </div>
    </article>
  );
}
