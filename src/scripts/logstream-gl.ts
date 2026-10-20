/**
 * WebGL layer for src/components/LogStream.astro, loaded on demand. Named imports keep the
 * three.js chunk to what is used (renderer, camera, points, shader material).
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, MathUtils, PerspectiveCamera, Points, Scene,
  ShaderMaterial, Sphere, Vector3, WebGLRenderer,
} from 'three';

type Config = { sources: { rate: number; y: number }[]; srcX: number; sinkX: number; w: number };

export function start(fig: HTMLElement, reduce: MediaQueryList) {
  const cfg: Config = JSON.parse(fig.dataset.logStream!);
  const stage = fig.querySelector<HTMLElement>('.stage')!;
  const canvas = fig.querySelector<HTMLCanvasElement>('canvas.gl')!;
  const countEl = fig.querySelector<HTMLElement>('.count')!;

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 2, 0.1, 100);

  const DUR = 2.6; // seconds for one event to travel source -> sink
  // One particle per event in flight: rate x travel time. Phases spread evenly, so each
  // source emits exactly `rate` dots per second.
  const counts = cfg.sources.map((s) => Math.max(1, Math.round(s.rate * DUR)));
  const total = counts.reduce((a, b) => a + b, 0);
  const offset = new Float32Array(total * 2);
  const phase = new Float32Array(total);
  const source = new Float32Array(total);
  const speed = new Float32Array(total);
  let k = 0;
  counts.forEach((n, si) => {
    for (let i = 0; i < n; i++, k++) {
      // Gaussian-ish spread across the stream's cross-section (y) and depth (z).
      const r = Math.sqrt(-2 * Math.log(Math.random() + 1e-6)) * 0.42;
      const a = Math.random() * Math.PI * 2;
      offset[k * 2] = Math.cos(a) * r;
      offset[k * 2 + 1] = Math.sin(a) * r;
      phase[k] = i / n;
      source[k] = si;
      speed[k] = 0.85 + Math.random() * 0.3;
    }
  });
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(total * 3), 3));
  geo.setAttribute('aOffset', new BufferAttribute(offset, 2));
  geo.setAttribute('aPhase', new BufferAttribute(phase, 1));
  geo.setAttribute('aSource', new BufferAttribute(source, 1));
  geo.setAttribute('aSpeed', new BufferAttribute(speed, 1));
  geo.boundingSphere = new Sphere(new Vector3(), 10);

  const css = (v: string) => new Color(getComputedStyle(fig).getPropertyValue(v).trim() || '#888');
  const uniforms = {
    uTime: { value: 0 },
    uDur: { value: DUR },
    uSrc0: { value: new Vector3(cfg.srcX, cfg.sources[0]?.y ?? 0, 0) },
    uSrc1: { value: new Vector3(cfg.srcX, cfg.sources[1]?.y ?? 0, 0) },
    uSink: { value: new Vector3(cfg.sinkX, 0, 0) },
    uC0: { value: css('--accent') },
    uC1: { value: css('--c-green') },
    uCSink: { value: css('--merged-bg') },
    uSize: { value: 3.6 },
    uPR: { value: renderer.getPixelRatio() },
  };
  const mat = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime, uDur, uSize, uPR;
      uniform vec3 uSrc0, uSrc1, uSink, uC0, uC1, uCSink;
      attribute vec2 aOffset;
      attribute float aPhase, aSource, aSpeed;
      varying vec3 vColor;
      varying float vAlpha;
      vec3 bez(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
        float u = 1.0 - t;
        return u*u*u*a + 3.0*u*u*t*b + 3.0*u*t*t*c + t*t*t*d;
      }
      void main() {
        float t = fract(uTime / (uDur * aSpeed) + aPhase);
        vec3 s = aSource < 0.5 ? uSrc0 : uSrc1;
        vec3 p = bez(s, s + vec3(3.0, 0.0, 0.0), uSink - vec3(3.0, 0.0, 0.0), uSink, t);
        // The stream is widest mid-flight and funnels into the sink.
        // Narrow at the source, widest mid-flight, funnelled into the sink.
        float spread = smoothstep(0.0, 0.45, t) * mix(0.5, 0.04, smoothstep(0.45, 1.0, t)) * (aSource < 0.5 ? 1.0 : 0.7);
        p += vec3(0.0, aOffset.x, aOffset.y) * spread;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (9.0 / -mv.z);
        vColor = mix(aSource < 0.5 ? uC0 : uC1, uCSink, smoothstep(0.6, 1.0, t));
        vAlpha = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.94, 1.0, t));
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.15, d));
      }`,
  });
  // Glow (additive) on dark backgrounds; additive dots vanish on white, so normal blending in light.
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const blend = () => { mat.blending = dark.matches ? AdditiveBlending : NormalBlending; mat.needsUpdate = true; };
  blend();
  scene.add(new Points(geo, mat));

  // Fit the camera so the z = 0 plane spans exactly world x in [-w, w] (matches the HTML).
  const fit = () => {
    const { clientWidth: wpx, clientHeight: hpx } = stage;
    if (!wpx || !hpx) return;
    renderer.setSize(wpx, hpx, false);
    camera.aspect = wpx / hpx;
    camera.position.set(0, 0, cfg.w / (Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    camera.updateProjectionMatrix();
  };
  fit();
  new ResizeObserver(fit).observe(stage);
  // Follow light/dark changes.
  dark.addEventListener('change', () => {
    blend();
    uniforms.uC0.value = css('--accent');
    uniforms.uC1.value = css('--c-green');
    uniforms.uCSink.value = css('--merged-bg');
  });

  // Run only while on screen and the tab is visible. The counter tracks animated time only.
  const perSecond = cfg.sources.reduce((a, s) => a + s.rate, 0);
  let visible = false;
  let raf = 0;
  let last = 0;
  let shown = 0; // seconds animated
  let lastText = 0;
  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    shown += dt;
    uniforms.uTime.value = shown;
    renderer.render(scene, camera);
    if (now - lastText > 100) {
      lastText = now;
      countEl.textContent = `${Math.round(shown * perSecond).toLocaleString('en-AU')} events at these rates while you've been watching`;
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const run = () => {
    if (visible && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  };
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    run();
  }).observe(stage);
  document.addEventListener('visibilitychange', run);
  reduce.addEventListener('change', () => { if (reduce.matches) { visible = false; fig.classList.remove('live'); } });

  renderer.render(scene, camera);
  fig.classList.add('live');
  countEl.hidden = false;
}
