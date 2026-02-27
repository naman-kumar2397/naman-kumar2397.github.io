"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import styles from "./CompanyMiniNav.module.css";

interface Company {
  id: string;
  label: string;
  projects?: { id: string; title: string }[];
}

interface NavSection {
  id: string;
  label: string;
  nested?: boolean;
}

interface CompanyMiniNavProps {
  companies: Company[];
  sections?: NavSection[];
}

/**
 * Left-side hamburger menu for quick navigation between company sections.
 * Closed by default; opens a compact drawer on click.
 * Uses IntersectionObserver to track the active section while scrolling.
 */
export const CompanyMiniNav = memo(function CompanyMiniNav({
  companies,
  sections = [],
}: CompanyMiniNavProps) {
  const [activeId, setActiveId] = useState<string | null>(companies[0]?.id ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [topOffset, setTopOffset] = useState(120);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ratioMapRef = useRef<Map<string, number>>(new Map());
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  /* ── Vertically center hamburger with identity card ── */
  useEffect(() => {
    const measure = () => {
      const card = document.getElementById("identity-card");
      if (card) {
        const rect = card.getBoundingClientRect();
        // Center vertically relative to identity card
        setTopOffset(Math.round(rect.top + rect.height / 2 - 20)); // 20 = half of 40px button height
      }
    };
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [companies]);

  /* ── Determine active company based on intersection ratios ── */
  const updateActiveFromRatios = useCallback(() => {
    const map = ratioMapRef.current;
    if (map.size === 0) return;

    let maxRatio = -1;
    let maxId: string | null = null;

    for (const [id, ratio] of map) {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxId = id;
      }
    }

    // Fall back to first company near the top of viewport
    if (maxRatio <= 0) {
      for (const company of companies) {
        const el = document.getElementById(`company-${company.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom > 100) {
            maxId = company.id;
            break;
          }
        }
      }
    }

    if (maxId && maxId !== activeId) {
      setActiveId(maxId);
    }
  }, [companies, activeId]);

  /* ── IntersectionObserver setup ── */
  useEffect(() => {
    if (companies.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id.replace("company-", "");
          ratioMapRef.current.set(id, entry.intersectionRatio);
        }
        updateActiveFromRatios();
      },
      {
        root: null,
        rootMargin: "-100px 0px -50% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const company of companies) {
      const el = document.getElementById(`company-${company.id}`);
      if (el) observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
      ratioMapRef.current.clear();
    };
  }, [companies, updateActiveFromRatios]);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen]);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  /* ── Auto-scroll active item into view when menu opens ── */
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen]);

  /* ── Handle company click: scroll + close menu ── */
  const handleSelect = useCallback((companyId: string) => {
    const el = document.getElementById(`company-${companyId}`);
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
      block: "start",
    });

    setActiveId(companyId);
    setIsOpen(false);
  }, []);

  /* ── Handle section click: scroll to anchor + close menu ── */
  const handleSectionSelect = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
      block: "start",
    });

    setIsOpen(false);
  }, []);

  /* ── Handle project click: scroll to project lane + close menu ── */
  const handleProjectSelect = useCallback((projectId: string) => {
    const el = document.getElementById(`project-${projectId}`);
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
      block: "center",
    });

    setIsOpen(false);
  }, []);

  if (companies.length <= 1 && sections.length === 0) return null;

  return (
    <>
      {/* Hamburger toggle button */}
      <button
        ref={toggleRef}
        className={styles.hamburger}
        style={{ "--hamburger-top": `${topOffset}px` } as React.CSSProperties}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open navigation"
        aria-expanded={isOpen}
        aria-controls="company-nav-panel"
      >
        <svg
          className={styles.hamburgerIcon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Backdrop (visible when open) */}
      {isOpen && (
        <div className={styles.backdrop} aria-hidden="true" />
      )}

      {/* Slide-in drawer panel */}
      <nav
        id="company-nav-panel"
        ref={panelRef}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        aria-label="Page navigation"
        role="navigation"
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Navigate</span>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Navigation items ── */}
        <ul className={styles.list} role="list">
          {sections.filter((s) => !s.nested).map((section) => (
            <li key={section.id} className={styles.item}>
              <button
                className={styles.menuItem}
                onClick={() => handleSectionSelect(section.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSectionSelect(section.id);
                  }
                }}
                tabIndex={isOpen ? 0 : -1}
              >
                <span className={styles.sectionIcon} aria-hidden="true" />
                <span className={styles.menuLabel}>{section.label}</span>
              </button>

              {/* Nest companies + nested sections under Work Experience */}
              {section.id === "experience" && (
                <ul className={styles.nestedList} role="list">
                  {/* Nested section links (e.g. Highlights) */}
                  {sections
                    .filter((s) => s.nested)
                    .map((s) => (
                      <li key={s.id} className={styles.item}>
                        <button
                          className={`${styles.menuItem} ${styles.nestedItem}`}
                          onClick={() => handleSectionSelect(s.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSectionSelect(s.id);
                            }
                          }}
                          tabIndex={isOpen ? 0 : -1}
                        >
                          <span className={styles.dot} aria-hidden="true" />
                          <span className={styles.menuLabel}>{s.label}</span>
                        </button>
                      </li>
                    ))}
                  {/* Company links */}
                  {companies.map((company) => {
                    const isActive = company.id === activeId;
                    return (
                      <li key={company.id} className={styles.item}>
                        <button
                          ref={isActive ? activeItemRef : undefined}
                          className={`${styles.menuItem} ${styles.nestedItem} ${isActive ? styles.menuItemActive : ""}`}
                          onClick={() => handleSelect(company.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelect(company.id);
                            }
                          }}
                          aria-current={isActive ? "true" : undefined}
                          tabIndex={isOpen ? 0 : -1}
                        >
                          <span className={styles.dot} aria-hidden="true" />
                          <span className={styles.menuLabel}>{company.label}</span>
                        </button>

                        {/* Project sub-links */}
                        {company.projects && company.projects.length > 0 && (
                          <ul className={styles.projectList} role="list">
                            {company.projects.map((project) => (
                              <li key={project.id} className={styles.item}>
                                <button
                                  className={`${styles.menuItem} ${styles.projectItem}`}
                                  onClick={() => handleProjectSelect(project.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleProjectSelect(project.id);
                                    }
                                  }}
                                  tabIndex={isOpen ? 0 : -1}
                                >
                                  <span className={styles.projectDash} aria-hidden="true" />
                                  <span className={styles.menuLabel}>{project.title}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}

          {/* ── Download Resume (inside list) ── */}
          <li className={`${styles.item} ${styles.resumeItem}`}>
            <a
              href="/resume.pdf"
              download
              className={`${styles.menuItem} ${styles.resumeLink}`}
              aria-label="Download resume"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8m0 0L4 6.5M7 9l3-2.5M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={styles.menuLabel}>Download Resume</span>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
});

CompanyMiniNav.displayName = "CompanyMiniNav";
