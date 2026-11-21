"use client";

import { useSyncExternalStore } from "react";

// The clock, once a second. 0 until mounted, so the server and the browser render the same.
const tick = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};
const nowSec = () => Math.floor(Date.now() / 1000) * 1000;
export function useNow() {
  return useSyncExternalStore(tick, nowSec, () => 0);
}

// 90061000 ms → "1d 01:01:01", 3661000 → "01:01:01"
export function fmtLeft(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = Math.floor(s / 86400);
  return `${d ? `${d}d ` : ""}${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
