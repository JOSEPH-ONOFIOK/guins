// Soft blobs in every site colour drifting slowly behind everything: violet, cyan,
// pink, gold, mint and sky. Pure CSS, so it costs nothing per frame in JS.

const BLOBS = [
  { c: "#7445f5", x: "8%", y: "6%", s: "42vmax", d: "26s", p: "drift-a" },
  { c: "#36f1ff", x: "62%", y: "-4%", s: "38vmax", d: "31s", p: "drift-b" },
  { c: "#ff4fd8", x: "70%", y: "38%", s: "34vmax", d: "23s", p: "drift-c" },
  { c: "#ffcf3f", x: "18%", y: "44%", s: "28vmax", d: "29s", p: "drift-b" },
  { c: "#4dffb5", x: "40%", y: "20%", s: "26vmax", d: "34s", p: "drift-a" },
  { c: "#5aa6ff", x: "-6%", y: "30%", s: "30vmax", d: "27s", p: "drift-c" },
];

export function ColorWash({ className = "", strength = 0.45 }: { className?: string; strength?: number }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ opacity: strength }}>
      {BLOBS.map((b, i) => (
        <span
          key={i}
          className={`wash-blob ${b.p}`}
          style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: `radial-gradient(circle at 50% 50%, ${b.c}, transparent 68%)`, animationDuration: b.d, animationDelay: `-${i * 4}s` }}
        />
      ))}
    </div>
  );
}
