"use client";

import React from "react";
import { useInView } from "@/lib/useInView";
import styles from "./CompanyFrame.module.css";

interface CompanyFrameProps {
  companyName: string;
  role: string;
  period: string;
  children: React.ReactNode;
  /** Visible index for stagger delay */
  index?: number;
}

/**
 * Envelope container that wraps all project lanes for a company.
 * Shows company header top-left, lanes as children below.
 * Scroll-triggered entrance with stagger based on index.
 */
export function CompanyFrame({
  companyName,
  role,
  period,
  children,
  index = 0,
}: CompanyFrameProps) {
  const [ref, inView] = useInView(0.08);

  return (
    <section
      ref={ref}
      className={`${styles.frame} ${inView ? styles.frameVisible : styles.frameHidden}`}
      style={{ "--frame-i": index } as React.CSSProperties}
    >
      {/* Company header strip */}
      <div className={styles.header}>
        <span className={styles.name}>{companyName}</span>
        <span className={styles.role}>{role}</span>
        <span className={styles.period}>{period}</span>
      </div>

      {/* Lane children */}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
