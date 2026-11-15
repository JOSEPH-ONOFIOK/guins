// One soft scrolling ribbon between the hero and the gang.
const WORDS = ["hoodguins", "do not disturb", "$RPENG", "unbothered", "secretly soft", "no smiling (ok maybe one)"];
const ICONS = ["♥", "✦", "✿"];

export function Ribbon() {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="-rotate-1 overflow-hidden border-y-[3px] border-outline bg-ink py-3 text-white" aria-label="Hoodguins. Do not disturb.">
      <div className="marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0" aria-hidden>
            {row.map((w, i) => (
              <span key={i} className="flex items-center gap-5 px-5 font-display text-lg font-bold whitespace-nowrap sm:text-xl">
                {w}
                <span className="text-beak">{ICONS[i % ICONS.length]}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
