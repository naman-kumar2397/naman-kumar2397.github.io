# Portfolio Flow Resume

A bespoke portfolio site that renders career work as a custom, data-driven SVG flowchart:
**Company → Project → Problem → Solution (+ tools carousel) → Impact** (shared nodes allowed).

Built with Next.js 16, TypeScript, Zod validation, and a custom SVG flow renderer — no heavy graph libraries.

## Local Development (Codespaces / local)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → Open http://localhost:3000

# Production build (static export)
npm run build
# → Output in ./out/
```

## Deploying to GitHub Pages

This is a **USER SITE** repo (`<username>.github.io`), so it deploys at `https://<username>.github.io/`.

### Option A: Deploy from `out/` via GitHub Actions (recommended)

1. Go to **Settings → Pages → Source** → select **GitHub Actions**.
2. Create `.github/workflows/deploy.yml` (see below).
3. Push to `main` — the action builds and deploys.

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Option B: Deploy `out/` to a branch

```bash
npm run build
npx gh-pages -d out -b gh-pages --dotfiles
```
Then set Pages source to the `gh-pages` branch.

## Deep-Link Routing on GitHub Pages

Since this uses `output: "export"` with `trailingSlash: true`, Next.js generates:
- `/index.html` for the home page
- `/project/<slug>/index.html` for each deep-dive project

GitHub Pages serves these directly — **no SPA fallback needed** for known routes.

For unknown routes, the generated `404.html` renders a styled 404 page.
The `?focus=<projectId>` query param on `/` is read client-side to auto-focus a project node when returning from a deep-dive page.

## Architecture

- **Data**: YAML files in `src/data/` validated at build time against Zod schemas in `src/schema/`
- **Graph Layout**: Custom layout engine in `src/lib/layout-engine.ts` — columnar L→R positioning
- **Rendering**: Pure SVG with React components — no ReactFlow, no Mermaid
- **Design**: "Operational Noir" direction — Fraunces + Spline Sans, dark graphite, deliberate motion
- **Filters**: Theme + Tool multi-select filters dim non-matching nodes (don't remove them)
- **Interaction**: Click to focus, Escape to reset, Tab for keyboard navigation, hover for highlight

## Repo Structure

```
app/                    Next.js App Router pages
  layout.tsx            Root layout (fonts + global CSS)
  page.tsx              Home page (graph canvas + filters)
  project/[id]/page.tsx Project deep-dive pages
src/
  components/           React components
    FlowCanvas.tsx      SVG flow chart renderer
    FlowEdge.tsx        Orthogonal edge with rounded corners
    Filters.tsx         Theme/tool filter sidebar
    HomeView.tsx        Home page client wrapper
    ProjectPage.tsx     Project deep-dive renderer
    nodes/              Individual SVG node components
  data/                 YAML seed data
  lib/                  Data loaders + layout engine
  schema/               Zod schemas
  styles/               Design tokens + global CSS
  content/projects/     MDX deep-dive content
docs/                   Specs (product, design, graph rendering)
public/                 Static assets (.nojekyll)
```
