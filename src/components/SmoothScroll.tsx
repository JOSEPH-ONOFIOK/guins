"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

// Weighted, gliding scroll (Lenis). Anchor links (#colony, #gang…) glide too, and
// land below the fixed nav. Skipped for anyone who prefers reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, anchors: { offset: -90 } });
    return () => lenis.destroy();
  }, []);
  return null;
}
