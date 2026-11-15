"use client";

import { useEffect, useRef } from "react";

// The living background: a glacier world under a sky that runs dawn → day →
// sunset → night on a loop, with penguins messing around in the snow.

const CYCLE_MS = 48000;

type Key = { t: number; top: string; mid: string; bot: string; shade: string; night: number };
const KEYS: Key[] = [
  { t: 0.0, top: "#7a8fd6", mid: "#f6b2a6", bot: "#ffe2c4", shade: "#ffe6d8", night: 0.15 }, // dawn
  { t: 0.12, top: "#4fb0ff", mid: "#9fd6ff", bot: "#e3f4ff", shade: "#ffffff", night: 0 }, // day
  { t: 0.42, top: "#3fa4f7", mid: "#93d0ff", bot: "#e0f3ff", shade: "#ffffff", night: 0 },
  { t: 0.54, top: "#5a4b9e", mid: "#f08a6c", bot: "#ffc785", shade: "#ffc9a6", night: 0.1 }, // sunset
  { t: 0.64, top: "#0b1433", mid: "#1d2b5c", bot: "#34477e", shade: "#5566a8", night: 1 }, // night
  { t: 0.9, top: "#0b1433", mid: "#1b2857", bot: "#30437a", shade: "#5566a8", night: 1 },
  { t: 1.0, top: "#7a8fd6", mid: "#f6b2a6", bot: "#ffe2c4", shade: "#ffe6d8", night: 0.15 },
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};
const ease = (k: number) => k * k * (3 - 2 * k);

// Fixed star field so server and client agree
const STARS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const q = (v: number) => Math.round(v * 100) / 100;
  return { x: q(r(1) * 100), y: q(r(2) * 55), s: q(r(3) * 2 + 1), d: q(r(4) * 4) };
});

function Penguin({ x = 0, y = 0, s = 1, hat }: { x?: number; y?: number; s?: number; hat?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="34" rx="22" ry="5" fill="#9fc4de" opacity=".5" />
      <ellipse cx="-9" cy="31" rx="8" ry="4" fill="#ffb02e" stroke="#121212" strokeWidth="2.5" />
      <ellipse cx="9" cy="31" rx="8" ry="4" fill="#ffb02e" stroke="#121212" strokeWidth="2.5" />
      <path d="M-20,-4 C-30,6 -30,18 -24,22 C-20,14 -18,6 -16,0 Z" fill="#1e1e1e" stroke="#121212" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20,-4 C30,6 30,18 24,22 C20,14 18,6 16,0 Z" fill="#1e1e1e" stroke="#121212" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-21,30 C-24,2 -18,-28 0,-31 C18,-28 24,2 21,30 Z" fill="#1e1e1e" stroke="#121212" strokeWidth="3" strokeLinejoin="round" />
      <path d="M-13,30 C-15,10 -8,-2 0,-3 C8,-2 15,10 13,30 Z" fill="#fff" />
      <path d="M-14,-13 L-2,-13 C-3,-8 -6,-5 -9,-5 C-12,-6 -14,-9 -14,-13 Z" fill="#fff" />
      <path d="M2,-13 L14,-13 C14,-9 12,-6 9,-5 C6,-5 3,-8 2,-13 Z" fill="#fff" />
      <circle cx="-7" cy="-10" r="2.2" fill="#121212" />
      <circle cx="8" cy="-10" r="2.2" fill="#121212" />
      <line x1="-15" y1="-13" x2="-1" y2="-13" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="1" y1="-13" x2="15" y2="-13" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-8,-3 L0,-7 L8,-3 L0,1 Z" fill="#ffcf3f" stroke="#121212" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="-13" cy="-1" rx="3.5" ry="2" fill="#ff8fa3" opacity=".6" />
      <ellipse cx="13" cy="-1" rx="3.5" ry="2" fill="#ff8fa3" opacity=".6" />
      {hat && (
        <g stroke="#121212" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M-14,-24 C-14,-40 14,-40 14,-24 Z" fill={hat} />
          <rect x="-16" y="-26" width="32" height="7" rx="3" fill={hat} />
          <circle cx="0" cy="-40" r="4" fill="#fff" />
        </g>
      )}
    </g>
  );
}

export function Scene() {
  const root = useRef<HTMLDivElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLDivElement>(null);
  const snow = useRef<HTMLCanvasElement>(null);

  // Day/night loop: writes CSS variables straight to the DOM each frame
  useEffect(() => {
    const el = root.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() - CYCLE_MS * 0.2;
    let raf = 0;

    const paint = (t: number) => {
      let i = 0;
      while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
      const a = KEYS[i], b = KEYS[i + 1];
      const k = ease((t - a.t) / (b.t - a.t));
      el.style.setProperty("--sky-top", mix(a.top, b.top, k));
      el.style.setProperty("--sky-mid", mix(a.mid, b.mid, k));
      el.style.setProperty("--sky-bot", mix(a.bot, b.bot, k));
      el.style.setProperty("--shade", mix(a.shade, b.shade, k));
      el.style.setProperty("--night", String(a.night + (b.night - a.night) * k));

      // Sun rides 0 → 0.6, moon rides 0.55 → 1.05
      const arc = (p: number, node: HTMLDivElement | null) => {
        if (!node) return;
        const on = p >= 0 && p <= 1;
        node.style.opacity = on ? "1" : "0";
        if (!on) return;
        node.style.left = `${6 + p * 88}%`;
        node.style.top = `${62 - Math.sin(Math.PI * p) * 52}%`;
      };
      arc(t / 0.6, sun.current);
      arc((((t - 0.55) % 1) + 1) % 1 / 0.5, moon.current);
    };

    if (still) {
      paint(0.25);
      return;
    }
    const tick = (now: number) => {
      paint(((now - start) % CYCLE_MS) / CYCLE_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Snowfall
  useEffect(() => {
    const canvas = snow.current!;
    const ctx = canvas.getContext("2d")!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const flakes = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2.2 + 0.8, s: Math.random() * 0.5 + 0.2, d: Math.random() * 6.28 }));
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      for (const f of flakes) {
        f.y += (f.s * f.r) / h * 1.4;
        f.x += Math.sin(t / 2000 + f.d) * 0.0003;
        if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
        ctx.globalAlpha = 0.5 + f.r / 6;
        ctx.beginPath();
        ctx.arc(f.x * w, f.y * h, f.r, 0, 6.28);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="scene pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--sky-top),var(--sky-mid)_55%,var(--sky-bot))]" />

      {/* Stars + aurora, only at night */}
      <div className="absolute inset-0" style={{ opacity: "var(--night)" }}>
        {STARS.map((s, i) => (
          <span key={i} className="twinkle absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}
        <div className="aurora absolute top-[8%] left-[-10%] h-[38%] w-[70%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(110,255,190,.55),transparent)] blur-2xl" />
        <div className="aurora absolute top-[4%] right-[-10%] h-[34%] w-[60%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(150,120,255,.45),transparent)] blur-2xl [animation-delay:-6s]" />
      </div>

      {/* Sun and moon */}
      <div ref={sun} style={{ opacity: 0 }} className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#121212] bg-[#ffd84a] shadow-[0_0_80px_30px_rgba(255,214,90,.55)] transition-opacity duration-700 sm:h-28 sm:w-28" />
      <div ref={moon} style={{ opacity: 0 }} className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#121212] bg-[#fff7e0] shadow-[0_0_60px_16px_rgba(255,247,224,.35)] transition-opacity duration-700 sm:h-20 sm:w-20">
        <span className="absolute top-[28%] left-[26%] h-3 w-3 rounded-full bg-[#e8dcb8]" />
        <span className="absolute top-[56%] left-[56%] h-4 w-4 rounded-full bg-[#e8dcb8]" />
      </div>

      {/* Clouds */}
      <div className="absolute inset-0" style={{ opacity: "calc(1 - var(--night) * 0.65)" }}>
      <div className="cloud absolute top-[12%] h-10 w-40 rounded-full bg-white/80 [animation-duration:70s]" />
      <div className="cloud absolute top-[24%] h-8 w-28 rounded-full bg-white/70 [animation-duration:55s] [animation-delay:-30s]" />
      <div className="cloud absolute top-[6%] h-12 w-52 rounded-full bg-white/60 [animation-duration:90s] [animation-delay:-60s]" />
      </div>

      {/* The glacier world */}
      <div className="absolute inset-x-0 bottom-0 h-[62%]">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <defs>
            <clipPath id="land"><path d="M0,520 L120,360 L210,430 L330,250 L450,410 L560,300 L690,440 L800,230 L930,420 L1040,320 L1170,450 L1290,270 L1420,420 L1530,340 L1600,400 L1600,900 L0,900 Z" /></clipPath>
          </defs>
          {/* Far glacier peaks */}
          <path d="M0,520 L120,360 L210,430 L330,250 L450,410 L560,300 L690,440 L800,230 L930,420 L1040,320 L1170,450 L1290,270 L1420,420 L1530,340 L1600,400 L1600,900 L0,900 Z" fill="#d6ebfb" stroke="#121212" strokeWidth="3" strokeLinejoin="round" />
          <path d="M330,250 L370,330 L340,320 L310,380 L300,290 Z M800,230 L850,320 L812,305 L790,370 L770,280 Z M1290,270 L1335,350 L1300,338 L1280,395 L1262,310 Z" fill="#fff" />
          <path d="M800,230 L930,420 L860,420 L840,340 Z M330,250 L450,410 L390,410 L370,320 Z M1290,270 L1420,420 L1350,420 L1330,330 Z" fill="#b5d6ef" />
          {/* Glacier cliffs */}
          <path d="M0,610 L90,560 L260,575 L300,520 L470,540 L520,600 L700,585 L760,540 L960,555 L1010,605 L1180,590 L1240,530 L1430,550 L1480,600 L1600,585 L1600,900 L0,900 Z" fill="#eaf6ff" stroke="#121212" strokeWidth="3" strokeLinejoin="round" />
          <g stroke="#9cc8e6" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M310,540 L320,590 M360,545 L355,600 M780,555 L790,600 M840,560 L835,610 M1260,545 L1268,595 M1320,552 L1312,600" />
          </g>
          {/* Sled hill */}
          <path d="M1060,700 C1160,620 1260,600 1380,610 C1480,620 1560,660 1600,690 L1600,900 L1060,900 Z" fill="#f6fbff" stroke="#121212" strokeWidth="3" />
          {/* Igloo */}
          <g transform="translate(330 690)">
            <path d="M-80,40 C-80,-50 80,-50 80,40 Z" fill="#fff" stroke="#121212" strokeWidth="3" />
            <path d="M-26,40 C-26,4 26,4 26,40 Z" fill="#2b3550" stroke="#121212" strokeWidth="3" />
            <g stroke="#b5d6ef" strokeWidth="2.5" fill="none">
              <path d="M-74,10 L74,10 M-62,-16 L62,-16 M-40,-34 L40,-34 M-40,10 L-44,-16 M30,10 L34,-16 M-6,-16 L-4,-34 M-52,40 L-52,10 M52,40 L52,10" />
            </g>
          </g>
          {/* Foreground snow */}
          <path d="M0,720 C200,690 380,740 600,715 C820,690 1000,735 1200,720 C1380,706 1500,730 1600,722 L1600,900 L0,900 Z" fill="#ffffff" stroke="#121212" strokeWidth="3" />
          <path d="M0,780 C260,760 520,800 800,782 C1080,764 1340,800 1600,786 L1600,900 L0,900 Z" fill="#edf6fd" />

          {/* Sledder going down the hill */}
          <g className="sled">
            <g transform="rotate(-14)">
              <rect x="-26" y="30" width="52" height="8" rx="4" fill="#e2492f" stroke="#121212" strokeWidth="2.5" />
              <Penguin s={0.8} hat="#e2492f" />
            </g>
          </g>

          {/* Snowman with a hopping helper */}
          <g transform="translate(1000 745)">
            <circle cx="0" cy="0" r="34" fill="#fff" stroke="#121212" strokeWidth="3" />
            <circle cx="0" cy="-52" r="24" fill="#fff" stroke="#121212" strokeWidth="3" />
            <circle cx="-8" cy="-58" r="3" fill="#121212" />
            <circle cx="8" cy="-58" r="3" fill="#121212" />
            <path d="M0,-52 L22,-48 L0,-45 Z" fill="#ff8a2a" stroke="#121212" strokeWidth="2" />
            <path d="M-22,-34 C-10,-28 10,-28 22,-34" stroke="#e2492f" strokeWidth="7" fill="none" strokeLinecap="round" />
            <circle cx="0" cy="-8" r="3" fill="#121212" />
            <circle cx="0" cy="6" r="3" fill="#121212" />
          </g>
          <g transform="translate(1075 742)">
            <g className="hop"><Penguin s={0.95} hat="#ffcf3f" /></g>
          </g>

          {/* Snowball fight */}
          <g transform="translate(600 748)"><g className="throw-a"><Penguin s={1.05} /></g></g>
          <g transform="translate(860 752)"><g className="throw-b"><Penguin s={1.05} hat="#5aa6ff" /></g></g>
          <g className="ball-x">
            <g className="ball-y">
              <circle cx="0" cy="0" r="7" fill="#fff" stroke="#121212" strokeWidth="2.5" />
            </g>
          </g>

          {/* Waddler */}
          <g className="walk">
            <g className="waddle"><Penguin s={0.9} /></g>
          </g>

          {/* Belly slider zooming across the front */}
          <g className="slide">
            <g transform="rotate(80)">
              <Penguin s={1.1} />
            </g>
            <g className="spray" fill="#fff" stroke="#121212" strokeWidth="2">
              <circle cx="-60" cy="22" r="6" />
              <circle cx="-80" cy="12" r="4" />
              <circle cx="-96" cy="24" r="3" />
            </g>
          </g>

          {/* Time-of-day tint, clipped to the land so the sky stays clean */}
          <rect x="-200" y="0" width="2000" height="900" clipPath="url(#land)" style={{ fill: "var(--shade)", mixBlendMode: "multiply" }} />
        </svg>
      </div>

      <canvas ref={snow} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
