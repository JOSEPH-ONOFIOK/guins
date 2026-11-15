"use client";

import { useCallback, useEffect, useState } from "react";
import { PINNED_ID, X_HANDLE, X_URL, isComplete, type PublicEntry } from "@/lib/entry";
import { HoodguinArt } from "./HoodguinArt";
import { XIcon } from "./Nav";

type Auth = "x" | "dev" | "off";

const AUTH_ERRORS: Record<string, string> = {
  cancelled: "You backed out on X. No hard feelings.",
  expired: "That took too long. Try connecting again.",
  handle_taken: "That handle is already tied to another X account.",
  x_failed: "X didn't answer. Try again in a minute.",
  rate_limited: "Too many tries. Give it ten minutes.",
  unavailable: "Connect X isn't switched on yet.",
};

// Ranks climb as the jobs get done
function rankOf(e: PublicEntry | null) {
  if (!e) return { name: "Stranger", step: 0 };
  if (isComplete(e)) return { name: "Made", step: 4 };
  if (e.done.engage) return { name: "Soldier", step: 3 };
  if (e.done.follow) return { name: "Runner", step: 2 };
  return { name: "Lookout", step: 1 };
}

// A stable 4-digit crew number from the handle
function crewNo(handle: string) {
  let h = 7;
  for (const c of handle.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return String((h % 9000) + 1000);
}

const intent = (kind: "like" | "retweet") => (PINNED_ID ? `https://x.com/intent/${kind}?tweet_id=${PINNED_ID}` : X_URL);

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
        if (q.has("connected") || q.has("auth_error")) history.replaceState(null, "", window.location.pathname + "#crew");
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
  const made = rank.step === 4;


  const input = "min-w-0 flex-1 rounded-full border-[2.5px] border-outline bg-white px-4 py-2 font-semibold text-sm outline-none focus:bg-mist disabled:opacity-50";

  const jobs = [
    {
      title: "Say hi",
      body: "Connect your X.",
      done: !!entry,
      action: entry ? (
        <div className="flex items-center gap-3 font-semibold text-sm">
          <span className="font-bold">@{entry.handle}</span>
          <button onClick={logout} className="text-soft underline hover:text-flame">switch</button>
        </div>
      ) : auth === "dev" ? (
        <form onSubmit={(e) => (e.preventDefault(), connect())} className="flex gap-2">
          <input value={devHandle} onChange={(e) => setDevHandle(e.target.value)} placeholder="handle (dev)" className={`${input} w-32`} />
          <button className="btn btn-beak !px-4 !py-1.5 text-sm" disabled={busy === "connect"}>Go</button>
        </form>
      ) : (
        <button onClick={connect} disabled={auth !== "x"} className="btn btn-ink !px-4 !py-1.5 text-sm">
          <XIcon /> {auth === "off" ? "Opens soon" : "Connect"}
        </button>
      ),
    },
    {
      title: "Follow",
      body: `@${X_HANDLE}, obviously.`,
      done: !!entry?.done.follow,
      action: (
        <button
          className="btn btn-white !px-4 !py-1.5 text-sm"
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
      body: "The pinned post. Both. We check.",
      done: !!entry?.done.engage,
      action: (
        <div className="flex gap-2">
          {(["like", "repost"] as const).map((a) => {
            const did = a === "like" ? entry?.liked : entry?.reposted;
            return (
              <button
                key={a}
                className={`btn !px-4 !py-1.5 text-sm ${did ? "btn-beak" : "btn-beak"}`}
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
      title: "Wallet",
      body: "Your EVM address.",
      done: !!entry?.done.wallet,
      action: (
        <form onSubmit={(e) => (e.preventDefault(), task({ task: "wallet", wallet }, "wallet"))} className="flex w-full gap-2">
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" spellCheck={false} disabled={!entry?.done.engage} className={input} />
          <button className="btn btn-beak !px-4 !py-1.5 text-sm" disabled={!entry?.done.engage || busy === "wallet"}>
            {entry?.done.wallet ? "Update" : "Save"}
          </button>
        </form>
      ),
    },
  ];

  return (
    <div className="mochi flex flex-col bg-white p-5 sm:p-7">
      {/* Crew badge: grows up as the jobs get done */}
      <div className={`relative flex items-center gap-4 rounded-[26px] border-[3px] border-outline p-3 transition-colors duration-500 ${made ? "bg-beak" : "bg-white"}`}>
        <div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-[3px] border-outline ${made ? "bg-beak" : "bg-mist"}`}>
          <HoodguinArt fit={made ? "shades" : rank.step >= 2 ? "hood" : "none"} asleep={!entry} className="absolute top-2 left-1/2 w-[120%] -translate-x-1/2" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 font-semibold text-xs text-soft">
            <span>crew card</span>
            <span>#{entry ? crewNo(entry.handle) : "----"}</span>
          </div>
          <div className="truncate font-display text-xl font-bold">{entry ? `@${entry.handle}` : "who are you?"}</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-sm">{rank.name}</span>
            <div className="flex gap-1" aria-label={`${rank.step} of 4 done`}>
              {[1, 2, 3, 4].map((s) => (
                <span key={s} className={`h-3 w-5 rounded-full border-2 border-outline transition-colors ${s <= rank.step ? "bg-beak" : "bg-white"}`} />
              ))}
            </div>
          </div>
        </div>
        {made && (
          <span className="pop-in pointer-events-none absolute -top-3 -right-2 rotate-12 rounded-full border-[3px] border-outline bg-beak px-3 py-0.5 font-display text-sm font-bold shadow-[0_3px_0_#121212]">
            made ♥
          </span>
        )}
      </div>

      <h2 className="mt-6 font-display text-4xl font-bold sm:text-5xl">join the crew</h2>
      <p className="mt-1 text-soft">Four tiny jobs, in order. Finish them and your card gets shades.</p>

      <ol className="mt-4 grid gap-2.5">
        {jobs.map((j, i) => {
          const locked = i > 0 && !jobs[i - 1].done;
          return (
            <li key={j.title} className={`flex flex-col gap-3 rounded-[22px] border-[2.5px] border-outline/10 bg-mist p-3 transition sm:flex-row sm:items-center ${locked ? "opacity-45" : ""}`}>
              <div className="flex flex-1 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2.5px] border-outline font-display font-bold ${j.done ? "bg-beak" : "bg-white"}`}>
                  {j.done ? "✓" : i + 1}
                </span>
                <div>
                  <div className="font-display font-bold leading-tight">{j.title}</div>
                  <p className="text-sm text-soft">{j.body}</p>
                </div>
              </div>
              <div className="sm:max-w-[60%] sm:shrink-0">{j.action}</div>
            </li>
          );
        })}
      </ol>

      {note && (
        <p className={`pop-in mt-3 rounded-2xl border-[2.5px] border-outline px-4 py-2.5 font-semibold text-sm ${note.bad ? "bg-flame text-white" : "bg-beak"}`} role="status">
          {note.text}
        </p>
      )}
      {made && (
        <button
          className="btn btn-ink mt-4 self-start text-sm"
          onClick={() => open(`https://x.com/intent/post?text=${encodeURIComponent(`Just joined the crew 🕶️ Card #${crewNo(entry!.handle)} 🐧\n\nStay unbothered. @${X_HANDLE}`)}`)}
        >
          <XIcon /> Flex it on X
        </button>
      )}
    </div>
  );
}
