"use client";

import { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────
   css-doodle rules for ~300 particles (20 × 15 grid).
   Theme-aware: darker particles for light, lighter for dark.
   ───────────────────────────────────────────────────── */

function getDoodleRules(isDark: boolean): string {
  const colors = isDark
    ? [
        "rgba(240, 180, 41, @rand(.10, .30))",   // gold / signal-ish
        "rgba(110, 231, 183, @rand(.10, .25))",   // teal / signal-2
        "rgba(215, 228, 248, @rand(.08, .22))",   // blue-white / ink
        "rgba(126, 184, 255, @rand(.06, .18))",   // sky-blue accent
      ]
    : [
        "rgba(180, 140, 20, @rand(.06, .18))",    // warm gold
        "rgba(40, 160, 120, @rand(.06, .15))",    // deep teal
        "rgba(68, 76, 102, @rand(.05, .14))",     // cool grey
        "rgba(60, 120, 200, @rand(.04, .12))",    // muted blue
      ];

  return `
    :doodle {
      @grid: 20x15 / 100vw 100vh;
      overflow: hidden;
    }
    :after {
      content: '';
      position: absolute;
      width: @rand(1px, 3px);
      height: @rand(1px, 3px);
      border-radius: 50%;
      top: @rand(5%, 95%);
      left: @rand(5%, 95%);
      background: @pick(${colors.join(", ")});
      animation: drift @rand(12s, 25s) ease-in-out infinite alternate;
      animation-delay: @rand(-25s, 0s);
    }
    @keyframes drift {
      from { transform: translate(@rand(-12px, 12px), @rand(-8px, 8px)); }
      to   { transform: translate(@rand(-12px, 12px), @rand(-8px, 8px)); }
    }
    @media (prefers-reduced-motion: reduce) {
      :after { animation: none; }
    }
  `;
}

/** Resolve the effective theme (dark = true). */
function resolveTheme(): boolean {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "night") return true;
  if (attr === "day") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Full-viewport particle dust layer rendered via css-doodle.
 * ~300 particles (≈ 3× the previous canvas renderer).
 * - Colour palette adapts to light / dark theme.
 * - Particles are CSS-animated (GPU-composited).
 * - Respects `prefers-reduced-motion: reduce`.
 */
export function DoodleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const doodleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("css-doodle")
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const isDark = resolveTheme();
        const el = document.createElement("css-doodle");
        el.innerHTML = getDoodleRules(isDark);
        containerRef.current.appendChild(el);
        doodleRef.current = el;
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Failed to load css-doodle:", err);
      });

    /* Watch for data-theme attribute changes */
    const observer = new MutationObserver(() => {
      if (!doodleRef.current) return;
      const isDark = resolveTheme();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doodleRef.current as any).update?.(getDoodleRules(isDark));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    /* Watch system colour-scheme when theme is "system" */
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "system" && doodleRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doodleRef.current as any).update?.(getDoodleRules(mql.matches));
      }
    };
    mql.addEventListener("change", onMediaChange);

    return () => {
      cancelled = true;
      observer.disconnect();
      mql.removeEventListener("change", onMediaChange);
      if (doodleRef.current) {
        doodleRef.current.remove();
        doodleRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
