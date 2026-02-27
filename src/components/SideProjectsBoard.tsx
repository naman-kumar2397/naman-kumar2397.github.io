"use client";

import React, { useCallback, useRef, useState } from "react";
import { DeepDiveModal } from "./DeepDiveModal";
import styles from "./SideProjectsBoard.module.css";
import {
  KANBAN_COLUMNS,
  SIDE_PROJECTS,
  type KanbanStatus,
  type SideProject,
} from "@/data/side-projects";

// Build per-column project lists once (module scope — stable reference)
const COLUMNS_DATA = KANBAN_COLUMNS.map((col) => ({
  ...col,
  projects: SIDE_PROJECTS.filter((p) => p.status === col.id),
}));

export default function SideProjectsBoard() {
  const [activeProject, setActiveProject] = useState<SideProject | null>(null);
  // Map from project id → ref so the modal can restore focus on close
  const triggerRefs = useRef<Map<string, React.RefObject<HTMLElement | null>>>(
    new Map()
  );

  function getTriggerRef(id: string): React.RefObject<HTMLElement | null> {
    if (!triggerRefs.current.has(id)) {
      triggerRefs.current.set(id, React.createRef<HTMLElement | null>());
    }
    return triggerRefs.current.get(id)!;
  }

  const handleOpen = useCallback((project: SideProject) => {
    setActiveProject(project);
  }, []);

  const handleClose = useCallback(() => {
    setActiveProject(null);
  }, []);

  return (
    <section className={styles.section} aria-label="AI Side Projects">
      <h2 className={styles.heading}>AI Projects (Naman after 5PM)</h2>
      <p className={styles.subheading}>
        Side experiments, tooling, and half-baked ideas — shipped, shipping, and
        still living in a notes file.
      </p>

      <div className={styles.board} role="list" aria-label="Project kanban board">
        {COLUMNS_DATA.map((col) => (
          <div
            key={col.id}
            className={styles.column}
            data-status={col.id}
            role="listitem"
            aria-label={`${col.label} column, ${col.projects.length} project${col.projects.length !== 1 ? "s" : ""}`}
          >
            {/* Column header */}
            <div className={styles.columnHeader} aria-hidden="true">
              <span className={styles.columnDot} />
              <span className={styles.columnLabel}>{col.label}</span>
              <span className={styles.columnCount}>{col.projects.length}</span>
            </div>

            {/* Cards */}
            {col.projects.map((project) => {
              const ref = getTriggerRef(project.id);
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  triggerRef={ref}
                  onOpen={handleOpen}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Deep-dive modal */}
      {activeProject && (
        <DeepDiveModal
          content={activeProject.deepDive}
          toolLabels={
            new Map(activeProject.stack.map((t) => [t, t]))
          }
          themeLabels={
            new Map(activeProject.deepDive.themes.map((th) => [th, th]))
          }
          onClose={handleClose}
          triggerRef={triggerRefs.current.get(activeProject.id)}
        />
      )}
    </section>
  );
}

/* ── Card sub-component ───────────────────────────────────────────────── */
interface ProjectCardProps {
  project: SideProject;
  triggerRef: React.RefObject<HTMLElement | null>;
  onOpen: (project: SideProject) => void;
}

function ProjectCard({ project, triggerRef, onOpen }: ProjectCardProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen(project);
      }
    },
    [project, onOpen]
  );

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      className={styles.card}
      onClick={() => onOpen(project)}
      onKeyDown={handleKeyDown}
      aria-label={`${project.title}: ${project.tagline}. Press Enter to read more.`}
      type="button"
    >
      <p className={styles.cardTitle}>{project.title}</p>
      <p className={styles.cardTagline}>{project.tagline}</p>
      <ul className={styles.cardTags} aria-label="Tech stack">
        {project.stack.slice(0, 3).map((tag) => (
          <li key={tag} className={styles.cardTag}>
            {tag}
          </li>
        ))}
        {project.stack.length > 3 && (
          <li className={styles.cardTag}>+{project.stack.length - 3}</li>
        )}
      </ul>
      <span className={styles.cardCta} aria-hidden="true">
        deep dive →
      </span>
    </button>
  );
}
