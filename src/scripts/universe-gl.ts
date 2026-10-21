/**
 * The 3D git graph behind /home-alternate/, loaded on demand (desktop, motion allowed, WebGL2).
 *
 * Built from the same layout as the 2D git log (src/lib/layout.ts via src/lib/universe.ts):
 * x = lane, z = time (newest nearest, older rows recede), a gentle wave in y. Branches are
 * camera-facing glowing ribbons (one draw call), commits are instanced billboards shaded as
 * small spheres with an additive halo (merges get a ring in the merged branch's colour, HEAD
 * is larger and pulses), and a sparse star field gives depth. Unlit materials only; fog is
 * computed in the shaders so far rows fade into the stage.
 *
 * Every vertex has two positions: `flat`, on a plane facing the camera exactly where the
 * terminal printed that part of `git log --graph` (measured from the DOM), and `deep`, its
 * place in the 3D graph. `morph(0..1)` moves between them, newest rows first, which is the
 * opening's lift-off. `setU(u)` flies the camera: -1 is the hero view, 0..6 the seven stops,
 * 7 the pull-back that shows the whole log.
 *
 * Renders only while on screen and the tab is visible, and stops rendering when nothing moves
 * (paused and the camera settled). Pixel ratio capped at 1.5; colours from the theme tokens,
 * re-read when the colour scheme changes.
 */
import {
  AddEquation, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, InstancedBufferAttribute,
  CustomBlending, DoubleSide, InstancedBufferGeometry, Mesh, NormalBlending, OneFactor, ZeroFactor, PerspectiveCamera, Points, Scene, ShaderMaterial, Sphere,
  Vector3, WebGLRenderer,
} from 'three';
import type { SceneData } from '../lib/universe';

/** Where the terminal printed the graph, in viewport pixels. */
export interface FlatMap {
  x0: number;
  charW: number;
  lineH: number;
  /** [row, y of its line centre], newest first. */
  rows: [number, number][];
}

export interface Universe {
  setU(u: number): void;
  flat(map: FlatMap): void;
  morph(m: number): void;
  pause(p: boolean): void;
  pointer(x: number, y: number): void;
  dispose(): void;
}

const LX = 2.7; // lane spacing (world units)
const DZ = 2.5; // depth per row
const SKY = 1600; // stars
const sm = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const MORPH = /* glsl */ `
  uniform float uMorph, uS, uHead, uLo;
  float morphAt(float rho) {
    float s = rho >= uLo ? uS * (uHead - rho) / max(1.0, uHead - uLo) : uS;
    float m = clamp(uMorph * (1.0 + uS) - s, 0.0, 1.0);
    return m * m * m * (m * (m * 6.0 - 15.0) + 10.0);
  }
`;

export async function mount(canvas: HTMLCanvasElement, data: SceneData): Promise<Universe> {
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  // Pixel ratio capped at 1.5. A software renderer (blocklisted GPU, headless) cannot fill a
  // full-screen glow at that size without stalling the main thread, so it gets fewer pixels and
  // 30 frames a second; frames that keep running slow lower the resolution further.
  const info = renderer.getContext().getExtension('WEBGL_debug_renderer_info');
  const gpu = info ? String(renderer.getContext().getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  const software = /swiftshader|llvmpipe|software|basic render/i.test(gpu);
  let ratio = software ? 0.6 : Math.min(devicePixelRatio, 1.5);
  const minGap = software ? 1000 / 30 - 4 : 0;
  renderer.setPixelRatio(ratio);
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(46, 2, 0.1, 600);

  const { head, lanes } = data;
  const lo = Math.max(0, head - 13);
  const laneX = (l: number) => (l - (lanes - 1) / 2) * LX;
  const wave = (r: number) => 0.55 * Math.sin(r * 0.29) + 0.32 * Math.sin(r * 0.11 + 1.3);
  const deep = (r: number, l: number, out = new Vector3()) => out.set(laneX(l), wave(r), -(head - r) * DZ);
  const branchIds = [...new Set(data.spans.map((s) => s.branch))];
  const bIndex = (b: string) => branchIds.indexOf(b);

  // ---- Shared uniforms.
  const U = {
    uMorph: { value: 1 }, uS: { value: 0.6 }, uHead: { value: head }, uLo: { value: lo },
    uTime: { value: 0 }, uRes: { value: [1, 1] as [number, number] }, uPx: { value: 1 },
    uFog: { value: 0.011 }, uDark: { value: dark.matches ? 1 : 0 },
    uFocus: { value: 0 }, uFocusBranch: { value: -1 }, uActiveRow: { value: head }, uActive: { value: 0 },
  };

  // ---- Branch ribbons.
  type P = { r: number; l: number };
  const paths = data.spans.map((s) => {
    const pts: P[] = [];
    const step = 0.125;
    let r0 = s.from;
    if (s.fork && s.parentLane !== null) {
      for (let i = 0; i <= 16; i++) pts.push({ r: s.from + i / 16, l: s.parentLane + (s.lane - s.parentLane) * sm(i / 16) });
      r0 = s.from + 1;
    }
    const r1 = s.merge ? s.to - 1 : s.to;
    for (let r = r0 + (pts.length ? step : 0); r <= r1 + 1e-6; r += step) pts.push({ r, l: s.lane });
    if (s.merge && s.parentLane !== null) {
      for (let i = 1; i <= 16; i++) pts.push({ r: s.to - 1 + i / 16, l: s.lane + (s.parentLane - s.lane) * sm(i / 16) });
    }
    return { span: s, pts };
  });
  const vCount = paths.reduce((a, p) => a + p.pts.length * 2, 0);
  const lineGeo = new BufferGeometry();
  const la = {
    deep: new Float32Array(vCount * 3), deepN: new Float32Array(vCount * 3),
    flat: new Float32Array(vCount * 3), flatN: new Float32Array(vCount * 3),
    side: new Float32Array(vCount), dir: new Float32Array(vCount), rho: new Float32Array(vCount), branch: new Float32Array(vCount),
    printed: new Float32Array(vCount), colour: new Float32Array(vCount * 3),
  };
  const lineIdx: number[] = [];
  const vtx: { p: P; n: P }[] = []; // per vertex pair, for recomputing flat positions
  {
    let v = 0;
    const tmp = new Vector3();
    for (const { span, pts } of paths) {
      const base = v;
      pts.forEach((p, i) => {
        const last = i === pts.length - 1;
        const n = last ? pts[i - 1] : pts[i + 1];
        const dir = last ? -1 : 1;
        for (const side of [-1, 1]) {
          deep(p.r, p.l, tmp).toArray(la.deep, v * 3);
          deep(n.r, n.l, tmp).toArray(la.deepN, v * 3);
          la.side[v] = side;
          la.dir[v] = dir;
          la.rho[v] = p.r;
          la.branch[v] = bIndex(span.branch);
          la.printed[v] = p.r >= lo - 0.01 ? 1 : 0;
          v++;
        }
        vtx.push({ p, n });
        if (!last) lineIdx.push(base + i * 2, base + i * 2 + 1, base + i * 2 + 2, base + i * 2 + 1, base + i * 2 + 3, base + i * 2 + 2);
      });
    }
  }
  const attr = (a: Float32Array, n: number) => new BufferAttribute(a, n);
  lineGeo.setAttribute('position', attr(la.deep, 3));
  lineGeo.setAttribute('aDeepN', attr(la.deepN, 3));
  lineGeo.setAttribute('aFlat', attr(la.flat, 3));
  lineGeo.setAttribute('aFlatN', attr(la.flatN, 3));
  lineGeo.setAttribute('aSide', attr(la.side, 1));
  lineGeo.setAttribute('aDir', attr(la.dir, 1));
  lineGeo.setAttribute('aRho', attr(la.rho, 1));
  lineGeo.setAttribute('aBranch', attr(la.branch, 1));
  lineGeo.setAttribute('aPrinted', attr(la.printed, 1));
  lineGeo.setAttribute('aColor', attr(la.colour, 3));
  lineGeo.setIndex(lineIdx);
  lineGeo.boundingSphere = new Sphere(new Vector3(), 1e4);

  const lineMat = new ShaderMaterial({
    uniforms: { ...U, uFlatHalf: { value: 1.6 }, uDeepHalf: { value: 0.3 } },
    transparent: true,
    side: DoubleSide, // ribbon winding flips with its screen direction
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      ${MORPH}
      uniform vec2 uRes;
      uniform float uPx, uFog, uFlatHalf, uDeepHalf;
      attribute vec3 aDeepN, aFlat, aFlatN, aColor;
      attribute float aSide, aDir, aRho, aBranch, aPrinted;
      varying float vV, vRho, vAlpha, vBranch, vCore;
      varying vec3 vColor;
      void main() {
        float m = morphAt(aRho);
        vec4 a = modelViewMatrix * vec4(mix(aFlat, position, m), 1.0);
        vec4 b = modelViewMatrix * vec4(mix(aFlatN, aDeepN, m), 1.0);
        const float NEAR = -0.25;
        if (a.z > NEAR && b.z > NEAR) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        if (a.z > NEAR) a = mix(b, a, (NEAR - b.z) / (a.z - b.z));
        if (b.z > NEAR) b = mix(a, b, (NEAR - a.z) / (b.z - a.z));
        vec4 ca = projectionMatrix * a, cb = projectionMatrix * b;
        vec2 d = cb.xy / cb.w * uRes - ca.xy / ca.w * uRes;
        float len = length(d);
        d = len > 1e-5 ? d / len : vec2(1.0, 0.0);
        float depth = -a.z;
        float hw = mix(uFlatHalf, min(uDeepHalf * uPx / depth, 30.0), m);
        float thin = clamp(hw / 1.4, 0.2, 1.0);
        hw = max(hw, 1.4);
        // The last point measures its direction backwards (aDir = -1), so flip its offset to match.
        ca.xy += vec2(-d.y, d.x) * aSide * aDir * hw / uRes * ca.w;
        gl_Position = ca;
        vV = aSide;
        vRho = aRho;
        vBranch = aBranch;
        vColor = aColor;
        vCore = mix(0.75, 0.2, m);
        vAlpha = exp(-pow(uFog * depth, 2.0)) * thin * mix(aPrinted, 1.0, m);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uDark, uFocus, uFocusBranch;
      varying float vV, vRho, vAlpha, vBranch, vCore;
      varying vec3 vColor;
      void main() {
        float a = abs(vV);
        float core = 1.0 - smoothstep(vCore * 0.55, vCore, a);
        float glow = exp(-a * a * 5.0) * (1.0 - a);
        float on = 1.0 - step(0.5, abs(vBranch - uFocusBranch));
        float k = mix(1.0, mix(0.55, 1.5, on), uFocus);
        // Sparse light pulses travelling towards HEAD (newer rows).
        float pulse = pow(max(0.0, sin(vRho * 0.42 - uTime * 1.25 + vBranch * 1.9)), 40.0);
        if (uDark > 0.5) {
          vec3 c = vColor * (core * 1.25 + glow * 0.6 + pulse * (core + glow) * 1.6) + vec3(core * 0.32 + pulse * core * 0.5);
          gl_FragColor = vec4(c * k * vAlpha, 0.0);
        } else {
          float al = core * 0.92 + glow * 0.2 + pulse * (core * 0.3 + glow * 0.35);
          float A = al * vAlpha * min(k, 1.15);
          gl_FragColor = vec4(mix(vColor, vColor * 0.72, pulse) * A, A);
        }
        #include <colorspace_fragment>
      }`,
  });
  const lines = new Mesh(lineGeo, lineMat);
  lines.frustumCulled = false;
  lines.renderOrder = 1;
  scene.add(lines);

  // ---- Commit orbs.
  const N = data.rows.length;
  const quad = new InstancedBufferGeometry();
  quad.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const oa = {
    deep: new Float32Array(N * 3), flat: new Float32Array(N * 3), colour: new Float32Array(N * 3), ring: new Float32Array(N * 3),
    kind: new Float32Array(N), row: new Float32Array(N), printed: new Float32Array(N),
  };
  data.rows.forEach((r, i) => {
    deep(i, r.lane).toArray(oa.deep, i * 3);
    oa.kind[i] = i === head ? 3 : r.kind === 'merge' ? 1 : r.kind === 'branch' ? 2 : 0;
    oa.row[i] = i;
    oa.printed[i] = i >= lo ? 1 : 0;
  });
  const iattr = (a: Float32Array, n: number) => new InstancedBufferAttribute(a, n);
  quad.setAttribute('aDeep', iattr(oa.deep, 3));
  quad.setAttribute('aFlat', iattr(oa.flat, 3));
  quad.setAttribute('aColor', iattr(oa.colour, 3));
  quad.setAttribute('aRing', iattr(oa.ring, 3));
  quad.setAttribute('aKind', iattr(oa.kind, 1));
  quad.setAttribute('aRow', iattr(oa.row, 1));
  quad.setAttribute('aPrinted', iattr(oa.printed, 1));
  quad.instanceCount = N;
  quad.boundingSphere = new Sphere(new Vector3(), 1e4);
  const orbMat = new ShaderMaterial({
    uniforms: { ...U, uFlatPx: { value: 6 }, uScale: { value: 1 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      ${MORPH}
      uniform vec2 uRes;
      uniform float uPx, uFog, uTime, uActiveRow, uActive, uFlatPx, uScale;
      attribute vec3 aDeep, aFlat, aColor, aRing;
      attribute float aKind, aRow, aPrinted;
      varying vec2 vUv;
      varying vec3 vColor, vRing;
      varying float vKind, vAlpha, vAct;
      void main() {
        float m = morphAt(aRow);
        vec4 mv = modelViewMatrix * vec4(mix(aFlat, aDeep, m), 1.0);
        if (mv.z > -0.4) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec4 cp = projectionMatrix * mv;
        float depth = -mv.z;
        float act = uActive * (1.0 - smoothstep(0.0, 0.6, abs(aRow - uActiveRow)));
        float r = aKind > 2.5 ? 0.3 : aKind > 0.5 && aKind < 1.5 ? 0.22 : 0.16;
        r *= 1.0 + act * 0.9 + (aKind > 2.5 ? 0.1 * sin(uTime * 2.2) : 0.0);
        float px = mix(uFlatPx * (aKind > 2.5 ? 1.25 : 1.0), r * 3.0 * uScale * uPx / depth, m);
        px = max(px, 2.5);
        cp.xy += position.xy * px / uRes * cp.w;
        gl_Position = cp;
        vUv = position.xy;
        vColor = aColor;
        vRing = aRing;
        vKind = aKind;
        vAct = act;
        vAlpha = exp(-pow(uFog * depth, 2.0)) * mix(aPrinted, 1.0, m);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uDark;
      varying vec2 vUv;
      varying vec3 vColor, vRing;
      varying float vKind, vAlpha, vAct;
      void main() {
        float d = length(vUv);
        if (d > 1.0) discard;
        const float RC = 0.3333;
        float core = 1.0 - smoothstep(RC * 0.8, RC, d);
        vec2 q = vUv / RC;
        float z = sqrt(max(0.0, 1.0 - dot(q, q)));
        float shade = 0.5 + 0.5 * max(0.0, dot(normalize(vec3(q, z)), normalize(vec3(-0.45, 0.55, 0.7))));
        float glow = exp(-d * d * 7.0) * (1.0 - d);
        float isMerge = step(0.5, vKind) * (1.0 - step(1.5, vKind));
        float ring = isMerge * (1.0 - smoothstep(0.03, 0.065, abs(d - RC * 1.45)));
        float isHead = step(2.5, vKind);
        float rp = fract(uTime * 0.42);
        float ripple = isHead * (1.0 - smoothstep(0.015, 0.05, abs(d - mix(RC, 0.98, rp)))) * (1.0 - rp);
        float halo = vAct * (1.0 - smoothstep(0.02, 0.05, abs(d - RC * 1.9))) * 0.8;
        if (uDark > 0.5) {
          vec3 c = vColor * (core * shade * 1.5 + glow * (0.85 + vAct * 0.9) + ripple * 0.9 + halo)
            + vec3(core * shade * 0.55) + vRing * ring * 1.3;
          gl_FragColor = vec4(c * vAlpha, 0.0);
        } else {
          float al = max(core, glow * (0.3 + vAct * 0.25) + ring * 0.95 + ripple * 0.6 + halo);
          vec3 c = mix(mix(vColor, vRing, ring * (1.0 - core)), vColor * (0.62 + shade * 0.5), core);
          gl_FragColor = vec4(c * al * vAlpha, al * vAlpha);
        }
        #include <colorspace_fragment>
      }`,
  });
  const orbs = new Mesh(quad, orbMat);
  orbs.frustumCulled = false;
  orbs.renderOrder = 2;
  scene.add(orbs);

  // ---- Star dust around the graph's volume.
  const sp = new Float32Array(SKY * 3);
  const seed = new Float32Array(SKY);
  for (let i = 0; i < SKY; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 7 + Math.pow(Math.random(), 0.7) * 70;
    sp[i * 3] = Math.cos(a) * rad;
    sp[i * 3 + 1] = Math.sin(a) * rad * 0.6 + 4;
    sp[i * 3 + 2] = 40 - Math.random() * (head * DZ + 140);
    seed[i] = Math.random();
  }
  const starGeo = new BufferGeometry();
  starGeo.setAttribute('position', new BufferAttribute(sp, 3));
  starGeo.setAttribute('aSeed', new BufferAttribute(seed, 1));
  starGeo.boundingSphere = new Sphere(new Vector3(), 1e4);
  const starMat = new ShaderMaterial({
    uniforms: { ...U, uPR: { value: renderer.getPixelRatio() }, uInk: { value: new Color() } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      uniform float uTime, uPR, uFog, uMorph;
      attribute float aSeed;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = max(0.5, -mv.z);
        gl_PointSize = clamp((0.9 + aSeed * 1.6) * uPR * 26.0 / depth, 1.0, 3.6 * uPR);
        float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
        vA = tw * exp(-pow(uFog * 0.55 * depth, 2.0)) * uMorph * (0.35 + aSeed * 0.65);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDark;
      uniform vec3 uInk;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float A = vA * smoothstep(0.5, 0.0, d) * (uDark > 0.5 ? 0.85 : 0.45);
        gl_FragColor = vec4(uInk * A, uDark > 0.5 ? 0.0 : A);
        #include <colorspace_fragment>
      }`,
  });
  const stars = new Points(starGeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  // ---- Colours, from the tokens.
  const css = (v: string) => new Color(getComputedStyle(canvas).getPropertyValue(v).trim() || '#888');
  const paint = () => {
    const isDark = dark.matches;
    // Everything outputs premultiplied colour. Dark: light adds up (colour One/One) and the canvas
    // alpha stays 0, so the page composites it additively over the CSS stage. Light: normal
    // premultiplied blending, so colours sit on the airy stage without dark fringes.
    for (const m of [lineMat, orbMat, starMat]) {
      m.premultipliedAlpha = true;
      if (isDark) {
        Object.assign(m, { blending: CustomBlending, blendEquation: AddEquation, blendSrc: OneFactor, blendDst: OneFactor, blendSrcAlpha: ZeroFactor, blendDstAlpha: OneFactor });
      } else m.blending = NormalBlending;
      m.needsUpdate = true;
    }
    U.uDark.value = isDark ? 1 : 0;
    const col = new Map<string, Color>();
    const c = (name: string) => col.get(name) ?? (col.set(name, css(`--c-${name}`)), col.get(name)!);
    let v = 0;
    for (const { span, pts } of paths) {
      const cc = c(span.colour);
      for (let i = 0; i < pts.length * 2; i++, v++) cc.toArray(la.colour, v * 3);
    }
    lineGeo.attributes.aColor.needsUpdate = true;
    data.rows.forEach((r, i) => { c(r.colour).toArray(oa.colour, i * 3); c(r.ring ?? r.colour).toArray(oa.ring, i * 3); });
    quad.attributes.aColor.needsUpdate = true;
    quad.attributes.aRing.needsUpdate = true;
    starMat.uniforms.uInk.value = isDark ? new Color(0.78, 0.86, 1) : css('--muted');
  };
  paint();

  // ---- Camera path: hero view, the seven stops (pulled in close to each key orb), the pull-back.
  const rowLane = (r: number) => data.rows[r].lane;
  const keys: { pos: Vector3; tgt: Vector3 }[] = [];
  const hO = deep(head, rowLane(head));
  keys.push({ pos: hO.clone().add(new Vector3(-4.2, 2.3, 6.2)), tgt: hO.clone().add(new Vector3(2.0, -4.3, -14)) });
  for (const s of data.stops) {
    const o = deep(s.row, rowLane(s.row));
    keys.push({ pos: o.clone().add(new Vector3(-2.6, 1.7, 6.8)), tgt: o.clone().add(new Vector3(-2.0, -0.5, -2.5)) });
  }
  const mid = deep(head / 2, 1);
  keys.push({ pos: mid.clone().add(new Vector3(-70, 44, 54)), tgt: mid.clone().add(new Vector3(6, -19, 6)) });
  const posPts: Vector3[] = [];
  const tgtPts: Vector3[] = [];
  keys.forEach((k, i) => {
    posPts.push(k.pos);
    tgtPts.push(k.tgt);
    if (i === keys.length - 1) return;
    const n = keys[i + 1];
    const m = k.pos.clone().lerp(n.pos, 0.5);
    const far = Math.abs(n.pos.z - k.pos.z);
    m.y += 1.6 + far * 0.06; // crane up while flying, more for long flights
    m.x = (m.x + laneX(1) - 2.2) / 2;
    posPts.push(m);
    tgtPts.push(k.tgt.clone().lerp(n.tgt, 0.5).add(new Vector3(0, -0.6, -5)));
  });
  const posCurve = new CatmullRomCurve3(posPts, false, 'centripetal');
  const tgtCurve = new CatmullRomCurve3(tgtPts, false, 'centripetal');
  const nPts = posPts.length;

  // ---- Flat (terminal) positions: viewport pixels projected onto a plane facing the hero camera.
  const placeCamera = (u: number, out: { pos: Vector3; tgt: Vector3 }) => {
    const t = clamp(((u + 1) * 2) / (nPts - 1), 0, 1);
    posCurve.getPoint(t, out.pos);
    tgtCurve.getPoint(t, out.tgt);
  };
  const flat = (map: FlatMap) => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const k = { pos: new Vector3(), tgt: new Vector3() };
    placeCamera(-1, k);
    camera.position.copy(k.pos);
    camera.lookAt(k.tgt);
    camera.fov = 46;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const fwd = k.tgt.clone().sub(k.pos).normalize();
    const D = 16;
    const ys = new Map(map.rows);
    const newest = map.rows[0][0];
    const oldest = map.rows[map.rows.length - 1][0];
    // Only the printed rows start on the screen; older ones fade in as they swing into place.
    U.uLo.value = oldest;
    la.rho.forEach((r, i) => { la.printed[i] = r >= oldest - 0.01 ? 1 : 0; });
    data.rows.forEach((_, i) => { oa.printed[i] = i >= oldest ? 1 : 0; });
    lineGeo.attributes.aPrinted.needsUpdate = true;
    quad.attributes.aPrinted.needsUpdate = true;
    const yOf = (r: number) => {
      if (r >= newest) return ys.get(newest)! - (r - newest) * map.lineH;
      if (r <= oldest) return ys.get(oldest)! + (oldest - r) * map.lineH;
      const a = Math.floor(r), f = r - a;
      return ys.get(a)! + (ys.get(a + 1)! - ys.get(a)!) * f;
    };
    const tmp = new Vector3();
    const toWorld = (p: P, arr: Float32Array, at: number) => {
      const x = map.x0 + (p.l * 2 + 0.5) * map.charW;
      const y = yOf(p.r);
      tmp.set((x / w) * 2 - 1, -(y / h) * 2 + 1, 0.5).unproject(camera).sub(k.pos).normalize();
      tmp.multiplyScalar(D / tmp.dot(fwd)).add(k.pos).toArray(arr, at * 3);
    };
    vtx.forEach(({ p, n }, i) => {
      for (const s of [0, 1]) { toWorld(p, la.flat, i * 2 + s); toWorld(n, la.flatN, i * 2 + s); }
    });
    data.rows.forEach((r, i) => toWorld({ r: i, l: r.lane }, oa.flat, i));
    lineGeo.attributes.aFlat.needsUpdate = true;
    lineGeo.attributes.aFlatN.needsUpdate = true;
    quad.attributes.aFlat.needsUpdate = true;
    // Ribbon and orb sizes that match the printed glyphs.
    lineMat.uniforms.uFlatHalf.value = Math.max(1.1, map.charW * 0.16);
    orbMat.uniforms.uFlatPx.value = map.charW * 0.62;
  };

  // ---- Sizing.
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    U.uRes.value = [w / 2, h / 2];
    starMat.uniforms.uPR.value = renderer.getPixelRatio();
    dirty = true;
  };
  let dirty = true;
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  // ---- Loop.
  let uTarget = -1, uCur = -1, paused = false, time = 0, last = 0, raf = 0, visible = true, live = true;
  let px = 0, py = 0, pxs = 0, pys = 0, roll = 0;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const stopBranch = data.stops.map((s) => bIndex(s.branch));
  const k = { pos: new Vector3(), tgt: new Vector3() };
  const prev = new Vector3();
  let slow = 0;
  const frame = (now: number) => {
    raf = 0;
    if (last && now - last < minGap) { if (visible && !document.hidden && live) raf = requestAnimationFrame(frame); return; }
    // Adaptive resolution: sustained frames over 45 ms step the pixel ratio down (to 0.5 at least).
    if (last && now - last > 45) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 24 && ratio > 0.5) { ratio = Math.max(0.5, ratio * 0.75); renderer.setPixelRatio(ratio); size(); slow = 0; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!paused) time += dt;
    const settled = Math.abs(uTarget - uCur) < 1e-4 && Math.abs(px - pxs) < 1e-3 && Math.abs(py - pys) < 1e-3;
    uCur += (uTarget - uCur) * (1 - Math.exp(-dt * 4.2));
    if (Math.abs(uTarget - uCur) < 1e-4) uCur = uTarget;
    const lift = U.uMorph.value >= 1;
    pxs += (px - pxs) * (1 - Math.exp(-dt * 3));
    pys += (py - pys) * (1 - Math.exp(-dt * 3));
    if (!(paused && settled && !dirty)) render(lift);
    dirty = false;
    if (visible && !document.hidden && live) raf = requestAnimationFrame(frame);
  };
  const render = (lift: boolean) => {
    U.uTime.value = time;
    placeCamera(lift ? uCur : -1, k);
    const f = uCur - Math.floor(uCur);
    const flying = lift && uCur > -1 && uCur < data.stops.length ? Math.sin(Math.PI * f) : 0;
    camera.fov = 46 + 7 * flying;
    if (lift) {
      // Breathing drift (stops when paused) and a small pointer parallax.
      k.pos.x += Math.sin(time * 0.21) * 0.16 + pxs * 0.5;
      k.pos.y += Math.sin(time * 0.17 + 1) * 0.12 - pys * 0.32;
    }
    const lateral = k.pos.x - prev.x;
    prev.copy(k.pos);
    roll += (clamp(-lateral * 0.5, -0.06, 0.06) - roll) * 0.08;
    camera.position.copy(k.pos);
    camera.lookAt(k.tgt);
    camera.rotateZ(roll);
    camera.updateProjectionMatrix();
    U.uPx.value = (canvas.clientHeight / 2) * camera.projectionMatrix.elements[5];
    // Fog clears for the pull-back so the whole log shows.
    const out = clamp(uCur - (data.stops.length - 1), 0, 1);
    const hero = clamp(-uCur, 0, 1);
    lineMat.uniforms.uDeepHalf.value = 0.3 * (1 + 1.6 * out);
    orbMat.uniforms.uScale.value = 1 + 1.2 * out;
    U.uFog.value = (0.0105 * (1 - out) + 0.0032 * out) * (1 - hero) + 0.0062 * hero;
    // The stop in view: its key orb grows a halo and its branch brightens.
    const idx = Math.round(clamp(uCur, 0, data.stops.length - 1));
    const near = lift && uCur > -0.5 && uCur < data.stops.length - 0.5 ? 1 - flying : 0;
    U.uActiveRow.value = data.stops[idx].row;
    U.uActive.value = near;
    U.uFocusBranch.value = stopBranch[idx];
    U.uFocus.value = near * 0.85;
    renderer.render(scene, camera);
  };
  const run = () => {
    if (visible && !document.hidden && live && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  };
  const io = new IntersectionObserver((e) => { visible = e.some((x) => x.isIntersecting); run(); });
  io.observe(canvas.parentElement!);
  const onVis = () => run();
  document.addEventListener('visibilitychange', onVis);
  const onScheme = () => { paint(); dirty = true; run(); };
  dark.addEventListener('change', onScheme);

  size();
  await renderer.compileAsync(scene, camera);
  render(false);

  const dispose = () => {
    live = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    dark.removeEventListener('change', onScheme);
    for (const g of [lineGeo, quad, starGeo]) g.dispose();
    for (const m of [lineMat, orbMat, starMat]) m.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  return {
    setU(u) { uTarget = u; run(); },
    flat(map) { flat(map); dirty = true; },
    morph(m) { U.uMorph.value = m; dirty = true; run(); },
    pause(p) { paused = p; dirty = true; run(); },
    pointer(x, y) { if (fine.matches) { px = x; py = y; run(); } },
    dispose,
  };
}
