"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./FilterDropdown.module.css";

interface FilterItem {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  themes: FilterItem[];
  tools: FilterItem[];
  activeThemes: string[];
  activeTools: string[];
  search: string;
  onSearch: (value: string) => void;
  onToggleTheme: (id: string) => void;
  onToggleTool: (id: string) => void;
  onClear: () => void;
  activeCount: number;
}

export function FilterDropdown({
  themes,
  tools,
  activeThemes,
  activeTools,
  search,
  onSearch,
  onToggleTheme,
  onToggleTool,
  onClear,
  activeCount,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const lc = search.toLowerCase();
  const filteredThemes = themes.filter((t) => t.label.toLowerCase().includes(lc));
  const filteredTools = tools.filter((t) => t.label.toLowerCase().includes(lc));

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M1 3h14M4 8h8M6 13h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className={styles.badge}>{activeCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Filter options">
          <div className={styles.searchRow}>
            <input
              className={styles.search}
              type="text"
              placeholder="Search filters…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
            />
            {activeCount > 0 && (
              <button
                className={styles.clearBtn}
                onClick={() => { onClear(); onSearch(""); }}
              >
                Clear all
              </button>
            )}
          </div>

          {filteredThemes.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Themes</span>
              <div className={styles.chips}>
                {filteredThemes.map((t) => (
                  <button
                    key={t.id}
                    className={`${styles.chip} ${activeThemes.includes(t.id) ? styles.chipActive : ""}`}
                    onClick={() => onToggleTheme(t.id)}
                    aria-pressed={activeThemes.includes(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTools.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Tools</span>
              <div className={styles.chips}>
                {filteredTools.map((t) => (
                  <button
                    key={t.id}
                    className={`${styles.chip} ${styles.chipTool} ${activeTools.includes(t.id) ? styles.chipToolActive : ""}`}
                    onClick={() => onToggleTool(t.id)}
                    aria-pressed={activeTools.includes(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredThemes.length === 0 && filteredTools.length === 0 && (
            <p className={styles.empty}>No matching filters</p>
          )}
        </div>
      )}
    </div>
  );
}
