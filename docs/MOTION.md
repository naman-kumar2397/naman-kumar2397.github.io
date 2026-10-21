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
- iPadOS-style pointer (`src/scripts/cursor.ts`): a dot that snaps onto small controls (up to 320x72) and
  takes their shape with a 3px magnetic pull, a text beam over text, the dot over large cards; form fields keep
  the native cursor. Fine pointer only, off with reduced motion, native cursor until the script runs
- `<details>`: animated open/close where supported (`::details-content`), rotating chevrons

**Hero**: staggered "coming online" entrance (status, word-masked name, role, statement, pitch, CTAs, photo);
portrait entrance on desktop (`src/scripts/portrait.ts`): the photo's own pixels spin as a dotted orb, fly home to
form it, the real photo fades in and a third of the pixels orbit as a ring (slows to a stop after 10 s, orbits again
on hover; decided before first paint, safety reveal at 4 s; phones, reduced motion and Save-Data get the plain fade);
live status dot pulse (only while visible); very slow ambient gradients (paused off-screen); desktop
cursor glow; subtle photo parallax; CTA sheen

**Navigation**: one sliding active-tab indicator tied to scroll-spy

**Metrics**: staggered card reveal, count-up on reveal (final value server-rendered, width reserved), accent bar draw

**Experience timeline**: heading/table/card reveals; scroll-drawn rail; nodes scale in; active role gets a
ring, accent edge and lift

**Case studies**: cinematic card reveals; desktop hover depth (2° max tilt, cursor highlight, accent border);
arrow nudges; title morphs from card to project page; diagrams reveal stage by stage with data pulses
travelling along connectors (only while on screen); node hover highlight

**Git log**: graph draws in when it first scrolls into view; thinking orbs (below) on HEAD and open branches; sliding segmented
control; filter changes via View Transitions with fade fallback; animated expand of the full log

**Skills**: the DevOps loop (`src/components/DevOpsLoop.astro`, `src/scripts/devops-loop.ts`): a pinned particle
infinity loop that always flows; scrolling the track lights one stage (brighter orbs on its arc) and its card rises out
of that stage's orb in 3D, settling inside its half (below the loop on narrow screens); clicking the card shows what I
did. Pause button (WCAG 2.2.2); pauses off screen; colours from tokens each frame (live light/dark). Without motion it
is a static list of the eight stages.

**Contact / Footer**: staggered reveals, hover states, underline sweeps.

**Journey homepage** (`/home-alternate/`, noindex alternate of the home page; `src/pages/home-alternate.astro`,
`src/components/ride/*`, content picked from `src/data` by `src/lib/ride.ts`):
- Hero: the home hero's entrance (word-masked name, staggered status, role, statement, fact chips, CTAs), the same portrait
  entrance and gate (`src/components/PortraitFx.astro` starts it on both pages), slow ambient gradients and a scroll cue line.
- Journey (`src/scripts/ride.ts`, `src/scripts/ride-field.ts`): `.live` is decided before first paint (html.motion, no
  Save-Data). Desktop: a sticky chapter rail (branch-coloured nodes, HEAD ring on the current chapter, a line that fills
  with progress) and a sticky stage beside six chapters, each a one-screen scene whose text is pinned (never hidden) while
  native scroll scrubs one shared canvas 2D particle field (1400 points, projected 3D, DPR capped at 1.5). Each chapter has
  a shape (accounts orbiting a team ring; agents converging with pulses and a timeline; two clouds merging; a sparse disc
  filling up; a log stream into a sink settling into 70 dots; a collapse into `main`), and the last 28% of a chapter morphs
  every particle, staggered on a small arc, into the next shape. Scenes trail the text by 0.14 of a chapter so a morph is
  half done as the next chapter becomes current. Phones: each chapter card gets its own small field (360 points, its scene
  only). Count-up figures count once, the first time their chapter is current (final value server-rendered, width reserved).
- Polite live region "Chapter n of 6: title" once the reader settles; J/K and up/down arrows move between chapters only
  while focus is inside the journey; rail links land on the same settled point. Pause button (WCAG 2.2.2) freezes the
  field; scrolling still scrubs it. Fields start when the journey nears the viewport and stop off screen and in hidden
  tabs. Colours come from the tokens (`--muted`, `--c-<branch>`) and are re-read on a colour scheme change.
- No JS, reduced motion or Save-Data: the same HTML as stacked chapter cards with a chapter index; no pinning, no canvas.
- Toolbox: the DevOps loop as a compact strip of disclosures (no pinning). `npm run check:layout` runs a motion-on pass
  for this page (1366 and 390, both schemes): overflow, 6 chapter headings, hero facts and resume above the fold at
  390x844, CLS < 0.05, no text overlap at any scroll position, rail matches the chapter in view, field animating.

**Thinking orbs** (`src/scripts/orbs.ts`, engine from [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs), MIT):
small dotted canvas animations tinted with the branch colour, used only for live or in-progress work: "working" on HEAD,
"composing" on open branches and the in-progress Bedrock proxy, "connecting" beside Alfred's status, "weaving" as the
Datadog node the log stream pours into. Decorative (aria-hidden), paused off screen, one static frame with reduced motion.

**Log stream** (`src/components/LogStream.astro`, three.js, observability case study only): one dot per log event at the
real migrated rates. Loads near the viewport when the browser is idle; never with reduced motion or Save-Data.

**3D architecture diagrams** (`src/components/Diagram.astro` + `src/scripts/arch3d.ts`, three.js, project pages only; the
home page stays 2D and three-free, enforced by `npm run check:bundle`): one board tilted 30° away from a fixed camera, a
lane per stage, an HTML card per component resting on the board (soft contact shadow), and flat glowing grooves for the
flow. Edges only join neighbouring stages: node to node when either side has one component (so fan-out and fan-in are
literal), otherwise through a hub between the lanes (hover never lights a component across a hub: the bundle says the
stage feeds the next stage, not which component feeds which).
- Gate: WebGL2, no reduced motion, no Save-Data, IntersectionObserver, figure at least 720px wide (re-checked on resize;
  narrower shows the list). Loads near the viewport, no sooner than 3s after load, when idle (the first frames are
  costly without a GPU). A "List view" toggle (`aria-pressed`), remembered, offered only where both views can be shown.
- No layout shift: the board's height is reserved in CSS (under `html.motion`, from the diagram's own text) before the
  engine loads; an inline script drops the reservation before first paint when the view can't run or the list was chosen.
  The list sits inside the box until the board is ready, then stays in the accessibility tree (sr-only). If the board
  would not fit, or the engine fails to load, the list stays (the box is released only while the figure is below the
  viewport).
- Motion: build-in under 1.6s (board rises, lanes left to right, cards drop by stage, grooves draw), exactly three packet
  cycles (a single component fans out to all targets at once), then rendering stops. Hover (fine pointer) lifts a card,
  brightens its grooves, dims the rest and plays one packet run; it renders only while that transition runs.
- Off screen or in a hidden tab nothing renders; the WebGL context is released on a real unload. Unlit materials only,
  pixel ratio capped at 1.5, colours read from the theme tokens.
- `?settle` skips straight to the settled board (a test hook for `npm run check:layout`, which also measures CLS with the
  board, with a stored list choice and with WebGL disabled).

## Guarantees
- Hidden start states only apply under `html.motion` (set before paint when JS runs and reduced motion is off;
  removed after 2.5s if the controller never starts). No-JS and reduced-motion visitors see everything.
- `prefers-reduced-motion: reduce`: no entrance, reveals, parallax, tilt, pulses, flow or view transitions.
- Touch / coarse pointers: no tilt, parallax, cursor glow, custom pointer or hover-only effects.
- Animations use transform, opacity and filter; continuous effects pause when off-screen.
- Measured: CLS 0; Lighthouse 100 on all categories; home LCP 1.4s (hero entrance adds about 0.3s by design).
