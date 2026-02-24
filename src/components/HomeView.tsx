"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { StarLane } from "@/components/StarLane";
import { CompanyFrame } from "@/components/CompanyFrame";
import { CompanyMiniNav } from "@/components/CompanyMiniNav";
import { ImpactInspector } from "@/components/ImpactInspector";
import { FilterDropdown } from "@/components/FilterDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeepDiveModal } from "@/components/DeepDiveModal";
import type { DeepDiveContent } from "@/components/DeepDiveModal";
import { CredentialsSection } from "@/components/CredentialsSection";
import { ExperienceHighlights } from "@/components/ExperienceHighlights";
import { ScheduleMeetingModal } from "@/components/ScheduleMeetingModal";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { profile } from "@/data/profile";
import type { StarLayout, LaneImpact, StarLane as StarLaneData } from "@/lib/layout-engine";
import type { Catalog, Certification, Education, Highlight } from "@/lib/data-loader";
import styles from "./HomeView.module.css";

/* ── Contact-tile icon lookup ── */
const CONTACT_ICONS: Record<string, React.ReactNode> = {
  phone: <Phone size={14} aria-hidden="true" />,
  email: <Mail size={14} aria-hidden="true" />,
  calendar: <Calendar size={14} aria-hidden="true" />,
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

/** A small tile that reveals its value on hover/focus/tap and copies to clipboard. */
function ContactTile({ id, label, value, href }: {
  id: string; label: string; value: string; href: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copyValue = useCallback(() => {
    const text = id === "linkedin" ? href : value;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* clipboard blocked — open link instead */ });
  }, [id, href, value]);

  const handleClick = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
    } else {
      copyValue();
    }
  }, [revealed, copyValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Reveal on hover (desktop)
  const handleMouseEnter = useCallback(() => setRevealed(true), []);

  return (
    <button
      type="button"
      className={`${styles.contactTile} ${revealed ? styles.contactTileRevealed : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onFocus={() => setRevealed(true)}
      aria-label={revealed ? `Copy ${label}` : `Reveal ${label}`}
      title={revealed ? value : `Reveal ${label}`}
    >
      <span className={styles.tileIcon}>{CONTACT_ICONS[id]}</span>
      <span className={styles.tileContent}>
        <span className={styles.tileLabel}>{copied ? "Copied!" : label}</span>
        {revealed && (
          <a
            href={href}
            target={id === "linkedin" ? "_blank" : undefined}
            rel={id === "linkedin" ? "noopener noreferrer" : undefined}
            className={styles.tileValue}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {value}
          </a>
        )}
      </span>
    </button>
  );
}

interface HomeViewProps {
  layouts: StarLayout[];
  catalog: Catalog;
  deepDiveMap: Record<string, DeepDiveContent>;
  certifications: Certification[];
  education: Education[];
  highlights: Highlight[];
}

export function HomeView({ layouts, catalog, deepDiveMap, certifications, education, highlights }: HomeViewProps) {
  const [activeThemes, setActiveThemes] = useState<string[]>([]);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [focusedImpactId, setFocusedImpactId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<string | null>(null);
  const [activeDeepDive, setActiveDeepDive] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleTriggerRef = useRef<HTMLButtonElement | null>(null);
  const deepDiveTriggerRef = useRef<HTMLElement | null>(null);

  /* URL-based project redirect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("_path");
    if (redirectPath) {
      const decoded = decodeURIComponent(redirectPath);
      const projectMatch = decoded.match(/\/project\/([^/?#]+)/);
      if (projectMatch) {
        window.location.href = `/project/${projectMatch[1]}/`;
      }
    }
  }, []);

  /* Escape to reset impact focus */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedImpactId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* Filter callbacks */
  const toggleTheme = useCallback((id: string) => {
    setActiveThemes((p) => (p.includes(id) ? p.filter((t) => t !== id) : [...p, id]));
  }, []);
  const toggleTool = useCallback((id: string) => {
    setActiveTools((p) => (p.includes(id) ? p.filter((t) => t !== id) : [...p, id]));
  }, []);
  const clearAll = useCallback(() => {
    setActiveThemes([]);
    setActiveTools([]);
    setSearch("");
  }, []);

  /* Lane hover */
  const handleLaneHover = useCallback((projectId: string | null) => {
    setHoveredLane(projectId);
  }, []);

  /* Impact focus */
  const handleImpactClick = useCallback((impactId: string) => {
    setFocusedImpactId((prev) => (prev === impactId ? null : impactId));
  }, []);

  /* Deep-dive modal open */
  const handleDeepDive = useCallback((slug: string, triggerEl?: HTMLElement) => {
    if (deepDiveMap[slug]) {
      deepDiveTriggerRef.current = triggerEl ?? null;
      setActiveDeepDive(slug);
    }
  }, [deepDiveMap]);

  const handleDeepDiveClose = useCallback(() => {
    setActiveDeepDive(null);
  }, []);

  /* Label maps for modal */
  const toolLabelMap = useMemo(
    () => new Map(catalog.tools.map((t) => [t.id, t.label])),
    [catalog],
  );
  const themeLabelMap = useMemo(
    () => new Map(catalog.themes.map((t) => [t.id, t.label])),
    [catalog],
  );

  /* Aggregate all lanes across layouts (for filter dropdowns) */
  const allLanes = useMemo(() => layouts.flatMap((l) => l.lanes), [layouts]);

  /* Resolve catalog items across all companies */
  const relevantThemes = useMemo(() => {
    const ids = new Set(allLanes.flatMap((l) => l.themes));
    return catalog.themes.filter((t) => ids.has(t.id));
  }, [allLanes, catalog]);

  const relevantTools = useMemo(() => {
    const ids = new Set(allLanes.flatMap((l) => l.tools));
    return catalog.tools.filter((t) => ids.has(t.id));
  }, [allLanes, catalog]);

  const toolMap = useMemo(
    () => new Map(catalog.tools.map((t) => [t.id, t])),
    [catalog]
  );

  /* Pre-compute stable tools arrays per lane (for memoization) */
  const laneToolsMap = useMemo(() => {
    const map = new Map<string, { id: string; label: string; category: string }[]>();
    for (const lane of allLanes) {
      const laneTools = lane.tools
        .map((tid) => toolMap.get(tid))
        .filter(Boolean) as { id: string; label: string; category: string }[];
      map.set(lane.projectId, laneTools);
    }
    return map;
  }, [allLanes, toolMap]);

  const activeCount = activeThemes.length + activeTools.length + (search ? 1 : 0);

  /* Combined impact-project map across all layouts */
  const combinedImpactProjectMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const layout of layouts) {
      for (const [impactId, projectIds] of Object.entries(layout.impactProjectMap)) {
        if (!map[impactId]) map[impactId] = [];
        map[impactId].push(...projectIds);
      }
    }
    return map;
  }, [layouts]);

  /* Combined all impacts across layouts */
  const allImpacts = useMemo(() => layouts.flatMap((l) => l.allImpacts), [layouts]);

  /* Impact focus set */
  const projectsForFocusedImpact = focusedImpactId
    ? new Set(combinedImpactProjectMap[focusedImpactId] || [])
    : null;

  /* Filter function (reused per company) */
  const filterLane = useCallback(
    (lane: StarLaneData): boolean => {
      // Theme filter
      if (activeThemes.length > 0 && !lane.themes.some((t) => activeThemes.includes(t))) {
        return false;
      }
      // Tool filter
      if (activeTools.length > 0 && !lane.tools.some((t) => activeTools.includes(t))) {
        return false;
      }
      // Search filter
      const lc = search.toLowerCase().trim();
      if (lc) {
        const laneToolLabels = lane.tools
          .map((tid) => toolMap.get(tid)?.label || "")
          .join(" ")
          .toLowerCase();
        const impactLabels = lane.impacts.map((i) => i.label).join(" ").toLowerCase();
        const haystack = [
          lane.projectTitle,
          lane.problemText,
          lane.solutionText,
          impactLabels,
          laneToolLabels,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(lc)) return false;
      }
      return true;
    },
    [activeThemes, activeTools, search, toolMap]
  );

  /* Filter lanes per layout (preserves structure) */
  const filteredLayoutsData = useMemo(() => {
    return layouts.map((layout) => ({
      layout,
      filteredLanes: layout.lanes.filter(filterLane),
    }));
  }, [layouts, filterLane]);

  /* Impact data for inspector */
  const focusedImpactData: LaneImpact | null = useMemo(() => {
    if (!focusedImpactId) return null;
    const imp = allImpacts.find((i) => i.id === focusedImpactId);
    if (!imp) return null;
    return { id: imp.id, label: imp.label, type: imp.type as LaneImpact["type"], metrics: imp.metrics };
  }, [focusedImpactId, allImpacts]);

  const inspectorProjectTitles = useMemo(() => {
    if (!focusedImpactId) return [];
    const pids = combinedImpactProjectMap[focusedImpactId] || [];
    return pids
      .map((pid) => allLanes.find((l) => l.projectId === pid)?.projectTitle)
      .filter(Boolean) as string[];
  }, [focusedImpactId, combinedImpactProjectMap, allLanes]);

  /* Check if all companies have zero matches */
  const totalFilteredCount = filteredLayoutsData.reduce((sum, d) => sum + d.filteredLanes.length, 0);

  /* Visible companies for nav (only those with matching lanes) */
  const visibleCompanies = useMemo(() => {
    return filteredLayoutsData
      .filter((d) => d.filteredLanes.length > 0)
      .map((d) => ({ id: d.layout.companyId, label: d.layout.companyLabel }));
  }, [filteredLayoutsData]);

  return (
    <div className={styles.page}>
      {/* ── Top bar: identity left, controls right ── */}
      <div className={styles.topBar}>
        {/* Identity card */}
        <div id="identity-card" className={styles.identityCard}>
          <div className={styles.identityRow}>
            {/* Avatar */}
            <div className={styles.avatar} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.photo}
                alt=""
                className={styles.avatarImg}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <span className={styles.avatarFallback}>{profile.initials}</span>
            </div>
            <div className={styles.identityText}>
              <span className={styles.name}>{profile.name}</span>
              <span className={styles.role}>{profile.title}</span>
              <span className={styles.location}>
                <MapPin size={12} aria-hidden="true" />
                {profile.location}
              </span>
            </div>
          </div>

          {/* Contact tiles */}
          <div className={styles.contactTiles}>
            {profile.contacts.map((c) =>
              c.id === "calendar" ? (
                <button
                  key={c.id}
                  ref={scheduleTriggerRef}
                  type="button"
                  className={`${styles.contactTile} ${styles.contactTileLink}`}
                  aria-label={c.label}
                  onClick={() => setScheduleOpen(true)}
                >
                  <span className={styles.tileIcon}>{CONTACT_ICONS[c.id]}</span>
                  <span className={styles.tileContent}>
                    <span className={styles.tileLabel}>{c.label}</span>
                  </span>
                </button>
              ) : (
                <ContactTile key={c.id} id={c.id} label={c.label} value={c.value} href={c.href} />
              )
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <ThemeToggle />
          <FilterDropdown
            themes={relevantThemes}
            tools={relevantTools}
            activeThemes={activeThemes}
            activeTools={activeTools}
            search={search}
            onSearch={setSearch}
            onToggleTheme={toggleTheme}
            onToggleTool={toggleTool}
            onClear={clearAll}
            activeCount={activeCount}
          />
          <a className={styles.downloadBtn} href="/resume.pdf" download title="Download Resume PDF">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v8m0 0L4 6.5M7 9l3-2.5M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Resume
          </a>
        </div>
      </div>

      {/* ── Work Experience section ── */}
      <section id="experience" className={styles.experienceSection}>
        <h2 className={`${styles.sectionHeading} ${styles.stickyHeading}`}>Work Experience</h2>

        {/* Experience highlights strip */}
        <ExperienceHighlights highlights={highlights} />

        <div className={styles.companyStack}>
        {totalFilteredCount === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No matching projects</p>
            <button className={styles.emptyReset} onClick={clearAll}>
              Clear filters
            </button>
          </div>
        ) : (
          filteredLayoutsData.map(({ layout, filteredLanes }) => {
            // Skip companies with no matching lanes
            if (filteredLanes.length === 0) return null;

            return (
              <section
                key={layout.companyId}
                id={`company-${layout.companyId}`}
                className={styles.companySection}
              >
                <CompanyFrame
                  companyName={layout.companyLabel}
                  role={layout.companyRole}
                  period={layout.companyPeriod}
                >
                {filteredLanes.map((lane, i) => {
                  // Use pre-computed stable tools array
                  const laneTools = laneToolsMap.get(lane.projectId) ?? [];

                  // Dim if impact is focused and this lane doesn't have it
                  const isDimmedByImpact =
                    projectsForFocusedImpact !== null && !projectsForFocusedImpact.has(lane.projectId);

                  // Light dim if another lane is hovered
                  const isLightDimmed =
                    hoveredLane !== null && hoveredLane !== lane.projectId && !isDimmedByImpact;

                  const isImpactHighlighted =
                    projectsForFocusedImpact !== null && projectsForFocusedImpact.has(lane.projectId);

                  return (
                    <StarLane
                      key={lane.projectId}
                      lane={lane}
                      tools={laneTools}
                      isHovered={hoveredLane === lane.projectId}
                      isDimmed={isDimmedByImpact}
                      isLightDimmed={isLightDimmed}
                      isImpactHighlighted={isImpactHighlighted}
                      highlightedImpactId={focusedImpactId}
                      delay={i * 0.06}
                      onHover={handleLaneHover}
                      onImpactClick={handleImpactClick}
                      onDeepDive={lane.deepDiveSlug ? handleDeepDive : undefined}
                    />
                  );
                })}
                </CompanyFrame>
              </section>
            );
          })
        )}
        </div>
      </section>

      {/* ── Certifications & Education ── */}
      <CredentialsSection certifications={certifications} education={education} />

      {/* ── Footer ── */}
      <Footer onOpenSchedule={() => setScheduleOpen(true)} />

      {/* ── Schedule meeting modal (single instance) ── */}
      <ScheduleMeetingModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        triggerRef={scheduleTriggerRef}
      />

      {/* ── Hamburger menu (floating) ── */}
      <CompanyMiniNav
        companies={visibleCompanies}
        sections={[
          { id: "experience", label: "Work Experience" },
          ...(highlights.length > 0 ? [{ id: "highlights", label: "Highlights", nested: true }] : []),
          ...(certifications.length > 0 ? [{ id: "certifications", label: "Certifications" }] : []),
          ...(education.length > 0 ? [{ id: "education", label: "Education" }] : []),
        ]}
      />

      {/* ── Impact Inspector (floating) ── */}
      {focusedImpactData && (
        <ImpactInspector
          impact={focusedImpactData}
          projectTitles={inspectorProjectTitles}
          onClose={() => setFocusedImpactId(null)}
        />
      )}

      {/* ── Deep-dive modal ── */}
      {activeDeepDive && deepDiveMap[activeDeepDive] && (
        <DeepDiveModal
          content={deepDiveMap[activeDeepDive]}
          toolLabels={toolLabelMap}
          themeLabels={themeLabelMap}
          onClose={handleDeepDiveClose}
          triggerRef={deepDiveTriggerRef}
        />
      )}
    </div>
  );
}
