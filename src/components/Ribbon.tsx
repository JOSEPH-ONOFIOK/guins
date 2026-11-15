// One scrolling ticker between the hero and the gang.
const WORDS = ["guins", "the colony", "do not disturb", "$RPENG", "unbothered", "gm (grumpy morning)", "waddle together", "no smiling (ok maybe one)"];

export function Ribbon() {
  const row = [...WORDS, ...WORDS];
  return (
    <div
      className="relative overflow-hidden border-y border-line bg-void/85 py-3.5 text-accent backdrop-blur-md"
      aria-label="Guins. The colony."
    >
      <div className="marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0" aria-hidden>
            {row.map((w, i) => (
              <span key={i} className="flex items-center gap-6 px-6 text-xs font-bold tracking-[0.24em] whitespace-nowrap uppercase sm:text-sm">
                <span>{w}</span>
                <span aria-hidden className="text-fg/30">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
