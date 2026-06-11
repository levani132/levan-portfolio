"use client";

import { useEffect } from "react";

/**
 * GlassFX — site-wide pointer tracking for the liquid-glass cards.
 *
 * One delegated listener updates --gx/--gy CSS vars on whichever .glass-card
 * the pointer is currently over; .glass-card::after renders a specular light
 * spot at that point. No per-card React state, no re-renders.
 */
export default function GlassFX() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const card = target.closest(".glass-card");
      if (!(card instanceof HTMLElement)) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--gy", `${e.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
