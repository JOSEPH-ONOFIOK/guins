"use client";

import { useEffect, useState } from "react";
import type { PublicLinks } from "@/lib/links";

const KEY = "guins_admin_key"; // kept for this tab only

export function AdminPanel() {
  const [key, setKey] = useState("");
  const [links, setLinks] = useState<PublicLinks | null>(null);
  const [canSave, setCanSave] = useState(false);
  const [pinned, setPinned] = useState("");
  const [airdrop, setAirdrop] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLinks(d.links);
      setCanSave(d.canSave);
      setPinned(d.links.pinnedPost);
      setAirdrop(d.links.airdropPost);
      try {
        sessionStorage.setItem(KEY, String(body.key));
      } catch {}
      return true;
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Something went wrong.", bad: true });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Stay unlocked across reloads in this tab
  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(KEY) ?? "";
    } catch {}
    if (!saved) return;
    queueMicrotask(() => {
      setKey(saved);
      void call({ key: saved });
    });
  }, []);

  if (!links)
    return (
      <form onSubmit={(e) => (e.preventDefault(), void call({ key }))} className="glass mt-8 grid gap-3 p-6">
        <label className="label" htmlFor="admin-key">Admin key</label>
        <input id="admin-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} className="field !py-3" autoComplete="current-password" />
        <button className="btn btn-accent" disabled={busy || !key}>{busy ? "Checking…" : "Unlock"}</button>
        {msg && <p className="text-sm font-semibold text-flame">{msg.text}</p>}
        <p className="text-xs text-dim">The key is the ADMIN_KEY setting in Vercel.</p>
      </form>
    );

  const field = (id: string, label: string, help: string, value: string, set: (v: string) => void, current: string, currentId: string) => (
    <div className="grid gap-2">
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => set(e.target.value)} placeholder="https://x.com/hoodguins/status/…" spellCheck={false} className="field !py-3" />
      <p className="text-xs text-dim">
        {help}{" "}
        {currentId ? (
          <a href={current} target="_blank" rel="noreferrer" className="font-bold text-fg underline underline-offset-2">Live now: post {currentId}</a>
        ) : (
          <span className="font-bold text-flame">Not set: the buttons open the profile.</span>
        )}
      </p>
    </div>
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (await call({ key, pinnedPost: pinned, airdropPost: airdrop })) setMsg({ text: "Saved. It's live." });
      }}
      className="glass mt-8 grid gap-6 p-6"
    >
      {!canSave && (
        <p className="rounded-xl border border-flame/40 bg-flame/10 px-4 py-3 text-sm text-flame">
          Saving needs the Google Sheet: add GOOGLE_SHEETS_WEBAPP_URL in Vercel. Until then, edit the links in the code.
        </p>
      )}
      {field("pinned", "Pinned post", "Whitelist steps 03 and 04: like, repost and reply.", pinned, setPinned, links.pinnedPost, links.pinnedId)}
      {field("airdrop", "Airdrop post", "$RPENG airdrop: comment, retweet and quote. Quotes are checked against this post.", airdrop, setAirdrop, links.airdropPost, links.airdropId)}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-accent" disabled={busy || !canSave}>{busy ? "Saving…" : "Save links"}</button>
        <a href={`/api/admin/export?key=${encodeURIComponent(key)}`} className="btn btn-ghost">Download sign-ups (CSV)</a>
      </div>
      {msg && <p className={`text-sm font-semibold ${msg.bad ? "text-flame" : "text-mint"}`} role="status">{msg.text}</p>}
      <p className="text-xs text-dim">Saved to the Settings tab of the Google Sheet. Clear a box and save to fall back to the link in the code (or the @hoodguins profile).</p>
    </form>
  );
}
