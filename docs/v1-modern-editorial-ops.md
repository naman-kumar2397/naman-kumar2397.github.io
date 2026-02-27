# Version 1 — Modern Editorial Ops

## Visual Direction Summary (What Changes & Why)

1. **Replace Roboto with DM Sans** — Roboto is ubiquitous/generic; DM Sans is geometric but distinctive, with optical sizing that reads cleanly at all scales. Matches "editorial-tech" tone.
2. **Add JetBrains Mono for data/metrics** — Metric chips, impact numbers, and tool pills gain engineering credibility with a monospace typeface. Keeps the "ops console" flavor without theme change.
3. **Refine accent from #ffcc33 → #f0b429 (night) / #c48a08 (day)** — Slightly warmer, less saturated gold. Passes WCAG AA on dark backgrounds; feels premium vs. "caution tape" yellow.
4. **Soften border-radius from 10/16/22 → 8/12/16** — Flatter, more disciplined radii. Modern 2026 trend is tighter curves, not pillow shapes.
5. **Tighten card borders: 1px → hairline with opacity** — Reduce visual noise. Cards defined by surface + shadow, not heavy strokes.
6. **Replace gradient-glow hover with clean lift + accent stroke** — The current `laneHovered::after` mask-composite gradient is flashy but distracting. Replace with a 1px accent border + `translateY(-1px)` + slightly deeper shadow. Confident, not showy.
7. **Introduce 3-tier elevation system** — `surface-0` (flush), `surface-1` (cards), `surface-2` (popovers/modals). Consistent depth hierarchy instead of per-component shadow guessing.
8. **Reduce animation durations 20–30%** — `0.45s → 0.32s` for lane reveal, `0.35s → 0.25s` for step reveal. Faster = more responsive feel. Keep stagger delays.
9. **Standardize motion easing to `cubic-bezier(0.16, 1, 0.3, 1)`** — A spring-like decel curve used by Linear/Vercel. Replaces generic `ease-out`.
10. **All-caps labels: tighter letter-spacing `0.04em`** — Current `0.8px` on 10px labels is loose. Tighter tracking reads more confident.
11. **Improve focus-visible ring: 2px solid var(--signal), 2px offset** — Consistent across every interactive element. Currently inconsistent (some have it, some don't).
12. **Reduce particle density 30%, lower opacity cap to 0.12** — Background should recede further. Content contrast improves.

---

## Tokens

### Color Roles (Night / Day)

| Token | Night | Day | Role |
|---|---|---|---|
| `--bg` | `#0c0e12` | `#f4f5f7` | Page canvas |
| `--surface-1` | `rgba(17, 20, 27, 0.82)` | `rgba(255, 255, 255, 0.78)` | Cards/panels |
| `--surface-2` | `rgba(22, 26, 35, 0.92)` | `rgba(255, 255, 255, 0.92)` | Popovers/modals |
| `--surface-solid` | `#11141b` | `#ffffff` | Non-transparent surfaces |
| `--ink` | `#e8ecf4` | `#1b1e25` | Primary text |
| `--muted` | `rgba(232, 236, 244, 0.68)` | `rgba(27, 30, 37, 0.65)` | Secondary text |
| `--faint` | `rgba(232, 236, 244, 0.32)` | `rgba(27, 30, 37, 0.36)` | Tertiary text/borders |
| `--signal` | `#f0b429` | `#c48a08` | Primary accent (warm amber) |
| `--signal-2` | `#6ee7b7` | `#059669` | Secondary accent (mint/green) |
| `--danger` | `#f87171` | `#dc2626` | Problem/error |
| `--stroke` | `rgba(232, 236, 244, 0.09)` | `rgba(27, 30, 37, 0.08)` | Hairline borders |
| `--stroke-strong` | `rgba(232, 236, 244, 0.18)` | `rgba(27, 30, 37, 0.15)` | Emphasis borders |

### Typography Scale

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `"Fraunces", serif` | H1/H2, section headings, name |
| `--font-body` | `"DM Sans", sans-serif` | Body, labels, UI chrome |
| `--font-mono` | `"JetBrains Mono", monospace` | Metrics, tool pills, data values |
| `--fs-00` | `0.75rem` (12px) | Caption, chip text |
| `--fs-0` | `0.875rem` (14px) | Body small, labels |
| `--fs-1` | `1rem` (16px) | Body default |
| `--fs-2` | `1.25rem` (20px) | H3, card titles |
| `--fs-3` | `1.75rem` (28px) | H2, company names |
| `--fs-4` | `2.5rem` (40px) | H1, hero display |
| `--lh-tight` | `1.2` | Headings |
| `--lh-body` | `1.55` | Paragraphs |
| `--lh-ui` | `1.35` | Labels, pills |
| `--ls-caps` | `0.04em` | All-caps labels |

### Spacing

| Token | Value |
|---|---|
| `--s-1` | `4px` |
| `--s-2` | `8px` |
| `--s-3` | `12px` |
| `--s-4` | `16px` |
| `--s-5` | `24px` |
| `--s-6` | `32px` |
| `--s-7` | `48px` |
| `--s-8` | `64px` |

### Radius

| Token | Old | New | Usage |
|---|---|---|---|
| `--r-1` | `10px` | `8px` | Small pills, tool chips |
| `--r-2` | `16px` | `12px` | Cards, panels |
| `--r-3` | `22px` | `16px` | Large containers |

### Shadows (3-tier)

| Token | Night | Day |
|---|---|---|
| `--shadow-1` | `0 1px 3px rgba(0,0,0,0.24), 0 4px 12px rgba(0,0,0,0.16)` | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)` |
| `--shadow-2` | `0 4px 16px rgba(0,0,0,0.32), 0 12px 40px rgba(0,0,0,0.24)` | `0 4px 16px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.08)` |
| `--shadow-float` | `0 8px 30px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.3)` | `0 8px 30px rgba(0,0,0,0.08), 0 20px 60px rgba(0,0,0,0.1)` |

### Motion

| Token | Value | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary deceleration |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Symmetric transitions |
| `--duration-fast` | `0.15s` | Micro-interactions (hover, toggle) |
| `--duration-md` | `0.25s` | Card reveals, step animations |
| `--duration-slow` | `0.4s` | Page transitions, modals |

---

## Layout

### Desktop (≥ 1024px)
- Max-width: 1440px, centered
- Page padding: `clamp(16px, 3vw, 40px)` horizontal
- Top bar: flex row, identity left, controls right
- Company stack: vertical, `32–40px` gap
- Star lane 3-col grid: `1fr 36px 1fr 36px 1fr`

### Tablet (641–1023px)
- Page padding: `clamp(12px, 2.5vw, 24px)` horizontal
- Top bar: still row, wraps naturally
- Star lane: vertical stack (cards stacked, arrows become vertical connectors)
- Company frame padding tightened

### Mobile (≤ 640px)
- Top bar: column layout (identity full-width, controls below right-aligned)
- Contact tiles: 2-column grid
- Company frame: minimal padding
- Star lanes: full-width vertical cards
- Filter panel: near full-width dropdown
- Impact badges: full-width

---

## Components

### Top Identity Area
- **Card**: `surface-1` bg, `--stroke` border (hairline), `--r-2` radius, `--shadow-1`
- **Avatar**: 48px circle, gradient ring removed → solid `signal` ring 2px
- **Name**: Fraunces 700, `--fs-2`, `--ink`
- **Role**: DM Sans 400, 13px, `--muted`
- **Location**: DM Sans 400, 12px, `--faint`
- **Contact tiles**: DM Sans 500, 12px, `--r-1` radius, `--stroke` border → on hover: `--signal` border + subtle bg tint

### Filters
- **Trigger**: DM Sans 500, 12px, `--r-1` radius, `--stroke` border
- **Panel**: `surface-2` bg, `--shadow-float`, `--r-2` radius
- **Chips**: DM Sans 400, 12px, pill shape (`--r-1`), `--stroke` border → active: `--signal` bg
- **Search input**: DM Sans 400, `--fs-00`, `--stroke` border, focus: `--signal` ring

### Company Frame
- **Frame**: `surface-1` bg, `--stroke` border, `--r-3` radius, `--shadow-1`
- **Header**: Fraunces 700 for name, DM Sans for role/period, baseline alignment
- **Bottom border**: `--stroke` separator

### Star Lane (Project Cards)
- **Lane container**: `surface-1` bg, `--stroke` border, `--r-2` radius
- **Hover**: border → `--signal` at 40% opacity, `translateY(-1px)`, `--shadow-2`. No gradient glow.
- **Problem card**: Left border 2px `--danger`, surface-1 bg
- **Solution card**: Left border 2px `--signal-2`, surface-1 bg
- **Result card**: Left border 2px `#7eb8ff`, surface-1 bg
- **Card labels**: DM Sans 600, 10px, `letter-spacing: 0.04em`, uppercase
- **Card text**: DM Sans 400, 12px, `--muted`, `line-height: 1.5`
- **Tool pills**: JetBrains Mono 500, 10px, `--signal-2` tint, `--r-1` radius

### Impact Badges
- **Badge**: `surface-1` bg, `--stroke` border, `14px` radius
- **Dot**: 7px circle, impact color
- **Type label**: DM Sans 600, 9px, uppercase, `0.04em` tracking
- **Impact label**: DM Sans 400, 11px, `--muted`
- **Metric chips**: JetBrains Mono 400, 9px, subtle border, `--r-1` radius
- **Glow state**: impact-color border, `0 0 8px` shadow (softer than current 12px)

### Deep-Dive Modal
- **Backdrop**: `rgba(0,0,0,0.5)` + backdrop-filter blur(8px)
- **Dialog**: full-screen, `--bg` background
- **Title**: Fraunces 700, `clamp(24px, 3.5vw, 40px)`, `--ink`
- **Sections**: Fraunces 700, `clamp(18px, 2.2vw, 20px)`
- **Body text**: DM Sans 400, `--fs-1`, `line-height: 1.75`, `--muted`
- **Close button**: 36px square, `surface-2` bg, `--r-1` radius

### Footer
- **Border**: `--stroke` at 30% opacity
- **Name**: Fraunces 600, 15px
- **Title**: DM Sans 400, 12px, `--faint`
- **Link tiles**: Same as header contact tiles (consistent language)
- **Resume tile**: `--signal` border pulse (keep but soften amplitude)

---

## Interaction States

| Component | Rest | Hover | Focus | Active | Selected | Dimmed |
|---|---|---|---|---|---|---|
| Contact tile | `--stroke` border | `--signal` 40% border + 4% bg tint | 2px `--signal` ring, 2px offset | scale(0.98) | N/A | N/A |
| Star lane | `--stroke` border | `--signal` 40% border + Y-1px + `--shadow-2` | 2px `--signal` ring, 2px offset | — | highlighted border | opacity 0.2 / 0.6 |
| Impact badge | `--stroke` border | impact-color border | 2px ring, 2px offset | scale(0.97) | glow + bg tint | — |
| Filter chip | `--stroke` border | `--signal` border | ring | — | `--signal` bg | — |
| Tool chip (solution) | `--stroke` dashed | `--signal-2` border | ring | — | `--signal-2` bg | — |
| Download btn | `--signal` 25% border + pulse | `--signal` solid border + glow | ring | — | — | — |
| Deep-dive btn | `--signal` 30% border | `--signal` solid border | ring | — | — | — |
| Close btn (modal) | `--stroke` border | `--signal` border + `--ink` color | ring | — | — | — |

---

## Accessibility

- **Contrast**: All text meets WCAG AA (4.5:1 normal, 3:1 large). `--muted` on `--bg` verified at ≥ 4.6:1 (night), ≥ 4.8:1 (day).
- **Focus rings**: Every interactive element has `outline: 2px solid var(--signal); outline-offset: 2px` on `:focus-visible`.
- **Keyboard**: All flow interactions (lane navigation, impact click, filter chips, modal open/close) reachable via Tab/Enter/Escape.
- **Motion**: `prefers-reduced-motion: reduce` disables all keyframe animations, transitions limited to opacity only.
- **Screen readers**: All decorative elements have `aria-hidden="true"`. Lanes have `role="row"` and `aria-label`. Modals have `role="dialog"` and `aria-modal`.
- **Color not sole indicator**: Impact types use color + text label + dot indicator (triple encoding).

---

## Implementation Steps

### Quick Wins (Day 1) — tokens + CSS-only, zero TSX changes

1. **Update `tokens.css`**: New color palette, radii, shadows, motion easing, `--font-mono` variable
2. **Update `layout.tsx`**: Load DM Sans + JetBrains Mono via next/font
3. **Update `global.css`**: Apply motion tokens, tighten link underline, selection color
4. **Update `animations.css`**: Faster durations, new easing

### Medium (Days 2–3) — CSS module patches

5. **`HomeView.module.css`**: Refine identity card, contact tiles, section headings
6. **`CompanyFrame.module.css`**: Tighter header, softer frame
7. **`StarLane.module.css`**: Replace gradient hover, refine cards, tool pills use mono font
8. **`FilterDropdown.module.css`**: Panel shadow, chip refinement
9. **`ImpactInspector.module.css`**: Shadow + radius update
10. **`Footer.module.css`**: Consistent tile styling, softer pulse

### Polish (Days 4–7)

11. **`DeepDiveModal.module.css`**: Typography spacing, impact snapshot refinement
12. **`ExperienceHighlights.module.css`**: Chip → mono font, tighter strip
13. **`ParticleBackground.tsx`**: Reduce count by 30%, lower opacity cap
14. **`CompanyMiniNav.module.css`**: Match new panel aesthetic
15. **Cross-browser QA**: Test `color-mix()`, `backdrop-filter`, `mask-composite`
16. **Lighthouse audit**: Ensure no CLS regressions from font swap
