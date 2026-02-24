"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import styles from "./CompanyMiniNav.module.css";

interface Company {
  id: string;
  label: string;
}

interface CompanyMiniNavProps {
  companies: Company[];
}

/**
 * Floating mini-nav for quick navigation between company sections.
 * Uses IntersectionObserver to track active section based on scroll.
 */
export const CompanyMiniNav = memo(function CompanyMiniNav({
  companies,
}: CompanyMiniNavProps) {
  const [activeId, setActiveId] = useState<string | null>(companies[0]?.id ?? null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ratioMapRef = useRef<Map<string, number>>(new Map());

  /* Determine active company based on intersection ratios */
  const updateActiveFromRatios = useCallback(() => {
    const map = ratioMapRef.current;
    if (map.size === 0) return;

    // Find company with highest intersection ratio
    let maxRatio = -1;
    let maxId: string | null = null;

    for (const [id, ratio] of map) {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxId = id;
      }
    }

    // Fall back to first visible if all ratios are 0
    if (maxRatio <= 0) {
      // Find first company whose section is near the top of viewport
      for (const company of companies) {
        const el = document.getElementById(`company-${company.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If top is within 200px of viewport top, consider it "active"
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

  /* Setup IntersectionObserver */
  useEffect(() => {
    if (companies.length === 0) return;

    // Create observer
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
        rootMargin: "-100px 0px -50% 0px", // Bias towards top of viewport
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all company sections
    for (const company of companies) {
      const el = document.getElementById(`company-${company.id}`);
      if (el) {
        observerRef.current.observe(el);
      }
    }

    return () => {
      observerRef.current?.disconnect();
      ratioMapRef.current.clear();
    };
  }, [companies, updateActiveFromRatios]);

  /* Handle click - smooth scroll to company section */
  const handleClick = useCallback(
    (companyId: string) => {
      const el = document.getElementById(`company-${companyId}`);
      if (!el) return;

      // Check for reduced motion preference
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      el.scrollIntoView({
        behavior: prefersReduced ? "instant" : "smooth",
        block: "start",
      });

      setActiveId(companyId);
      setIsMobileOpen(false);
    },
    []
  );

  /* Keyboard handler */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, companyId: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick(companyId);
      }
    },
    [handleClick]
  );

  if (companies.length <= 1) {
    // No need for nav with only one company
    return null;
  }

  return (
    <>
      {/* Desktop: Floating rail */}
      <nav
        className={`${styles.nav} ${isExpanded ? styles.navExpanded : ""}`}
        aria-label="Company navigation"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocus={() => setIsExpanded(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsExpanded(false);
          }
        }}
      >
        <ul className={styles.list} role="list">
          {companies.map((company) => {
            const isActive = company.id === activeId;
            return (
              <li key={company.id} className={styles.item}>
                <button
                  className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
                  onClick={() => handleClick(company.id)}
                  onKeyDown={(e) => handleKeyDown(e, company.id)}
                  aria-current={isActive ? "true" : undefined}
                  title={company.label}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.label}>{company.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: Collapsed button + overlay */}
      <div className={styles.mobileContainer}>
        <button
          className={styles.mobileToggle}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-expanded={isMobileOpen}
          aria-label="Company navigation menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className={styles.mobileLabel}>Companies</span>
        </button>

        {isMobileOpen && (
          <>
            <div className={styles.mobileBackdrop} onClick={() => setIsMobileOpen(false)} />
            <div className={styles.mobilePanel}>
              <ul className={styles.mobileList} role="list">
                {companies.map((company) => {
                  const isActive = company.id === activeId;
                  return (
                    <li key={company.id}>
                      <button
                        className={`${styles.mobileItem} ${isActive ? styles.mobileItemActive : ""}`}
                        onClick={() => handleClick(company.id)}
                        aria-current={isActive ? "true" : undefined}
                      >
                        {company.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
});

CompanyMiniNav.displayName = "CompanyMiniNav";
