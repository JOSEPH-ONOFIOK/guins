import Image from "next/image";

// The gold Guin as a giant floating $RPENG medallion, with a few twinkles round it.
const SPARKS = [
  { top: "6%", left: "4%", s: 22, d: "0s" },
  { top: "18%", left: "88%", s: 16, d: ".8s" },
  { top: "72%", left: "92%", s: 26, d: "1.4s" },
  { top: "84%", left: "10%", s: 14, d: "2s" },
  { top: "40%", left: "-6%", s: 12, d: "1.1s" },
];

export function GoldMedallion({ className = "" }: { className?: string }) {
  return (
    <div className={`float relative ${className}`} style={{ ["--r" as string]: "3deg" }}>
      <div aria-hidden className="halo absolute -inset-6 rounded-full !opacity-40" />
      <div className="relative aspect-square overflow-hidden rounded-full border-[5px] border-[#ffe9a3] bg-gold shadow-[0_0_0_6px_#b8860b,0_0_60px_10px_rgba(255,207,63,.55),inset_0_-10px_30px_rgba(120,70,0,.4)]">
        <Image src="/hg/gold.png" alt="Midas, the gold Guin" fill priority sizes="(min-width: 640px) 16rem, 10rem" className="object-cover object-[50%_42%] scale-[1.35]" />
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
