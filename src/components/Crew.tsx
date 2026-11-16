"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { X_HANDLE, X_URL, isComplete, type PublicEntry } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";
import { Icon } from "./Icon";
import { ArrowIcon, XIcon } from "./Nav";

// The whitelist application: one step at a time, in order.
// 01 connect X · 02 follow · 03 like + repost · 04 tag + comment · 05 wallet · 06 post your Guin

type Auth = "x" | "dev" | "off";

export const AUTH_ERRORS: Record<string, string> = {
  cancelled: "You backed out on X. No hard feelings.",
  expired: "That took too long. Try connecting again.",
  handle_taken: "That handle is already tied to another X account.",
  x_failed: "X didn't answer. Try again in a minute.",
  rate_limited: "Too many tries. Give it ten minutes.",
  unavailable: "Connect X isn't switched on yet.",
};

// Ranks climb as the steps get done
function rankOf(e: PublicEntry | null) {
  if (!e) return "Stranger";
  if (isComplete(e)) return "Made";
  if (e.done.wallet) return "Capo";
  if (e.done.comment) return "Enforcer";
  if (e.done.engage) return "Soldier";
  if (e.done.follow) return "Runner";
  return "Lookout";
}

// A stable 4-digit colony number from the handle
function crewNo(handle: string) {
  let h = 7;
  for (const c of handle.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String((h % 9000) + 1000);
}

// The pinned post comes from the server (an admin can change it); no post yet = the profile
const intent = (pinnedId: string, kind: "like" | "retweet") => (pinnedId ? `https://x.com/intent/${kind}?tweet_id=${pinnedId}` : X_URL);
// Opens a reply to the pinned post so they can tag friends and comment
const replyIntent = (pinnedId: string) => (pinnedId ? `https://x.com/intent/post?in_reply_to=${pinnedId}&text=${encodeURIComponent("Waddling in with ")}` : X_URL);
const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

function Check() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
  );
}

// Note box under the title: what this step does, in one line
function Note({ strong, children }: { strong?: string; children: ReactNode }) {
  return (
    <div className="well mt-6 flex gap-3 px-4 py-3.5 text-sm text-dim">
      <Check />
      <p>
        {strong && <b className="text-fg">{strong} </b>}
        {children}
      </p>
    </div>
  );
}

// Big full-width action, label left and arrow right
function Action({ onClick, disabled, children, ghost }: { onClick?: () => void; disabled?: boolean; children: ReactNode; ghost?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`btn w-full justify-between !py-4 ${ghost ? "btn-ghost" : "btn-accent"}`}>
      <span className="flex items-center gap-2">{children}</span>
      <ArrowIcon />
    </button>
  );
}

export function Crew() {
  const [entry, setEntry] = useState<PublicEntry | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [wallet, setWallet] = useState("");
  const [devHandle, setDevHandle] = useState("");
  const [pinnedId, setPinnedId] = useState("");
  // Which step is on screen. null = the next one to do.
  const [view, setView] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setEntry(d.entry);
        setAuth(d.auth);
        setPinnedId(d.links?.pinnedId ?? "");
        if (d.entry?.wallet) setWallet(d.entry.wallet);
      })
      .catch(() => setAuth("off"))
      .finally(() => {
        const q = new URLSearchParams(window.location.search);
        if (q.get("connected")) setNote({ text: "You're in. Now earn it." });
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
      setView(null);
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
    setView(null);
  };

  const d = entry?.done ?? {};
  const steps: { label: string; title: string; done: boolean; body: ReactNode }[] = [
    {
      label: "Identity",
      title: "Start with X.",
      done: !!entry,
      body: (
        <>
          <Note strong="Read-only access.">Connecting X can&apos;t post, follow, like or message on your behalf.</Note>
          <div className="mt-6">
            {auth === "off" ? (
              <div className="grid gap-3">
                <p className="rounded-xl border border-dashed border-line px-4 py-3.5 text-center text-sm font-bold tracking-wide text-dim uppercase">Sign-in opens soon</p>
                <a href={X_URL} target="_blank" rel="noreferrer" className="btn btn-ghost w-full justify-between !py-4">
                  <span className="flex items-center gap-2">
                    <XIcon /> Follow @{X_HANDLE} to hear first
                  </span>
                  <ArrowIcon />
                </a>
              </div>
            ) : auth === "dev" ? (
              <form onSubmit={(e) => (e.preventDefault(), connect())} className="flex gap-2">
                <input value={devHandle} onChange={(e) => setDevHandle(e.target.value)} placeholder="your handle (dev mode)" className="field" />
                <button className="btn btn-accent" disabled={busy === "connect"}>Go</button>
              </form>
            ) : (
              <Action onClick={connect}>
                <XIcon /> Sign in with X
              </Action>
            )}
          </div>
        </>
      ),
    },
    {
      label: "Follow",
      title: `Follow @${X_HANDLE}.`,
      done: !!d.follow,
      body: (
        <>
          <Note>Opens X in a new tab. Follow, then come back here for the next step.</Note>
          <div className="mt-6">
            <Action disabled={busy === "follow"} onClick={() => (open(`https://x.com/intent/follow?screen_name=${X_HANDLE}`), task({ task: "follow" }, "follow"))}>
              <XIcon /> Follow @{X_HANDLE}
            </Action>
          </div>
        </>
      ),
    },
    {
      label: "Engage",
      title: "Like + repost.",
      done: !!d.engage,
      body: (
        <>
          <Note>Both, on the pinned post. Each button opens it on X.</Note>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {(["like", "repost"] as const).map((a) => {
              const did = a === "like" ? entry?.liked : entry?.reposted;
              return (
                <Action key={a} ghost={did} disabled={busy === a} onClick={() => (open(intent(pinnedId, a === "like" ? "like" : "retweet")), task({ task: "engage", action: a }, a))}>
                  {did ? "✓ " : <Icon name={a === "like" ? "heart" : "repost"} className="h-4 w-4" />}
                  {a}
                </Action>
              );
            })}
          </div>
        </>
      ),
    },
    {
      label: "Shout",
      title: "Tag your friends.",
      done: !!d.comment,
      body: (
        <>
          <Note>Reply under the pinned post, tag a friend or two, and drop a comment.</Note>
          <div className="mt-6">
            <Action disabled={busy === "comment"} onClick={() => (open(replyIntent(pinnedId)), task({ task: "comment" }, "comment"))}>
              <Icon name="comment" className="h-4 w-4" /> Comment on X
            </Action>
          </div>
        </>
      ),
    },
    {
      label: "Wallet",
      title: "Submit your wallet.",
      done: !!d.wallet,
      body: (
        <>
          <Note strong="No signing, no payment.">Just your EVM address. It starts with 0x.</Note>
          <form onSubmit={(e) => (e.preventDefault(), task({ task: "wallet", wallet }, "wallet"))} className="mt-6 grid gap-2">
            <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" className="field !py-4" />
            <button className="btn btn-accent w-full justify-between !py-4" disabled={busy === "wallet" || !wallet.trim()}>
              {d.wallet ? "Update wallet" : "Submit wallet"} <ArrowIcon />
            </button>
          </form>
        </>
      ),
    },
    {
      label: "Flex",
      title: "Post your Guin.",
      done: !!d.post,
      body: (
        <>
          <Note>Show the timeline your Guin or your colony pass. Add your image on X before you post.</Note>
          <div className="mt-6">
            <Action
              disabled={busy === "post"}
              onClick={() => {
                open(`https://x.com/intent/post?text=${encodeURIComponent(`Just joined the Guins colony 🐧 Pass #${crewNo(entry!.handle)}\n\nStay unbothered. @${X_HANDLE}\n${window.location.origin}`)}`);
                task({ task: "post" }, "post");
              }}
            >
              <XIcon /> Post on X
            </Action>
          </div>
        </>
      ),
    },
  ];

  const next = steps.findIndex((s) => !s.done);
  const finished = next === -1;
  const i = view ?? (finished ? -1 : next);
  const step = i >= 0 ? steps[i] : null;
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="glass p-6 sm:p-9">
      {/* Progress: tap a done step to revisit it */}
      <div className="flex items-center gap-1.5" aria-label={`${doneCount} of ${steps.length} steps done`}>
        {steps.map((s, k) => {
          const reachable = s.done || k === next;
          return (
            <button
              key={s.label}
              disabled={!reachable || !entry}
              onClick={() => setView(k === next ? null : k)}
              aria-label={`Step ${k + 1}: ${s.label}`}
              className={`h-1.5 flex-1 rounded-full transition ${k === i ? "bg-accent" : s.done ? "bg-accent/45 hover:bg-accent/70" : "bg-fg/12"}`}
            />
          );
        })}
      </div>

      {auth === null ? (
        // Same shape as a step while we check who's signed in, so nothing jumps
        <div aria-busy="true" aria-label="Loading" className="animate-pulse">
          <div className="mt-6 h-3 w-32 rounded bg-fg/10" />
          <div className="mt-4 h-10 w-3/4 rounded-lg bg-fg/10" />
          <div className="mt-6 h-16 rounded-2xl bg-fg/[.06]" />
          <div className="mt-6 h-14 rounded-xl bg-accent/25" />
        </div>
      ) : step ? (
        <div key={i} className="pop-in">
          <div className="mt-6 flex items-center justify-between">
            <p className="label label-accent">
              Step {String(i + 1).padStart(2, "0")} · {step.label}
            </p>
            {step.done && <span className="label">done ✓</span>}
          </div>
          <h2 className="mt-3 font-display text-4xl leading-none font-bold sm:text-5xl">{step.title}</h2>
          {step.body}
          {view !== null && !finished && (
            <button onClick={() => setView(null)} className="mt-4 text-sm font-bold text-dim underline underline-offset-4 hover:text-fg">
              Back to step {String(next + 1).padStart(2, "0")}
            </button>
          )}
        </div>
      ) : (
        // All done: their status
        <div className="pop-in">
          <p className="label label-accent mt-6">Status · On the list</p>
          <h2 className="mt-3 font-display text-4xl leading-none font-bold sm:text-5xl">You&apos;re in the colony.</h2>
          <div className="holo relative mt-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-accent/50 bg-accent/10 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-accent">
              <HoodguinArt fit="shades" className="absolute top-2 left-1/2 w-[120%] -translate-x-1/2" />
            </div>
            <div className="min-w-0">
              <p className="label">Colony pass #{crewNo(entry!.handle)}</p>
              <p className="truncate font-display text-2xl font-bold">@{entry!.handle}</p>
              <p className="text-sm font-bold text-accent uppercase">{rankOf(entry)} ✦</p>
            </div>
          </div>
          <div className="well mt-3 px-4 py-3">
            <p className="label">wallet</p>
            <p className="mt-0.5 font-mono text-sm break-all">{entry!.wallet}</p>
          </div>
          <button onClick={() => setView(4)} className="mt-4 text-sm font-bold text-dim underline underline-offset-4 hover:text-fg">
            Change wallet
          </button>
        </div>
      )}

      {note && (
        <p className={`pop-in mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${note.bad ? "border-flame/40 bg-flame/10 text-flame" : "border-accent/40 bg-accent/10 text-fg"}`} role="status">
          {note.text}
        </p>
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
  );
}
