"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { StarLane } from "@/components/StarLane";
import { CompanyFrame } from "@/components/CompanyFrame";
import { CompanyMiniNav } from "@/components/CompanyMiniNav";
import { ImpactInspector } from "@/components/ImpactInspector";
import { FilterDropdown } from "@/components/FilterDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { StarLayout, LaneImpact, StarLane as StarLaneData } from "@/lib/layout-engine";
import type { Catalog } from "@/lib/data-loader";
import styles from "./HomeView.module.css";

interface HomeViewProps {
  layouts: StarLayout[];
  catalog: Catalog;
}

export function HomeView({ layouts, catalog }: HomeViewProps) {
  const [activeThemes, setActiveThemes] = useState<string[]>([]);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [focusedImpactId, setFocusedImpactId] = useState<string | null>(null);
  const [hoveredLane, setHoveredLane] = useState<string | null>(null);

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
        <div className={styles.identityCard}>
          <span className={styles.name}>Naman Kumar</span>
          <div className={styles.contactRow}>
            <span className={styles.detail}>Melbourne, VIC</span>
            <span className={styles.sep}>·</span>
            <a href="tel:+61452176778" className={styles.detail}>+61 452 176 778</a>
            <span className={styles.sep}>·</span>
            <a href="mailto:namankumar2397@gmail.com" className={styles.detail}>namankumar2397@gmail.com</a>
            <span className={styles.sep}>·</span>
            <a href="https://linkedin.com/in/naman-kumar2397" target="_blank" rel="noopener noreferrer" className={styles.detail}>
              LinkedIn ↗
            </a>
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

      {/* ── Company envelopes with STAR Lanes inside ── */}
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
                    />
                  );
                })}
                </CompanyFrame>
              </section>
            );
          })
        )}
      </div>

      {/* ── Company mini-nav (floating) ── */}
      {visibleCompanies.length > 1 && <CompanyMiniNav companies={visibleCompanies} />}

      {/* ── Impact Inspector (floating) ── */}
      {focusedImpactData && (
        <ImpactInspector
          impact={focusedImpactData}
          projectTitles={inspectorProjectTitles}
          onClose={() => setFocusedImpactId(null)}
        />
      )}
    </div>
  );
}
