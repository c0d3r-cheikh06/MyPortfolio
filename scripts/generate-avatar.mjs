/**
 * CHEIKH.EXE — avatar generator
 * Usage: node scripts/generate-avatar.mjs
 * Outputs:
 *   public/models/cheikh-avatar.glb       (high detail, desktop)
 *   public/models/cheikh-avatar-lite.glb  (reduced detail, mobile / low tier)
 *   public/models/cheikh-strokes.json     (laser stroke paths for the reconstruction)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { surfaceNets, gradient, smoothMesh } from './avatar/mesher.mjs';
import { writeGLB } from './avatar/glb.mjs';
import * as S from './avatar/sdf.mjs';

const OUT = new URL('../public/models/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const lin = (hex) => {
  const c = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return c;
};
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const SKIN = lin(0x523120);
const SKIN_DARK = lin(0x3a2115);
const SKIN_WARM = lin(0x633a27);
const LIP = lin(0x462622);
const LIP_INNER = lin(0x58302c);
const BROW = lin(0x110c0a);
const HAIR = lin(0x0c0908);
const SCLERA = lin(0xd6d0c7);
const IRIS = lin(0x28170d);
const IRIS_RIM = lin(0x140b06);
const PUPIL = lin(0x040303);
const TEE = lin(0x9a9ea4);
const JACKET = lin(0x141518);

// ───────────── vertex attributes: albedo + AO + detail + curvature ─────────────
function bakeAttributes(mesh, sdf, albedoFn, detailFn) {
  const { positions, normals } = mesh;
  const n = positions.length / 3;
  const colors = new Float32Array(n * 4);
  const uvs = new Float32Array(n * 2);
  const e = 0.0035;
  for (let v = 0; v < n; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    const nx = normals[v * 3], ny = normals[v * 3 + 1], nz = normals[v * 3 + 2];
    // ambient occlusion (SDF cone approximation) against the whole bust
    let occ = 0, w = 1;
    for (let i = 1; i <= 5; i++) {
      const h = 0.0035 * i;
      const d = S.sceneSDF(x + nx * h, y + ny * h, z + nz * h);
      occ += (h - Math.max(d, 0)) * w;
      w *= 0.62;
    }
    const ao = Math.max(0.15, Math.min(1, 1 - occ * 38));
    // mean curvature from the laplacian of the part SDF
    const c0 = sdf(x, y, z);
    const lap =
      (sdf(x + e, y, z) + sdf(x - e, y, z) + sdf(x, y + e, z) + sdf(x, y - e, z) + sdf(x, y, z + e) + sdf(x, y, z - e) - 6 * c0) /
      (e * e);
    const curv = Math.max(0, Math.min(1, 0.5 + lap / 900));
    const col = albedoFn(x, y, z, nx, ny, nz);
    colors.set([col[0], col[1], col[2], ao], v * 4);
    uvs[v * 2] = detailFn ? detailFn(x, y, z) : 0;
    uvs[v * 2 + 1] = curv;
  }
  return { ...mesh, colors, uvs };
}

const skinAlbedo = (x, y, z) => {
  let c = SKIN;
  const n1 = S.vnoise(x * 260, y * 260, z * 260);
  const n2 = S.vnoise(x * 60 + 3, y * 60, z * 60);
  c = mix(c, SKIN_DARK, 0.25 * n2 + 0.12 * n1);
  // warmer cheeks/nose, darker periphery (forehead edge, under jaw)
  const ax = Math.abs(x);
  c = mix(c, SKIN_WARM, 0.35 * S.smoothstep(0.03, 0.0, Math.abs(ax - 0.035) + Math.abs(y + 0.03) * 0.8) * S.smoothstep(0.04, 0.08, z));
  c = mix(c, SKIN_DARK, 0.35 * S.smoothstep(0.035, 0.065, y) * S.smoothstep(0.05, 0.085, z)); // hairline shadow
  c = mix(c, SKIN_DARK, 0.3 * S.smoothstep(-0.1, -0.16, y)); // neck shadow
  // eyelid / under-eye darker pigmentation
  const ex = ax - S.EYE.x, ey = y - S.EYE.y;
  c = mix(c, SKIN_DARK, 0.45 * Math.max(0, 1 - Math.sqrt(ex * ex * 0.8 + ey * ey * 2.2) / 0.016));
  // lips
  const lm = S.smoothstep(0.0012, -0.0012, S.lipsShape(x, y, z));
  if (lm > 0) {
    const inner = S.smoothstep(0.004, 0.0, Math.abs(y + 0.0853));
    c = mix(c, mix(LIP, LIP_INNER, inner * 0.6), lm);
  }
  // eyebrows
  const bm = S.browMask(x, y, z);
  if (bm > 0) {
    const hairs = 0.75 + 0.25 * S.vnoise(x * 2200, y * 600, z * 600);
    c = mix(c, BROW, bm * hairs);
  }
  return c;
};
const skinDetail = (x, y, z) => {
  const bm = S.browMask(x, y, z);
  const lm = S.smoothstep(0.0012, -0.0012, S.lipsShape(x, y, z));
  return Math.max(bm, lm * 0.6);
};

const eyeAlbedo = (x, y, z) => {
  const ax = Math.abs(x);
  const dx = ax - S.EYE.x, dy = y - S.EYE.y, dz = z - S.EYE.z;
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const ang = Math.acos(Math.max(-1, Math.min(1, dz / l)));
  const deg = (ang * 180) / Math.PI;
  if (deg < 10) return PUPIL;
  if (deg < 30) {
    const t = (deg - 10) / 20;
    const fib = 0.85 + 0.15 * Math.sin(Math.atan2(dy, dx) * 40);
    return mix(IRIS, IRIS_RIM, Math.pow(t, 3)).map((v) => v * fib);
  }
  if (deg < 32.5) return mix(IRIS_RIM, SCLERA, (deg - 30) / 2.5);
  return mix(SCLERA, lin(0x9a8f86), S.smoothstep(60, 100, deg));
};

const hairAlbedo = (x, y, z) => {
  const n = S.vnoise(x * 500, y * 500, z * 500);
  return HAIR.map((v) => v * (0.8 + 0.5 * n));
};
const teeAlbedo = (x, y, z) => TEE.map((v) => v * (0.94 + 0.06 * S.vnoise(x * 300, y * 300, z * 300)));
const jacketAlbedo = (x, y, z) => JACKET.map((v) => v * (0.9 + 0.2 * S.vnoise(x * 400, y * 400, z * 400)));

// ───────────── zipper geometry (explicit boxes) ─────────────
function boxGeo(out, cx, cy, cz, sx, sy, sz) {
  const base = out.pos.length / 3;
  const faces = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
  ];
  let k = 0;
  for (const [n, u, v] of faces) {
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = cx + (n[0] + u[0] * a + v[0] * b) * sx * 0.5;
      const py = cy + (n[1] + u[1] * a + v[1] * b) * sy * 0.5;
      const pz = cz + (n[2] + u[2] * a + v[2] * b) * sz * 0.5;
      out.pos.push(px, py, pz);
      out.nor.push(...n);
    }
    const o = base + k * 4;
    out.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    k++;
  }
}

function surfaceZ(sdf, x, y, z0 = 0.3) {
  let t = 0;
  for (let i = 0; i < 300; i++) {
    const d = sdf(x, y, z0 - t);
    if (d < 1e-5) return z0 - t;
    t += Math.max(d * 0.8, 0.0002);
    if (t > 0.6) return null;
  }
  return null;
}

function buildZipper() {
  const out = { pos: [], nor: [], idx: [] };
  const top = -0.338;
  for (let y = S.CUT_Y + 0.004, i = 0; y < top; y += 0.0021, i++) {
    const z = surfaceZ(S.jacket, 0.006, y) ?? 0.1;
    // tape
    if (i % 2 === 0) boxGeo(out, 0, y, z - 0.0004, 0.011, 0.0042, 0.0012);
    // alternating teeth
    boxGeo(out, i % 2 ? 0.0011 : -0.0011, y, z + 0.0004, 0.0042, 0.0013, 0.0018);
  }
  const zt = surfaceZ(S.jacket, 0.006, top) ?? 0.1;
  boxGeo(out, 0, top - 0.004, zt + 0.0018, 0.0075, 0.011, 0.0035); // slider
  boxGeo(out, 0, top - 0.017, zt + 0.0034, 0.0048, 0.018, 0.0012); // pull tab
  const n = out.pos.length / 3;
  const colors = new Float32Array(n * 4);
  for (let v = 0; v < n; v++) colors.set([...lin(0x8a8d90), 1], v * 4);
  return {
    positions: new Float32Array(out.pos),
    normals: new Float32Array(out.nor),
    indices: new Uint32Array(out.idx),
    colors,
    uvs: new Float32Array(n * 2),
  };
}

// ───────────── eye mesh (analytic UV sphere, both eyes) ─────────────
function buildEyes(seg = 32) {
  const pos = [], nor = [], idx = [];
  for (const side of [-1, 1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI;
      for (let j = 0; j <= seg; j++) {
        const ph = (j / seg) * Math.PI * 2;
        // pole along +z (gaze)
        const nx = Math.sin(th) * Math.cos(ph), ny = Math.sin(th) * Math.sin(ph), nz = Math.cos(th);
        pos.push(side * S.EYE.x + nx * S.EYE.r, S.EYE.y + ny * S.EYE.r, S.EYE.z + nz * S.EYE.r);
        nor.push(nx, ny, nz);
      }
    }
    for (let i = 0; i < seg; i++)
      for (let j = 0; j < seg; j++) {
        const a = base + i * (seg + 1) + j, b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), indices: new Uint32Array(idx) };
}

// ───────────── strokes (laser paths) ─────────────
const round = (v) => Math.round(v * 10000) / 10000;

function march(sdf, ox, oy, oz, dx, dy, dz, maxT = 0.6) {
  let t = 0;
  for (let i = 0; i < 400; i++) {
    const x = ox + dx * t, y = oy + dy * t, z = oz + dz * t;
    const d = sdf(x, y, z);
    if (d < 2e-5) return [x, y, z];
    t += Math.max(d * 0.85, 0.00015);
    if (t > maxT) return null;
  }
  return null;
}

function lift(sdf, p, amount = 0.0007) {
  const g = gradient(sdf, p[0], p[1], p[2], 0.0005);
  return [p[0] + g[0] * amount, p[1] + g[1] * amount, p[2] + g[2] * amount];
}

function snap(sdf, p) {
  let [x, y, z] = p;
  for (let i = 0; i < 6; i++) {
    const d = sdf(x, y, z);
    const g = gradient(sdf, x, y, z, 0.0004);
    x -= d * g[0];
    y -= d * g[1];
    z -= d * g[2];
  }
  return lift(sdf, [x, y, z]);
}

function frontProject(sdf, x, y, dir = [0, 0, -1], zTarget = 0.09) {
  const ox = x - dir[0] * 0.3, oy = y - dir[1] * 0.3, oz = zTarget - dir[2] * 0.3;
  const hit = march(sdf, ox, oy, oz, dir[0], dir[1], dir[2], 0.7);
  return hit ? lift(sdf, hit) : null;
}

function buildStrokes() {
  const strokes = [];
  const push = (g, pts, closed = false) => {
    const clean = pts.filter(Boolean);
    if (clean.length < 2) return;
    strokes.push({ g, c: closed ? 1 : 0, p: clean.flat().map(round) });
  };
  const scene = (x, y, z) => Math.min(S.headSkin(x, y, z), S.hairBase(x, y, z), S.tshirt(x, y, z), S.jacket(x, y, z), S.eyes(x, y, z));

  // 0 — horizontal scan contours, bottom to top
  for (let y = S.CUT_Y + 0.012; y < 0.16; y += 0.0115) {
    let seg = [];
    const segs = [];
    const N = 120;
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * Math.PI * 2;
      const dx = Math.sin(a), dz = Math.cos(a);
      const cz = y > -0.2 ? -0.012 : -0.0;
      const hit = march(scene, dx * 0.45, y, cz + dz * 0.45, -dx, 0, -dz, 0.46);
      if (hit) seg.push(lift(scene, hit, 0.0012));
      else if (seg.length) {
        segs.push(seg);
        seg = [];
      }
    }
    if (seg.length) segs.push(seg);
    for (const s of segs) push(0, s, false);
  }

  const skin = S.headSkin;
  const skinEyes = (x, y, z) => Math.min(S.headSkin(x, y, z), S.eyes(x, y, z));

  // 1 — eyes (almond lid lines + iris rings)
  for (const side of [-1, 1]) {
    const b = 0.0136, w = 0.0042;
    const r = (b * b / w + w) * 0.5, d = (b * b / w - w) * 0.5;
    const c = Math.cos(0.075), s = Math.sin(0.075);
    const upper = [], lower = [];
    for (let k = 0; k <= 40; k++) {
      const x = -b + (2 * b * k) / 40;
      const q = Math.sqrt(Math.max(0, r * r - x * x));
      for (const [arr, yy] of [[upper, -d + q - 0.0008], [lower, d - q - 0.0010]]) {
        const lx = x - 0.0004, ly = yy;
        const rx = lx * c - ly * s, ry = lx * s + ly * c;
        arr.push(frontProject(skinEyes, side * (S.EYE.x + rx), S.EYE.y + ry));
      }
    }
    push(1, upper);
    push(1, lower);
    const crease = [];
    for (let k = 0; k <= 30; k++) {
      const x = -0.011 + (0.022 * k) / 30;
      crease.push(frontProject(skin, side * (S.EYE.x + x), S.EYE.y + 0.0078 + 0.0004 * (1 - (x / 0.011) ** 2)));
    }
    push(1, crease);
    for (const ang of [30, 10]) {
      const ring = [];
      const t = (ang * Math.PI) / 180;
      for (let k = 0; k <= 36; k++) {
        const ph = (k / 36) * Math.PI * 2;
        const nx = Math.sin(t) * Math.cos(ph), ny = Math.sin(t) * Math.sin(ph), nz = Math.cos(t);
        const R = S.EYE.r + 0.0003;
        ring.push([side * S.EYE.x + nx * R, S.EYE.y + ny * R, S.EYE.z + nz * R]);
      }
      push(1, ring, true);
    }
  }

  // 2 — eyebrows (natural masculine arch, 3 strands each)
  for (const side of [-1, 1])
    for (const off of [-0.0020, 0, 0.0020]) {
      const pts = [];
      for (let k = 0; k <= 28; k++) {
        const ax = 0.013 + (0.042 * k) / 28;
        const u = (ax - 0.034) / 0.0215;
        const by = 0.0215 + 0.0032 * (1 - (u - 0.25) ** 2) + off * (1 - 0.35 * (k / 28));
        pts.push(frontProject(skin, side * ax, by));
      }
      push(2, pts);
    }

  // 3 — nose
  for (const side of [-1, 1]) {
    const bridge = [];
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      bridge.push(frontProject(skin, side * (0.0075 + 0.004 * t), 0.012 - 0.05 * t));
    }
    push(3, bridge);
    const ala = [];
    for (let k = 0; k <= 26; k++) {
      const a = (70 - (240 * k) / 26) * (Math.PI / 180);
      ala.push(frontProject(skin, side * (0.0135 + Math.cos(a) * 0.0105), -0.0505 + Math.sin(a) * 0.0092));
    }
    push(3, ala);
    const nostril = [];
    for (let k = 0; k <= 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      const P = [side * (0.0083 + Math.cos(a) * 0.0045), -0.059, 0.0965 + Math.sin(a) * 0.0055];
      nostril.push(snap(skin, P));
    }
    push(3, nostril, true);
  }
  {
    const tip = [];
    for (let k = 0; k <= 24; k++) {
      const a = Math.PI + (Math.PI * k) / 24;
      tip.push(frontProject(skin, Math.cos(a) * 0.011, -0.046 + Math.sin(a) * 0.009, [0, 0.35, -0.94], 0.105));
    }
    push(3, tip);
  }

  // 4 — lips
  {
    const up = [], mid = [], low = [];
    for (let k = 0; k <= 48; k++) {
      const x = -0.0245 + (0.049 * k) / 48;
      const u = Math.min(1, Math.abs(x) / 0.0245);
      const bow = 0.0012 * Math.exp(-(((Math.abs(x) - 0.0058) / 0.0035) ** 2)) - 0.0007 * Math.exp(-((x / 0.0022) ** 2));
      up.push(frontProject(skin, x, -0.0853 + 0.0148 * Math.pow(1 - u * u, 0.55) + bow + 0.9 * x * x));
      mid.push(frontProject(skin, x, -0.0853 + 0.9 * x * x));
      low.push(frontProject(skin, x * 0.96, -0.0853 - 0.0172 * Math.pow(1 - u * u, 0.7) + 0.9 * x * x));
    }
    push(4, up);
    push(4, mid);
    push(4, low);
  }

  // 5 — face outline, jaw, ears, profile
  for (const side of [-1, 1]) {
    const jaw = [];
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const P = [side * (0.072 * (1 - t) + 0.004 * t) * (1 - 0.15 * Math.sin(t * Math.PI)), -0.03 - 0.108 * Math.pow(t, 0.8), -0.004 * (1 - t) + 0.062 * t];
      jaw.push(snap(skin, P));
    }
    push(5, jaw);
    const ear = [];
    for (let k = 0; k <= 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      const ty = Math.sin(a) * 0.029, tz = Math.cos(a) * 0.0175;
      const c = Math.cos(0.2), s = Math.sin(0.2);
      const ey = ty * c + tz * s, ez = -ty * s + tz * c;
      ear.push(snap(skin, [side * 0.088, ey - 0.006, ez - 0.014]));
    }
    push(5, ear, true);
    // cheekbone accent
    const cheek = [];
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      cheek.push(frontProject(skin, side * (0.03 + 0.032 * t), -0.022 - 0.012 * Math.sin(t * Math.PI)));
    }
    push(5, cheek);
  }
  {
    // mid-sagittal profile (back of neck → crown → forehead → nose → chin)
    const prof = [];
    const sceneHead = (x, y, z) => Math.min(S.headSkin(x, y, z), S.hairBase(x, y, z));
    for (let k = 0; k <= 160; k++) {
      const a = -Math.PI * 0.95 + (Math.PI * 1.75 * k) / 160; // angle in y-z plane
      const dy = Math.sin(a), dz = Math.cos(a);
      const hit = march(sceneHead, 0, -0.01 + dy * 0.4, -0.01 + dz * 0.4, 0, -dy, -dz, 0.42);
      if (hit && hit[1] > -0.16) prof.push(lift(sceneHead, hit, 0.0012));
    }
    push(5, prof);
  }

  // 6 — hair: hairline + clean crown latitude/meridian contours
  {
    const line = [];
    for (let k = 0; k <= 120; k++) {
      const a = (k / 120) * Math.PI * 2;
      const dx = Math.sin(a), dz = Math.cos(a);
      let y = 0.05, hit = null;
      for (let it = 0; it < 6; it++) {
        hit = march(S.headSkin, dx * 0.3, y, -0.012 + dz * 0.3, -dx, 0, -dz, 0.31);
        if (!hit) break;
        y = S.hairlineY(hit[0], hit[2]) + 0.001;
      }
      if (hit) line.push(snap((x, yy, z) => Math.min(S.hairBase(x, yy, z), S.headSkin(x, yy, z)), hit));
    }
    push(6, line, true);
    // Clean horizontal contour rings across the coily hair volume
    for (const yRing of [0.085, 0.105, 0.125, 0.142]) {
      const ring = [];
      for (let k = 0; k <= 72; k++) {
        const a = (k / 72) * Math.PI * 2;
        const dx = Math.sin(a), dz = Math.cos(a);
        const hit = march(S.hairBase, dx * 0.25, yRing, -0.01 + dz * 0.25, -dx, 0, -dz, 0.26);
        if (hit && hit[1] > S.hairlineY(hit[0], hit[2]) + 0.003) ring.push(lift(S.hairBase, hit, 0.002));
      }
      if (ring.length > 8) push(6, ring, true);
    }
    // Clean sagittal/coronal crown arches
    for (let k = -2; k <= 2; k++) {
      const xOff = k * 0.025;
      const pts = [];
      for (let j = 0; j <= 44; j++) {
        const a = -0.35 * Math.PI + (0.85 * Math.PI * j) / 44;
        const dy = Math.sin(a), dz = Math.cos(a);
        const hit = march(S.hairBase, xOff, 0.04 + dy * 0.26, -0.01 + dz * 0.26, 0, -dy, -dz, 0.28);
        if (hit && hit[1] > S.hairlineY(hit[0], hit[2]) + 0.004) pts.push(lift(S.hairBase, hit, 0.0022));
      }
      push(6, pts);
    }
  }

  // 7 — clothes: opening edges, zipper line, collar, t-shirt neckline, shoulder seams
  {
    for (const side of [-1, 1]) {
      const edge = [];
      for (let y = S.CUT_Y + 0.005; y < -0.2; y += 0.004) edge.push(frontProject(S.jacket, side * (S.openingW(y) + 0.0035), y, [0, 0, -1], 0.11));
      push(7, edge);
      const seam = [];
      for (let k = 0; k <= 30; k++) {
        const t = k / 30;
        seam.push(snap(S.jacket, [side * (0.075 + 0.115 * t), -0.22 - 0.055 * t, -0.022]));
      }
      push(7, seam);
    }
    const zip = [];
    for (let y = S.CUT_Y + 0.005; y < -0.335; y += 0.004) zip.push(frontProject(S.jacket, 0.0, y, [0, 0, -1], 0.11));
    push(7, zip);
    const collar = [], tee = [];
    for (let k = 0; k <= 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      const dx = Math.sin(a), dz = Math.cos(a);
      const topY = -0.168 - 0.03 * S.smoothstep(-0.02, 0.07, -0.02 + dz * 0.08) - 0.002;
      const h = march(S.jacket, dx * 0.2, topY, -0.02 + dz * 0.2, -dx, 0, -dz, 0.2);
      if (h) collar.push(lift(S.jacket, h, 0.0015));
      const neckY = -0.212 - 0.026 * S.smoothstep(-0.01, 0.055, -0.024 + dz * 0.066) - 0.001;
      const h2 = march(S.tshirt, dx * 0.15, neckY, -0.024 + dz * 0.15, -dx, 0, -dz, 0.15);
      if (h2) tee.push(lift(S.tshirt, h2, 0.0015));
    }
    push(7, collar);
    push(7, tee);
  }

  return strokes;
}

// ───────────── main ─────────────
function partMeshes(scale, smoothIt) {
  const t0 = Date.now();
  const log = (n, m) =>
    console.log(`  ${n.padEnd(8)} verts ${String(m.positions.length / 3).padStart(7)}  tris ${String(m.indices.length / 3).padStart(7)}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const skin = smoothMesh(surfaceNets(S.headSkin, [-0.105, -0.3, -0.13], [0.105, 0.135, 0.13], 0.00125 * scale), smoothIt, 0.3);
  log('skin', skin);
  const hairM = smoothMesh(surfaceNets(S.hair, [-0.1, -0.09, -0.135], [0.1, 0.17, 0.125], 0.00135 * scale), smoothIt, 0.25);
  log('hair', hairM);
  const tee = smoothMesh(surfaceNets(S.tshirt, [-0.14, -0.48, -0.12], [0.14, -0.16, 0.13], 0.0025 * scale), smoothIt, 0.4);
  log('tshirt', tee);
  const jack = smoothMesh(surfaceNets(S.jacket, [-0.29, S.CUT_Y - 0.004, -0.17], [0.29, -0.15, 0.15], 0.0034 * scale), smoothIt, 0.4);
  log('jacket', jack);
  const eyesM = buildEyes(scale > 1 ? 20 : 32);

  return [
    { name: 'Skin', ...bakeAttributes(skin, S.headSkin, skinAlbedo, skinDetail), material: { name: 'skin', color: [1, 1, 1, 1], roughness: 0.55 } },
    { name: 'Eyes', ...bakeAttributes(eyesM, S.eyes, eyeAlbedo), material: { name: 'eyes', roughness: 0.1 } },
    { name: 'Hair', ...bakeAttributes(hairM, S.hair, hairAlbedo), material: { name: 'hair', roughness: 0.85 } },
    { name: 'Tshirt', ...bakeAttributes(tee, S.tshirt, teeAlbedo), material: { name: 'tshirt', roughness: 0.92 } },
    { name: 'Jacket', ...bakeAttributes(jack, S.jacket, jacketAlbedo), material: { name: 'jacket', roughness: 0.7 } },
    { name: 'Zipper', ...buildZipper(), material: { name: 'zipper', roughness: 0.35, metalness: 1 } },
  ];
}

const only = process.argv[2];
if (!only || only === 'hi') {
  console.log('▶ high detail');
  const size = writeGLB(new URL('cheikh-avatar.glb', OUT), partMeshes(2.0, 2));
  console.log(`  → cheikh-avatar.glb ${(size / 1e6).toFixed(2)} MB`);
}
if (!only || only === 'lite') {
  console.log('▶ lite');
  const size = writeGLB(new URL('cheikh-avatar-lite.glb', OUT), partMeshes(3.1, 2));
  console.log(`  → cheikh-avatar-lite.glb ${(size / 1e6).toFixed(2)} MB`);
}
if (!only || only === 'strokes') {
  console.log('▶ strokes');
  const strokes = buildStrokes();
  const json = JSON.stringify({ version: 1, units: 'm', groups: ['scan', 'eyes', 'brows', 'nose', 'lips', 'face', 'hair', 'clothes'], strokes });
  writeFileSync(new URL('cheikh-strokes.json', OUT), json);
  console.log(`  → ${strokes.length} strokes, ${(json.length / 1024).toFixed(0)} KB`);
}
