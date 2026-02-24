"use client";

import React, { useRef, useEffect, useState, memo } from "react";
import type { StarLane as StarLaneData } from "@/lib/layout-engine";
import styles from "./StarLane.module.css";

/* ── Dev render counter ── */
const isDev = process.env.NODE_ENV === "development";
let renderCount = 0;

const IMPACT_COLORS: Record<string, string> = {
  reliability: "#ffcc33",
  observability: "#6df2c1",
  scalability: "#7eb8ff",
  security: "#ff6b8a",
};

interface ToolItem {
  id: string;
  label: string;
  category: string;
}

interface StarLaneProps {
  lane: StarLaneData;
  tools: ToolItem[];
  isHovered: boolean;
  isDimmed: boolean;
  isLightDimmed: boolean;
  isImpactHighlighted: boolean;
  highlightedImpactId: string | null;
  delay: number;
  onHover: (projectId: string | null) => void;
  onImpactClick: (impactId: string) => void;
  onDeepDive?: (slug: string, triggerEl?: HTMLElement) => void;
}

/* ── IntersectionObserver hook (fire once) ── */
function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setInView(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/* ── Static Arrow SVG (memoized) ── */
type ArrowVariant = "problem-solution" | "solution-result";

const ARROW_COLORS: Record<ArrowVariant, { shaft: string; head: string }> = {
  "problem-solution": {
    shaft: "rgba(255, 107, 138, 0.6)",   // red (danger)
    head: "rgba(109, 242, 193, 0.7)",     // green (signal-2)
  },
  "solution-result": {
    shaft: "rgba(109, 242, 193, 0.7)",     // green (signal-2)
    head: "rgba(126, 184, 255, 0.7)",     // blue (result)
  },
};

export const Arrow = memo(function Arrow({ active, variant }: { active: boolean; variant: ArrowVariant }) {
  const { shaft, head } = ARROW_COLORS[variant];
  return (
    <svg className={styles.arrowSvg} viewBox="0 0 48 20" fill="none" aria-hidden="true" style={{ opacity: active ? 1 : 0.6 }}>
      <line x1="0" y1="10" x2="36" y2="10" stroke={shaft} strokeWidth="2" />
      <polygon points="35,5 47,10 35,15" fill={head} />
    </svg>
  );
});
Arrow.displayName = "Arrow";

/* ── Main component (memoized) ── */
export const StarLane = memo(function StarLane({
  lane,
  tools,
  isHovered,
  isDimmed,
  isLightDimmed,
  isImpactHighlighted,
  highlightedImpactId,
  delay,
  onHover,
  onImpactClick,
  onDeepDive,
}: StarLaneProps) {
  /* Dev render counter */
  if (isDev) {
    renderCount++;
    console.debug(`[StarLane] render #${renderCount} – ${lane.projectId}`);
  }

  const [observerRef, inView] = useInView(0.12);

  const step = (n: number) => `${delay + n * 0.12}s`;

  const laneClasses = [
    styles.lane,
    inView ? styles.laneVisible : styles.laneHidden,
    isHovered ? styles.laneHovered : "",
    isDimmed ? styles.laneDimmed : "",
    isLightDimmed ? styles.laneLightDimmed : "",
    isImpactHighlighted ? styles.laneHighlighted : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={observerRef}
      className={laneClasses}
      style={{ animationDelay: `${delay}s` }}
      tabIndex={0}
      role="row"
      aria-label={`Project: ${lane.projectTitle}`}
      onMouseEnter={() => onHover(lane.projectId)}
      onMouseLeave={() => onHover(null)}
    >
      {/* ── Project title ── */}
      <div className={styles.laneHeader}>
        <span className={styles.projectTitle} title={lane.projectTitle}>
          {lane.projectTitle}
        </span>
      </div>

      {/* ── 3-column grid: Problem | Solution | Result ── */}
      <div className={styles.starGrid}>
        {/* Problem */}
        <div
          className={`${styles.card} ${styles.problemCard} ${inView ? styles.stepReveal : ""}`}
          style={{ animationDelay: step(0) }}
          title={lane.problemText}
        >
          <span className={styles.cardLabel}>PROBLEM</span>
          <p className={styles.cardText}>{lane.problemText}</p>
        </div>

        {/* Arrow 1: Problem → Solution */}
        <div className={`${styles.arrowCell} ${inView ? styles.arrowReveal : ""}`} style={{ animationDelay: step(1) }}>
          <Arrow active={isHovered} variant="problem-solution" />
        </div>

        {/* Solution */}
        <div
          className={`${styles.card} ${styles.solutionCard} ${inView ? styles.stepReveal : ""}`}
          style={{ animationDelay: step(2) }}
          title={lane.solutionText}
        >
          <span className={styles.cardLabel} data-accent="solution">SOLUTION</span>
          <p className={styles.cardText}>{lane.solutionText}</p>
          {tools.length > 0 && (
            <div className={styles.toolRow}>
              {tools.slice(0, 5).map((t) => (
                <span key={t.id} className={styles.toolPill} title={t.label}>{t.label}</span>
              ))}
              {tools.length > 5 && <span className={styles.toolMore}>+{tools.length - 5}</span>}
            </div>
          )}
        </div>

        {/* Arrow 2: Solution → Result */}
        <div className={`${styles.arrowCell} ${inView ? styles.arrowReveal : ""}`} style={{ animationDelay: step(3) }}>
          <Arrow active={isHovered} variant="solution-result" />
        </div>

        {/* Result (impact badges) */}
        <div
          className={`${styles.resultCell} ${isHovered ? styles.resultCellActive : ""} ${inView ? styles.stepReveal : ""}`}
          style={{ animationDelay: step(4) }}
        >
          <span className={styles.resultLabel}>RESULT</span>
          {lane.impacts.map((imp) => {
            const color = IMPACT_COLORS[imp.type] || "var(--signal)";
            const isHit = highlightedImpactId === imp.id;
            const metrics = imp.metrics ?? [];
            const visibleMetrics = metrics.slice(0, 2);
            const overflow = metrics.length > 2 ? metrics.length - 2 : 0;
            return (
              <button
                key={imp.id}
                className={`${styles.impactBadge} ${isHit ? styles.impactBadgeGlow : ""}`}
                style={{ "--imp-color": color } as React.CSSProperties}
                title={`${imp.type.toUpperCase()}: ${imp.label}${metrics.length ? "\n" + metrics.join(", ") : ""}`}
                onClick={(e) => { e.stopPropagation(); onImpactClick(imp.id); }}
                aria-label={`Impact: ${imp.label}`}
              >
                <div className={styles.impactHeader}>
                  <span className={styles.impactDot} style={{ background: color }} />
                  <span className={styles.impactType}>{imp.type}</span>
                  <span className={styles.impactLabel}>{imp.label}</span>
                </div>
                {visibleMetrics.length > 0 && (
                  <div className={styles.metricRow}>
                    {visibleMetrics.map((m, idx) => (
                      <span key={idx} className={styles.metricChip} title={m}>{m}</span>
                    ))}
                    {overflow > 0 && (
                      <span className={styles.metricOverflow} title={metrics.slice(2).join(", ")}>+{overflow} more</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
          {lane.deepDiveSlug && onDeepDive && (
            <button
              className={styles.deepDiveResultBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDeepDive(lane.deepDiveSlug!, e.currentTarget);
              }}
              title="Open full case study"
              type="button"
            >
              Deep Dive →
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
StarLane.displayName = "StarLane";
