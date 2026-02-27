"use client";

import React from "react";
import styles from "./GlassSurface.module.css";

type GlassTone = "glass-0" | "glass-1" | "glass-2" | "glass-3";

interface GlassSurfaceProps {
  tone: GlassTone;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  noSpecular?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}

const toneMap: Record<GlassTone, string> = {
  "glass-0": styles.glass0,
  "glass-1": styles.glass1,
  "glass-2": styles.glass2,
  "glass-3": styles.glass3,
};

export function GlassSurface({
  tone,
  as: Tag = "div",
  className,
  noSpecular = false,
  children,
  ...rest
}: GlassSurfaceProps) {
  const cls = [
    styles.surface,
    toneMap[tone],
    noSpecular ? styles.noSpecular : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
