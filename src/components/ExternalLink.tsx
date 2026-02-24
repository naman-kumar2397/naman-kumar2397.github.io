import React from "react";

type ExternalLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "target" | "rel"
> & {
  children: React.ReactNode;
};

/**
 * A drop-in `<a>` replacement for external links.
 *
 * Automatically applies `target="_blank"` and `rel="noopener noreferrer"`
 * so every external link is safe by default — no need to remember the attrs.
 *
 * Usage:
 * ```tsx
 * <ExternalLink href="https://example.com">Visit</ExternalLink>
 * ```
 */
export function ExternalLink({ children, ...props }: ExternalLinkProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
