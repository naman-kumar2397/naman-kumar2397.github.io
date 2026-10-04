# naman-kumar2397.github.io

Personal site: a career told as `git log --graph`. Astro + TypeScript, static output, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Editing content

- `src/data/journey.ts` — branches and commits (oldest first). Lanes, spans, Open/Merged state and HEAD are computed in `src/lib/layout.ts`. Blank dates are unknown and marked `TODO`.
- `src/data/profile.ts` — README card, skills, contact and the resume.

After changing resume content, regenerate the PDF and commit it:

```sh
npm run resume:pdf   # builds, prints /resume to public/resume.pdf (needs Chromium; set CHROMIUM_PATH)
```

## Commands

```sh
npm install
npm run dev       # http://localhost:4321
npm test          # layout engine tests
npm run build     # astro check + static build to dist/
```
