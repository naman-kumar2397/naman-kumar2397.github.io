import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://naman-kumar2397.github.io',
  output: 'static',
  trailingSlash: 'ignore',
  // Stylesheets are small (~25 KB); inlining removes the render-blocking request.
  build: { inlineStylesheets: 'always' },
});
