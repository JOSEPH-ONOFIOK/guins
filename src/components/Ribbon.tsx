// One scrolling ticker between the hero and the gang.
const WORDS = ["guins", "the colony", "do not disturb", "$RPENG", "unbothered", "gm (grumpy morning)", "waddle together", "no smiling (ok maybe one)"];

export function Ribbon() {
  const row = [...WORDS, ...WORDS];
  return (
    <div
      className="relative overflow-hidden border-y border-surface/70 bg-surface/60 py-3 backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,#7445f5,#0aa9c9,transparent)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,transparent,#e03fb4,#7445f5,transparent)]"
      aria-label="Guins. The colony."
    >
      <div className="marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0" aria-hidden>
            {row.map((w, i) => (
              <span key={i} className="flex items-center gap-6 px-6 font-mono text-sm tracking-[0.18em] font-semibold whitespace-nowrap text-fg uppercase">
                <span className={w === "$RPENG" ? "text-amber" : ""}>{w}</span>
                <span className="text-cyan">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
