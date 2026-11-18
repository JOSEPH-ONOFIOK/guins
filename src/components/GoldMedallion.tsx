import Image from "next/image";

// The gold Guin as a floating $RPENG medallion, with a few twinkles round it.
// delay: start the float at a different point, so several side by side don't bob in step.
const SPARKS = [
  { top: "6%", left: "4%", s: 22, d: "0s" },
  { top: "18%", left: "88%", s: 16, d: ".8s" },
  { top: "72%", left: "92%", s: 26, d: "1.4s" },
  { top: "84%", left: "10%", s: 14, d: "2s" },
  { top: "40%", left: "-6%", s: 12, d: "1.1s" },
];

export function GoldMedallion({ className = "", delay = 0, tilt = 3, priority = false }: { className?: string; delay?: number; tilt?: number; priority?: boolean }) {
  return (
    <div className={`float relative ${className}`} style={{ ["--r" as string]: `${tilt}deg`, animationDelay: `${-delay}s` }}>
      <div aria-hidden className="halo absolute -inset-6 rounded-full !opacity-40" />
      <div className="relative aspect-square overflow-hidden rounded-full border-[5px] border-[#ffe9a3] bg-gold shadow-[0_0_0_6px_#b8860b,0_0_60px_10px_rgba(255,207,63,.55),inset_0_-10px_30px_rgba(120,70,0,.4)]">
        <Image src="/hg/gold.png" alt="" fill priority={priority} sizes="(min-width: 640px) 12rem, 8rem" className="object-cover object-[50%_42%] scale-[1.35]" />
        <div aria-hidden className="absolute inset-0 rounded-full bg-[linear-gradient(130deg,rgba(255,255,255,.45),transparent_35%,transparent_65%,rgba(255,255,255,.2))]" />
      </div>
      {SPARKS.map((s, i) => (
        <span key={i} aria-hidden className="twinkle absolute text-white drop-shadow-[0_0_6px_#ffcf3f]" style={{ top: s.top, left: s.left, fontSize: s.s, animationDelay: s.d }}>
          ✦
        </span>
      ))}
    </div>
  );
}
