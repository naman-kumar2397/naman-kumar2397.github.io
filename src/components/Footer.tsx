"use client";

import React, { memo } from "react";
import { Phone, Mail, Calendar, Download } from "lucide-react";
import { ExternalLink } from "@/components/ExternalLink";
import { profile } from "@/data/profile";
import styles from "./Footer.module.css";

/* ── Icon lookup (matches identity-card tiles) ── */
const FOOTER_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone size={14} aria-hidden="true" />,
  email: <Mail size={14} aria-hidden="true" />,
  calendar: <Calendar size={14} aria-hidden="true" />,
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

export const Footer = memo(function Footer({
  onOpenSchedule,
}: {
  onOpenSchedule?: () => void;
}) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Identity */}
        <div className={styles.identity}>
          <span className={styles.name}>{profile.name}</span>
          <span className={styles.title}>{profile.title}</span>
        </div>

        {/* Contact links */}
        <nav className={styles.links} aria-label="Footer contact links">
          {profile.contacts.map((c) =>
            c.id === "calendar" && onOpenSchedule ? (
              <button
                key={c.id}
                type="button"
                className={styles.linkTile}
                aria-label={c.label}
                onClick={onOpenSchedule}
              >
                <span className={styles.linkIcon}>{FOOTER_ICONS[c.id]}</span>
                <span className={styles.linkLabel}>{c.label}</span>
              </button>
            ) : c.id === "linkedin" ? (
              <ExternalLink
                key={c.id}
                href={c.href}
                className={styles.linkTile}
                aria-label={c.label}
              >
                <span className={styles.linkIcon}>{FOOTER_ICONS[c.id]}</span>
                <span className={styles.linkLabel}>{c.label}</span>
              </ExternalLink>
            ) : (
              <a
                key={c.id}
                href={c.href}
                className={styles.linkTile}
                aria-label={c.label}
              >
                <span className={styles.linkIcon}>{FOOTER_ICONS[c.id]}</span>
                <span className={styles.linkLabel}>{c.label}</span>
              </a>
            ),
          )}
        </nav>

        {/* Download Resume */}
        <a
          href="/resume.pdf"
          download
          className={`${styles.linkTile} ${styles.resumeTile}`}
          aria-label="Download resume"
        >
          <span className={styles.linkIcon}>
            <Download size={14} aria-hidden="true" />
          </span>
          <span className={styles.linkLabel}>Download Resume</span>
        </a>

        {/* Copyright */}
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} {profile.name}
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
