"use client";

import React, { useRef, useEffect } from "react";

/**
 * Subtle particle dust field rendered on a fixed <canvas>.
 * - 55–130 particles based on viewport area.
 * - Pauses when tab is hidden (Page Visibility API).
 * - Static single frame when prefers-reduced-motion is enabled.
 * - pointer-events: none so it never blocks interaction.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    /* ── Particle setup ── */
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      opacity: number;
    }

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let rafId: number | null = null;
    let paused = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticles() {
      const area = w * h;
      // Scale count: ~95 on 1920×1080, clamp to 55–130
      const count = Math.min(130, Math.max(55, Math.round(area / 22000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.1,
        r: Math.random() * 1.4 + 0.5,
        opacity: Math.random() * 0.18 + 0.08,
      }));
    }

    function getParticleColor(): string {
      // Read the current theme from the html element
      const theme = document.documentElement.getAttribute("data-theme");
      return theme === "day"
        ? "68, 76, 102"    // deeper cool-grey for light mode (better contrast)
        : "215, 228, 248"; // crisper blue-white for dark mode
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const rgb = getParticleColor();
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb}, ${p.opacity})`;
        ctx!.fill();
      }
    }

    function update() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around edges
        if (p.x < -2) p.x = w + 2;
        if (p.x > w + 2) p.x = -2;
        if (p.y < -2) p.y = h + 2;
        if (p.y > h + 2) p.y = -2;
      }
    }

    function loop() {
      if (paused) return;
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    /* ── Init ── */
    resize();
    createParticles();

    if (prefersReduced) {
      // Just draw one static frame
      draw();
      return;
    }

    loop();

    /* ── Page Visibility ── */
    function onVisibility() {
      if (document.hidden) {
        paused = true;
        if (rafId !== null) cancelAnimationFrame(rafId);
      } else {
        paused = false;
        loop();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    /* ── Resize ── */
    function onResize() {
      resize();
      createParticles();
    }
    window.addEventListener("resize", onResize);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
