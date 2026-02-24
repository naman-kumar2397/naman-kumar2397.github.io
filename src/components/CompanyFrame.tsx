"use client";

import React from "react";
import styles from "./CompanyFrame.module.css";

interface CompanyFrameProps {
  companyName: string;
  role: string;
  period: string;
  children: React.ReactNode;
}

/**
 * Envelope container that wraps all project lanes for a company.
 * Shows company header top-left, lanes as children below.
 */
export function CompanyFrame({
  companyName,
  role,
  period,
  children,
}: CompanyFrameProps) {
  return (
    <section className={styles.frame}>
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
