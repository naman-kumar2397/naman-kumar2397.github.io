# naman-kumar2397.github.io

Personal site: a career told as `git log --graph`. Astro + TypeScript, static output, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Editing content

All content is typed data; components only render it. Every claim must be traceable to the resume.

- `src/data/profile.ts`: hero copy, impact metrics, experience (`top: true` marks the 3 to 5 headline points per role), skills and the full resume used by the PDF.
- `src/data/caseStudies.ts`: flagship case studies. Sections without source material stay empty (`TODO`) and are not rendered.
- `src/data/journey.ts`: the git log. Branches and commits, oldest first. Lanes, spans, Open/Merged state and HEAD are computed in `src/lib/layout.ts`. `milestone: true` puts a commit in the curated Highlights view; `tag` marks awards and certifications. Blank dates are unknown and marked `TODO`.

After changing resume or headline content, regenerate the committed assets:

```sh
npm run assets   # builds, then renders /resume -> public/resume.pdf and /og -> public/og.png (needs Chromium; set CHROMIUM_PATH)
```

## Page structure

Overview (hero + metrics) · Experience · Projects (case studies) · Journey (git log with Highlights/Full history and filters) · Skills · Contact. Everything renders without JavaScript; JS adds the graph, the curated view and filters.

Motion: see [docs/MOTION.md](docs/MOTION.md) for the motion tokens, controller contract and inventory.

## Commands

```sh
npm install
npm run dev       # http://localhost:4321
npm test          # layout engine and content checks
npm run build     # astro check + static build to dist/
```
