"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AIRDROP_POST, AIRDROP_POST_ID, AIRDROP_SHARE, qrtText, refLink } from "@/lib/airdrop";
import { WALLET, X_HANDLE, X_URL, type PublicEntry } from "@/lib/entry";
import { AUTH_ERRORS } from "./Crew";
import { XIcon } from "./Nav";

// $RPENG airdrop application: follow, comment + retweet the airdrop post, quote it with
// your invite link (checked on X), then drop your wallet.

const REF_KEY = "guins_ad_ref";
const POST_URL = AIRDROP_POST || X_URL;
const openX = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
const intent = (kind: string, q: Record<string, string>) => `https://x.com/intent/${kind}?${new URLSearchParams(q)}`;

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

const Locked = ({ children }: { children: ReactNode }) => <p className="text-sm text-dim">🔒 {children}</p>;
const Err = ({ children }: { children: ReactNode }) => <p className="mt-2 font-mono text-sm text-flame">{children}</p>;

export function Airdrop() {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<"x" | "dev" | "off">("off");
  const [entry, setEntry] = useState<PublicEntry | null>(null);
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null);
  const [stats, setStats] = useState<{ applied: number; invites: number } | null>(null);
  const [devHandle, setDevHandle] = useState("");
  const [link, setLink] = useState("");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<{ step: string; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Remember ?ref=handle from an invite link so it survives Connect X
    const q = new URLSearchParams(location.search);
    const ref = q.get("ref");
    if (ref) {
      try {
        localStorage.setItem(REF_KEY, ref);
      } catch {}
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        setEntry(d.entry);
        setAuth(d.auth);
      })
      .catch(() => {})
      .finally(() => {
        setReady(true);
        if (q.get("connected")) setNotice({ text: "Connected. Let's get you on the list." });
        const e = q.get("auth_error");
        if (e) setNotice({ text: AUTH_ERRORS[e] ?? "Something went wrong with X.", bad: true });
        if (q.has("connected") || q.has("auth_error")) history.replaceState(null, "", location.pathname + "#airdrop");
      });
  }, []);

  const ad = entry?.ad;
  const applied = !!ad?.appliedAt;
  const engaged = !!(ad?.commented && ad?.reposted);

  useEffect(() => {
    if (!applied) return;
    fetch("/api/airdrop")
      .then((r) => r.json())
      .then((d) => typeof d.applied === "number" && setStats(d))
      .catch(() => {});
  }, [applied]);

  const step = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setErr(null);
    try {
      const r = await fetch("/api/airdrop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEntry(d.entry);
    } catch (e) {
      setErr({ step: key, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  };

  const connect = async () => {
    if (auth === "x") return location.assign(new URL(`/api/auth/x/start?to=${encodeURIComponent("/rpeng")}`, location.href).href);
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
  };

  const readRef = () => {
    try {
      return localStorage.getItem(REF_KEY) ?? "";
    } catch {
      return "";
    }
  };

  const myLink = entry ? refLink(entry.handle) : "";
  const text = entry ? qrtText(entry.handle, X_HANDLE) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${myLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div>
      <div className="text-center">
        <p className="chip">
          <span className="glow-dot h-2 w-2 animate-pulse rounded-full bg-mint" />
          application is live
        </p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-gold sm:text-6xl">$RPENG Airdrop</h2>
        <p className="mx-auto mt-3 max-w-lg text-lg text-dim">
          <span className="rounded-md bg-gold px-1.5 font-semibold text-[#1a1200]">{AIRDROP_SHARE}</span> of $RPENG goes back to the colony. Four quick steps, drop your wallet, and you&apos;re in.
        </p>
      </div>

      <div className="glass mx-auto mt-8 max-w-2xl p-5 sm:p-7">
        {notice && <p className={`pop-in mb-4 rounded-xl border px-4 py-2.5 text-center font-mono text-sm ${notice.bad ? "border-flame/50 bg-flame/10 text-flame" : "border-mint/40 bg-mint/10 text-mint"}`}>{notice.text}</p>}

        {!ready ? (
          <p className="text-center text-dim">Loading…</p>
        ) : !entry ? (
          <div className="text-center">
            {auth === "off" ? (
              <p className="font-display text-lg font-bold">Applications open soon. Follow @{X_HANDLE} to hear first.</p>
            ) : auth === "dev" ? (
              <form onSubmit={(e) => (e.preventDefault(), connect())} className="mx-auto flex max-w-xs gap-2">
                <input value={devHandle} onChange={(e) => setDevHandle(e.target.value)} placeholder="handle (dev)" className="field" />
                <button className="btn btn-neon btn-sm" disabled={busy === "connect"}>Go</button>
              </form>
            ) : (
              <button onClick={connect} className="btn btn-neon text-lg">
                <XIcon /> Connect X to apply
              </button>
            )}
            <p className="mt-3 text-sm text-dim">We check your quote comes from your account. We never post for you.</p>
          </div>
        ) : (
          <>
            <div className="well flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <p className="text-sm">
                Connected as <span className="font-mono font-semibold text-gold">@{entry.handle}</span>
              </p>
              <button onClick={logout} className="font-mono text-xs text-dim underline hover:text-flame">disconnect</button>
            </div>

            {applied ? (
              <div className="pop-in mt-6 rounded-2xl border border-gold/50 bg-[linear-gradient(135deg,rgba(255,207,63,.18),rgba(255,79,216,.12),rgba(54,241,255,.12))] p-6 text-center">
                <p className="font-display text-5xl font-bold text-gold">YOU&apos;RE IN</p>
                <p className="mt-3 text-sm text-dim">Your $RPENG airdrop goes to</p>
                <p className="mx-auto mt-1 max-w-md rounded-lg bg-black/30 px-3 py-1.5 font-mono text-sm break-all">{ad?.wallet}</p>
                <div className="well mx-auto mt-6 max-w-md p-4 text-left">
                  <p className="font-display font-bold">Bring your friends</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-2 py-1.5 text-sm">{myLink}</code>
                    <button onClick={copy} className="btn btn-gold btn-sm">{copied ? "Copied!" : "Copy"}</button>
                  </div>
                  <p className="mt-3 font-mono text-sm text-dim">
                    <span className="text-2xl font-bold text-fg">{(stats?.invites ?? 0).toLocaleString("en-US")}</span> friends applied with your link
                  </p>
                </div>
              </div>
            ) : (
              <ol className="mt-5 grid gap-3">
                <Step n={1} title={`Follow @${X_HANDLE}`} done={!!ad?.followed}>
                  <button
                    className={`btn btn-sm ${ad?.followed ? "btn-ghost" : "btn-neon"}`}
                    disabled={busy === "follow"}
                    onClick={() => {
                      openX(intent("follow", { screen_name: X_HANDLE }));
                      step({ step: "follow" }, "follow");
                    }}
                  >
                    <XIcon /> {ad?.followed ? "Following" : "Follow"}
                  </button>
                </Step>

                <Step n={2} title="Comment and retweet the airdrop post" done={engaged}>
                  {!ad?.followed ? (
                    <Locked>Follow @{X_HANDLE} in step 1 first.</Locked>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={`btn btn-sm ${ad?.commented ? "btn-ghost !text-mint" : "btn-neon"}`}
                        onClick={() => {
                          openX(AIRDROP_POST_ID ? intent("post", { in_reply_to: AIRDROP_POST_ID, text: "Applying for the $RPENG airdrop 🐧" }) : POST_URL);
                          step({ step: "engage", action: "comment" }, "comment");
                        }}
                      >
                        💬 {ad?.commented ? "Commented" : "Comment"}
                      </button>
                      <button
                        className={`btn btn-sm ${ad?.reposted ? "btn-ghost !text-mint" : "btn-neon"}`}
                        onClick={() => {
                          openX(AIRDROP_POST_ID ? intent("retweet", { tweet_id: AIRDROP_POST_ID }) : POST_URL);
                          step({ step: "engage", action: "repost" }, "repost");
                        }}
                      >
                        ⟲ {ad?.reposted ? "Retweeted" : "Retweet"}
                      </button>
                      <a href={POST_URL} target="_blank" rel="noreferrer" className="font-mono text-xs text-dim underline">view post</a>
                    </div>
                  )}
                </Step>

                <Step n={3} title="Quote it with your invite link" done={!!ad?.qrtLink}>
                  {!engaged ? (
                    <Locked>Finish steps 1 and 2 first.</Locked>
                  ) : ad?.qrtLink ? (
                    <a href={ad.qrtLink} target="_blank" rel="noreferrer" className="font-mono text-sm text-mint underline">see your quote</a>
                  ) : (
                    <>
                      <p className="text-sm text-dim">{AIRDROP_POST_ID ? "Quote the airdrop post with this text. Keep your invite link in it." : `Post this on X. It must tag @${X_HANDLE} and keep your invite link.`}</p>
                      <p className="mt-2 rounded-xl border border-dashed border-line bg-black/20 px-3 py-2 font-mono text-xs whitespace-pre-line">{text}</p>
                      <button
                        className="btn btn-gold btn-sm mt-3"
                        onClick={() => openX(intent("post", AIRDROP_POST_ID ? { text, url: AIRDROP_POST } : { text }))}
                      >
                        <XIcon /> {AIRDROP_POST_ID ? "Quote on X" : "Post on X"}
                      </button>
                      <form onSubmit={(e) => (e.preventDefault(), step({ step: "qrt", link }, "qrt"))} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://x.com/you/status/…" spellCheck={false} className="field" />
                        <button className="btn btn-neon btn-sm" disabled={busy === "qrt" || !link.trim()}>{busy === "qrt" ? "Checking…" : "Verify"}</button>
                      </form>
                      {err?.step === "qrt" && <Err>{err.text}</Err>}
                    </>
                  )}
                </Step>

                <Step n={4} title="Drop your EVM wallet" done={false}>
                  {!ad?.qrtLink ? (
                    <Locked>Finish steps 1 to 3 first.</Locked>
                  ) : (
                    <>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!WALLET.test(wallet.trim())) return setErr({ step: "wallet", text: "That isn't a valid EVM address. It starts with 0x followed by 40 characters." });
                          step({ step: "wallet", wallet: wallet.trim(), ref: readRef() }, "wallet");
                        }}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" className="field" />
                        <button className="btn btn-gold btn-sm" disabled={busy === "wallet" || !wallet.trim()}>{busy === "wallet" ? "Saving…" : "Get my $RPENG"}</button>
                      </form>
                      {err?.step === "wallet" && <Err>{err.text}</Err>}
                      <p className="mt-2 text-xs text-dim">Your airdrop goes to this wallet. No signing, no payment.</p>
                    </>
                  )}
                </Step>
                {err && !["qrt", "wallet"].includes(err.step) && <Err>{err.text}</Err>}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}
