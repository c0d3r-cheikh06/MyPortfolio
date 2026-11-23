/**
 * CHEIKH.EXE — Studio-Grade Realistic Human Bust Builder (CC0 MakeHuman hm08 Base)
 * ---------------------------------------------------------------------------------
 * Uses the MakeHuman / MPFB2 CC0 1.0 Universal anatomical quad mesh (`base.obj`),
 * real anatomical morph targets (`african-male-young`, `head-oval`, almond eyes,
 * full lips, medium nose, confident jaw), Catmull-Clark subdivision, barycentric-fitted
 * MakeHuman `high-poly` eyeballs, sculpted short coily tapered-fade hair conformed
 * directly to the cranial scalp, and a tailored black zipped jacket over a light-grey
 * crew-neck t-shirt conformed to the upright anatomical torso.
 *
 * Asset license: MakeHuman hm08 base mesh, targets & eyes are CC0 1.0 Universal.
 * Output:
 *   public/models/cheikh-avatar.glb   (sub-3MB studio-quality human bust)
 *   public/models/cheikh-strokes.json (precision biometric laser scan contours)
 */

import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { writeGLB } from "./avatar/glb.mjs";

const MH_DIR =
  "C:/Users/chkth/.gemini/antigravity-cli/brain/3149b568-17ed-44fe-a3de-774233d6208b/scratch/makehuman";
const OUT_DIR = path.join(process.cwd(), "public", "models");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ───────────────────── math & color helpers ─────────────────────
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const lin = (hex) =>
  [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
const mix3 = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function hash3(i, j, k) {
  let h = (i * 374761393 + j * 668265263 + k * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function vnoise(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const fx = x - ix,
    fy = y - iy,
    fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx),
    uy = fy * fy * (3 - 2 * fy),
    uz = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(
      l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), ux),
      l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), ux),
      uy
    ),
    l(
      l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), ux),
      l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), ux),
      uy
    ),
    uz
  );
}

function worley(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  let best = 9;
  for (let k = -1; k <= 1; k++)
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = ix + i,
          cy = iy + j,
          cz = iz + k;
        const dx = cx + hash3(cx, cy, cz) - x;
        const dy = cy + hash3(cy, cz, cx) - y;
        const dz = cz + hash3(cz, cx, cy) - z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < best) best = d;
      }
  return Math.sqrt(best);
}

// ───────────────────── 1. Parse MakeHuman base.obj ─────────────────────
function parseOBJ(filePath) {
  const txt = fs.readFileSync(filePath, "utf8");
  const verts = [];
  const uvs = [];
  const groups = {};
  let curG = "default";

  for (const raw of txt.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    if (l.startsWith("v ")) {
      const p = l.split(/\s+/);
      verts.push([+p[1], +p[2], +p[3]]);
    } else if (l.startsWith("vt ")) {
      const p = l.split(/\s+/);
      uvs.push([+p[1], +p[2]]);
    } else if (l.startsWith("g ")) {
      curG = l.slice(2).trim();
    } else if (l.startsWith("f ")) {
      const toks = l.split(/\s+/).slice(1);
      const faceV = [];
      const faceVT = [];
      for (const tok of toks) {
        const parts = tok.split("/");
        faceV.push(parseInt(parts[0], 10) - 1);
        faceVT.push(parts[1] ? parseInt(parts[1], 10) - 1 : -1);
      }
      (groups[curG] ||= []).push({ v: faceV, vt: faceVT });
    }
  }
  return { verts, uvs, groups };
}

function applyTarget(verts, fileName, weight) {
  const full = path.join(MH_DIR, fileName);
  if (!fs.existsSync(full)) {
    console.warn("  [skip missing target]", fileName);
    return;
  }
  const txt = zlib.gunzipSync(fs.readFileSync(full)).toString("utf8");
  for (const raw of txt.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    const p = l.split(/\s+/);
    if (p.length === 4) {
      const idx = parseInt(p[0], 10);
      if (verts[idx]) {
        verts[idx][0] += +p[1] * weight;
        verts[idx][1] += +p[2] * weight;
        verts[idx][2] += +p[3] * weight;
      }
    }
  }
}

// ───────────────────── Catmull-Clark Subdivision (quad-preserving) ─────────────────────
function catmullClark(verts, faces, iterations = 1) {
  let V = verts.map((p) => [...p]);
  let F = faces.map((f) => [...f]);

  for (let it = 0; it < iterations; it++) {
    const nV = V.length;
    const nF = F.length;

    // Face points
    const facePts = F.map((f) => {
      const s = [0, 0, 0];
      for (const vi of f) {
        s[0] += V[vi][0];
        s[1] += V[vi][1];
        s[2] += V[vi][2];
      }
      return [s[0] / f.length, s[1] / f.length, s[2] / f.length];
    });

    // Edge map -> adjacent faces & edge midpoints
    const edgeKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
    const edges = new Map();
    const vertFaces = Array.from({ length: nV }, () => []);
    const vertEdges = Array.from({ length: nV }, () => new Set());

    for (let fi = 0; fi < nF; fi++) {
      const f = F[fi];
      for (let i = 0; i < f.length; i++) {
        const a = f[i],
          b = f[(i + 1) % f.length];
        vertFaces[a].push(fi);
        const k = edgeKey(a, b);
        if (!edges.has(k)) edges.set(k, { a, b, faces: [], ptIdx: -1 });
        edges.get(k).faces.push(fi);
        vertEdges[a].add(k);
        vertEdges[b].add(k);
      }
    }

    const newV = [];
    // Compute updated original vertex positions
    for (let vi = 0; vi < nV; vi++) {
      const adjF = vertFaces[vi];
      const adjE = [...vertEdges[vi]];
      const boundaryE = adjE.filter((k) => edges.get(k).faces.length === 1);
      if (boundaryE.length >= 2) {
        // Boundary crease rule
        let sx = V[vi][0] * 0.75,
          sy = V[vi][1] * 0.75,
          sz = V[vi][2] * 0.75;
        const w = 0.25 / boundaryE.length;
        for (const k of boundaryE) {
          const e = edges.get(k);
          const o = e.a === vi ? e.b : e.a;
          sx += V[o][0] * w;
          sy += V[o][1] * w;
          sz += V[o][2] * w;
        }
        newV.push([sx, sy, sz]);
      } else if (adjF.length > 0 && adjE.length > 0) {
        const n = adjF.length;
        const Favg = [0, 0, 0];
        for (const fi of adjF) {
          Favg[0] += facePts[fi][0];
          Favg[1] += facePts[fi][1];
          Favg[2] += facePts[fi][2];
        }
        Favg[0] /= n;
        Favg[1] /= n;
        Favg[2] /= n;

        const Ravg = [0, 0, 0];
        for (const k of adjE) {
          const e = edges.get(k);
          Ravg[0] += (V[e.a][0] + V[e.b][0]) * 0.5;
          Ravg[1] += (V[e.a][1] + V[e.b][1]) * 0.5;
          Ravg[2] += (V[e.a][2] + V[e.b][2]) * 0.5;
        }
        Ravg[0] /= adjE.length;
        Ravg[1] /= adjE.length;
        Ravg[2] /= adjE.length;

        const p = V[vi];
        newV.push([
          (Favg[0] + 2 * Ravg[0] + (n - 3) * p[0]) / n,
          (Favg[1] + 2 * Ravg[1] + (n - 3) * p[1]) / n,
          (Favg[2] + 2 * Ravg[2] + (n - 3) * p[2]) / n,
        ]);
      } else {
        newV.push([...V[vi]]);
      }
    }

    // Append face points
    const facePtBase = newV.length;
    for (const fp of facePts) newV.push(fp);

    // Append edge points
    for (const e of edges.values()) {
      e.ptIdx = newV.length;
      if (e.faces.length === 2) {
        const f0 = facePts[e.faces[0]],
          f1 = facePts[e.faces[1]];
        newV.push([
          (V[e.a][0] + V[e.b][0] + f0[0] + f1[0]) * 0.25,
          (V[e.a][1] + V[e.b][1] + f0[1] + f1[1]) * 0.25,
          (V[e.a][2] + V[e.b][2] + f0[2] + f1[2]) * 0.25,
        ]);
      } else {
        newV.push([
          (V[e.a][0] + V[e.b][0]) * 0.5,
          (V[e.a][1] + V[e.b][1]) * 0.5,
          (V[e.a][2] + V[e.b][2]) * 0.5,
        ]);
      }
    }

    // Build refined quads
    const newF = [];
    for (let fi = 0; fi < nF; fi++) {
      const f = F[fi];
      const fpIdx = facePtBase + fi;
      for (let i = 0; i < f.length; i++) {
        const curr = f[i];
        const next = f[(i + 1) % f.length];
        const prev = f[(i + f.length - 1) % f.length];
        const eNext = edges.get(edgeKey(curr, next)).ptIdx;
        const ePrev = edges.get(edgeKey(prev, curr)).ptIdx;
        newF.push([curr, eNext, fpIdx, ePrev]);
      }
    }
    V = newV;
    F = newF;
  }
  return { verts: V, faces: F };
}

function computeNormals(verts, tris) {
  const n = new Float32Array(verts.length * 3);
  for (let i = 0; i < tris.length; i += 3) {
    const a = tris[i],
      b = tris[i + 1],
      c = tris[i + 2];
    const va = verts[a],
      vb = verts[b],
      vc = verts[c];
    const ux = vb[0] - va[0],
      uy = vb[1] - va[1],
      uz = vb[2] - va[2];
    const vx = vc[0] - va[0],
      vy = vc[1] - va[1],
      vz = vc[2] - va[2];
    const nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    n[a * 3] += nx;
    n[a * 3 + 1] += ny;
    n[a * 3 + 2] += nz;
    n[b * 3] += nx;
    n[b * 3 + 1] += ny;
    n[b * 3 + 2] += nz;
    n[c * 3] += nx;
    n[c * 3 + 1] += ny;
    n[c * 3 + 2] += nz;
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l;
    n[i + 1] /= l;
    n[i + 2] /= l;
  }
  return n;
}

function triangulate(faces) {
  const idx = [];
  for (const f of faces) {
    if (f.length === 3) idx.push(f[0], f[1], f[2]);
    else if (f.length === 4) idx.push(f[0], f[1], f[2], f[0], f[2], f[3]);
    else {
      for (let i = 1; i < f.length - 1; i++) idx.push(f[0], f[i], f[i + 1]);
    }
  }
  return new Uint32Array(idx);
}

/** Fast approximate vertex ambient occlusion + mean curvature from 1-ring mesh neighborhood */
function computeMeshAOandCurv(verts, normals, faces) {
  const nV = verts.length;
  const adj = Array.from({ length: nV }, () => new Set());
  for (const f of faces) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i],
        b = f[(i + 1) % f.length];
      adj[a].add(b);
      adj[b].add(a);
    }
  }
  const ao = new Float32Array(nV);
  const curv = new Float32Array(nV);
  for (let i = 0; i < nV; i++) {
    const s = adj[i];
    if (s.size === 0) {
      ao[i] = 1;
      curv[i] = 0.5;
      continue;
    }
    const p = verts[i];
    const nx = normals[i * 3],
      ny = normals[i * 3 + 1],
      nz = normals[i * 3 + 2];
    let avgDot = 0;
    let avgProj = 0;
    for (const u of s) {
      const q = verts[u];
      const dx = q[0] - p[0],
        dy = q[1] - p[1],
        dz = q[2] - p[2];
      const l = Math.hypot(dx, dy, dz) || 1;
      // Positive dot => neighbor lies in front of normal => concave crevice => darker AO!
      const d = (dx * nx + dy * ny + dz * nz) / l;
      avgDot += d;
      avgProj += dx * nx + dy * ny + dz * nz;
    }
    avgDot /= s.size;
    avgProj /= s.size;
    ao[i] = clamp(1.0 - Math.max(0, avgDot) * 2.1, 0.25, 1.0);
    curv[i] = clamp(0.5 - avgProj * 180, 0, 1);
  }
  return { ao, curv };
}

function toFlatPositions(verts) {
  const out = new Float32Array(verts.length * 3);
  for (let i = 0; i < verts.length; i++) {
    out[i * 3] = verts[i][0];
    out[i * 3 + 1] = verts[i][1];
    out[i * 3 + 2] = verts[i][2];
  }
  return out;
}

// ───────────────────── MAIN BUILD ─────────────────────
console.log("▶ Loading MakeHuman hm08 CC0 anatomical base mesh...");
const base = parseOBJ(path.join(MH_DIR, "3dobjs__base.obj"));
const V = base.verts.map((p) => [...p]);

// Apply CC0 anatomical morph targets matching Cheikh's physical description:
// young Black male, slightly elongated oval face, calm dark almond eyes,
// medium nose, full lips, clean-shaven, confident jaw
const morphs = [
  ["targets__macrodetails__african-male-young.target.gz", 1.0],
  ["targets__head__head-oval.target.gz", 0.45],
  ["targets__head__head-scale-vert-incr.target.gz", 0.16],
  ["targets__eyes__l-eye-corner2-up.target.gz", 0.45],
  ["targets__eyes__r-eye-corner2-up.target.gz", 0.45],
  ["targets__eyes__l-eye-height2-decr.target.gz", 0.18],
  ["targets__eyes__r-eye-height2-decr.target.gz", 0.18],
  ["targets__mouth__mouth-upperlip-volume-incr.target.gz", 0.25],
  ["targets__mouth__mouth-lowerlip-volume-incr.target.gz", 0.28],
  ["targets__nose__nose-width2-incr.target.gz", 0.1],
  ["targets__eyebrows__eyebrows-angle-down.target.gz", 0.1],
  ["targets__chin__chin-prominent-incr.target.gz", 0.2],
];
for (const [file, w] of morphs) applyTarget(V, file, w);

// Find anatomical eye centers & shoulder pivots (in MakeHuman decimeters)
function groupCenter(name) {
  const faces = base.groups[name] || [];
  const seen = new Set();
  const s = [0, 0, 0];
  for (const f of faces)
    for (const vi of f.v) {
      if (!seen.has(vi)) {
        seen.add(vi);
        s[0] += V[vi][0];
        s[1] += V[vi][1];
        s[2] += V[vi][2];
      }
    }
  return [s[0] / seen.size, s[1] / seen.size, s[2] / seen.size];
}

const eyeL_dm = groupCenter("joint-l-eye");
const eyeR_dm = groupCenter("joint-r-eye");
const shoulderL_dm = groupCenter("joint-l-shoulder");
const shoulderR_dm = groupCenter("joint-r-shoulder");

// Origin in dm: x=0, y = eye line, z = center of cranium (~0.52 dm)
const originDM = [0, (eyeL_dm[1] + eyeR_dm[1]) * 0.5, 0.52];
const toMeters = (p) => [
  (p[0] - originDM[0]) * 0.1,
  (p[1] - originDM[1]) * 0.1,
  (p[2] - originDM[2]) * 0.1,
];

// Fit MakeHuman high-poly eyeballs BEFORE posing arms (uses unmodified head vertices!)
function buildFittedEyes() {
  const eyeObj = parseOBJ(path.join(MH_DIR, "mh__eyes__high-poly__high-poly.obj"));
  const mhcloLines = fs
    .readFileSync(path.join(MH_DIR, "mh__eyes__high-poly__high-poly.mhclo"), "utf8")
    .split(/\r?\n/);

  let xScale = 1,
    yScale = 1,
    zScale = 1;
  const bindings = [];
  let inVerts = false;
  for (const raw of mhcloLines) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    const p = l.split(/\s+/);
    if (p[0] === "x_scale") {
      const a = V[+p[1]],
        b = V[+p[2]];
      xScale = Math.abs(a[0] - b[0]) / +p[3];
    } else if (p[0] === "y_scale") {
      const a = V[+p[1]],
        b = V[+p[2]];
      yScale = Math.abs(a[1] - b[1]) / +p[3];
    } else if (p[0] === "z_scale") {
      const a = V[+p[1]],
        b = V[+p[2]];
      zScale = Math.abs(a[2] - b[2]) / +p[3];
    } else if (p[0] === "verts") {
      inVerts = true;
    } else if (inVerts) {
      if (p.length === 9) {
        bindings.push([+p[0], +p[1], +p[2], +p[3], +p[4], +p[5], +p[6], +p[7], +p[8]]);
      } else if (p.length === 1 && !Number.isNaN(+p[0])) {
        bindings.push([+p[0]]);
      }
    }
  }

  const fittedM = [];
  for (let i = 0; i < eyeObj.verts.length; i++) {
    const b = bindings[i];
    if (!b) {
      fittedM.push(toMeters(eyeObj.verts[i]));
      continue;
    }
    if (b.length === 1) {
      fittedM.push(toMeters(V[b[0]]));
    } else {
      const v0 = V[b[0]],
        v1 = V[b[1]],
        v2 = V[b[2]];
      const px = v0[0] * b[3] + v1[0] * b[4] + v2[0] * b[5] + b[6] * xScale;
      const py = v0[1] * b[3] + v1[1] * b[4] + v2[1] * b[5] + b[7] * yScale;
      const pz = v0[2] * b[3] + v1[2] * b[4] + v2[2] * b[5] + b[8] * zScale;
      fittedM.push(toMeters([px, py, pz]));
    }
  }

  const allFaces = Object.values(eyeObj.groups).flat().map((f) => f.v);
  const tris = triangulate(allFaces);
  const normals = computeNormals(fittedM, tris);
  const eyeLM = toMeters(eyeL_dm);
  const eyeRM = toMeters(eyeR_dm);

  const SCLERA = lin(0xdad4cc);
  const IRIS = lin(0x23130a);
  const IRIS_RIM = lin(0x110804);
  const PUPIL = lin(0x030202);
  const colors = new Float32Array(fittedM.length * 4);
  const uvs = new Float32Array(fittedM.length * 2);

  for (let i = 0; i < fittedM.length; i++) {
    const p = fittedM[i];
    const center = p[0] >= 0 ? eyeLM : eyeRM;
    const dx = p[0] - center[0],
      dy = p[1] - center[1],
      dz = p[2] - center[2];
    const l = Math.hypot(dx, dy, dz) || 1;
    const deg = (Math.acos(clamp(dz / l, -1, 1)) * 180) / Math.PI;
    let col;
    if (deg < 10.5) col = PUPIL;
    else if (deg < 28.5) {
      const t = (deg - 10.5) / 18;
      const fib = 0.84 + 0.16 * Math.sin(Math.atan2(dy, dx) * 38);
      col = mix3(IRIS, IRIS_RIM, Math.pow(t, 2.5)).map((c) => c * fib);
    } else if (deg < 31) col = mix3(IRIS_RIM, SCLERA, (deg - 28.5) / 2.5);
    else col = mix3(SCLERA, lin(0x9a8f88), smoothstep(55, 95, deg));
    colors.set([col[0], col[1], col[2], 1.0], i * 4);
    uvs[i * 2] = deg < 30 ? 0.9 : 0.1;
    uvs[i * 2 + 1] = 0.5;
  }

  return {
    name: "Eyes",
    positions: toFlatPositions(fittedM),
    normals,
    indices: tris,
    colors,
    uvs,
    material: { name: "eyes", roughness: 0.08, metalness: 0.05 },
  };
}

const eyesMesh = buildFittedEyes();
console.log(`  Eyes fitted: ${eyesMesh.positions.length / 3} verts`);

// Smoothly lower A-pose upper arms into natural upright ID-portrait stance
const ARM_DROP_ANGLE = 0.44; // ~25 degrees downward toward torso sides
for (let i = 0; i < V.length; i++) {
  const p = V[i];
  const ax = Math.abs(p[0]);
  if (ax > 1.45 && p[1] < 7.2 && p[1] > 1.0) {
    const side = p[0] >= 0 ? 1 : -1;
    const pivot = side > 0 ? shoulderL_dm : shoulderR_dm;
    // Smooth blend from deltoid into arm
    const w = smoothstep(1.5, 2.45, ax) * smoothstep(7.15, 6.1, p[1]);
    const ang = -side * ARM_DROP_ANGLE * w;
    const dx = p[0] - pivot[0],
      dy = p[1] - pivot[1];
    const c = Math.cos(ang),
      s = Math.sin(ang);
    p[0] = pivot[0] + dx * c - dy * s;
    p[1] = pivot[1] + dx * s + dy * c;
  }
}

// Extract bust faces from `body` group (head, neck, shoulders, upper chest; cut cleanly at y >= 3.65 dm)
const CUT_Y_DM = 3.65;
const bodyFacesRaw = base.groups["body"];
const keptFaces = [];
const oldToNew = new Map();
const bustVertsM = [];

for (const f of bodyFacesRaw) {
  // Keep face if at least one vertex is in bust region and none are far down arms
  let minY = Infinity,
    maxX = 0;
  for (const vi of f.v) {
    minY = Math.min(minY, V[vi][1]);
    maxX = Math.max(maxX, Math.abs(V[vi][0]));
  }
  if (minY < CUT_Y_DM || maxX > 3.1) continue;
  const nf = [];
  for (const vi of f.v) {
    let ni = oldToNew.get(vi);
    if (ni === undefined) {
      ni = bustVertsM.length;
      oldToNew.set(vi, ni);
      bustVertsM.push(toMeters(V[vi]));
    }
    nf.push(ni);
  }
  keptFaces.push(nf);
}

console.log(`  Bust base: ${bustVertsM.length} verts, ${keptFaces.length} quads -> Catmull-Clark subdiv...`);
const sub = catmullClark(bustVertsM, keptFaces, 1);
const bodyV = sub.verts;
const bodyF = sub.faces;
const bodyTris = triangulate(bodyF);
const bodyNormals = computeNormals(bodyV, bodyTris);
const { ao: bodyAO, curv: bodyCurv } = computeMeshAOandCurv(bodyV, bodyNormals, bodyF);
console.log(`  Subdivided bust: ${bodyV.length} verts, ${bodyTris.length / 3} tris`);

// Find actual eye & mouth landmarks in meters for accurate albedo masks (eyebrows, lips, hairline)
const eyeLM = toMeters(eyeL_dm);
const eyeX = Math.abs(eyeLM[0]); // ~0.0293m
const eyeZ = eyeLM[2]; // ~0.078m
const headMaxY = Math.max(...bodyV.map((p) => p[1])); // ~0.11m
const bustMinY = Math.min(...bodyV.map((p) => p[1])); // ~-0.52m
console.log(`  Landmarks (m): eyeX=${eyeX.toFixed(4)} eyeZ=${eyeZ.toFixed(4)} headTop=${headMaxY.toFixed(4)} bustBottom=${bustMinY.toFixed(4)}`);

// ───────────────────── 2. Realistic Dark-Brown Skin Vertex Colors ─────────────────────
const SKIN = lin(0x523120);
const SKIN_DARK = lin(0x371f13);
const SKIN_WARM = lin(0x663c27);
const LIP_UP = lin(0x43231f);
const LIP_LOW = lin(0x562f2b);
const BROW = lin(0x0f0a08);

function browCoverage(x, y, z) {
  const ax = Math.abs(x);
  if (z < eyeZ - 0.015 || y < 0.009 || y > 0.044) return 0;
  // Natural full masculine black eyebrows sitting cleanly on the MakeHuman brow ridge
  const u = (ax - (eyeX + 0.003)) / 0.0245;
  const archY = 0.0235 + 0.0036 * (1 - (u - 0.2) * (u - 0.2));
  const thick = 0.0062 * (1.0 - 0.36 * smoothstep(0.1, 1.0, u));
  const v = (y - archY) / thick;
  const d = u * u + v * v;
  return 1 - smoothstep(0.45, 1.02, d);
}

function lipCoverage(x, y, z) {
  const ax = Math.abs(x);
  if (z < eyeZ + 0.008 || y > -0.05 || y < -0.105 || ax > 0.032) return 0;
  const u = ax / 0.0265;
  // Upper & lower full lips centered around y ≈ -0.076m on MakeHuman african-male-young
  const cy = -0.0755 + 0.0025 * u * u;
  const halfH = 0.0138 * Math.sqrt(Math.max(0, 1 - u * u * 0.92));
  const v = Math.abs(y - cy) / Math.max(0.001, halfH);
  return 1 - smoothstep(0.68, 1.08, v);
}

// Hairline height function fitted tightly to MakeHuman head proportions
function hairlineY(x, z) {
  const ax = Math.abs(x);
  // Crisp natural masculine line-up across forehead (~0.060m), clean temple corners, natural fade above ears
  if (z > 0.014) {
    const temple = smoothstep(0.044, 0.060, ax);
    return 0.060 - 0.016 * temple + 0.06 * (z - 0.065);
  }
  return 0.024 + 0.65 * z;
}

const skinColors = new Float32Array(bodyV.length * 4);
const skinUvs = new Float32Array(bodyV.length * 2);

for (let i = 0; i < bodyV.length; i++) {
  const [x, y, z] = bodyV[i];
  const ax = Math.abs(x);
  let col = SKIN;

  const n1 = vnoise(x * 260, y * 260, z * 260);
  const n2 = vnoise(x * 55 + 4, y * 55, z * 55);
  col = mix3(col, SKIN_DARK, 0.22 * n2 + 0.1 * n1);

  // Warm cheek & nose-bridge undertone
  const warmMask =
    smoothstep(0.05, 0.0, Math.abs(ax - 0.036) + Math.abs(y + 0.025)) *
    smoothstep(0.03, 0.08, z);
  col = mix3(col, SKIN_WARM, 0.34 * warmMask);

  // Subtle orbital / eyelid darkening
  const eyeDist = Math.hypot((ax - eyeX) * 0.85, y * 2.0);
  col = mix3(col, SKIN_DARK, 0.42 * smoothstep(0.019, 0.004, eyeDist) * smoothstep(0.04, 0.075, z));

  // Subtle fade shadow near hairline & under chin
  const hl = hairlineY(x, z);
  col = mix3(col, SKIN_DARK, 0.48 * smoothstep(-0.012, 0.006, y - hl));
  col = mix3(col, SKIN_DARK, 0.25 * smoothstep(-0.11, -0.17, y));

  // Full lips coloration
  const lm = lipCoverage(x, y, z);
  if (lm > 0) {
    const isLower = smoothstep(-0.073, -0.080, y);
    col = mix3(col, mix3(LIP_UP, LIP_LOW, isLower), lm * 0.92);
  }

  // Thick black eyebrows
  const bm = browCoverage(x, y, z);
  if (bm > 0) {
    const hairTex = 0.8 + 0.2 * vnoise(x * 1600, y * 700, z * 700);
    col = mix3(col, BROW, clamp(bm * 1.15, 0, 1) * hairTex);
  }

  skinColors.set([col[0], col[1], col[2], bodyAO[i]], i * 4);
  skinUvs[i * 2] = Math.max(bm, lm * 0.65);
  skinUvs[i * 2 + 1] = bodyCurv[i];
}

// ───────────────────── 3. Sculpted Short Coily Tapered-Fade Hair (razor-clean hairline, organic coily dome) ─────────────────────
function buildCoilyHair() {
  // Include a comfortable margin below the hairline so we sink outer rim smoothly into the skull -> ZERO jagged edges!
  const hairFacesRaw = [];
  const vMap = new Map();
  const basePts = [];

  const nearScalp = (i) => {
    const [x, y, z] = bodyV[i];
    const ax = Math.abs(x);
    if (y < -0.075) return false;
    if (ax > 0.066 && y < 0.016 && z < 0.028 && z > -0.045) return false;
    return y >= hairlineY(x, z) - 0.018;
  };

  for (const f of bodyF) {
    if (!f.some(nearScalp)) continue;
    const nf = [];
    for (const vi of f) {
      let ni = vMap.get(vi);
      if (ni === undefined) {
        ni = basePts.length;
        vMap.set(vi, ni);
        basePts.push([...bodyV[vi]]);
      }
      nf.push(ni);
    }
    hairFacesRaw.push(nf);
  }

  // 1 Catmull-Clark refinement for fine tight kinky/coily curl clusters
  const subH = catmullClark(basePts, hairFacesRaw, 1);
  const hv = subH.verts;
  const hf = subH.faces;
  const hTris = triangulate(hf);
  const rawNorms = computeNormals(hv, hTris);

  // Displace smoothly: vertices BELOW hairline sink slightly (-2.5mm) inside the skull so the
  // intersection between scalp & hair forms a razor-smooth continuous curved hairline!
  const displaced = hv.map((p, i) => {
    const [x, y, z] = p;
    const ax = Math.abs(x);
    const nx = rawNorms[i * 3],
      ny = rawNorms[i * 3 + 1],
      nz = rawNorms[i * 3 + 2];

    const hl = hairlineY(x, z);
    const above = y - hl;
    const earDist = Math.hypot((ax - 0.075) * 1.15, (y + 0.015) * 0.9, (z + 0.010) * 0.9);
    const earClear = smoothstep(0.024, 0.038, earDist);

    // Smooth mask transitioning from sunken (-0.0025m) right at hairline to natural fade
    const coverage = smoothstep(-0.003, 0.010, above) * earClear;
    if (coverage <= 0.001) {
      return [x - nx * 0.003, y - ny * 0.003, z - nz * 0.003];
    }

    // Natural short coily tapered fade:
    //   - Short sleek tapered sides (2.5–4.5 mm)
    //   - Rounded, natural slightly fuller height on top (13–17 mm — realistic, NOT a tall cylinder!)
    const topMask = smoothstep(0.056, 0.106, y) * smoothstep(0.072, 0.026, ax);
    const backTaper = smoothstep(-0.08, 0.02, z);
    const thick =
      -0.0028 * (1 - coverage) +
      coverage * (0.0032 + 0.0135 * topMask * (0.72 + 0.28 * backTaper));

    // Fine natural tight kinky/coily texture via dual-scale 3D Worley cells
    const freq = 1 / 0.0046;
    const w1 = worley(x * freq, y * freq, z * freq);
    const w2 = worley(x * freq * 2.15 + 5.7, y * freq * 2.15, z * freq * 2.15);
    const curlAmp = (0.0014 + 0.0032 * topMask) * coverage;
    const curl = (0.56 - w1) * curlAmp + (0.50 - w2) * curlAmp * 0.42;

    const total = thick + curl;
    const crownSoftLift = 0.0038 * topMask * coverage;
    return [x + nx * total, y + ny * total + crownSoftLift, z + nz * total];
  });

  const normals = computeNormals(displaced, hTris);
  const { ao, curv } = computeMeshAOandCurv(displaced, normals, hf);
  const HAIR_COL = lin(0x0d0a09);
  const colors = new Float32Array(displaced.length * 4);
  const uvs = new Float32Array(displaced.length * 2);

  for (let i = 0; i < displaced.length; i++) {
    const [x, y, z] = displaced[i];
    const n = 0.78 + 0.44 * vnoise(x * 480, y * 480, z * 480);
    const c = HAIR_COL.map((v) => v * n);
    colors.set([c[0], c[1], c[2], ao[i]], i * 4);
    uvs[i * 2] = 0.55;
    uvs[i * 2 + 1] = curv[i];
  }

  return {
    name: "Hair",
    positions: toFlatPositions(displaced),
    normals,
    indices: hTris,
    colors,
    uvs,
    material: { name: "hair", roughness: 0.90, metalness: 0.02 },
  };
}

const hairMesh = buildCoilyHair();
console.log(`  Coily Hair built: ${hairMesh.positions.length / 3} verts`);

// ───────────────────── 4. Razor-Clean Tailored T-Shirt + Black Zipped Jacket ─────────────────────
/**
 * Clips a triangle mesh cleanly along an exact implicit boundary function `signedFn(p) >= 0`
 * (using exact edge intersection interpolation!) -> produces 100% smooth tailored seams with ZERO stair-stepping!
 */
function clipTrianglesSmooth(verts, tris, signedFn) {
  const outV = [];
  const outT = [];
  const vCache = new Map();
  const edgeCache = new Map();

  const addOrig = (i) => {
    let ni = vCache.get(i);
    if (ni === undefined) {
      ni = outV.length;
      vCache.set(i, ni);
      outV.push([...verts[i]]);
    }
    return ni;
  };

  const addCut = (ia, ib, fa, fb) => {
    const key = ia < ib ? `${ia}_${ib}` : `${ib}_${ia}`;
    let ni = edgeCache.get(key);
    if (ni === undefined) {
      const t = fa / (fa - fb);
      const a = verts[ia],
        b = verts[ib];
      ni = outV.length;
      edgeCache.set(key, ni);
      outV.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ]);
    }
    return ni;
  };

  const vals = new Float32Array(verts.length);
  for (let i = 0; i < verts.length; i++) vals[i] = signedFn(verts[i]);

  for (let i = 0; i < tris.length; i += 3) {
    const i0 = tris[i],
      i1 = tris[i + 1],
      i2 = tris[i + 2];
    const f0 = vals[i0],
      f1 = vals[i1],
      f2 = vals[i2];
    const inside = [f0 >= 0, f1 >= 0, f2 >= 0];
    const count = (inside[0] ? 1 : 0) + (inside[1] ? 1 : 0) + (inside[2] ? 1 : 0);
    if (count === 0) continue;
    if (count === 3) {
      outT.push(addOrig(i0), addOrig(i1), addOrig(i2));
    } else if (count === 1) {
      const rot = inside[0] ? [i0, i1, i2] : inside[1] ? [i1, i2, i0] : [i2, i0, i1];
      const [a, b, c] = rot;
      const ab = addCut(a, b, vals[a], vals[b]);
      const ac = addCut(a, c, vals[a], vals[c]);
      outT.push(addOrig(a), ab, ac);
    } else {
      const rot = !inside[0] ? [i0, i1, i2] : !inside[1] ? [i1, i2, i0] : [i2, i0, i1];
      const [outI, b, c] = rot;
      const ab = addCut(outI, b, vals[outI], vals[b]);
      const ac = addCut(outI, c, vals[outI], vals[c]);
      const nb = addOrig(b),
        nc = addOrig(c);
      outT.push(nb, nc, ac, nb, ac, ab);
    }
  }
  return { verts: outV, tris: new Uint32Array(outT) };
}

function finalizeGarment(name, verts, tris, offsetFn, colorFn, matSpec) {
  const baseNormals = computeNormals(verts, tris);
  const moved = verts.map((p, i) =>
    offsetFn(p, [baseNormals[i * 3], baseNormals[i * 3 + 1], baseNormals[i * 3 + 2]])
  );
  const normals = computeNormals(moved, tris);
  // Build face list for AO/curv
  const faces = [];
  for (let i = 0; i < tris.length; i += 3) faces.push([tris[i], tris[i + 1], tris[i + 2]]);
  const { ao, curv } = computeMeshAOandCurv(moved, normals, faces);
  const colors = new Float32Array(moved.length * 4);
  const uvs = new Float32Array(moved.length * 2);
  for (let i = 0; i < moved.length; i++) {
    const c = colorFn(moved[i]);
    colors.set([c[0], c[1], c[2], ao[i]], i * 4);
    uvs[i * 2] = 0.14;
    uvs[i * 2 + 1] = curv[i];
  }
  return {
    name,
    positions: toFlatPositions(moved),
    normals,
    indices: tris,
    colors,
    uvs,
    material: { ...matSpec, doubleSided: true },
  };
}

// 4A. Light-Grey Crew-Neck T-Shirt (smooth clipped curved neckline sitting naturally at collarbone)
const teeNeckY = (p) => -0.158 - 0.044 * smoothstep(-0.02, 0.075, p[2]);
const TEE_COL = lin(0x9ea4ac);
const teeClipped = clipTrianglesSmooth(bodyV, bodyTris, (p) => {
  const belowNeck = teeNeckY(p) - p[1];
  const inChest = 0.175 - Math.abs(p[0]);
  return Math.min(belowNeck, inChest);
});
const tshirtMesh = finalizeGarment(
  "Tshirt",
  teeClipped.verts,
  teeClipped.tris,
  (p, n) => {
    const neckDist = Math.max(0, teeNeckY(p) - p[1]);
    const rib = smoothstep(0.016, 0.0, neckDist) * 0.0045;
    const off = 0.0055 + rib + 0.0008 * (vnoise(p[0] * 35, p[1] * 35, p[2] * 35) - 0.5);
    return [p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off];
  },
  (p) => TEE_COL.map((v) => v * (0.94 + 0.08 * vnoise(p[0] * 260, p[1] * 260, p[2] * 260))),
  { name: "tshirt", roughness: 0.90, metalness: 0.02 }
);

// 4B. Tailored Black Zipped Jacket (smooth clipped crisp V-opening + structured stand collar!)
const jacketTopY = (p) => -0.132 - 0.022 * smoothstep(-0.03, 0.07, p[2]);
const jacketOpenHalfW = (y) => 0.002 + 0.074 * smoothstep(-0.335, -0.155, y);
const JACKET_COL = lin(0x14171c);

// First clip smoothly at top collar line, then clip smoothly along the crisp front V-opening!
const jackTopClipped = clipTrianglesSmooth(bodyV, bodyTris, (p) => jacketTopY(p) - p[1]);
const jackFinalClipped = clipTrianglesSmooth(jackTopClipped.verts, jackTopClipped.tris, (p) => {
  if (p[2] <= 0.005 || p[1] <= -0.335) return 0.08;
  return Math.abs(p[0]) - jacketOpenHalfW(p[1]);
});

const jacketMesh = finalizeGarment(
  "Jacket",
  jackFinalClipped.verts,
  jackFinalClipped.tris,
  (p, n) => {
    const topY = jacketTopY(p);
    const collarMask = smoothstep(0.048, 0.0, Math.max(0, topY - p[1]));
    const lapelEdge =
      p[2] > 0.01 && p[1] > -0.34
        ? smoothstep(0.022, 0.0, Math.abs(Math.abs(p[0]) - jacketOpenHalfW(p[1])))
        : 0;
    const shoulderStructure =
      smoothstep(0.10, 0.21, Math.abs(p[0])) * smoothstep(-0.36, -0.20, p[1]) * 0.0065;
    const fold = 0.0014 * (vnoise(p[0] * 20, p[1] * 14, p[2] * 20) - 0.5);
    const off = 0.0145 + shoulderStructure + collarMask * 0.0045 + lapelEdge * 0.0035 + fold;
    return [p[0] + n[0] * off, p[1] + n[1] * off + collarMask * 0.012, p[2] + n[2] * off];
  },
  (p) => JACKET_COL.map((v) => v * (0.92 + 0.16 * vnoise(p[0] * 340, p[1] * 340, p[2] * 340))),
  { name: "jacket", roughness: 0.62, metalness: 0.10 }
);

// Metallic Zipper Teeth + Slider along the front midline of the black jacket
function buildZipper() {
  const pos = [],
    nor = [],
    idx = [];
  const addBox = (cx, cy, cz, sx, sy, sz) => {
    const baseI = pos.length / 3;
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
        pos.push(
          cx + (n[0] + u[0] * a + v[0] * b) * sx * 0.5,
          cy + (n[1] + u[1] * a + v[1] * b) * sy * 0.5,
          cz + (n[2] + u[2] * a + v[2] * b) * sz * 0.5
        );
        nor.push(...n);
      }
      const o = baseI + k * 4;
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
      k++;
    }
  };

  // Find front centerline z(y) from jacket vertices near x=0
  const centerVerts = [];
  for (let i = 0; i < jacketMesh.positions.length; i += 3) {
    const x = jacketMesh.positions[i],
      y = jacketMesh.positions[i + 1],
      z = jacketMesh.positions[i + 2];
    if (Math.abs(x) < 0.022 && z > 0.02) centerVerts.push([y, z]);
  }
  const frontZAt = (y) => {
    let bestZ = 0.1,
      bestD = 1e9;
    for (const [vy, vz] of centerVerts) {
      const d = Math.abs(vy - y);
      if (d < bestD) {
        bestD = d;
        bestZ = vz;
      }
    }
    return bestZ;
  };

  const zipTop = -0.342;
  for (let y = bustMinY + 0.012, step = 0; y < zipTop; y += 0.0028, step++) {
    const z = frontZAt(y) + 0.0022;
    addBox(step % 2 ? 0.0012 : -0.0012, y, z, 0.0042, 0.0015, 0.0022);
  }
  const zt = frontZAt(zipTop) + 0.0035;
  addBox(0, zipTop - 0.004, zt, 0.0085, 0.012, 0.0045); // slider body
  addBox(0, zipTop - 0.017, zt + 0.002, 0.0052, 0.019, 0.0015); // metallic pull tab

  const nV = pos.length / 3;
  const colors = new Float32Array(nV * 4);
  const metalCol = lin(0x90969e);
  for (let i = 0; i < nV; i++) colors.set([...metalCol, 1], i * 4);
  return {
    name: "Zipper",
    positions: new Float32Array(pos),
    normals: new Float32Array(nor),
    indices: new Uint32Array(idx),
    colors,
    uvs: new Float32Array(nV * 2),
    material: { name: "zipper", roughness: 0.28, metalness: 0.95 },
  };
}

const zipperMesh = buildZipper();
console.log(
  `  Garments: Tshirt=${tshirtMesh.positions.length / 3}v, Jacket=${jacketMesh.positions.length / 3}v, Zipper=${zipperMesh.positions.length / 3}v`
);

// ───────────────────── 5. Precision Horizontal Biometric Scan Rings (real mesh slices!) ─────────────────────
function buildPrecisionScanContours() {
  const allPos = [bodyV, ...[hairMesh, jacketMesh].map((m) => {
    const arr = [];
    for (let i = 0; i < m.positions.length; i += 3)
      arr.push([m.positions[i], m.positions[i + 1], m.positions[i + 2]]);
    return arr;
  })].flat();

  const strokes = [];
  const round = (v) => Math.round(v * 10000) / 10000;

  // Slice clean horizontal topographic contour rings from bust bottom to hair crown
  for (let y = bustMinY + 0.02; y < headMaxY + 0.03; y += 0.022) {
    const band = allPos.filter((p) => Math.abs(p[1] - y) < 0.006);
    if (band.length < 24) continue;
    // Bin by azimuth angle around center of slice -> clean continuous anatomical silhouette contour!
    const bins = 64;
    const sumR = new Float32Array(bins);
    const cnt = new Uint16Array(bins);
    let cz = 0;
    for (const p of band) cz += p[2];
    cz /= band.length;

    for (const p of band) {
      const ang = Math.atan2(p[0], p[2] - cz);
      const bi = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * bins) % bins;
      const r = Math.hypot(p[0], p[2] - cz);
      if (r > sumR[bi]) sumR[bi] = r; // outer silhouette envelope
      cnt[bi]++;
    }
    const pts = [];
    for (let b = 0; b < bins; b++) {
      if (cnt[b] === 0) continue;
      const ang = ((b + 0.5) / bins) * Math.PI * 2 - Math.PI;
      const r = sumR[b] + 0.0018;
      pts.push(round(Math.sin(ang) * r), round(y), round(cz + Math.cos(ang) * r));
    }
    if (pts.length >= 24) {
      const group = y < -0.17 ? 7 : y < 0.055 ? 5 : 6;
      strokes.push({ g: group, c: 1, p: pts });
    }
  }
  return strokes;
}

const skinMesh = {
  name: "Skin",
  positions: toFlatPositions(bodyV),
  normals: bodyNormals,
  indices: bodyTris,
  colors: skinColors,
  uvs: skinUvs,
  material: { name: "skin", color: [1, 1, 1, 1], roughness: 0.58, metalness: 0.02 },
};

const meshes = [skinMesh, eyesMesh, hairMesh, tshirtMesh, jacketMesh, zipperMesh];
const glbPath = path.join(OUT_DIR, "cheikh-avatar.glb");
const size = writeGLB(glbPath, meshes, {
  generator: "CHEIKH.EXE MakeHuman CC0 studio bust pipeline",
});
console.log(`✓ Wrote cheikh-avatar.glb (${(size / 1e6).toFixed(2)} MB)`);

// Also copy as lite fallback so any reference works cleanly without swapping geometries mid-session
fs.copyFileSync(glbPath, path.join(OUT_DIR, "cheikh-avatar-lite.glb"));

const strokes = buildPrecisionScanContours();
const strokesJson = JSON.stringify({
  version: 2,
  units: "m",
  groups: ["scan", "eyes", "brows", "nose", "lips", "face", "hair", "clothes"],
  strokes,
});
fs.writeFileSync(path.join(OUT_DIR, "cheikh-strokes.json"), strokesJson);
console.log(`✓ Wrote cheikh-strokes.json (${strokes.length} clean anatomical contour rings)`);
