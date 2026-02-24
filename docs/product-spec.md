# Product Spec — Portfolio Flow Resume

## Problem
Traditional resumes bury the signal. We want an interface that:
- shows ownership and impact as narrative flows (Problem → Solution → Impact)
- makes exploration easy (filters)
- stays legible (one company per viewport, progressive disclosure)

## Target audiences
- Recruiters: quick scan + key metrics and themes
- Engineering managers: depth on problem-solving and impact
- SRE/Platform leads: tooling, architecture thinking, operational maturity

## Pages
### `/` Home
- Company selector (default: Synechron)
- Flowchart canvas (custom designed)
- Sidebar / topbar filters:
  - Company (single select)
  - Themes (multi)
  - Tools (multi)
- Focus mode:
  - Clicking a Project zooms/focuses to its mini-flow
  - Clicking an Impact highlights all Projects contributing to it

### `/project/[id]` Project deep dive
- Narrative writeup with sections:
  - Context, Constraints, Approach, Tradeoffs, Outcomes, Learnings
- Optional architecture diagram (static SVG or inline component)
- Back link to company view + auto-focus that project node

## Interaction & UX
- Hover: highlight node + connected edges
- Click: focus node (dim unrelated)
- ESC: reset focus
- Keyboard:
  - Tab cycles interactive nodes
  - Enter focuses
  - Escape resets
- Responsive:
  - Desktop: canvas + filter panel
  - Mobile: stacked “flow cards” with a mini-map toggle

## Non-goals
- No CMS/admin
- No authentication
- No blogging engine

## Performance
- Data loaded locally (YAML compiled/bundled)
- Initial render under 1s on modern devices
- Canvas is SVG-based (preferred) for crisp typography and SEO-friendly text

