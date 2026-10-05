# Motion system

One small controller and a handful of tokens drive every animation. No animation library.

## Primitives

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 90ms | press feedback |
| `--dur-fast` | 160ms | hover, colour changes |
| `--dur-normal` | 260ms | UI state (tabs, segmented control, details, page transition) |
| `--dur-slow` | 480ms | emphasis, settle-back (tilt, accent bars) |
| `--dur-reveal` | 720ms | content entering the viewport |
| `--dur-hero` | 900ms | the hero entrance only |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | UI state |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | reveals |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | things that move and stop (indicators) |

Defined in `src/styles/global.css`. The controller is `src/scripts/motion.ts`; its header documents the
data-attribute contract (`data-reveal`, `data-reveal-group`, `data-inview`, `data-parallax`,
`data-pointer`, `data-tilt`, `data-count`) and `onScroll()`, the single shared passive scroll/resize loop.

## Inventory

**Global**
- Scroll progress line (top of viewport), one rAF-batched listener for all scroll effects
- Native cross-document View Transitions between pages (CSS only)
- Buttons: hover lift 1px + shadow, press scale .98, visible focus
- `<details>`: animated open/close where supported (`::details-content`), rotating chevrons

**Hero**: staggered "coming online" entrance (status, word-masked name, role, statement, pitch, CTAs, photo);
live status dot pulse (only while visible); very slow ambient gradients (paused off-screen); desktop
cursor glow; subtle photo parallax; CTA sheen

**Navigation**: one sliding active-tab indicator tied to scroll-spy

**Metrics**: staggered card reveal, count-up on reveal (final value server-rendered, width reserved), accent bar draw

**Experience timeline**: heading/table/card reveals; scroll-drawn rail; nodes scale in; active role gets a
ring, accent edge and lift

**Case studies**: cinematic card reveals; desktop hover depth (2° max tilt, cursor highlight, accent border);
arrow nudges; title morphs from card to project page; diagrams reveal stage by stage with data pulses
travelling along connectors (only while on screen); node hover highlight

**Git log**: graph draws in when it first scrolls into view; HEAD pulse only while visible; sliding segmented
control; filter changes via View Transitions with fade fallback; animated expand of the full log

**Skills / Contact / Footer**: staggered reveals, hover states, underline sweeps

## Guarantees
- Hidden start states only apply under `html.motion` (set before paint when JS runs and reduced motion is off;
  removed after 2.5s if the controller never starts). No-JS and reduced-motion visitors see everything.
- `prefers-reduced-motion: reduce`: no entrance, reveals, parallax, tilt, pulses, flow or view transitions.
- Touch / coarse pointers: no tilt, parallax, cursor glow or hover-only effects.
- Animations use transform, opacity and filter; continuous effects pause when off-screen.
- Measured: CLS 0; Lighthouse 100 on all categories; home LCP 1.4s (hero entrance adds about 0.3s by design).
