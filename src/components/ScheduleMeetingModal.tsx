"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { ExternalLink } from "@/components/ExternalLink";
import styles from "./ScheduleMeetingModal.module.css";

const CAL_URL = "https://cal.com/naman-kumar-6s44m9";

/* ── Focus-trap hook ── */
function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

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
    return () => document.removeEventListener("keydown", handleTab);
  }, [containerRef, active]);
}

/* ── Props ── */
interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ref to the element that triggered the modal (for focus restore). */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Fullscreen modal embedding the Cal.com scheduler.
 *
 * - Lazy-loads iframe only when opened.
 * - Falls back to a CTA card if iframe errors.
 * - Body scroll lock, ESC close, backdrop close, focus trap + restore.
 */
export const ScheduleMeetingModal = memo(function ScheduleMeetingModal({
  isOpen,
  onClose,
  triggerRef,
}: ScheduleMeetingModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [iframeOk, setIframeOk] = useState(true);
  const iframeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Hydration-safe portal mount
  useEffect(() => setMounted(true), []);

  // Focus trap
  useFocusTrap(dialogRef, isOpen);

  /* ── Body scroll lock ── */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  /* ── ESC close ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* ── Focus restore on close ── */
  const prevOpen = useRef(false);
  useEffect(() => {
    if (prevOpen.current && !isOpen) {
      triggerRef?.current?.focus();
    }
    prevOpen.current = isOpen;
  }, [isOpen, triggerRef]);

  /* ── Iframe timeout: assume blocked after 8 s ── */
  useEffect(() => {
    if (!isOpen) return;
    // Reset state each time modal opens
    setIframeOk(true);
    clearTimeout(iframeTimerRef.current);
    iframeTimerRef.current = setTimeout(() => setIframeOk(false), 8000);
    return () => clearTimeout(iframeTimerRef.current);
  }, [isOpen]);

  /* ── Backdrop click ── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Schedule a meeting"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Schedule a meeting</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close scheduler"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {iframeOk ? (
            <iframe
              src={CAL_URL}
              title="Schedule a meeting with Naman Kumar"
              className={styles.iframe}
              allow="payment"
              onLoad={() => clearTimeout(iframeTimerRef.current)}
              onError={() => setIframeOk(false)}
            />
          ) : (
            <div className={styles.fallback}>
              <p className={styles.fallbackText}>
                The scheduler could not be loaded inline.
              </p>
              <ExternalLink
                href={CAL_URL}
                className={styles.fallbackBtn}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Open scheduler
              </ExternalLink>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
});

ScheduleMeetingModal.displayName = "ScheduleMeetingModal";
