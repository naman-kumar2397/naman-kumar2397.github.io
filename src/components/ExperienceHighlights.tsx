"use client";

import React, { memo } from "react";
import { useInView } from "@/lib/useInView";
import type { Highlight } from "@/lib/data-loader";
import styles from "./ExperienceHighlights.module.css";

interface ExperienceHighlightsProps {
  highlights: Highlight[];
}

/**
 * Compact summary strip rendered at the top of the Work Experience section.
 * Displays 4–6 data-driven bullet highlights with optional metric chips.
 * Designed to be scanned in ~5 seconds by a recruiter.
 * Scroll-triggered entrance animation.
 */
export const ExperienceHighlights = memo(function ExperienceHighlights({
  highlights,
}: ExperienceHighlightsProps) {
  const [ref, inView] = useInView(0.15);

  if (highlights.length === 0) return null;

  return (
    <div
      ref={ref}
      id="highlights"
      className={`${styles.strip} ${inView ? styles.stripVisible : styles.stripHidden}`}
      role="region"
      aria-label="Experience highlights"
    >
      <ul className={styles.list}>
        {highlights.map((h) => (
          <li key={h.id} className={styles.item}>
            <span className={styles.bullet} aria-hidden="true" />
            <span className={styles.text}>{h.text}</span>
            {h.metrics.length > 0 && (
              <span className={styles.metrics}>
                {h.metrics.map((m, i) => (
                  <span key={i} className={styles.chip}>{m}</span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});

ExperienceHighlights.displayName = "ExperienceHighlights";
