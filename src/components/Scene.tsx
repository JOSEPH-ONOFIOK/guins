"use client";

import { useEffect, useRef } from "react";
import { ColorWash } from "./ColorWash";

// The living background: a glacier world under a sky that runs dawn → day →
// sunset → night → aurora on a loop. While the sun is down the whole site goes
// dark: this sets data-night on <html>, and globals.css swaps the colours., with penguins messing around in the snow.

const CYCLE_MS = 48000;

type Key = { t: number; top: string; mid: string; bot: string; shade: string; night: number };
const KEYS: Key[] = [
  { t: 0.0, top: "#9d9cf5", mid: "#f3b8e0", bot: "#ffe6d6", shade: "#fff0f6", night: 0.15 }, // pastel dawn
  { t: 0.25, top: "#7fb4ff", mid: "#c3dcff", bot: "#f0f4ff", shade: "#ffffff", night: 0 }, // soft day
  { t: 0.48, top: "#8a8cf0", mid: "#c9b6ff", bot: "#f6e2ff", shade: "#f4ecff", night: 0.2 }, // lilac
  { t: 0.57, top: "#5a4b9e", mid: "#f08a8c", bot: "#ffc9a6", shade: "#ffd2c4", night: 0.35 }, // sunset
  { t: 0.65, top: "#070a24", mid: "#141a4a", bot: "#28306e", shade: "#5560b0", night: 1 }, // night
  { t: 0.78, top: "#041226", mid: "#0c2c52", bot: "#1d5682", shade: "#5a86c0", night: 1 }, // aurora night
  { t: 0.86, top: "#3a3f8f", mid: "#8a7fd0", bot: "#e6b8d8", shade: "#e6d8f4", night: 0.45 }, // first light
  { t: 1.0, top: "#9d9cf5", mid: "#f3b8e0", bot: "#ffe6d6", shade: "#fff0f6", night: 0.15 }, // pastel dawn
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

// A puffy cartoon cloud with a little face, drawn like the penguins: soft white,
// thin dark outline, blush cheeks.
type Face = "sleepy" | "happy" | "wink";
function CuteCloud({ face }: { face: Face }) {
  const ink = "#121212";
  return (
    <svg viewBox="0 0 120 70" className="h-auto w-full overflow-visible drop-shadow-[0_6px_10px_rgba(70,80,160,.18)]" aria-hidden>
      <path
        d="M22,60 C7,60 4,42 18,39 C15,25 33,17 43,27 C47,11 74,8 80,25 C90,16 107,23 104,38 C118,40 116,60 101,60 Z"
        fill="#fff"
        stroke={ink}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* soft shading along the bottom */}
      <path d="M14,52 C30,58 90,58 108,51 C110,56 106,60 101,60 L22,60 C17,60 14,57 14,52 Z" fill="#dfe8ff" opacity=".7" />
      <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none">
        {face === "happy" ? (
          <>
            <circle cx="50" cy="42" r="2.4" fill={ink} stroke="none" />
            <circle cx="70" cy="42" r="2.4" fill={ink} stroke="none" />
          </>
        ) : face === "wink" ? (
          <>
            <circle cx="50" cy="42" r="2.4" fill={ink} stroke="none" />
            <path d="M66,42 q4,-4 8,0" />
          </>
        ) : (
          <>
            <path d="M46,41 q4,4 8,0" />
            <path d="M66,41 q4,4 8,0" />
          </>
        )}
        <path d={face === "sleepy" ? "M57,49 q3,1.5 6,0" : "M56,47 q4,4.5 8,0"} />
      </g>
      <ellipse cx="41" cy="48" rx="4.5" ry="2.6" fill="#ff9db5" opacity=".65" />
      <ellipse cx="79" cy="48" rx="4.5" ry="2.6" fill="#ff9db5" opacity=".65" />
    </svg>
  );
}

// Where each cloud floats: height on screen, size, how long one crossing takes, head start
const CLOUDS: { top: string; w: string; speed: number; delay: number; face: Face }[] = [
  { top: "7%", w: "9rem", speed: 80, delay: 10, face: "sleepy" },
  { top: "16%", w: "6rem", speed: 62, delay: 40, face: "happy" },
  { top: "28%", w: "7.5rem", speed: 95, delay: 70, face: "wink" },
  { top: "11%", w: "5rem", speed: 70, delay: 55, face: "happy" },
  { top: "22%", w: "10rem", speed: 110, delay: 5, face: "sleepy" },
];

export function Scene() {
  const root = useRef<HTMLDivElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLDivElement>(null);
  const snow = useRef<HTMLCanvasElement>(null);

  // Day/night loop: writes CSS variables straight to the DOM each frame
  useEffect(() => {
    const el = root.current!;
    const html = document.documentElement;
    let night = false, fade = 0, first = true;
    // Only touches the page when the sun actually crosses the horizon. Landing at
    // night goes straight to dark; a sunset or sunrise you watch fades over a second.
    const setNight = (on: boolean) => {
      const was = first;
      first = false;
      if (on === night) return;
      night = on;
      if (!was) {
        html.classList.add("theme-fade");
        clearTimeout(fade);
        fade = window.setTimeout(() => html.classList.remove("theme-fade"), 1100);
      }
      if (on) html.dataset.night = "";
      else delete html.dataset.night;
    };
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

      // Sun rides 0.85 → 0.6 (wrapping through dawn), moon rides 0.55 → 0.95
      const arc = (p: number, node: HTMLDivElement | null) => {
        if (!node) return;
        const on = p >= 0 && p <= 1;
        node.style.opacity = on ? "1" : "0";
        if (!on) return;
        node.style.left = `${6 + p * 88}%`;
        node.style.top = `${62 - Math.sin(Math.PI * p) * 52}%`;
      };
      const sunP = ((t + 0.15) % 1) / 0.75;
      arc(sunP, sun.current);
      setNight(sunP > 1);
      arc((((t - 0.55) % 1) + 1) % 1 / 0.4, moon.current);
    };

    const cleanup = () => {
      clearTimeout(fade);
      html.classList.remove("theme-fade");
      delete html.dataset.night;
    };
    // ?sky=0.7 freezes the loop at that point (0 dawn, 0.25 day, 0.57 sunset, 0.7 night), for previews
    const pinned = Number(new URLSearchParams(location.search).get("sky") ?? NaN);
    if (pinned >= 0 && pinned < 1) {
      paint(pinned);
      return cleanup;
    }
    if (still) {
      paint(0.3);
      return cleanup;
    }
    const tick = (now: number) => {
      paint(((now - start) % CYCLE_MS) / CYCLE_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
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

      <ColorWash strength={0.5} />

      {/* Stars + aurora */}
      <div className="absolute inset-0" style={{ opacity: "var(--night)" }}>
        {STARS.map((s, i) => (
          <span key={i} className="twinkle absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}
        <div className="aurora absolute top-[8%] left-[-10%] h-[38%] w-[70%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(54,241,255,.5),transparent)] blur-2xl" />
        <div className="aurora absolute top-[4%] right-[-10%] h-[34%] w-[60%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,79,216,.4),transparent)] blur-2xl [animation-delay:-6s]" />
      </div>

      {/* Sun and moon */}
      <div ref={sun} style={{ opacity: 0 }} className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(to_bottom,#ffe27a,#ff7aa8_55%,#b44cff)] shadow-[0_0_90px_30px_rgba(255,79,216,.45)] [mask-image:repeating-linear-gradient(to_bottom,#000_0_62%,transparent_62%_70%,#000_70%_76%,transparent_76%_82%,#000_82%_86%,transparent_86%_92%,#000_92%)] transition-opacity duration-700 sm:h-36 sm:w-36" />
      <div ref={moon} style={{ opacity: 0 }} className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff,#d9d2ff_60%,#a99cff)] shadow-[0_0_70px_20px_rgba(160,140,255,.45)] transition-opacity duration-700 sm:h-20 sm:w-20">
        <span className="absolute top-[28%] left-[26%] h-3 w-3 rounded-full bg-[#b9adf0]" />
        <span className="absolute top-[56%] left-[56%] h-4 w-4 rounded-full bg-[#b9adf0]" />
      </div>

      {/* Clouds */}
      <div className="absolute inset-0" style={{ opacity: "calc(1 - var(--night) * 0.5)" }}>
      {CLOUDS.map((c, i) => (
        <div key={i} className="cloud absolute" style={{ top: c.top, width: c.w, animationDuration: `${c.speed}s`, animationDelay: `-${c.delay}s` }}>
          <div className="cloud-bob" style={{ animationDelay: `-${i * 0.7}s` }}>
            <CuteCloud face={c.face} />
          </div>
        </div>
      ))}
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

      {/* Soft haze at the edges so the glass UI reads cleanly on top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_40%,rgba(243,241,255,.45))]" />
    </div>
  );
}
