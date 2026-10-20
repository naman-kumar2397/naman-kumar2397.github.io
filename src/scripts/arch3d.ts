/**
 * 3D view for src/components/Diagram.astro, loaded on demand: one board tilted away from the
 * viewer, a lane per stage (left to right), a low tile per component and flat glowing grooves
 * for the flow, with small packets travelling along them.
 *
 * The labels are HTML cards (crisp text, theme colours) positioned over the tiles; the canvas
 * and the label layer are decorative (aria-hidden). The list in the figure stays the accessible
 * version and is shown whenever this view is not.
 *
 * Edges are only stage i -> stage i + 1. When either side has a single component the grooves
 * run node to node (so fan-out and fan-in are literal); otherwise they bundle through a hub
 * between the lanes, meaning every component of one stage feeds the next stage.
 *
 * Motion: a short build-in, three packet cycles, then rendering stops and only resumes for
 * hover, resize and theme changes. Unlit materials only; nothing renders while off screen.
 */
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CircleGeometry, Color, EdgesGeometry, Float32BufferAttribute,
  Group, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, NormalBlending, PerspectiveCamera,
  Points, Scene, ShaderMaterial, Sphere, Vector3, WebGLRenderer,
} from 'three';

type Data = { stages: { title: string; nodes: { label: string; detail?: string }[] }[] };
type Node = { stage: number; index: number; x: number; z: number; w: number; d: number; lift: number; dim: number; el: HTMLElement; cw: number; ch: number };
type Groove = { from: number; to: number; t: number; pts: Vector3[]; len: number; core: Mesh; glow: Mesh; level: number };
type Trip = { path: Groove[]; t0: number; dur: number };

export type Controller = { settle(): void; dispose(): void; setActive(on: boolean): boolean; disposed: boolean };

declare global { interface Window { __arch3dSettle?: () => void } }

// World units. The board lies in the x/z plane (y up); stages run along +x, the near edge is +z.
const TILT = 30; // degrees the board leans back from facing the viewer
const FOV = 22; // horizontal, so the perspective stays the same in any box shape
const LANE_W = 2.6;
const GAP = 0.8; // between lanes: where grooves bend and hubs sit
const MARGIN = 0.22; // board border around the lanes
const BOARD_T = 0.22;
const LANE_T = 0.012;
const TILE_H = 0.09;
const LIFT = 0.16;
// Pixels (cards are HTML, so spacing is measured on screen).
const FIT_PX = 2;
const LANE_PAD_PX = 7;
const RIM_PX = 5;
const TILE_GAP_PX = 12;
const TOP_PX = 14;
const CHIP_GAP_PX = 12;
const BOTTOM_PX = 12;
// Seconds.
const BUILD = 1.55;
const STEP = 0.55; // delay between one stage's packets and the next
const TRAVEL = 0.95;
const CYCLES = 3;

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const WHITE = new Color(1, 1, 1);

export async function mount(fig: HTMLElement): Promise<Controller> {
  const data: Data = JSON.parse(fig.dataset.diagram!);
  const scene3d = fig.querySelector<HTMLElement>('.scene')!;
  const canvas = scene3d.querySelector<HTMLCanvasElement>('canvas')!;
  const layer = scene3d.querySelector<HTMLElement>('.labels')!;
  const settleParam = new URLSearchParams(location.search).has('settle');
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 2, 0.1, 400);
  const rig = new Group();
  scene.add(rig);

  // ---- Colours, from the page's tokens (the site follows prefers-color-scheme only).
  const css = (v: string) => new Color(getComputedStyle(fig).getPropertyValue(v).trim() || '#888');
  const col = {} as Record<'bg' | 'panel' | 'border' | 'accent' | 'text' | 'boardFar' | 'boardNear' | 'boardSide' | 'lane' | 'laneEdge' | 'tile' | 'tileEdge', Color>;
  const readColours = () => {
    const bg = css('--bg'), panel = css('--panel'), border = css('--border'), accent = css('--accent'), text = css('--text');
    const d = dark.matches;
    Object.assign(col, {
      bg, panel, border, accent, text,
      boardFar: bg.clone().lerp(panel, d ? 0.35 : 0.55),
      boardNear: bg.clone().lerp(panel, d ? 0.75 : 0.25),
      boardSide: panel.clone().lerp(border, d ? 0.45 : 0.75),
      lane: d ? panel.clone().lerp(border, 0.1) : panel.clone().lerp(border, 0.2),
      laneEdge: d ? panel.clone().lerp(border, 0.7) : panel.clone().lerp(border, 0.85),
      tile: d ? panel.clone().lerp(border, 0.45) : panel.clone().lerp(border, 0.45),
      tileEdge: d ? border.clone().lerp(text, 0.12) : border.clone().lerp(text, 0.08),
    });
  };
  readColours();

  // ---- Board: one slab with a faint far-to-near gradient baked into its vertex colours.
  const boardGeo = new BoxGeometry(1, 1, 1).translate(0, -0.5, 0);
  boardGeo.setAttribute('color', new Float32BufferAttribute(new Float32Array(boardGeo.attributes.position.count * 3), 3));
  const board = new Mesh(boardGeo, new MeshBasicMaterial({ vertexColors: true }));
  rig.add(board);
  const paintBoard = () => {
    const pos = boardGeo.attributes.position, nrm = boardGeo.attributes.normal, c = boardGeo.attributes.color as BufferAttribute;
    const tmp = new Color();
    for (let i = 0; i < pos.count; i++) {
      if (nrm.getY(i) > 0.5) tmp.lerpColors(col.boardFar, col.boardNear, pos.getZ(i) + 0.5);
      else if (nrm.getZ(i) > 0.5) tmp.copy(col.boardSide);
      else tmp.copy(col.boardSide).lerp(col.bg, 0.3);
      c.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    c.needsUpdate = true;
  };

  // ---- Lanes: one instanced slab each, plus their 1px outlines merged into one line set.
  const n = data.stages.length;
  const lanes = new InstancedMesh(new BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new MeshBasicMaterial(), n);
  rig.add(lanes);
  const laneEdgeGeo = new BufferGeometry();
  laneEdgeGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 8 * 3), 3));
  laneEdgeGeo.setAttribute('color', new Float32BufferAttribute(new Float32Array(n * 8 * 3), 3));
  const laneEdges = new LineSegments(laneEdgeGeo, new LineBasicMaterial({ vertexColors: true }));
  rig.add(laneEdges);

  // ---- Tiles: instanced boxes, shaded per face (top lighter than the sides), with merged outlines.
  const nodes: Node[] = [];
  data.stages.forEach((s, si) => s.nodes.forEach((nd, ni) => {
    const el = document.createElement('div');
    el.className = 'a3-card';
    el.innerHTML = '<span class="lbl"></span>' + (nd.detail ? '<span class="dt"></span>' : '');
    el.firstElementChild!.textContent = nd.label;
    if (nd.detail) el.lastElementChild!.textContent = nd.detail;
    el.dataset.i = String(nodes.length);
    layer.append(el);
    nodes.push({ stage: si, index: ni, x: 0, z: 0, w: 1, d: 1, lift: 0, dim: 0, el, cw: 0, ch: 0 });
  }));
  const chips = data.stages.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'a3-chip';
    el.textContent = `${String(i + 1).padStart(2, '0')} ${s.title}`;
    layer.append(el);
    return el;
  });
  const tileGeo = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  {
    const nrm = tileGeo.attributes.normal;
    const shade = new Float32Array(nrm.count * 3);
    for (let i = 0; i < nrm.count; i++) {
      const v = nrm.getY(i) > 0.5 ? 1 : nrm.getZ(i) > 0.5 ? 0.9 : 0.8;
      shade.set([v, v, v], i * 3);
    }
    tileGeo.setAttribute('color', new Float32BufferAttribute(shade, 3));
  }
  const tiles = new InstancedMesh(tileGeo, new MeshBasicMaterial({ vertexColors: true }), nodes.length);
  rig.add(tiles);
  const unitBox = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const unitEdgeGeo = new EdgesGeometry(unitBox);
  const unitEdges = unitEdgeGeo.attributes.position;
  unitBox.dispose();
  const tileEdgeGeo = new BufferGeometry();
  tileEdgeGeo.setAttribute('position', new Float32BufferAttribute(new Float32Array(nodes.length * unitEdges.count * 3), 3));
  tileEdgeGeo.setAttribute('color', new Float32BufferAttribute(new Float32Array(nodes.length * unitEdges.count * 3), 3));
  const tileEdges = new LineSegments(tileEdgeGeo, new LineBasicMaterial({ vertexColors: true }));
  rig.add(tileEdges);

  // ---- Grooves (rebuilt on layout), hubs and packets.
  const grooveGroup = new Group();
  rig.add(grooveGroup);
  let grooves: Groove[] = [];
  const hubMat = new MeshBasicMaterial({ transparent: true, depthWrite: false });
  const hubGeo = new CircleGeometry(1, 24).rotateX(-Math.PI / 2);
  const viaHub = (t: number) => data.stages[t].nodes.length > 1 && data.stages[t + 1].nodes.length > 1;

  const MAX_PACKETS = 48;
  const pGeo = new BufferGeometry();
  pGeo.setAttribute('position', new BufferAttribute(new Float32Array(MAX_PACKETS * 3), 3));
  pGeo.setAttribute('aAlpha', new BufferAttribute(new Float32Array(MAX_PACKETS), 1));
  pGeo.boundingSphere = new Sphere(new Vector3(), 100);
  const pUniforms = { uColor: { value: new Color() }, uCore: { value: new Color() }, uSize: { value: 11 }, uPR: { value: renderer.getPixelRatio() } };
  const pMat = new ShaderMaterial({
    uniforms: pUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uSize, uPR;
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uPR;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uCore;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(mix(uCore, uColor, smoothstep(0.0, 0.32, d)), vAlpha * smoothstep(0.5, 0.18, d));
        #include <colorspace_fragment>
      }`,
  });
  const packets = new Points(pGeo, pMat);
  packets.renderOrder = 3;
  packets.frustumCulled = false;
  rig.add(packets);

  const applyTheme = () => {
    readColours();
    paintBoard();
    const d = dark.matches;
    // Glow (additive) on dark; additive light vanishes on white, so normal blending in light.
    const blend = d ? AdditiveBlending : NormalBlending;
    pMat.blending = blend;
    pMat.needsUpdate = true;
    pUniforms.uColor.value.copy(col.accent);
    pUniforms.uCore.value.copy(col.accent).lerp(WHITE, d ? 0.55 : 0); // a hot core reads as glow on dark
    hubMat.color.copy(col.accent);
    for (const g of grooves) {
      (g.core.material as MeshBasicMaterial).color.copy(col.accent);
      const gm = g.glow.material as MeshBasicMaterial;
      gm.color.copy(col.accent);
      gm.blending = blend;
      gm.needsUpdate = true;
    }
  };

  // ---- Layout: cards are measured, tiles sized to sit just under them, camera fitted to the box.
  let W = 0, H = 0, D = 6, ok = false;
  const BW = n * LANE_W + (n - 1) * GAP;
  const laneX = (i: number) => -BW / 2 + i * (LANE_W + GAP) + LANE_W / 2;
  const elev = ((90 - TILT) * Math.PI) / 180;
  const v = new Vector3();
  const project = (x: number, y: number, z: number) => {
    v.set(x, y, z).applyMatrix4(rig.matrixWorld).project(camera);
    return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, behind: v.z > 1 };
  };
  // Pixels per world unit along x and along z, at depth z on the board.
  const sx = (z: number) => project(0.5, 0, z).x - project(-0.5, 0, z).x;
  const sz = (z: number) => (project(0, 0, z + 0.25).y - project(0, 0, z - 0.25).y) * 2;
  const placeCamera = (dist: number) => {
    camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
  };
  const fit = () => {
    camera.aspect = W / H;
    camera.fov = (2 * Math.atan(Math.tan((FOV * Math.PI) / 360) / camera.aspect) * 180) / Math.PI;
    camera.clearViewOffset();
    const near = D / 2 + MARGIN;
    let lo = 4, hi = 400;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      placeCamera(mid);
      const p = project(BW / 2 + MARGIN, -BOARD_T, near);
      if (p.x > W - FIT_PX) lo = mid; else hi = mid;
    }
    placeCamera(hi);
  };

  const layout = () => {
    W = scene3d.clientWidth;
    H = scene3d.clientHeight;
    if (!W || !H) return false;
    rig.position.set(0, 0, 0);
    rig.updateMatrixWorld();
    renderer.setSize(W, H, false);
    const stacks: number[] = new Array(n).fill(0);
    let chipZ = 0;
    for (let iter = 0; iter < 4; iter++) {
      fit();
      // Card widths follow the lane's width on screen at the card's depth (board centre at first).
      stacks.fill(0);
      let maxChip = 0;
      for (const nd of nodes) {
        const z = iter === 0 ? 0 : nd.z;
        const cw = Math.floor(LANE_W * sx(z) - 2 * (LANE_PAD_PX + RIM_PX));
        if (cw !== nd.cw) { nd.el.style.width = `${cw}px`; nd.cw = cw; }
      }
      chips.forEach((c) => {
        c.style.width = '';
        c.style.maxWidth = `${Math.floor(LANE_W * sx(D / 2) - 2 * LANE_PAD_PX)}px`;
        // A wrapped title keeps its box as wide as its longest line, not the whole lane.
        const r = document.createRange();
        r.selectNodeContents(c);
        const lines = [...r.getClientRects()];
        if (lines.length > 1) c.style.width = `${Math.ceil(Math.max(...lines.map((q) => q.width)) + c.offsetWidth - c.clientWidth + 16)}px`;
        maxChip = Math.max(maxChip, c.offsetHeight);
      });
      for (const nd of nodes) nd.ch = nd.el.offsetHeight;
      const k = sz(0);
      // Stack each lane's tiles along z (first component farthest), then size the board to the tallest lane.
      for (const nd of nodes) {
        nd.d = (nd.ch + 2 * RIM_PX) / k;
        stacks[nd.stage] += nd.d + (nd.index ? TILE_GAP_PX / k : 0);
      }
      const top = TOP_PX / k, chip = (CHIP_GAP_PX + maxChip + BOTTOM_PX) / k;
      const content = Math.max(...stacks);
      D = top + content + chip;
      const farZ = -D / 2 + top;
      chipZ = D / 2 - chip + CHIP_GAP_PX / k;
      for (let s = 0; s < n; s++) {
        let z = farZ + (content - stacks[s]) / 2;
        for (const nd of nodes.filter((q) => q.stage === s)) {
          nd.z = z + nd.d / 2;
          nd.x = laneX(s);
          nd.w = (nd.cw + 2 * RIM_PX) / sx(nd.z);
          z += nd.d + TILE_GAP_PX / k;
        }
      }
    }
    // Centre the board vertically in the box (shifting the view keeps the perspective).
    const top = project(0, 0, -D / 2 - MARGIN).y;
    const bottom = project(BW / 2 + MARGIN, -BOARD_T, D / 2 + MARGIN).y;
    camera.setViewOffset(W, H, 0, Math.round((top + bottom) / 2 - H / 2), W, H);
    camera.updateProjectionMatrix();
    chips.forEach((c, i) => { c.dataset.x = String(laneX(i) - LANE_W / 2 + LANE_PAD_PX / sx(chipZ)); c.dataset.z = String(chipZ); });

    board.scale.set(BW + 2 * MARGIN, BOARD_T, D + 2 * MARGIN);
    const m = new Matrix4();
    const lp = laneEdgeGeo.attributes.position as BufferAttribute;
    for (let i = 0; i < n; i++) {
      const x0 = laneX(i) - LANE_W / 2, x1 = x0 + LANE_W, z0 = -D / 2, z1 = D / 2, y = LANE_T + 0.001;
      lanes.setMatrixAt(i, m.makeScale(LANE_W, LANE_T, D).setPosition(laneX(i), 0, 0));
      [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]].forEach(([a, b, c, d], j) => {
        lp.setXYZ(i * 8 + j * 2, a, y, b);
        lp.setXYZ(i * 8 + j * 2 + 1, c, y, d);
      });
    }
    lanes.instanceMatrix.needsUpdate = true;
    lp.needsUpdate = true;
    buildGrooves();
    applyTheme();
    return (bottom - top) <= H - 8;
  };

  const curve = (x0: number, z0: number, x1: number, z1: number) => {
    const pts: Vector3[] = [];
    const dx = (x1 - x0) * 0.5;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, u = 1 - t;
      pts.push(new Vector3(
        u * u * u * x0 + 3 * u * u * t * (x0 + dx) + 3 * u * t * t * (x1 - dx) + t * t * t * x1,
        LANE_T + 0.004,
        u * u * u * z0 + 3 * u * u * t * z0 + 3 * u * t * t * z1 + t * t * t * z1,
      ));
    }
    return pts;
  };
  // A flat ribbon along the curve; the glow fades to transparent at both sides.
  const ribbon = (pts: Vector3[], width: number, soft: boolean) => {
    const pos: number[] = [], colr: number[] = [];
    const side = (i: number) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
      return [-tz / l, tx / l];
    };
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = side(i), [bx, bz] = side(i + 1), p = pts[i], q = pts[i + 1], h = width / 2;
      const P = (pt: Vector3, nx: number, nz: number, o: number) => [pt.x + nx * o, pt.y, pt.z + nz * o];
      const quads: [number, number, number, number][] = soft ? [[-h, 0, 0, 1], [0, h, 1, 0]] : [[-h, h, 1, 1]];
      for (const [o0, o1, a0, a1] of quads) {
        const v00 = P(p, ax, az, o0), v01 = P(p, ax, az, o1), v10 = P(q, bx, bz, o0), v11 = P(q, bx, bz, o1);
        // Counter-clockwise seen from above (+y), so the ribbon faces the camera.
        pos.push(...v00, ...v11, ...v10, ...v00, ...v01, ...v11);
        colr.push(1, 1, 1, a0, 1, 1, 1, a1, 1, 1, 1, a0, 1, 1, 1, a0, 1, 1, 1, a1, 1, 1, 1, a1);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new Float32BufferAttribute(colr, 4));
    return g;
  };

  const buildGrooves = () => {
    for (const g of grooves) {
      g.core.geometry.dispose(); g.glow.geometry.dispose();
      (g.core.material as MeshBasicMaterial).dispose(); (g.glow.material as MeshBasicMaterial).dispose();
    }
    grooveGroup.clear();
    grooves = [];
    const k = sx(0);
    const add = (from: number, to: number, t: number, x0: number, z0: number, x1: number, z1: number) => {
      const pts = curve(x0, z0, x1, z1);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
      const core = new Mesh(ribbon(pts, 2 / k, false), new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
      const glow = new Mesh(ribbon(pts, 12 / k, true), new MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
      core.renderOrder = 2; glow.renderOrder = 1;
      grooveGroup.add(glow, core);
      grooves.push({ from, to, t, pts, len, core, glow, level: 1 });
    };
    const right = (nd: Node) => nd.x + nd.w / 2, left = (nd: Node) => nd.x - nd.w / 2;
    for (let t = 0; t < n - 1; t++) {
      const a = nodes.filter((q) => q.stage === t), b = nodes.filter((q) => q.stage === t + 1);
      if (!viaHub(t)) {
        for (const u of a) for (const w of b) add(nodes.indexOf(u), nodes.indexOf(w), t, right(u), u.z, left(w), w.z);
        continue;
      }
      const hx = laneX(t) + LANE_W / 2 + GAP / 2;
      const hz = [...a, ...b].reduce((s, q) => s + q.z, 0) / (a.length + b.length);
      for (const u of a) add(nodes.indexOf(u), -1 - t, t, right(u), u.z, hx, hz);
      for (const w of b) add(-1 - t, nodes.indexOf(w), t, hx, hz, left(w), w.z);
      const hub = new Mesh(hubGeo, hubMat);
      hub.position.set(hx, LANE_T + 0.006, hz);
      hub.scale.setScalar(3.5 / k);
      hub.renderOrder = 2;
      grooveGroup.add(hub);
    }
  };

  // ---- Animation state.
  let time = 0; // seconds animated (only advances while rendering)
  let buildDone = false;
  let cyclesLeft = CYCLES;
  let nextCycle = BUILD;
  let trips: Trip[] = [];
  let focus = -1;

  const pathsFrom = (i: number) => {
    const out: Groove[][] = [];
    for (const g of grooves) {
      if (g.from !== i) continue;
      if (g.to >= 0) out.push([g]);
      else for (const h of grooves) if (h.from === g.to) out.push([g, h]);
    }
    return out;
  };
  const pathsInto = (i: number) => {
    const out: Groove[][] = [];
    for (const g of grooves) {
      if (g.to !== i) continue;
      if (g.from >= 0) out.push([g]);
      else for (const h of grooves) if (h.to === g.from) out.push([h, g]);
    }
    return out;
  };
  // One cycle: a wave left to right. A single component fans out to all its targets at once;
  // through a hub each component sends one packet on to one of the next stage's components.
  const cycle = (t0: number) => {
    for (let t = 0; t < n - 1; t++) {
      const start = t0 + t * STEP;
      for (const nd of nodes.filter((q) => q.stage === t)) {
        const i = nodes.indexOf(nd);
        const ps = pathsFrom(i);
        if (viaHub(t)) trips.push({ path: ps[Math.floor(Math.random() * ps.length)], t0: start, dur: TRAVEL * 1.15 });
        else for (const p of ps) trips.push({ path: p, t0: start, dur: TRAVEL });
      }
    }
  };

  const related = (i: number, j: number) => {
    if (i === j) return true;
    const a = nodes[i], b = nodes[j];
    if (Math.abs(a.stage - b.stage) !== 1) return false;
    const t = Math.min(a.stage, b.stage);
    return viaHub(t) || data.stages[a.stage].nodes.length === 1 || data.stages[b.stage].nodes.length === 1;
  };
  const grooveTouches = (g: Groove, i: number) => {
    if (g.from === i || g.to === i) return true;
    // The other half of a hub bundle the focused component feeds or is fed by.
    const st = nodes[i].stage;
    if (g.from < 0 && g.t === st && viaHub(st)) return true;
    if (g.to < 0 && g.t === st - 1 && viaHub(st - 1)) return true;
    return false;
  };

  const setFocus = (i: number) => {
    if (i === focus) return;
    focus = i;
    nodes.forEach((nd, j) => nd.el.classList.toggle('dim', i >= 0 && !related(i, j)));
    nodes.forEach((nd, j) => nd.el.classList.toggle('on', i === j));
    chips.forEach((c) => c.classList.toggle('dim', i >= 0));
    if (i >= 0) {
      const inc = pathsInto(i), out = pathsFrom(i);
      for (const p of inc) trips.push({ path: p, t0: time, dur: TRAVEL * p.length * 0.6 });
      for (const p of out) trips.push({ path: p, t0: time + (inc.length ? 0.55 : 0), dur: TRAVEL * p.length * 0.6 });
    }
    kick();
  };

  // ---- Per-frame drawing.
  const tmpC = new Color(), edgeC = new Color();
  const m4 = new Matrix4();
  const grooveTarget = (g: Groove) => (focus < 0 ? 1 : grooveTouches(g, focus) ? 2 : 0);
  const approach = (cur: number, target: number, dt: number, rate = 12) => {
    const next = cur + (target - cur) * (1 - Math.exp(-rate * dt));
    return Math.abs(next - target) < 0.002 ? target : next;
  };

  const draw = (dt: number) => {
    let busy = false;
    const b = buildDone ? 1 : time / BUILD;
    if (!buildDone) busy = true;
    rig.position.y = -0.35 * (1 - ease(b * 3));
    rig.updateMatrixWorld();
    const d = dark.matches;

    // Lanes appear left to right.
    const lc = laneEdgeGeo.attributes.color as BufferAttribute;
    for (let i = 0; i < n; i++) {
      const p = buildDone ? 1 : ease((time - 0.12 - i * 0.1) / 0.4);
      lanes.setColorAt(i, tmpC.lerpColors(col.boardFar, col.lane, p));
      tmpC.lerpColors(col.boardFar, col.laneEdge, p);
      for (let j = 0; j < 8; j++) lc.setXYZ(i * 8 + j, tmpC.r, tmpC.g, tmpC.b);
      chips[i].style.opacity = String(p);
    }
    lc.needsUpdate = true;
    if (lanes.instanceColor) lanes.instanceColor.needsUpdate = true;

    // Tiles drop in by stage, then lift and dim with focus.
    const tp = tileEdgeGeo.attributes.position as BufferAttribute, tc = tileEdgeGeo.attributes.color as BufferAttribute;
    nodes.forEach((nd, i) => {
      const p = buildDone ? 1 : ease((time - 0.32 - nd.stage * 0.13 - nd.index * 0.04) / 0.45);
      const liftT = focus === i ? 1 : 0;
      const dimT = focus >= 0 && !related(focus, i) ? 1 : 0;
      nd.lift = approach(nd.lift, liftT, dt);
      nd.dim = approach(nd.dim, dimT, dt);
      if (nd.lift !== liftT || nd.dim !== dimT) busy = true;
      const y = LANE_T + (1 - p) * 0.4 + nd.lift * LIFT;
      m4.makeScale(nd.w, TILE_H, nd.d).setPosition(nd.x, y, nd.z);
      tiles.setMatrixAt(i, m4);
      const fade = p * (1 - nd.dim * 0.65);
      tiles.setColorAt(i, tmpC.lerpColors(col.lane, col.tile, fade));
      const ec = edgeC.lerpColors(col.lane, col.tileEdge, fade);
      const base = i * unitEdges.count;
      for (let j = 0; j < unitEdges.count; j++) {
        v.fromBufferAttribute(unitEdges, j).applyMatrix4(m4);
        tp.setXYZ(base + j, v.x, v.y, v.z);
        tc.setXYZ(base + j, ec.r, ec.g, ec.b);
      }
      if (!buildDone) nd.el.style.opacity = String(p);
    });
    tiles.instanceMatrix.needsUpdate = true;
    if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
    tp.needsUpdate = true;
    tc.needsUpdate = true;

    // Grooves draw along their curve, stage by stage; the focused component's brighten.
    for (const g of grooves) {
      const p = buildDone ? 1 : ease((time - 0.62 - g.t * 0.16 - (g.from < 0 ? 0.2 : 0)) / 0.45);
      const segs = g.pts.length - 1;
      g.core.geometry.setDrawRange(0, Math.round(p * segs) * 6);
      g.glow.geometry.setDrawRange(0, Math.round(p * segs) * 12);
      const target = grooveTarget(g);
      g.level = approach(g.level, target, dt);
      if (g.level !== target) busy = true;
      const lv = g.level;
      const coreA = lv < 1 ? 0.14 + 0.5 * lv : 0.64 + 0.36 * (lv - 1);
      const glowA = (lv < 1 ? 0.04 + 0.14 * lv : 0.18 + 0.22 * (lv - 1)) * (d ? 1 : 0.7);
      (g.core.material as MeshBasicMaterial).opacity = coreA;
      (g.glow.material as MeshBasicMaterial).opacity = glowA;
    }
    hubMat.opacity = (buildDone ? 1 : ease((time - 0.8) / 0.4)) * (focus >= 0 ? 0.5 : 0.9);

    // Packets.
    if (buildDone && cyclesLeft > 0 && time >= nextCycle) {
      cycle(nextCycle);
      cyclesLeft--;
      nextCycle += (n - 1) * STEP + TRAVEL * 0.9 + 0.25;
    }
    if (cyclesLeft > 0) busy = true;
    const pp = pGeo.attributes.position as BufferAttribute, pa = pGeo.attributes.aAlpha as BufferAttribute;
    trips = trips.filter((tr) => time < tr.t0 + tr.dur);
    let k = 0;
    for (const tr of trips) {
      if (k >= MAX_PACKETS) break;
      const u = (time - tr.t0) / tr.dur;
      if (u < 0) { busy = true; continue; }
      busy = true;
      const total = tr.path.reduce((s, g) => s + g.len, 0);
      let dist = inOut(u) * total;
      let g = tr.path[0];
      for (const q of tr.path) { g = q; if (dist <= q.len) break; dist -= q.len; }
      const f = clamp01(dist / g.len) * (g.pts.length - 1), i0 = Math.floor(f), i1 = Math.min(g.pts.length - 1, i0 + 1);
      v.lerpVectors(g.pts[i0], g.pts[i1], f - i0);
      pp.setXYZ(k, v.x, v.y + 0.01, v.z);
      pa.setX(k, Math.min(1, u / 0.08, (1 - u) / 0.08));
      k++;
    }
    for (let j = k; j < MAX_PACKETS; j++) pa.setX(j, 0);
    pp.needsUpdate = true;
    pa.needsUpdate = true;

    renderer.render(scene, camera);
    placeLabels();
    return busy;
  };

  // Labels follow their anchors on whole pixels.
  const placeLabels = () => {
    for (const nd of nodes) {
      const p = project(nd.x, LANE_T + TILE_H + nd.lift * LIFT, nd.z);
      nd.el.style.visibility = p.behind ? 'hidden' : '';
      nd.el.style.transform = `translate3d(${Math.round(p.x - nd.cw / 2)}px, ${Math.round(p.y - nd.ch / 2)}px, 0)`;
    }
    chips.forEach((c) => {
      const p = project(Number(c.dataset.x), LANE_T, Number(c.dataset.z));
      c.style.visibility = p.behind ? 'hidden' : '';
      c.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
    });
  };

  // ---- Loop: runs only while something moves, the figure is on screen and the tab is visible.
  let raf = 0, last = 0, onScreen = false, active = false, disposed = false, readyMarked = false;
  const frame = (now: number) => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    time += dt;
    if (!buildDone && time >= BUILD) {
      buildDone = true;
      nodes.forEach((nd) => { nd.el.style.opacity = ''; });
    }
    const busy = draw(dt);
    if (buildDone && !readyMarked) { readyMarked = true; requestAnimationFrame(() => { fig.dataset.arch3d = 'ready'; }); }
    if (busy) kick(); else last = 0;
  };
  function kick() {
    if (!raf && active && ok && onScreen && !document.hidden && !disposed) raf = requestAnimationFrame(frame);
  }
  const renderOnce = () => { if (active && ok && !disposed) { draw(0); kick(); } };

  const settle = () => {
    time = Math.max(time, BUILD);
    buildDone = true;
    cyclesLeft = 0;
    trips = [];
    nodes.forEach((nd) => { nd.el.style.opacity = ''; });
    renderOnce();
    readyMarked = true;
    fig.dataset.arch3d = 'ready';
  };

  // ---- Interaction (fine pointer only): hover a card or a tile.
  const hit = (e: PointerEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.a3-card');
    if (card) return Number(card.dataset.i);
    const r = scene3d.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / W) * 2 - 1, ny = 1 - ((e.clientY - r.top) / H) * 2;
    const o = camera.position, dir = new Vector3(nx, ny, 0.5).unproject(camera).sub(o).normalize();
    const y0 = LANE_T + TILE_H;
    if (Math.abs(dir.y) < 1e-6) return -1;
    const s = (y0 - o.y) / dir.y, hx = o.x + dir.x * s, hz = o.z + dir.z * s;
    return nodes.findIndex((nd) => Math.abs(hx - nd.x) <= nd.w / 2 && Math.abs(hz - nd.z) <= nd.d / 2);
  };
  const onMove = (e: PointerEvent) => { if (fine.matches && e.pointerType !== 'touch' && buildDone) setFocus(hit(e)); };
  const onLeave = () => setFocus(-1);
  scene3d.addEventListener('pointermove', onMove);
  scene3d.addEventListener('pointerleave', onLeave);

  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    kick();
  });
  io.observe(scene3d);
  const onVis = () => kick();
  document.addEventListener('visibilitychange', onVis);
  // Shown only when the board fits the reserved box; otherwise the list stays.
  const show = () => {
    ok = layout();
    fig.classList.toggle('is-3d', ok);
    if (ok) renderOnce();
    return ok;
  };
  const ro = new ResizeObserver(() => { if (active) show(); });
  ro.observe(scene3d);
  const onTheme = () => { applyTheme(); renderOnce(); };
  dark.addEventListener('change', onTheme);

  const ctl: Controller = {
    disposed: false,
    settle,
    // Active = the 3D view is the one shown (wide enough, not switched to the list).
    setActive(on: boolean) {
      if (on === active || disposed) return ok;
      active = on;
      if (!on) {
        setFocus(-1);
        fig.classList.remove('is-3d');
        if (raf) cancelAnimationFrame(raf);
        raf = 0; last = 0;
        return false;
      }
      if (show() && settleParam) settle();
      return ok;
    },
    dispose() {
      if (disposed) return;
      disposed = ctl.disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      dark.removeEventListener('change', onTheme);
      scene3d.removeEventListener('pointermove', onMove);
      scene3d.removeEventListener('pointerleave', onLeave);
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((x) => x.dispose());
      });
      unitEdgeGeo.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      layer.replaceChildren();
      fig.classList.remove('is-3d');
      delete fig.dataset.arch3d;
    },
  };

  // Compile shaders before the build-in, so its first frames don't stall.
  layout();
  await renderer.compileAsync(scene, camera);
  const prev = window.__arch3dSettle;
  window.__arch3dSettle = () => { prev?.(); if (active) settle(); };
  return ctl;
}
