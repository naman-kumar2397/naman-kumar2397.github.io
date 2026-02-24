"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    // Handle SPA fallback: if we got here via a direct URL that should be
    // handled by Next.js routing, try to redirect
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("_path");
    if (redirectPath) {
      const decoded = decodeURIComponent(redirectPath);
      window.location.replace(decoded);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        fontFamily: "var(--font-body)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-4)",
          color: "var(--ink)",
          margin: 0,
        }}
      >
        404
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "var(--fs-1)" }}>
        Page not found
      </p>
      <Link
        href="/"
        style={{
          color: "var(--signal)",
          borderBottom: "1px solid var(--signal)",
          fontSize: "var(--fs-1)",
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
