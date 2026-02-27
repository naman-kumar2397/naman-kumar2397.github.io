"use client";

import React, { useRef, useEffect, useCallback, memo, type RefObject } from "react";
import type { StarLane as StarLaneData } from "@/lib/layout-engine";
import { useInView } from "@/lib/useInView";
import styles from "./StarLane.module.css";

/* Merge a RefObject and a MutableRefObject via a callback ref */
function mergeRefs<T>(...refs: (RefObject<T | null> | React.MutableRefObject<T | null>)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/* ── Dev render counter ── */
const isDev = process.env.NODE_ENV === "development";
let renderCount = 0;

const IMPACT_COLORS: Record<string, string> = {
  reliability: "#f0b429",
  observability: "#6ee7b7",
  scalability: "#7eb8ff",
  security: "#f87171",
};

export const IMPACT_TYPE_ORDER = ["reliability", "observability", "scalability", "security"] as const;

type ImpactType = typeof IMPACT_TYPE_ORDER[number];

interface ImpactGroup {
  type: ImpactType;
  impacts: import("@/lib/layout-engine").LaneImpact[];
}

/** Groups impacts by type in deterministic order (reliability → observability → scalability → security).
 *  Within each group, the original ordering from impact_ids is preserved.
 *  SSR-safe: no Math.random / Date.now. */
export function groupImpactsByType(impacts: import("@/lib/layout-engine").LaneImpact[]): ImpactGroup[] {
  const map = new Map<ImpactType, import("@/lib/layout-engine").LaneImpact[]>();
  for (const imp of impacts) {
    const group = map.get(imp.type as ImpactType);
    if (group) {
      group.push(imp);
    } else {
      map.set(imp.type as ImpactType, [imp]);
    }
  }
  return IMPACT_TYPE_ORDER
    .filter((type) => map.has(type))
    .map((type) => ({ type, impacts: map.get(type)! }));
}

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
  isExpanded: boolean;
  isPinned: boolean;
  onToggleExpand: (projectId: string) => void;
  onHoverExpand: (projectId: string) => void;
  onHoverCollapse: (projectId: string) => void;
  onHover: (projectId: string | null) => void;
  onImpactClick: (impactId: string) => void;
  onDeepDive?: (slug: string, triggerEl?: HTMLElement) => void;
}

/* ── Static Arrow SVG (memoized) ── */
type ArrowVariant = "problem-solution" | "solution-result";

const ARROW_COLORS: Record<ArrowVariant, { shaft: string; head: string }> = {
  "problem-solution": {
    shaft: "rgba(248, 113, 113, 0.55)",
    head: "rgba(110, 231, 183, 0.65)",
  },
  "solution-result": {
    shaft: "rgba(110, 231, 183, 0.65)",
    head: "rgba(126, 184, 255, 0.65)",
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
  isExpanded,
  isPinned,
  onToggleExpand,
  onHoverExpand,
  onHoverCollapse,
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
  const laneRef = useRef<HTMLDivElement>(null);
  const hoverEnterTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* Wider stagger for more dramatic sequential flow */
  const step = (n: number) => `${delay + n * 0.15}s`;

  /* Keep expanded lane's top in viewport */
  useEffect(() => {
    if (isExpanded && laneRef.current) {
      const el = laneRef.current;
      const rect = el.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.4) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [isExpanded]);

  /* Cleanup timers */
  useEffect(() => {
    return () => {
      clearTimeout(hoverEnterTimer.current);
      clearTimeout(hoverLeaveTimer.current);
    };
  }, []);

  const handleToggle = useCallback(() => {
    // Click always pins/unpins — cancel any hover timers
    clearTimeout(hoverEnterTimer.current);
    clearTimeout(hoverLeaveTimer.current);
    onToggleExpand(lane.projectId);
  }, [lane.projectId, onToggleExpand]);

  const handleMouseEnter = useCallback(() => {
    onHover(lane.projectId);
    clearTimeout(hoverLeaveTimer.current);
    // Don't hover-expand if already pinned open
    if (!isPinned) {
      hoverEnterTimer.current = setTimeout(() => {
        onHoverExpand(lane.projectId);
      }, 300);
    }
  }, [lane.projectId, onHover, onHoverExpand, isPinned]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
    clearTimeout(hoverEnterTimer.current);
    // Don't hover-collapse if pinned
    if (!isPinned) {
      hoverLeaveTimer.current = setTimeout(() => {
        onHoverCollapse(lane.projectId);
      }, 500);
    }
  }, [lane.projectId, onHover, onHoverCollapse, isPinned]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  const laneClasses = [
    styles.lane,
    inView ? styles.laneVisible : styles.laneHidden,
    isHovered ? styles.laneHovered : "",
    isDimmed ? styles.laneDimmed : "",
    isLightDimmed ? styles.laneLightDimmed : "",
    isImpactHighlighted ? styles.laneHighlighted : "",
    isExpanded ? styles.laneExpanded : "",
  ].filter(Boolean).join(" ");

  /* ── Impact type chips for collapsed view ── */
  const impactTypes = [...new Set(lane.impacts.map((i) => i.type))];

  return (
    <div
      id={`project-${lane.projectId}`}
      ref={mergeRefs(observerRef, laneRef)}
      className={laneClasses}
      style={{ animationDelay: `${delay}s` }}
      tabIndex={0}
      role="row"
      aria-label={`Project: ${lane.projectTitle}`}
      aria-expanded={isExpanded}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      {/* ── Collapsed header (always visible) ── */}
      <div className={styles.laneHeader}>
        <div className={styles.headerLeft}>
          {/* Large animated chevron */}
          <span className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ""}`} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className={styles.projectTitle} title={lane.projectTitle}>
            {lane.projectTitle}
          </span>
          {/* "View details" micro-hint — only when collapsed */}
          {!isExpanded && (
            <span className={styles.detailsHint}>View details</span>
          )}
          {/* Pinned indicator */}
          {isPinned && isExpanded && (
            <span className={styles.pinnedBadge} title="Click to unpin">📌</span>
          )}
        </div>
        <div className={styles.headerRight}>
          {/* Impact type dots */}
          <div className={styles.impactDots} aria-label={`Impact types: ${impactTypes.join(", ")}`}>
            {impactTypes.map((type) => (
              <span
                key={type}
                className={styles.impactTypeDot}
                style={{ background: IMPACT_COLORS[type] || "var(--signal)" }}
                title={type}
              />
            ))}
          </div>
          {/* Tool count */}
          {tools.length > 0 && (
            <span className={styles.toolCount} aria-label={`${tools.length} tools`}>
              {tools.length} tool{tools.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Summary line (collapsed only) ── */}
      {!isExpanded && (
        <p className={styles.summaryLine}>{lane.projectSummary}</p>
      )}

      {/* ── Expanded content (grid-rows animation) ── */}
      <div
        className={`${styles.expandedContent} ${isExpanded ? styles.expandedContentOpen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.expandedContentInner}>
          {isExpanded && (
            <div style={{ paddingTop: 14 }}>
        {/* 3-column STAR grid: Problem → Solution → Result */}
        <div className={styles.starGrid}>
          {/* Problem */}
          <div
            className={`${styles.card} ${styles.problemCard} ${inView ? styles.stepReveal : ""}`}
            style={{ animationDelay: step(0) }}
          >
            <span className={styles.cardLabel}>PROBLEM</span>
            <p className={styles.cardText}>{lane.problemText}</p>
          </div>

          {/* Arrow 1 */}
          <div className={`${styles.arrowCell} ${inView ? styles.arrowReveal : ""}`} style={{ animationDelay: step(1) }}>
            <Arrow active={isHovered} variant="problem-solution" />
          </div>

          {/* Solution */}
          <div
            className={`${styles.card} ${styles.solutionCard} ${inView ? styles.stepReveal : ""}`}
            style={{ animationDelay: step(2) }}
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

          {/* Arrow 2 */}
          <div className={`${styles.arrowCell} ${inView ? styles.arrowReveal : ""}`} style={{ animationDelay: step(3) }}>
            <Arrow active={isHovered} variant="solution-result" />
          </div>

          {/* Result */}
          <div
            className={`${styles.resultCell} ${inView ? styles.stepReveal : ""}`}
            style={{ animationDelay: step(4) }}
          >
            <span className={styles.resultLabel}>RESULT</span>
            {groupImpactsByType(lane.impacts).map(({ type, impacts: groupImpacts }) => {
              const color = IMPACT_COLORS[type] || "var(--signal)";
              return (
                <div key={type} className={styles.impactGroup}>
                  {/* Type heading — rendered once per group */}
                  <div className={styles.impactGroupHeading}>
                    <span className={styles.impactDot} style={{ background: color }} />
                    <span className={styles.impactGroupLabel} style={{ color }}>{type}</span>
                  </div>
                  {/* Impact rows — type label omitted (shown in heading above) */}
                  {groupImpacts.map((imp) => {
                    const isHit = highlightedImpactId === imp.id;
                    const metrics = imp.metrics ?? [];
                    return (
                      <div
                        key={imp.id}
                        className={`${styles.impactBadge} ${isHit ? styles.impactBadgeGlow : ""}`}
                        style={{ "--imp-color": color } as React.CSSProperties}
                      >
                        <div className={styles.impactHeader}>
                          <span className={styles.impactLabel}>{imp.label}</span>
                        </div>
                        {metrics.length > 0 && (
                          <ul className={styles.metricList}>
                            {metrics.map((m, idx) => (
                              <li key={idx} className={styles.metricItem}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Deep Dive button */}
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
          )}
        </div>
      </div>
    </div>
  );
});
StarLane.displayName = "StarLane";
