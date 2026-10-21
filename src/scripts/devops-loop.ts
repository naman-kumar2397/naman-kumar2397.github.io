/**
 * Skills section's DevOps loop (markup and fallback in src/components/DevOpsLoop.astro).
 *
 * A Bernoulli lemniscate of flowing particles, always moving the same way: t in [pi/2, 3pi/2]
 * is the Dev half, [3pi/2, 5pi/2] the Ops half, four stages on each half's outer arc. Scrolling
 * through the pinned track lights one stage (brighter, larger orbs on its arc) and its card rises
 * out of that stage's orb in 3D, settling as frosted glass inside its half (below the loop on
 * narrow screens). Moving on collapses it back into its orb and the next card rises from the next.
 *
 * Runs only with html.motion. Pauses off screen, in hidden tabs and with the pause button
 * (WCAG 2.2.2). Colours are read from CSS tokens every frame, so light/dark switches live.
 */
import { loopStages as STAGES } from '../data/devopsLoop';

type Spark = { x: number; y: number; vx: number; vy: number; life: number; age: number; col: number[] };

const TAU = Math.PI * 2;
const T0 = Math.PI / 2;
const GAP = 0.5; // keep stages clear of the crossing
const N = 1700;

export function initDevOpsLoop(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('#dl-canvas');
  const loopEl = root.querySelector<HTMLElement>('#dl-loop');
  const slot = root.querySelector<HTMLElement>('#dl-slot');
  const track = root.querySelector<HTMLElement>('#dl-track');
  const pauseBtn = root.querySelector<HTMLButtonElement>('#dl-pause');
  const status = root.querySelector<HTMLElement>('#dl-status');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !loopEl || !slot || !track || !pauseBtn || !ctx) return;
  // The static list stays in the DOM for crawlers; the interactive loop replaces it for people.
  root.querySelector('.dl-list')?.setAttribute('aria-hidden', 'true');

  const narrow = matchMedia('(max-width: 759px)');
  const style = getComputedStyle(root);
  const rgb = (v: string) => {
    const s = style.getPropertyValue(v).trim();
    const n = parseInt(s.replace('#', ''), 16);
    return s.startsWith('#') && s.length === 7 ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128];
  };

  let W = 0, H = 0, dpr = 1, A = 0, lobeW = 0;
  let centre: Record<'dev' | 'ops', [number, number]> = { dev: [0, 0], ops: [0, 0] };
  const curve = (t: number): [number, number] => {
    const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s;
    return [W / 2 + (A * c) / d, H / 2 - (A * s * c) / d];
  };
  const normal = (t: number): [number, number] => {
    const [x1, y1] = curve(t - 0.001), [x2, y2] = curve(t + 0.001);
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  const stageT = (i: number) => T0 + (i < 4 ? 0 : Math.PI) + GAP + ((i % 4) + 0.5) * ((Math.PI - 2 * GAP) / 4);

  const tags = STAGES.map((s) => {
    const el = document.createElement('span');
    el.className = `tag ${s.half}`;
    el.textContent = s.name;
    loopEl.appendChild(el);
    return el;
  });
  const halves = { dev: root.querySelector<HTMLElement>('#dl-half-dev')!, ops: root.querySelector<HTMLElement>('#dl-half-ops')! };

  function layout() {
    const r = loopEl!.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = Math.round(W * dpr);
    canvas!.height = Math.round(H * dpr);
    A = Math.min(W * (narrow.matches ? 0.36 : 0.44), H * 1.2);
    // True centre of each half: the polygon centroid of that lobe's outline.
    const cen = (from: number): [number, number] => {
      let a = 0, cx = 0, cy = 0;
      const n = 240;
      for (let k = 0; k < n; k++) {
        const [x0, y0] = curve(from + (k / n) * Math.PI), [x1, y1] = curve(from + ((k + 1) / n) * Math.PI);
        const cr = x0 * y1 - x1 * y0;
        a += cr; cx += (x0 + x1) * cr; cy += (y0 + y1) * cr;
      }
      return [cx / (3 * a), cy / (3 * a)];
    };
    centre = { dev: cen(T0), ops: cen(T0 + Math.PI) };
    lobeW = A * 0.8;
    for (const k of ['dev', 'ops'] as const) {
      halves[k].style.left = `${centre[k][0]}px`;
      halves[k].style.top = `${centre[k][1]}px`;
    }
    STAGES.forEach((s, i) => {
      const [x, y] = curve(stageT(i)), [cx, cy] = centre[s.half];
      const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, k = Math.max(24, A * 0.16);
      tags[i].style.left = `${x + (dx / l) * k}px`;
      tags[i].style.top = `${y + (dy / l) * k}px`;
    });
    if (card) { mountCard(card); place(card, active); }
  }

  // --- particles: constant flow along the band ---
  const parts = Array.from({ length: N }, () => ({
    u: Math.random(),
    off: (Math.random() + Math.random() + Math.random() - 1.5) / 1.5,
    sp: 0.022 + Math.random() * 0.006,
    z: Math.random(),
  }));
  const sparks: Spark[] = [];

  // --- the card ---
  let card: HTMLButtonElement | null = null, active = -1, target = 0, busy = false;
  const colourVar = (i: number) => (STAGES[i].half === 'dev' ? '--dev' : '--ops');

  function makeCard(i: number) {
    const s = STAGES[i];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dl-card';
    el.setAttribute('aria-expanded', 'false');
    el.style.setProperty('--c', `var(${colourVar(i)})`);
    el.innerHTML = `
      <span class="step">${String(i + 1).padStart(2, '0')} / 08 · ${s.half === 'dev' ? 'Dev' : 'Ops'}</span>
      <span class="name"><span class="swatch" aria-hidden="true"></span>${s.name}</span>
      <span class="what">${s.what}</span>
      <span class="chips">${s.tools.map((t) => `<span class="chip-i">${t}</span>`).join('')}</span>
      <span class="more"><span class="chev" aria-hidden="true">›</span>What I did</span>
      <span class="did">${s.work.map(([k, v]) => `<span><b>${k}:</b> ${v}</span>`).join('')}</span>`;
    el.addEventListener('click', () => {
      el.setAttribute('aria-expanded', String(el.getAttribute('aria-expanded') !== 'true'));
      place(el, i);
    });
    return el;
  }
  // Wide screens: the card floats inside its half over the loop; narrow: in the slot below.
  function mountCard(el: HTMLElement) {
    const host = narrow.matches ? slot! : loopEl!.parentElement!;
    if (el.parentElement !== host) host.appendChild(el);
  }
  function place(el: HTMLElement, i: number) {
    if (narrow.matches) {
      const w = Math.min(slot!.clientWidth, 440);
      el.style.setProperty('--cw', `${w}px`);
      el.style.left = `${(slot!.clientWidth - w) / 2}px`;
      el.style.top = '0px';
      slot!.style.minHeight = `${el.offsetHeight + 8}px`;
      return;
    }
    slot!.style.minHeight = '';
    const [cx, cy] = centre[STAGES[i].half];
    const w = Math.min(320, lobeW);
    el.style.setProperty('--cw', `${w}px`);
    const h = el.offsetHeight;
    // Coordinates are relative to the pin (the loop's parent); the loop starts at its top.
    const offY = loopEl!.offsetTop, offX = loopEl!.offsetLeft;
    el.style.left = `${offX + cx - w / 2}px`;
    el.style.top = `${offY + Math.max(4, Math.min(H - h - 4, cy - h / 2))}px`;
  }
  // The transform that squeezes the card into its stage's orb, tipped away at an angle.
  function orbTransform(el: HTMLElement, i: number) {
    const [nx, ny] = curve(stageT(i));
    const lr = loopEl!.getBoundingClientRect(), er = el.getBoundingClientRect();
    const ox = lr.left + nx - (er.left + er.width / 2), oy = lr.top + ny - (er.top + er.height / 2);
    const side = STAGES[i].half === 'dev' ? 1 : -1;
    return `translate3d(${ox}px, ${oy}px, -160px) scale(0.04) rotateX(${ny < H / 2 ? -65 : 65}deg) rotateY(${side * 50}deg)`;
  }
  function burst(i: number, n: number, out: boolean) {
    const [x, y] = curve(stageT(i));
    const col = rgb(colourVar(i));
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, v = (out ? 70 : 35) + Math.random() * 90;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.45 + Math.random() * 0.4, age: 0, col });
    }
    kick();
  }

  async function show(i: number) {
    target = i;
    if (busy) return;
    busy = true;
    while (active !== target) {
      const next = target;
      if (card) {
        const old = card, from = active;
        await old.animate([{ transform: 'none', opacity: 1 }, { transform: orbTransform(old, from), opacity: 0 }],
          { duration: 300, easing: 'cubic-bezier(.55,0,.75,.2)', fill: 'forwards' }).finished.catch(() => {});
        burst(from, 26, false);
        old.remove();
      }
      active = next;
      setActiveUI(next);
      card = makeCard(next);
      mountCard(card);
      place(card, next);
      burst(next, 36, true);
      await card.animate([{ transform: orbTransform(card, next), opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 580, easing: 'cubic-bezier(.16,1,.3,1)' }).finished.catch(() => {});
    }
    busy = false;
  }

  // --- stage buttons, pause, scroll ---
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('#dl-stages button')];
  buttons.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
  function setActiveUI(i: number) {
    buttons.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    tags.forEach((t, k) => t.classList.toggle('on', k === i));
    if (status) status.textContent = `${STAGES[i].name}: ${STAGES[i].what} Tools: ${STAGES[i].tools.join(', ')}.`;
  }
  function goTo(i: number) {
    const span = track!.offsetHeight - innerHeight;
    const y = scrollY + track!.getBoundingClientRect().top + span * ((i + 0.5) / STAGES.length);
    scrollTo({ top: y, behavior: 'smooth' });
  }
  let paused = false;
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play animation' : 'Pause animation';
    kick();
  });

  let litT = stageT(0), litGoal = stageT(0);
  function onScroll() {
    const rect = track!.getBoundingClientRect(), span = track!.offsetHeight - innerHeight;
    const progress = Math.min(1, Math.max(0, -rect.top / span));
    const i = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));
    litGoal = stageT(i);
    if (i !== target) show(i);
    kick();
  }

  // --- render loop: the loop always flows the same way; only the lit stage brightens ---
  let raf = 0, last = 0, visible = false;
  function frame(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    const flow = paused ? 0 : dt;
    litT += (litGoal - litT) * Math.min(1, dt * 8);
    const dev = rgb('--dev'), ops = rgb('--ops');
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, W, H);
    const band = Math.max(7, A * 0.07);
    for (const p of parts) {
      p.u = (p.u + p.sp * flow) % 1;
      const t = T0 + p.u * TAU;
      const [x0, y0] = curve(t), [nx, ny] = normal(t);
      const col = t < T0 + Math.PI ? dev : ops;
      const d = Math.abs((((t - litT + Math.PI) % TAU) + TAU) % TAU - Math.PI);
      const lit = Math.max(0, 1 - d / 0.38) ** 1.4;
      ctx!.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.2 + 0.08 * p.z + 0.72 * lit})`;
      ctx!.beginPath();
      ctx!.arc(x0 + nx * p.off * band, y0 + ny * p.off * band, 0.6 + 0.6 * p.z + 1.3 * lit, 0, TAU);
      ctx!.fill();
    }
    // Stage orbs: small dotted rings; the lit one is larger and brighter.
    const spin0 = paused ? 0 : now / 1000;
    STAGES.forEach((s, i) => {
      const [x, y] = curve(stageT(i)), col = s.half === 'dev' ? dev : ops, on = i === active;
      const R = on ? 12 : 6, n = on ? 16 : 9, spin = spin0 * 0.8 + i;
      for (let k = 0; k < n; k++) {
        const ang = spin + (k / n) * TAU, depth = Math.sin(ang) * 0.5 + 0.5;
        ctx!.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${on ? 0.45 + 0.55 * depth : 0.35 + 0.3 * depth})`;
        ctx!.beginPath();
        ctx!.arc(x + Math.cos(ang) * R, y + Math.sin(ang) * R * 0.42, on ? 1.7 : 1.1, 0, TAU);
        ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${on ? 1 : 0.6})`;
      ctx!.beginPath();
      ctx!.arc(x, y, on ? 3.2 : 2, 0, TAU);
      ctx!.fill();
    });
    for (let k = sparks.length - 1; k >= 0; k--) {
      const s = sparks[k];
      s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.92; s.vy *= 0.92;
      if (s.age >= s.life) { sparks.splice(k, 1); continue; }
      ctx!.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${1 - s.age / s.life})`;
      ctx!.beginPath();
      ctx!.arc(s.x, s.y, 1.6, 0, TAU);
      ctx!.fill();
    }
    const settling = Math.abs(litGoal - litT) > 0.001 || sparks.length > 0;
    if (visible && !document.hidden && (!paused || settling)) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) { kick(); } }).observe(canvas);
  addEventListener('scroll', onScroll, { passive: true });
  let resizeT = 0;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = window.setTimeout(() => { layout(); kick(); }, 100); }, { passive: true });
  document.addEventListener('visibilitychange', kick);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', kick);
  layout();
  onScroll();
  show(target);
}
