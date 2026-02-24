# Design Direction — “Operational Noir”

## Concept
A bespoke SRE interface that feels like an incident console meets editorial case-study:
- dark, textured background (subtle grain)
- sharp typography hierarchy
- flowchart nodes feel “engineered”, not a generic UI kit
- motion is restrained but memorable: a single orchestrated entrance + purposeful focus transitions

## Tone
Industrial / utilitarian / high-contrast / precise.
No “AI gradient slop”. No purple-on-white startup landing vibes.

## Typography
- Display: Fraunces (high-contrast serif for headings; distinctive)
- Body: Spline Sans (clean but characterful)
Avoid Inter/Roboto/system fonts.

## Color
- Dominant: near-black graphite background
- Accent: one high-chroma “signal” color for active paths (use CSS variables)
- Secondary: muted inks for inactive nodes/edges

## Motion rules
- One hero animation on page load:
  - edges draw in subtly
  - nodes fade + slide in with stagger
- Focus transitions:
  - dim unrelated
  - gently scale/translate to center
No constant jitter or over-animated hover effects.

## Layout rules
- One company per viewport
- Filters never cover the canvas on desktop
- Always show role + dates + “impact by numbers” capsule near company title

