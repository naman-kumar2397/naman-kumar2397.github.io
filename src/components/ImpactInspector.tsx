"use client";

import React from "react";
import styles from "./ImpactInspector.module.css";
import type { LaneImpact } from "@/lib/layout-engine";

const IMPACT_COLORS: Record<string, string> = {
  reliability: "#ffcc33",
  observability: "#6df2c1",
  scalability: "#7eb8ff",
  security: "#ff6b8a",
};

interface ImpactInspectorProps {
  impact: LaneImpact;
  projectTitles: string[];
  onClose: () => void;
}

export function ImpactInspector({ impact, projectTitles, onClose }: ImpactInspectorProps) {
  const color = IMPACT_COLORS[impact.type] || "var(--signal)";

  return (
    <div
      className={styles.inspector}
      role="dialog"
      aria-label={`Impact: ${impact.label}`}
      style={{ "--imp-color": color } as React.CSSProperties}
    >
      <div className={styles.header}>
        <span className={styles.dot} style={{ background: color }} />
        <span className={styles.type}>{impact.type}</span>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close inspector"
        >
          ✕
        </button>
      </div>

      <h3 className={styles.label}>{impact.label}</h3>

      {impact.metrics.length > 0 && (
        <ul className={styles.metrics}>
          {impact.metrics.map((m, i) => (
            <li key={i} className={styles.metric}>{m}</li>
          ))}
        </ul>
      )}

      <div className={styles.projects}>
        <span className={styles.projectsLabel}>Contributing projects:</span>
        {projectTitles.map((t, i) => (
          <span key={i} className={styles.projectTag}>{t}</span>
        ))}
      </div>
    </div>
  );
}
