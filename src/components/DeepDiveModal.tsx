"use client";

import React, { useEffect, useRef, useCallback, useState, memo } from "react";
import { createPortal } from "react-dom";
import styles from "./DeepDiveModal.module.css";

/* ── Types ── */

interface ContentSection {
  heading: string | null;
  paragraphs: string[];
  listItems: string[];
}

export interface DeepDiveContent {
  slug: string;
  title: string;
  content: string;
  themes: string[];
  tools: string[];
  impactSnapshot: string[];
}

interface DeepDiveModalProps {
  /** Deep dive content, pre-loaded at build time */
  content: DeepDiveContent;
  /** Tool/theme label maps from catalog */
  toolLabels: Map<string, string>;
  themeLabels: Map<string, string>;
  /** Close callback */
  onClose: () => void;
  /** Element that triggered the modal (for focus restore) */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/* ── Parse MDX content into sections ── */
function parseMDXContent(content: string): ContentSection[] {
  const lines = content.split("\n");
  const sections: ContentSection[] = [];
  let current: ContentSection = { heading: null, paragraphs: [], listItems: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      if (current.heading || current.paragraphs.length > 0 || current.listItems.length > 0) {
        sections.push(current);
      }
      current = {
        heading: trimmed.replace(/^##\s+/, ""),
        paragraphs: [],
        listItems: [],
      };
    } else if (trimmed.startsWith("- ")) {
      current.listItems.push(trimmed.replace(/^-\s+/, ""));
    } else {
      current.paragraphs.push(trimmed);
    }
  }

  if (current.heading || current.paragraphs.length > 0 || current.listItems.length > 0) {
    sections.push(current);
  }

  return sections;
}

/* ── Focus trap hook ── */
function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    // Focus first focusable element on mount
    requestAnimationFrame(() => first?.focus());

    return () => document.removeEventListener("keydown", handleTab);
  }, [containerRef, active]);
}

/* ── DeepDiveModal ── */
export const DeepDiveModal = memo(function DeepDiveModal({
  content,
  toolLabels,
  themeLabels,
  onClose,
  triggerRef,
}: DeepDiveModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  /* Focus trap */
  useFocusTrap(dialogRef, visible);

  /* Mount portal + lock body scroll */
  useEffect(() => {
    setMounted(true);

    // Lock body scroll with scrollbar compensation
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  /* ESC key to close */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Close with exit animation + focus restore */
  const handleClose = useCallback(() => {
    setVisible(false);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = prefersReduced ? 0 : 180;

    setTimeout(() => {
      onClose();
      // Restore focus to trigger element
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    }, delay);
  }, [onClose, triggerRef]);

  /* Backdrop click */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  /* Parse content */
  const sections = parseMDXContent(content.content);

  if (!mounted) return null;

  const modal = (
    <div
      className={`${styles.backdrop} ${visible ? styles.backdropVisible : ""}`}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${visible ? styles.dialogVisible : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
      >
        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close deep dive"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scrollable content area */}
        <div className={styles.scrollArea}>
          <article className={styles.article}>
            {/* Header */}
            <header className={styles.header}>
              <h1 className={styles.title}>{content.title}</h1>

              {/* Tags */}
              <div className={styles.meta}>
                {content.themes.length > 0 && (
                  <div className={styles.tags}>
                    {content.themes.map((tid) => (
                      <span key={tid} className={styles.themeTag}>
                        {themeLabels.get(tid) || tid}
                      </span>
                    ))}
                  </div>
                )}
                {content.tools.length > 0 && (
                  <div className={styles.tags}>
                    {content.tools.map((tid) => (
                      <span key={tid} className={styles.toolTag}>
                        {toolLabels.get(tid) || tid}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Impact Snapshot */}
            {content.impactSnapshot.length > 0 && (
              <aside className={styles.impactSnapshot} aria-label="Impact snapshot">
                <h2 className={styles.impactSnapshotHeading}>Impact Snapshot</h2>
                <ul className={styles.impactSnapshotList}>
                  {content.impactSnapshot.map((metric, i) => (
                    <li key={i} className={styles.impactSnapshotItem}>{metric}</li>
                  ))}
                </ul>
              </aside>
            )}

            {/* Body sections */}
            <div className={styles.content}>
              {sections.map((section, i) => (
                <section key={i} className={styles.section}>
                  {section.heading && (
                    <h2 className={styles.sectionHeading}>{section.heading}</h2>
                  )}
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className={styles.paragraph}>
                      {p}
                    </p>
                  ))}
                  {section.listItems.length > 0 && (
                    <ul className={styles.list}>
                      {section.listItems.map((item, k) => (
                        <li key={k}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
});

DeepDiveModal.displayName = "DeepDiveModal";
