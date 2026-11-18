"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MIN_BET, RATE, RATE_KNOWN, START_CHIPS, fmtTok, fmtUsd } from "@/lib/rpeng";
import { FLIP_PAYS } from "./CoinFlip";
import { FOUR_TIERS, TARGET } from "./FourSeconds";
import { OU_PAYS } from "./OverUnder";
import { Icon, type IconName } from "../Icon";
import { Rules } from "./Rules";
import { PAIR_PAYS, SYMBOLS } from "./Slots";

// The Colony Casino wiki: one article per game plus a glossary and FAQ.
// Every number here is worked out from the game code, so it can't go stale.

const pct = (p: number) => `${(p * 100).toFixed(p < 0.01 ? 3 : 2).replace(/\.?0+$/, "")}%`;
const odds = (p: number) => (p > 0 ? `1 in ${Math.round(1 / p).toLocaleString("en-US")}` : "never");

// Two dice: ways to roll each total
const WAYS = Array.from({ length: 11 }, (_, i) => {
  const sum = i + 2;
  return { sum, ways: 6 - Math.abs(7 - sum) };
});
const pUnder = WAYS.filter((w) => w.sum < 7).reduce((t, w) => t + w.ways, 0) / 36;
const pSeven = 6 / 36;
const pOver = WAYS.filter((w) => w.sum > 7).reduce((t, w) => t + w.ways, 0) / 36;

// Slots: chance of each line
const W = SYMBOLS.reduce((t, s) => t + s.w, 0);
const SLOT_LINES = SYMBOLS.map((s) => ({ ...s, p: (s.w / W) ** 3 }));
const pPair = SYMBOLS.reduce((t, s) => t + 3 * (s.w / W) ** 2 * (1 - s.w / W), 0);
const slotRtp = SLOT_LINES.reduce((t, s) => t + s.p * s.three, 0) + pPair * PAIR_PAYS;
const pSlotWin = SLOT_LINES.reduce((t, s) => t + s.p, 0) + pPair;

type Article = { id: string; icon: IconName; title: string; box?: [string, string][]; body: ReactNode };

function H({ children }: { children: ReactNode }) {
  return <h4 className="mt-6 mb-2 font-display text-base font-bold text-gold">{children}</h4>;
}
function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5">
          <tr>{head.map((h) => <th key={h} className="label px-3 py-2 !text-[11px]">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, k) => <td key={k} className={`px-3 py-2 ${k > 0 ? "font-mono" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const Tips = ({ items }: { items: string[] }) => (
  <ul className="grid gap-2">
    {items.map((t) => (
      <li key={t} className="flex gap-2"><span className="text-gold">✦</span><span>{t}</span></li>
    ))}
  </ul>
);

const ARTICLES: Article[] = [
  {
    id: "how-to-play",
    icon: "scroll",
    title: "How to play",
    body: <Rules />,
  },
  {
    id: "start",
    icon: "penguin",
    title: "Getting started",
    body: (
      <>
        <p>The Colony Casino is where Guins kill time while they wait for $RPENG. You play with free <b>play chips</b>, not real tokens, so nothing here costs or pays real money.</p>
        <H>Your first round</H>
        <ol className="grid list-decimal gap-1.5 pl-5">
          <li>You start with <b>{fmtTok(START_CHIPS)}</b> play chips{RATE_KNOWN && ` (≈ ${fmtUsd(START_CHIPS)})`}.</li>
          <li>Pick a game from the four tabs above the table.</li>
          <li>Tap a poker chip under the table to set your bet. ½, 2× and Max adjust it.</li>
          <li>Play. Your bet leaves your balance when the round starts, and any win lands back on it when the round ends.</li>
        </ol>
        <H>Reading the numbers</H>
        <p>Big amounts are shortened: <b>K</b> = thousand, <b>M</b> = million, <b>B</b> = billion.
          {RATE_KNOWN ? (
            <>
              {" "}The dollar figure next to an amount uses the reference rate <b>{RATE.tokens.toLocaleString("en-US")} $RPENG = {fmtUsd(RATE.tokens)}</b>, so 1M ≈ {fmtUsd(1_000_000)} and 50M ≈ {fmtUsd(50_000_000)}.
            </>
          ) : (
            " There are no dollar values: $RPENG hasn't launched, so it has no price yet."
          )}
        </p>
        <H>Which game should I play?</H>
        <Table
          head={["Game", "Win chance", "Top payout", "Return", "Skill"]}
          rows={[
            ["Coin Flip", pct(0.5), `${FLIP_PAYS}×`, pct(0.5 * FLIP_PAYS), "none"],
            ["4 Seconds", "up to you", `${FOUR_TIERS[0].pays}×`, "depends on you", "all of it"],
            ["Over / Under 7", `${pct(pSeven)}–${pct(pUnder)}`, `${OU_PAYS.seven}×`, `${pct(pSeven * OU_PAYS.seven)}–${pct(pUnder * OU_PAYS.under)}`, "none"],
            ["Guin Slots", pct(pSlotWin), `${SYMBOLS[0].three}×`, pct(slotRtp), "none"],
          ]}
        />
      </>
    ),
  },
  {
    id: "flip",
    icon: "coin",
    title: "Coin Flip",
    box: [["Type", "Luck"], ["Win chance", pct(0.5)], ["Payout", `${FLIP_PAYS}×`], ["Return", pct(0.5 * FLIP_PAYS)], ["Round time", "1.6s"]],
    body: (
      <>
        <p>The oldest game in the colony. One side of the coin is the gold $RPENG face, the other is a Guin&apos;s beak. Call a side, the coin spins, and if it lands your way you win.</p>
        <H>Odds</H>
        <Table head={["Result", "Chance", "You get back"]} rows={[["Your side", pct(0.5), `${FLIP_PAYS}× bet`], ["Other side", pct(0.5), "nothing"]]} />
        <H>Example</H>
        <p>Bet 10M on $RPENG. It lands $RPENG: you get {fmtTok(10_000_000 * FLIP_PAYS)} back, a profit of {fmtTok(10_000_000 * (FLIP_PAYS - 1))}. It lands Beak: the 10M is gone.</p>
        <H>Tips</H>
        <Tips items={["Every flip is independent. Five Beaks in a row doesn't make $RPENG \"due\".", "Neither side is luckier. Pick whichever you like the look of.", `The ${FLIP_PAYS}× payout is a hair under 2×. That small gap is the house edge.`]} />
      </>
    ),
  },
  {
    id: "four",
    icon: "timer",
    title: "4 Seconds",
    box: [["Type", "Skill"], ["Target", `${TARGET.toFixed(2)}s`], ["Top payout", `${FOUR_TIERS[0].pays}×`], ["Clock hides", "after 1.5s"], ["Auto stop", "8s"]],
    body: (
      <>
        <p>The only game in The Colony Casino you can actually get good at. Start the clock and stop it as close to exactly {TARGET.toFixed(2)} seconds as you can. You see the first 1.5 seconds, then it goes dark and you&apos;re counting on feel.</p>
        <H>Payout tiers</H>
        <Table
          head={["Tier", "Stop between", "You get back"]}
          rows={[
            ...FOUR_TIERS.map((t) => [t.name, `${(TARGET - t.within).toFixed(2)}s – ${(TARGET + t.within).toFixed(2)}s`, t.pays === 1 ? "your bet" : `${t.pays}× bet`]),
            ["Miss", "anything else", "nothing"],
          ]}
        />
        <H>Tips</H>
        <Tips items={[
          "Use the visible 1.5 seconds to lock in the rhythm, then keep counting at the same speed.",
          "Count \"one-penguin, two-penguin…\" and press on the start of \"four\". Saying a word per second keeps you steady.",
          "Most people stop early when nervous. If you keep landing around 3.7s, wait a beat longer.",
          "Practise with the smallest chip before going big. Your timing gets better fast.",
        ]} />
      </>
    ),
  },
  {
    id: "dice",
    icon: "dice",
    title: "Over / Under 7",
    box: [["Type", "Luck"], ["Dice", "2 × six-sided"], ["Best odds", pct(pUnder)], ["Top payout", `${OU_PAYS.seven}×`], ["Round time", "0.9s"]],
    body: (
      <>
        <p>Two dice are rolled and added together. Before the roll you call where the total will land: under 7, exactly 7, or over 7.</p>
        <H>Your three bets</H>
        <Table
          head={["Bet", "Wins on", "Chance", "Payout", "Return"]}
          rows={[
            ["Under 7", "2 – 6", pct(pUnder), `${OU_PAYS.under}×`, pct(pUnder * OU_PAYS.under)],
            ["Lucky 7", "7", pct(pSeven), `${OU_PAYS.seven}×`, pct(pSeven * OU_PAYS.seven)],
            ["Over 7", "8 – 12", pct(pOver), `${OU_PAYS.over}×`, pct(pOver * OU_PAYS.over)],
          ]}
        />
        <H>Why 7 is special</H>
        <p>There are 36 ways two dice can land. More of them add up to 7 than any other total, so 7 is the single most likely number, but it&apos;s still only {pct(pSeven)}.</p>
        <div className="mt-3 flex items-end gap-1.5" aria-label="How many ways each total can be rolled">
          {WAYS.map((w) => (
            <div key={w.sum} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-dim">{w.ways}</span>
              <div className={`w-full rounded-t-md ${w.sum === 7 ? "bg-gold" : w.sum < 7 ? "bg-cyan/70" : "bg-pink/70"}`} style={{ height: `${w.ways * 14}px` }} />
              <span className="font-mono text-xs">{w.sum}</span>
            </div>
          ))}
        </div>
        <H>Tips</H>
        <Tips items={["Under and Over are mirror images: same chance, same payout.", "Lucky 7 wins less often but pays more than double when it does.", "Over the long run Under/Over gives back more of your chips than Lucky 7."]} />
      </>
    ),
  },
  {
    id: "slots",
    icon: "slots",
    title: "Guin Slots",
    box: [["Type", "Luck"], ["Reels", "3"], ["Any win", pct(pSlotWin)], ["Jackpot", `${SYMBOLS[0].three}×`], ["Return", pct(slotRtp)]],
    body: (
      <>
        <p>Three reels, six symbols from around the glacier. Rarer symbols show up less and pay more. Three of a kind pays the line, and any two matching symbols pays a small win.</p>
        <H>Paytable</H>
        <Table
          head={["Line", "Chance", "Odds", "Payout"]}
          rows={[...SLOT_LINES.map((s) => [`${s.s}${s.s}${s.s}`, pct(s.p), odds(s.p), `${s.three}×`]), ["Any pair", pct(pPair), odds(pPair), `${PAIR_PAYS}×`]]}
        />
        <H>The symbols</H>
        <Table head={["Symbol", "Name", "How common"]} rows={SYMBOLS.map((s) => [s.s, { "💎": "Glacier diamond", "🐧": "Guin", "🪙": "$RPENG coin", "🐟": "Fish", "❄️": "Snowflake", "🧊": "Ice cube" }[s.s] ?? "", `${s.w} in ${W} per reel`])} />
        <H>Tips</H>
        <Tips items={[`Three 💎 is ${odds(SLOT_LINES[0].p)} spins on average. Don't chase it with your whole stack.`, "Pairs are where most wins come from. They keep your balance ticking along between big hits.", "Each reel stops on its own, left to right, and every spin is fresh."]} />
      </>
    ),
  },
  {
    id: "glossary",
    icon: "book",
    title: "Glossary",
    body: (
      <dl className="grid gap-3">
        {[
          ["Bet", "The chips you put on one round."],
          ["Payout (×)", "What you get back for a win, as a multiple of your bet. 3× on 10M is 30M back."],
          ["Profit", "Payout minus your bet. 3× on 10M is 20M profit."],
          ["Push", "A round where you get exactly your bet back. No win, no loss."],
          ["Return (RTP)", "How much of every chip bet a game pays back over many, many rounds. 97% means 100M bet returns about 97M on average."],
          ["House edge", "The other side of return: the small share the house keeps. 97% return is a 3% edge."],
          ["Win chance", "How often a bet wins. It's different from return, because rare wins pay more."],
          ["Top up", `Resets your balance to ${fmtTok(START_CHIPS)} once it falls under ${fmtTok(MIN_BET)}.`],
          ...(RATE_KNOWN ? [["Reference rate", `${RATE.tokens.toLocaleString("en-US")} $RPENG = ${fmtUsd(RATE.tokens)}. Used to show dollar values, nothing else.`]] : []),
        ].map(([k, v]) => (
          <div key={k} className="well px-4 py-3">
            <dt className="font-display text-sm font-bold text-gold">{k}</dt>
            <dd className="mt-1 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    id: "faq",
    icon: "help",
    title: "FAQ",
    body: (
      <div className="grid gap-2">
        {[
          ["Are these real $RPENG?", "No. Chips are play money for fun. They can't be bought, withdrawn, swapped or cashed out, and they have nothing to do with real $RPENG."],
          ["Where is my balance saved?", "In this browser only. Clearing site data, a private window or another device starts you fresh."],
          ["Is it rigged?", "Every result comes from your browser's secure random number generator, the same kind used for passwords. The odds in this wiki are exact."],
          ["Can I lose more than my balance?", "No. You can't bet more than you have, and you can top up whenever you drop under the minimum bet."],
          RATE_KNOWN
            ? ["Why do dollar values look so small?", `$RPENG has a huge supply, so each token is worth a tiny fraction of a cent at the reference rate: 1M ≈ ${fmtUsd(1_000_000)}.`]
            : ["What's $RPENG worth?", "Nothing yet: it hasn't launched, so it has no price. That's why The Colony Casino shows chips and no dollar values."],
        ].map(([q, a]) => (
          <details key={q} className="well group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
              {q}
              <span className="text-gold transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm text-dim">{a}</p>
          </details>
        ))}
      </div>
    ),
  },
];

export const WIKI_IDS = ARTICLES.map((a) => a.id);

export function Wiki() {
  const [id, setId] = useState(ARTICLES[0].id);
  const a = ARTICLES.find((x) => x.id === id)!;

  // Articles have their own links: /rpeng/wiki#slots opens Guin Slots
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1);
      if (WIKI_IDS.includes(h)) setId(h);
    };
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);
  const pick = (next: string) => {
    setId(next);
    history.replaceState(null, "", `#${next}`);
  };

  return (
    <div>
      <div className="glass grid grid-cols-[minmax(0,1fr)] overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Contents */}
        <nav aria-label="Wiki contents" className="border-b border-line bg-black/20 p-3 md:border-r md:border-b-0 md:p-4">
          <p className="label mb-2 hidden md:block">contents</p>
          <ul className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
            {ARTICLES.map((x) => (
              <li key={x.id} className="shrink-0">
                <button
                  onClick={() => pick(x.id)}
                  aria-current={x.id === id ? "page" : undefined}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold whitespace-nowrap transition ${x.id === id ? "bg-gold/15 text-gold ring-1 ring-gold/50" : "hover:bg-white/5"}`}
                >
                  <Icon name={x.icon} className="h-4.5 w-4.5" />
                  {x.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Article */}
        <article key={a.id} className="pop-in min-w-0 p-5 leading-relaxed sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl font-bold sm:text-3xl">
                <Icon name={a.icon} className="mr-2 inline h-7 w-7 -translate-y-0.5 text-accent" />
                {a.title}
              </h3>
              <div className="mt-4 text-[0.95rem]">{a.body}</div>
            </div>
            {a.box && (
              <aside className="well w-full shrink-0 overflow-hidden !p-0 lg:sticky lg:top-24 lg:w-56">
                <p className="bg-gold/15 px-4 py-2 text-center font-display text-sm font-bold text-gold">{a.title}</p>
                <dl>
                  {a.box.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-t border-line px-4 py-2 text-sm">
                      <dt className="text-dim">{k}</dt>
                      <dd className="font-mono font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
