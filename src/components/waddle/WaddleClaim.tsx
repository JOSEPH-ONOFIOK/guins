"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WALLET, X_HANDLE, X_URL, type PublicEntry } from "@/lib/entry";
import { OG, WADDLE, WADDLE_POST, WADDLE_POST_ID, WL_CAP, claimText, communityOf, wlTasksDone, type WlStats } from "@/lib/waddle";
import { AUTH_ERRORS } from "../Crew";
import { Icon } from "../Icon";
import { ArrowIcon, XIcon } from "../Nav";
import { Reveal } from "../Reveal";
import { CommunityArt, CommunityCard } from "./CommunityCard";

// The Waddle List: hold an NFT from a partner community, do the tasks, get a GTD spot.
// 01 check wallet · 02 follow · 03 like + repost · 04 comment you claimed → confirm

const fmt = (n: number) => n.toLocaleString("en-US");
const openX = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
const intent = (kind: string, q: Record<string, string>) => `https://x.com/intent/${kind}?${new URLSearchParams(q)}`;
const sum = (list: typeof OG) => list.reduce((n, c) => n + c.limit, 0);

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <li className={`well p-4 ${done ? "!border-mint/40" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${done ? "border-mint/50 bg-mint/15 text-mint" : "border-line bg-white/5 text-dim"}`}>
          {done ? "✓" : `0${n}`}
        </span>
        <h3 className="font-display font-bold">{title}</h3>
      </div>
      <div className="mt-3 sm:pl-11">{children}</div>
    </li>
  );
}

const Locked = ({ children = "Check your wallet in step 01 first." }: { children?: ReactNode }) => <p className="text-sm text-dim">🔒 {children}</p>;
const Err = ({ children }: { children: ReactNode }) => <p className="mt-2 font-mono text-sm text-flame">{children}</p>;

// Spots gone across every community
function Meter({ stats }: { stats: WlStats | null }) {
  const cap = stats?.cap ?? WL_CAP;
  const claimed = Math.min(stats?.claimed ?? 0, cap);
  const full = !!stats && claimed >= cap;
  return (
    <div className="glass p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Waddle List spots claimed</p>
          <p className="mt-1 font-display text-4xl leading-none font-bold tabular-nums sm:text-5xl">
            {stats ? fmt(claimed) : "…"}
            <span className="text-2xl text-dim sm:text-3xl"> / {fmt(cap)}</span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.14em] uppercase ${full ? "bg-flame text-white" : "bg-accent text-accent-ink"}`}>
          {!stats ? "…" : full ? "All taken" : `${fmt(cap - claimed)} left`}
        </span>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-fg/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent via-[#ffe58a] to-accent transition-[width] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: stats ? `${Math.max((claimed / cap) * 100, claimed ? 1.5 : 0)}%` : "0%" }}
        />
      </div>
      {/* Every community: pfp with its name beside it, the OG frens first */}
      {/* One swipeable row on phones, so the claim card stays close; wraps from sm up */}
      <ul className="-mx-5 mt-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {[...OG, ...WADDLE].map((c) => {
          const n = Math.min(stats?.by[c.name] ?? 0, c.limit);
          const done = !!stats && n >= c.limit;
          return (
            <li
              key={c.name}
              title={`${c.name}: ${fmt(n)} of ${fmt(c.limit)} claimed`}
              className={`flex shrink-0 snap-start items-center gap-2 rounded-full border py-1 pr-3 pl-1 ${c.group === "og" ? "border-accent/60 bg-accent/10" : "border-line bg-[var(--well)]"}`}
            >
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                <CommunityArt c={c} tiny className="h-full w-full" />
              </span>
              <span className="text-sm leading-none font-semibold whitespace-nowrap">{c.name}</span>
              <span className={`font-mono text-[11px] leading-none tabular-nums ${done ? "text-mint" : "text-dim"}`}>{done ? "full" : `${fmt(n)}/${fmt(c.limit)}`}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WaddleClaim() {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<"x" | "dev" | "off">("off");
  const [entry, setEntry] = useState<PublicEntry | null>(null);
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null);
  const [devHandle, setDevHandle] = useState("");
  // The post they like, repost and comment on: the Waddle List post
  const post = { url: WADDLE_POST, id: WADDLE_POST_ID };
  // null until they type, so the saved wallet shows by default
  const [draft, setDraft] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<{ step: string; text: string } | null>(null);
  const [stats, setStats] = useState<WlStats | null>(null);

  const wl = entry?.wl;
  const eligible = !!wl?.community;
  const claimed = !!wl?.claimedAt;
  const mine = communityOf(wl?.community);
  const wallet = draft ?? wl?.wallet ?? "";

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setEntry(d.entry);
        setAuth(d.auth);
      })
      .catch(() => {})
      .finally(() => {
        setReady(true);
        if (q.get("connected")) setNotice({ text: "Connected. Let's find your community." });
        const e = q.get("auth_error");
        if (e) setNotice({ text: AUTH_ERRORS[e] ?? "Something went wrong with X.", bad: true });
        if (q.has("connected") || q.has("auth_error")) history.replaceState(null, "", location.pathname + "#claim");
      });
  }, []);

  // The live count: on arrival, every 5 s while the tab is open, and once their own spot is confirmed
  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/waddle")
        .then((r) => r.json())
        .then((d: WlStats) => live && typeof d.claimed === "number" && setStats(d))
        .catch(() => {});
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 5_000);
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [claimed]);

  const full = !!stats && stats.claimed >= stats.cap;

  const step = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setErr(null);
    try {
      const r = await fetch("/api/waddle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.entry) setEntry(d.entry);
      if (!r.ok) throw new Error(d.error);
      return true;
    } catch (e) {
      setErr({ step: key, text: e instanceof Error ? e.message : "Something went wrong." });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const connect = async () => {
    if (auth === "x") return location.assign(new URL(`/api/auth/x/start?to=${encodeURIComponent("/waddle")}`, location.href).href);
    setBusy("connect");
    const r = await fetch("/api/auth/dev", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: devHandle }) });
    const d = await r.json();
    setBusy(null);
    if (!r.ok) return setNotice({ text: d.error, bad: true });
    setEntry(d.entry);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setEntry(null);
    setDraft(null);
  };

  const checkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!WALLET.test(wallet.trim())) return setErr({ step: "wallet", text: "That isn't a valid EVM address. It starts with 0x followed by 40 characters." });
    if (await step({ step: "wallet", wallet: wallet.trim() }, "wallet")) setDraft(null);
  };

  const postUrl = post.url || X_URL;
  const text = mine ? claimText(mine) : "";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-12">
      <section id="claim" className="scroll-mt-24">
        <Reveal>
          <Meter stats={stats} />
        </Reveal>

        <Reveal className="mt-6">
          <div className="glass overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
              {/* The art: their community once found, otherwise the three OG frens */}
              <div className="relative min-h-[260px] overflow-hidden border-b border-line lg:border-r lg:border-b-0">
                {mine ? (
                  <div key={mine.name} className="pop-in absolute inset-0">
                    <CommunityArt c={mine} big className="absolute inset-0 h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="label !text-accent">{claimed ? "Claimed through" : "Your wallet holds"}</p>
                      <p className="font-display text-4xl leading-none font-bold">{mine.name}</p>
                      <p className="mt-2 font-mono text-xs text-white/75">{fmt(mine.limit)} spots for this community</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 grid grid-cols-3">
                    {OG.map((c) => (
                      <div key={c.name} className="relative overflow-hidden">
                        <CommunityArt c={c} className="absolute inset-0 h-full w-full scale-110" />
                        <span className="sr-only">{c.name}</span>
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/5" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="label !text-accent">GTD free mint</p>
                      <p className="font-display text-4xl leading-none font-bold">Hold a fren. Claim a spot.</p>
                      <p className="mt-2 text-sm text-white/75">
                        {OG.length + WADDLE.length} communities · {fmt(WL_CAP)} spots
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 p-5 sm:p-8">
                {notice && (
                  <p className={`pop-in mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.bad ? "border-flame/40 bg-flame/10 text-flame" : "border-accent/40 bg-accent/10"}`} role="status">
                    {notice.text}
                  </p>
                )}

                {!ready ? (
                  <div aria-busy="true" aria-label="Loading" className="animate-pulse">
                    <div className="h-3 w-32 rounded bg-fg/10" />
                    <div className="mt-4 h-10 w-3/4 rounded-lg bg-fg/10" />
                    <div className="mt-6 h-14 rounded-xl bg-accent/25" />
                  </div>
                ) : !entry ? (
                  <div>
                    <p className="label label-accent">Waddle List · Community claim</p>
                    <h2 className="mt-3 font-display text-4xl leading-none font-bold sm:text-5xl">Start with X.</h2>
                    <p className="mt-4 text-dim">Connect X, paste the wallet holding your NFT, then do three quick tasks. Read-only: we can&apos;t post, follow or like for you.</p>
                    <div className="mt-6">
                      {auth === "off" ? (
                        <a href={X_URL} target="_blank" rel="noreferrer" className="btn btn-ghost w-full justify-between !py-4">
                          <span className="flex items-center gap-2">
                            <XIcon /> Sign-in opens soon · follow @{X_HANDLE}
                          </span>
                          <ArrowIcon />
                        </a>
                      ) : auth === "dev" ? (
                        <form onSubmit={(e) => (e.preventDefault(), connect())} className="flex gap-2">
                          <input value={devHandle} onChange={(e) => setDevHandle(e.target.value)} placeholder="your handle (dev mode)" className="field" />
                          <button className="btn btn-accent" disabled={busy === "connect"}>Go</button>
                        </form>
                      ) : (
                        <button onClick={connect} className="btn btn-accent w-full justify-between !py-4">
                          <span className="flex items-center gap-2">
                            <XIcon /> Sign in with X
                          </span>
                          <ArrowIcon />
                        </button>
                      )}
                    </div>
                  </div>
                ) : claimed ? (
                  <div className="pop-in">
                    <p className="label label-accent">Status · GTD secured</p>
                    <h2 className="mt-3 font-display text-4xl leading-none font-bold sm:text-5xl">You&apos;re on the Waddle List.</h2>
                    {!!wl?.spot && (
                      <p className="mt-4 font-display text-2xl">
                        Spot #{fmt(wl.spot)} <span className="text-dim">of {fmt(WL_CAP)}</span>
                      </p>
                    )}
                    <div className="well mt-5 px-4 py-3">
                      <p className="label">Free mint wallet</p>
                      <p className="mt-0.5 font-mono text-sm break-all">{wl?.wallet}</p>
                    </div>
                    <p className="mt-4 text-sm text-dim">See you at mint. Watch @{X_HANDLE} for the date.</p>
                  </div>
                ) : full ? (
                  <div>
                    <p className="label label-accent">Waddle List</p>
                    <h2 className="mt-3 font-display text-4xl leading-none font-bold">All spots are taken.</h2>
                    <p className="mt-3 text-dim">All {fmt(WL_CAP)} spots are claimed. Follow @{X_HANDLE} for what&apos;s next.</p>
                  </div>
                ) : (
                  <ol className="grid gap-3">
                    <Step n={1} title="Check your wallet" done={eligible}>
                      <form onSubmit={checkWallet} className="flex flex-col gap-2 sm:flex-row">
                        <input value={wallet} onChange={(e) => setDraft(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" className="field font-mono" />
                        <button className="btn btn-accent shrink-0" disabled={busy === "wallet" || !wallet.trim() || wallet.trim() === wl?.wallet}>
                          {busy === "wallet" ? "Checking…" : eligible ? "Change" : "Check"}
                        </button>
                      </form>
                      {err?.step === "wallet" ? (
                        <Err>{err.text}</Err>
                      ) : eligible ? (
                        <p className="mt-2 text-sm font-bold text-mint">Eligible through {wl?.community}.</p>
                      ) : (
                        <p className="mt-2 text-sm text-dim">No signing, no payment. We only read what the wallet holds, and only save it once your spot is confirmed.</p>
                      )}
                    </Step>

                    <Step n={2} title={`Follow @${X_HANDLE}`} done={!!wl?.followed}>
                      {!eligible ? (
                        <Locked />
                      ) : (
                        <button
                          onClick={() => (openX(intent("follow", { screen_name: X_HANDLE })), step({ step: "follow" }, "follow"))}
                          className={`btn ${wl?.followed ? "btn-ghost" : "btn-accent"}`}
                        >
                          <XIcon /> {wl?.followed ? "Following" : `Follow @${X_HANDLE}`}
                        </button>
                      )}
                    </Step>

                    <Step n={3} title="Like + repost the post" done={!!(wl?.liked && wl.reposted)}>
                      {!eligible ? (
                        <Locked />
                      ) : !wl?.followed ? (
                        <Locked>Follow @{X_HANDLE} in step 02 first.</Locked>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {(["like", "repost"] as const).map((a) => {
                            const did = a === "like" ? wl?.liked : wl?.reposted;
                            return (
                              <button
                                key={a}
                                onClick={() => (openX(post.id ? intent(a === "like" ? "like" : "retweet", { tweet_id: post.id }) : postUrl), step({ step: "engage", action: a }, a))}
                                className={`btn capitalize ${did ? "btn-ghost" : "btn-accent"}`}
                              >
                                {did ? "✓" : <Icon name={a === "like" ? "heart" : "repost"} className="h-4 w-4" />} {did ? (a === "like" ? "Liked" : "Reposted") : a}
                              </button>
                            );
                          })}
                          <a href={postUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-dim underline underline-offset-4 hover:text-fg">
                            View post
                          </a>
                        </div>
                      )}
                    </Step>

                    <Step n={4} title="Comment that you claimed" done={!!wl?.commentLink}>
                      {!eligible ? (
                        <Locked />
                      ) : !wl?.followed || !wl.liked || !wl.reposted ? (
                        <Locked>{!wl?.followed ? `Follow @${X_HANDLE} in step 02 first.` : "Like and repost in step 03 first."}</Locked>
                      ) : wl.commentLink ? (
                        <a href={wl.commentLink} target="_blank" rel="noreferrer" className="text-sm font-bold underline underline-offset-4">
                          See your comment
                        </a>
                      ) : (
                        <>
                          <p className="text-sm text-dim">
                            {post.id ? "Reply under the post saying you claimed, then paste your comment's link." : `Post on X tagging @${X_HANDLE} saying you claimed, then paste the link.`}
                          </p>
                          <p className="mt-3 rounded-xl border border-dashed border-line bg-[var(--field)] px-3 py-2 text-sm whitespace-pre-line">{text}</p>
                          <button
                            onClick={() => openX(intent("post", post.id ? { in_reply_to: post.id, text } : { text }))}
                            className="btn btn-accent mt-3"
                          >
                            <Icon name="comment" className="h-4 w-4" /> {post.id ? "Comment on X" : "Post on X"}
                          </button>
                          <form onSubmit={(e) => (e.preventDefault(), step({ step: "comment", link }, "comment"))} className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://x.com/you/status/…" spellCheck={false} className="field" />
                            <button className="btn btn-ghost shrink-0" disabled={busy === "comment" || !link.trim()}>
                              {busy === "comment" ? "Checking…" : "Verify"}
                            </button>
                          </form>
                          {err?.step === "comment" && <Err>{err.text}</Err>}
                        </>
                      )}
                    </Step>

                    {wlTasksDone(wl) && (
                      <li className="rounded-2xl border border-accent/50 bg-accent/10 p-4 text-center">
                        <p className="font-semibold">Every step is done. One last look at your wallet.</p>
                        <button onClick={() => step({ step: "claim" }, "claim")} disabled={busy === "claim"} className="btn btn-accent mt-3">
                          {busy === "claim" ? "Checking…" : "Confirm my spot"} <ArrowIcon />
                        </button>
                        {err?.step === "claim" && <Err>{err.text}</Err>}
                      </li>
                    )}
                    {err && !["wallet", "comment", "claim"].includes(err.step) && <Err>{err.text}</Err>}
                  </ol>
                )}

                {entry && (
                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
                    <span className="text-dim">
                      Signed in as <b className="text-fg">@{entry.handle}</b>
                    </span>
                    <button onClick={logout} className="font-bold text-dim underline underline-offset-4 hover:text-flame">
                      Switch
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Top section: the OG collections, featured */}
      <section id="og" className="scroll-mt-24">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label label-accent">Penguin Frens</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] leading-none font-bold uppercase">OG NFT Communities</h2>
          </div>
          <p className="font-mono text-sm text-dim">{fmt(sum(OG))} spots</p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {OG.map((c, i) => (
            <Reveal key={c.name} delay={i * 90}>
              <CommunityCard c={c} featured claimed={stats?.by[c.name] ?? 0} loaded={!!stats} mine={mine?.name === c.name} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Second section: every other partner community */}
      <section id="communities" className="scroll-mt-24 pb-16">
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label label-accent">The colony&apos;s allies</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] leading-none font-bold uppercase">Waddle Communities</h2>
          </div>
          <p className="font-mono text-sm text-dim">
            {WADDLE.length} communities · {fmt(sum(WADDLE))} spots
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {WADDLE.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 70}>
              <CommunityCard c={c} claimed={stats?.by[c.name] ?? 0} loaded={!!stats} mine={mine?.name === c.name} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
