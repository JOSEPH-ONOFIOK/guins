// A Hoodguin drawn in SVG in the collection's style: bullet body, thick black
// outline, flat top lids over deadpan eyes, a wide diamond beak and two tufts.
// The eyes follow `look` (-1..1 on each axis), and `asleep` closes them.

export type Fit = "none" | "hood" | "beanie" | "shades";

const OUT = "#121212";
const W = 7;

export function HoodguinArt({
  look = { x: 0, y: 0 },
  asleep = false,
  fit = "none",
  body = "#24211f",
  className,
}: {
  look?: { x: number; y: number };
  asleep?: boolean;
  fit?: Fit;
  body?: string;
  className?: string;
}) {
  const dx = Math.max(-1, Math.min(1, look.x)) * 15;
  const dy = Math.max(0, Math.min(1, (look.y + 1) / 2)) * 9;
  const lid = { transformBox: "fill-box" as const, transformOrigin: "top", transition: "transform .25s ease", transform: asleep ? "scaleY(0.12)" : "scaleY(1)" };

  return (
    <svg viewBox="0 0 400 420" className={className} role="img" aria-label="A Hoodguin">
      {/* Hood: sits behind the head */}
      {fit === "hood" && (
        <g>
          <path d="M40,420 C28,250 40,96 128,56 C170,38 230,38 272,56 C360,96 372,250 360,420 Z" fill="#e2492f" stroke={OUT} strokeWidth={W} strokeLinejoin="round" />
          <path d="M300,90 C340,140 352,240 350,420 L318,420 C320,260 306,150 280,108 Z" fill="#b8341f" />
        </g>
      )}

      {/* Tufts */}
      <path d="M196,84 C186,62 168,56 166,66 C164,76 184,82 196,84 Z" fill={body} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <path d="M204,84 C214,62 232,56 234,66 C236,76 216,82 204,84 Z" fill={body} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />

      {/* Body */}
      <path d="M70,420 C64,300 70,150 118,102 C148,74 252,74 282,102 C330,150 336,300 330,420 Z" fill={body} stroke={OUT} strokeWidth={W} strokeLinejoin="round" />
      {/* Flat cel shading, like the art */}
      <path d="M200,84 C240,84 270,92 284,106 C318,140 330,240 332,420 L262,420 C272,330 268,200 244,128 Z" fill="#ffffff" opacity="0.07" />
      <path d="M96,300 L150,150 L118,104 C80,150 70,240 72,330 Z" fill="#ffffff" opacity="0.05" />

      {/* Belly */}
      <path d="M118,420 C110,338 140,282 200,276 C260,282 290,338 282,420" fill="#ffffff" stroke={OUT} strokeWidth={W} strokeLinejoin="round" />
      <path d="M200,276 C260,282 290,338 282,420 L238,420 C246,350 236,300 200,276 Z" fill="#000" opacity="0.08" />

      {/* Hoodie drawstrings over the belly */}
      {fit === "hood" && (
        <g stroke={OUT} strokeWidth={4} strokeLinecap="round">
          <line x1="150" y1="300" x2="146" y2="380" />
          <line x1="250" y1="300" x2="254" y2="380" />
          <circle cx="146" cy="386" r="6" fill="#fff3e6" />
          <circle cx="254" cy="386" r="6" fill="#fff3e6" />
        </g>
      )}

      {/* Brow marks */}
      <g stroke={OUT} strokeWidth={5} strokeLinecap="round">
        <line x1="186" y1="184" x2="193" y2="171" />
        <line x1="200" y1="186" x2="209" y2="173" />
      </g>

      {/* Eyes */}
      <g style={lid}>
        <path d="M98,200 L184,200 C180,220 172,232 160,240 C148,246 128,246 116,242 C106,232 100,216 98,200 Z" fill="#fff" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
        <path d="M216,200 L302,200 C300,216 294,232 284,242 C272,246 252,246 240,240 C228,232 220,220 216,200 Z" fill="#fff" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
        {!asleep && (
          <g style={{ transition: "transform .12s ease-out" }} transform={`translate(${dx} ${dy})`}>
            <circle cx="146" cy="212" r="10" fill={OUT} />
            <circle cx="258" cy="212" r="10" fill={OUT} />
            <circle cx="149" cy="208" r="3" fill="#fff" />
            <circle cx="261" cy="208" r="3" fill="#fff" />
          </g>
        )}
        <path d="M110,236 C126,246 148,246 162,238 L170,230 C150,238 128,238 110,228 Z" fill="#000" opacity="0.1" />
      </g>
      {/* The flat lid line that gives the deadpan look */}
      <g stroke={OUT} strokeWidth={8} strokeLinecap="round">
        <line x1="92" y1="200" x2="190" y2="200" />
        <line x1="210" y1="200" x2="308" y2="200" />
      </g>

      {/* Blush */}
      <ellipse cx="112" cy="262" rx="20" ry="11" fill="#ff8fb3" opacity="0.55" />
      <ellipse cx="288" cy="262" rx="20" ry="11" fill="#ff8fb3" opacity="0.55" />
      <circle cx="104" cy="258" r="3" fill="#fff" opacity="0.7" />
      <circle cx="280" cy="258" r="3" fill="#fff" opacity="0.7" />

      {/* Beak */}
      <path d="M138,258 L194,236 L220,237 L262,258 C267,262 265,267 258,269 L216,283 L194,283 L144,269 C136,266 134,261 138,258 Z" fill="#ffd25e" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <path d="M220,237 L262,258 C267,262 265,267 258,269 L230,278 Z" fill="#fde26a" />
      <path d="M182,262 C192,258 208,258 218,262" fill="none" stroke={OUT} strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx="200" cy="268" rx="5" ry="3.5" fill={OUT} />

      {fit === "beanie" && (
        <g stroke={OUT} strokeWidth={W} strokeLinejoin="round">
          <path d="M112,132 C112,66 288,66 288,132 Z" fill="#ffd25e" />
          <rect x="100" y="120" width="200" height="34" rx="8" fill="#e0a91c" />
          <g strokeWidth={3} opacity="0.5">
            {[124, 148, 172, 196, 220, 244, 268].map((x) => (
              <line key={x} x1={x} y1="126" x2={x} y2="148" />
            ))}
          </g>
          <circle cx="200" cy="62" r="16" fill="#fff3e6" />
        </g>
      )}

      {fit === "shades" && (
        <g stroke={OUT} strokeWidth={6} strokeLinejoin="round">
          <path d="M88,192 L190,192 L184,228 C176,244 116,246 100,232 Z" fill="#121212" />
          <path d="M210,192 L312,192 L300,232 C284,246 224,244 216,228 Z" fill="#121212" />
          <line x1="190" y1="200" x2="210" y2="200" />
          <path d="M110,202 L140,202" stroke="#ffcf3f" strokeWidth={5} opacity="0.55" />
          <path d="M230,202 L260,202" stroke="#ffcf3f" strokeWidth={5} opacity="0.55" />
        </g>
      )}
    </svg>
  );
}
