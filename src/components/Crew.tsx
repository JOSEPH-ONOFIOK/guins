"use client";

import { useCallback, useEffect, useState } from "react";
import { PINNED_ID, X_HANDLE, X_URL, isComplete, type PublicEntry } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";
import { XIcon } from "./Nav";

type Auth = "x" | "dev" | "off";

export const AUTH_ERRORS: Record<string, string> = {
  cancelled: "You backed out on X. No hard feelings.",
  expired: "That took too long. Try connecting again.",
  handle_taken: "That handle is already tied to another X account.",
  x_failed: "X didn't answer. Try again in a minute.",
  rate_limited: "Too many tries. Give it ten minutes.",
  unavailable: "Connect X isn't switched on yet.",
};

// Ranks climb as the tasks get done: connect, then the five tasks
const STEPS = 6;
function rankOf(e: PublicEntry | null) {
  if (!e) return { name: "Stranger", step: 0 };
  if (isComplete(e)) return { name: "Made", step: 6 };
  if (e.done.wallet) return { name: "Capo", step: 5 };
  if (e.done.comment) return { name: "Enforcer", step: 4 };
  if (e.done.engage) return { name: "Soldier", step: 3 };
  if (e.done.follow) return { name: "Runner", step: 2 };
  return { name: "Lookout", step: 1 };
}

// A stable 4-digit colony number from the handle
function crewNo(handle: string) {
  let h = 7;
  for (const c of handle.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String((h % 9000) + 1000);
}

const intent = (kind: "like" | "retweet") => (PINNED_ID ? `https://x.com/intent/${kind}?tweet_id=${PINNED_ID}` : X_URL);
// Opens a reply to the pinned post so they can tag friends and comment
const replyIntent = () => (PINNED_ID ? `https://x.com/intent/post?in_reply_to=${PINNED_ID}&text=${encodeURIComponent("Waddling in with ")}` : X_URL);

export function Crew() {
  const [entry, setEntry] = useState<PublicEntry | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [wallet, setWallet] = useState("");
  const [devHandle, setDevHandle] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setEntry(d.entry);
        setAuth(d.auth);
        if (d.entry?.wallet) setWallet(d.entry.wallet);
      })
      .catch(() => setAuth("off"))
      .finally(() => {
        const q = new URLSearchParams(window.location.search);
        if (q.get("connected")) setNote({ text: "You're in! Now earn it." });
        const err = q.get("auth_error");
        if (err) setNote({ text: AUTH_ERRORS[err] ?? "Something went wrong with X.", bad: true });
        if (q.has("connected") || q.has("auth_error")) history.replaceState(null, "", window.location.pathname + "#colony");
      });
  }, []);

  const task = useCallback(async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setNote(null);
    try {
      const r = await fetch("/api/task", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEntry(d.entry);
      return d.entry as PublicEntry;
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : "Something went wrong.", bad: true });
    } finally {
      setBusy(null);
    }
  }, []);

  const connect = async () => {
    if (auth === "x") {
      window.location.assign(new URL("/api/auth/x/start", window.location.href).href);
      return;
    }
    if (auth !== "dev") return;
    setBusy("connect");
    const r = await fetch("/api/auth/dev", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: devHandle }) });
    const d = await r.json();
    setBusy(null);
    if (!r.ok) return setNote({ text: d.error, bad: true });
    setEntry(d.entry);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setEntry(null);
    setWallet("");
  };

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const rank = rankOf(entry);
  const made = rank.step === STEPS;


  const input = "field";

  const jobs = [
    {
      title: "Connect X",
      body: "So we know who's waddling in.",
      done: !!entry,
      action: entry ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono font-semibold text-violet">@{entry.handle}</span>
          <button onClick={logout} className="font-mono text-xs text-dim underline hover:text-flame">switch</button>
        </div>
      ) : auth === "dev" ? (
        <form onSubmit={(e) => (e.preventDefault(), connect())} className="flex gap-2">
          <input value={devHandle} onChange={(e) => setDevHandle(e.target.value)} placeholder="handle (dev)" className={`${input} w-32`} />
          <button className="btn btn-neon btn-sm" disabled={busy === "connect"}>Go</button>
        </form>
      ) : (
        <button onClick={connect} disabled={auth !== "x"} className="btn btn-neon btn-sm">
          <XIcon /> {auth === "off" ? "Opens soon" : "Connect"}
        </button>
      ),
    },
    {
      title: `Follow @${X_HANDLE}`,
      body: "Obviously.",
      done: !!entry?.done.follow,
      action: (
        <button
          className="btn btn-ghost btn-sm"
          disabled={!entry || busy === "follow"}
          onClick={() => {
            open(`https://x.com/intent/follow?screen_name=${X_HANDLE}`);
            task({ task: "follow" }, "follow");
          }}
        >
          Follow
        </button>
      ),
    },
    {
      title: "Like + repost",
      body: "The pinned post. Both.",
      done: !!entry?.done.engage,
      action: (
        <div className="flex gap-2">
          {(["like", "repost"] as const).map((a) => {
            const did = a === "like" ? entry?.liked : entry?.reposted;
            return (
              <button
                key={a}
                className={`btn btn-sm ${did ? "btn-ghost !border-mint/50 !text-mint" : "btn-neon"}`}
                disabled={!entry?.done.follow || busy === a}
                onClick={() => {
                  open(intent(a === "like" ? "like" : "retweet"));
                  task({ task: "engage", action: a }, a);
                }}
              >
                {did ? "✓ " : ""}
                {a}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Tag + comment",
      body: "Tag a friend or two on the pinned post and drop your comment.",
      done: !!entry?.done.comment,
      action: (
        <button
          className="btn btn-neon btn-sm"
          disabled={!entry?.done.engage || busy === "comment"}
          onClick={() => {
            open(replyIntent());
            task({ task: "comment" }, "comment");
          }}
        >
          Comment
        </button>
      ),
    },
    {
      title: "Add your wallet",
      body: "Your EVM address.",
      done: !!entry?.done.wallet,
      action: (
        <form onSubmit={(e) => (e.preventDefault(), task({ task: "wallet", wallet }, "wallet"))} className="flex w-full gap-2">
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" spellCheck={false} disabled={!entry?.done.comment} className={input} />
          <button className="btn btn-neon btn-sm" disabled={!entry?.done.comment || busy === "wallet"}>
            {entry?.done.wallet ? "Update" : "Save"}
          </button>
        </form>
      ),
    },
    {
      title: "Post your Guin",
      body: "Show the timeline your Guin or your colony pass.",
      done: !!entry?.done.post,
      action: (
        <button
          className="btn btn-gold btn-sm"
          disabled={!entry?.done.wallet || busy === "post"}
          onClick={() => {
            open(`https://x.com/intent/post?text=${encodeURIComponent(`Just joined the Guins colony 🐧 Pass #${crewNo(entry!.handle)}\n\nStay unbothered. @${X_HANDLE}\n${window.location.origin}`)}`);
            task({ task: "post" }, "post");
          }}
        >
          <XIcon /> Post
        </button>
      ),
    },
  ];

  return (
    <div className="glass flex flex-col p-5 sm:p-7">
      {/* Colony pass: grows up as the jobs get done */}
      <div className={`holo relative flex items-center gap-4 overflow-hidden rounded-2xl border p-3 transition-all duration-500 ${made ? "border-gold/60 bg-[linear-gradient(120deg,rgba(255,207,63,.22),rgba(255,79,216,.18),rgba(54,241,255,.18))] shadow-[0_0_40px_-8px_rgba(255,207,63,.6)]" : "border-line bg-[linear-gradient(120deg,rgba(116,69,245,.12),rgba(10,169,201,.08))]"}`}>
        <div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${made ? "border-gold/70 bg-gold" : "border-line bg-[linear-gradient(160deg,#e9e4ff,#c9f3ff)]"}`}>
          <HoodguinArt fit={made ? "shades" : rank.step >= 2 ? "hood" : "none"} asleep={!entry} className="absolute top-2 left-1/2 w-[120%] -translate-x-1/2" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="label flex items-center justify-between gap-2 !text-[10px]">
            <span>colony pass</span>
            <span className="text-violet">#{entry ? crewNo(entry.handle) : "----"}</span>
          </div>
          <div className="truncate font-display text-xl font-bold tracking-tight">{entry ? `@${entry.handle}` : "who are you?"}</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className={`font-mono text-xs font-semibold tracking-widest uppercase ${made ? "text-amber" : "text-fg"}`}>{rank.name}</span>
            <div className="flex gap-1" aria-label={`${rank.step} of ${STEPS} done`}>
              {Array.from({ length: STEPS }, (_, k) => k + 1).map((s) => (
                <span key={s} className={`h-1.5 w-4 rounded-full sm:w-5 transition-all ${s <= rank.step ? "bg-[linear-gradient(90deg,#8b5cff,#36f1ff)] shadow-[0_0_8px_rgba(54,241,255,.8)]" : "bg-fg/10"}`} />
              ))}
            </div>
          </div>
        </div>
        {made && (
          <span className="pop-in pointer-events-none absolute top-2 right-2 rounded-md bg-gold px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-black uppercase shadow-[0_0_16px_rgba(255,207,63,.8)]">
            made ✦
          </span>
        )}
      </div>

      <h2 className="grad-text mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">join the colony</h2>
      <p className="mt-1 text-dim">Six quick tasks, in order. Finish them and your pass gets shades.</p>

      <ol className="mt-4 grid gap-2.5">
        {jobs.map((j, i) => {
          const locked = i > 0 && !jobs[i - 1].done;
          return (
            <li key={j.title} className={`well flex flex-col gap-3 p-3 transition sm:flex-row sm:items-center ${j.done ? "!border-mint/30" : ""} ${locked ? "opacity-40" : ""}`}>
              <div className="flex flex-1 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${j.done ? "border-mint/50 bg-mint/15 text-mint shadow-[0_0_14px_-2px_rgba(77,255,181,.6)]" : "border-line bg-surface text-dim"}`}>
                  {j.done ? "✓" : `0${i + 1}`}
                </span>
                <div>
                  <div className="font-display font-bold leading-tight">{j.title}</div>
                  <p className="text-sm text-dim">{j.body}</p>
                </div>
              </div>
              <div className="sm:max-w-[60%] sm:shrink-0">{j.action}</div>
            </li>
          );
        })}
      </ol>

      {note && (
        <p className={`pop-in mt-3 rounded-xl border px-4 py-2.5 font-mono text-sm ${note.bad ? "border-flame/50 bg-flame/10 text-flame" : "border-mint/40 bg-mint/10 text-mint"}`} role="status">
          {note.text}
        </p>
      )}
      {made && !note && (
        <p className="pop-in mt-3 rounded-xl border border-mint/40 bg-mint/10 px-4 py-2.5 font-mono text-sm text-mint" role="status">
          You&apos;re in the colony. Stay unbothered. ✦
        </p>
      )}
    </div>
  );
}
