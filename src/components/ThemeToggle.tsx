"use client";

import React, { useState, useEffect } from "react";
import styles from "./ThemeToggle.module.css";

type ThemeMode = "night" | "day" | "system";

const STORAGE_KEY = "theme-preference";

/**
 * Apply theme to the document and persist in localStorage.
 */
function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage may be unavailable (incognito, etc.)
  }
}

/**
 * Get initial theme from localStorage or default to "system".
 */
function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "night" || stored === "day" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "system";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  // Initial read from localStorage — client only
  useEffect(() => {
    const initial = getInitialTheme();
    setMode(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const handleChange = (newMode: ThemeMode) => {
    setMode(newMode);
    applyTheme(newMode);
  };

  // SSR: render "system" selected until hydrated
  if (!mounted) {
    return (
      <div className={styles.toggle} aria-label="Theme selector">
        <button className={`${styles.btn} ${styles.active}`} aria-pressed="true">
          <SunIcon />
        </button>
        <button className={styles.btn} aria-pressed="false">
          <MoonIcon />
        </button>
        <button className={styles.btn} aria-pressed="false">
          <SystemIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.toggle} role="radiogroup" aria-label="Theme selector">
      <button
        className={`${styles.btn} ${mode === "day" ? styles.active : ""}`}
        onClick={() => handleChange("day")}
        aria-pressed={mode === "day"}
        title="Day theme"
      >
        <SunIcon />
      </button>
      <button
        className={`${styles.btn} ${mode === "night" ? styles.active : ""}`}
        onClick={() => handleChange("night")}
        aria-pressed={mode === "night"}
        title="Night theme"
      >
        <MoonIcon />
      </button>
      <button
        className={`${styles.btn} ${mode === "system" ? styles.active : ""}`}
        onClick={() => handleChange("system")}
        aria-pressed={mode === "system"}
        title="System preference"
      >
        <SystemIcon />
      </button>
    </div>
  );
}

/* ── Icons ── */

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1v2m0 10v2M1 8h2m10 0h2M3.05 3.05l1.41 1.41m7.08 7.08l1.41 1.41M3.05 12.95l1.41-1.41m7.08-7.08l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 10.5A6 6 0 015.5 2a6 6 0 108.5 8.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 14h5M8 11v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
