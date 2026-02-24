"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import styles from "./CalEmbed.module.css";

const CAL_LINK = "naman-kumar-6s44m9";
const CAL_URL = `https://cal.com/${CAL_LINK}`;

type EmbedState = "idle" | "loading" | "ready" | "error";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type AnyComponent = React.ComponentType<any>;

/**
 * Lazy-loaded Cal.com scheduling embed.
 *
 * Strategy:
 * 1. Wait until section scrolls into view (IntersectionObserver).
 * 2. Attempt Cal.com inline embed via @calcom/embed-react.
 * 3. If embed fails, fall back to an iframe.
 * 4. If iframe is also blocked (CSP / load error), show a CTA card.
 */
export const CalEmbed = memo(function CalEmbed() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [embedState, setEmbedState] = useState<EmbedState>("idle");
  const [CalInline, setCalInline] = useState<AnyComponent | null>(null);

  /* ── Lazy trigger: mount embed only when section is in viewport ── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: prefersReduced ? "0px" : "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Load Cal embed component dynamically once visible ── */
  useEffect(() => {
    if (!visible || embedState !== "idle") return;
    setEmbedState("loading");

    import("@calcom/embed-react")
      .then((mod) => {
        const Comp = mod.default;
        if (Comp) {
          setCalInline(() => Comp as AnyComponent);
          setEmbedState("ready");
        } else {
          setEmbedState("error");
        }
      })
      .catch(() => {
        setEmbedState("error");
      });
  }, [visible, embedState]);

  return (
    <div ref={sentinelRef} className={styles.wrapper}>
      {!visible && (
        <div className={styles.placeholder} aria-hidden="true">
          <span className={styles.placeholderText}>Loading scheduler…</span>
        </div>
      )}

      {visible && embedState === "loading" && (
        <div className={styles.placeholder}>
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.placeholderText}>Loading scheduler…</span>
        </div>
      )}

      {visible && embedState === "ready" && CalInline && (
        <div className={styles.embedContainer}>
          <CalInline
            calLink={CAL_LINK}
            style={{ width: "100%", height: "100%", overflow: "auto" }}
            config={{
              layout: "month_view",
              theme: "auto",
            }}
          />
        </div>
      )}

      {visible && embedState === "error" && (
        <IframeFallback />
      )}
    </div>
  );
});

CalEmbed.displayName = "CalEmbed";

/* ── Iframe fallback ── */
function IframeFallback() {
  const [iframeOk, setIframeOk] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // If iframe doesn't fire load within 8s, assume blocked
    timerRef.current = setTimeout(() => setIframeOk(false), 8000);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!iframeOk) return <FallbackCard />;

  return (
    <div className={styles.embedContainer}>
      <iframe
        src={CAL_URL}
        title="Schedule a meeting with Naman Kumar"
        className={styles.iframe}
        loading="lazy"
        allow="payment"
        onLoad={() => clearTimeout(timerRef.current)}
        onError={() => setIframeOk(false)}
      />
    </div>
  );
}

/* ── Static fallback card ── */
function FallbackCard() {
  return (
    <div className={styles.fallbackCard}>
      <p className={styles.fallbackText}>
        The scheduler could not be loaded inline.
      </p>
      <ExternalLink
        href={CAL_URL}
        className={styles.fallbackBtn}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Open scheduler
      </ExternalLink>
    </div>
  );
}
