"use client";

import React from "react";
import Link from "next/link";
import type { Catalog } from "@/lib/data-loader";
import styles from "./ProjectPage.module.css";

interface ProjectPageProps {
  slug: string;
  title: string;
  content: string;
  companyId: string;
  themes: string[];
  tools: string[];
  catalog: Catalog;
}

export function ProjectPage({
  slug,
  title,
  content,
  companyId,
  themes,
  tools,
  catalog,
}: ProjectPageProps) {
  const toolMap = new Map(catalog.tools.map((t) => [t.id, t]));
  const themeMap = new Map(catalog.themes.map((t) => [t.id, t]));

  // Simple MDX-to-HTML: parse headings + paragraphs
  const sections = parseMDXContent(content);

  return (
    <article className={styles.article}>
      <nav className={styles.backNav}>
        <Link
          href={`/?focus=${slug}`}
          className={styles.backLink}
        >
          ← Back to Company View
        </Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.meta}>
          {themes.length > 0 && (
            <div className={styles.tags}>
              {themes.map((tid) => {
                const theme = themeMap.get(tid);
                return (
                  <span key={tid} className={styles.themeTag}>
                    {theme?.label || tid}
                  </span>
                );
              })}
            </div>
          )}
          {tools.length > 0 && (
            <div className={styles.tags}>
              {tools.map((tid) => {
                const tool = toolMap.get(tid);
                return (
                  <span key={tid} className={styles.toolTag}>
                    {tool?.label || tid}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className={styles.content}>
        {sections.map((section, i) => (
          <section key={i} className={styles.section}>
            {section.heading && (
              <h2 className={styles.sectionHeading}>{section.heading}</h2>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className={styles.paragraph}>
                {p}
              </p>
            ))}
            {section.listItems.length > 0 && (
              <ul className={styles.list}>
                {section.listItems.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

interface ContentSection {
  heading: string | null;
  paragraphs: string[];
  listItems: string[];
}

function parseMDXContent(content: string): ContentSection[] {
  const lines = content.split("\n");
  const sections: ContentSection[] = [];
  let current: ContentSection = { heading: null, paragraphs: [], listItems: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      if (current.heading || current.paragraphs.length > 0 || current.listItems.length > 0) {
        sections.push(current);
      }
      current = {
        heading: trimmed.replace(/^##\s+/, ""),
        paragraphs: [],
        listItems: [],
      };
    } else if (trimmed.startsWith("- ")) {
      current.listItems.push(trimmed.replace(/^-\s+/, ""));
    } else {
      current.paragraphs.push(trimmed);
    }
  }

  if (current.heading || current.paragraphs.length > 0 || current.listItems.length > 0) {
    sections.push(current);
  }

  return sections;
}
