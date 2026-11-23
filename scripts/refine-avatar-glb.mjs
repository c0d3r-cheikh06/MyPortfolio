/**
 * CHEIKH.EXE — Studio-Grade Realistic Bust Refinement Pipeline (Idempotent)
 * -------------------------------------------------------------------------
 * Reads the untouched MakeHuman CC0 base bust (`scripts/avatar/cheikh-avatar-base.glb`)
 * and refines geometry, anatomical vertex colors (in Float32 precision!), normals,
 * coily hair crown volume & curl relief, jacket lapel thickness, and biometric scan contours.
 *
 * Outputs:
 *   public/models/cheikh-avatar.glb
 *   public/models/cheikh-avatar-lite.glb
 *   public/models/cheikh-strokes.json
 */

import fs from "node:fs";
import path from "node:path";
import { writeGLB } from "./avatar/glb.mjs";

const BASE_GLB = path.join(process.cwd(), "scripts", "avatar", "cheikh-avatar-base.glb");
const OUT_DIR = path.join(process.cwd(), "public", "models");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ───────────────────── Math & Noise Helpers ─────────────────────
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
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
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

/** Dual-distance 3D Worley cellular noise returning [F1, F2] */
function worleyF12(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  let f1 = 9;
  let f2 = 9;
  for (let k = -1; k <= 1; k++) {
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = ix + i;
        const cy = iy + j;
        const cz = iz + k;
        const dx = cx + hash3(cx, cy, cz) - x;
        const dy = cy + hash3(cy, cz, cx) - y;
        const dz = cz + hash3(cz, cx, cy) - z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) {
          f2 = d;
        }
      }
    }
  }
  return [Math.sqrt(f1), Math.sqrt(f2)];
}

// ───────────────────── Minimal GLB Reader ─────────────────────
function readGLB(filePath) {
  const buf = fs.readFileSync(filePath);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const binStart = 20 + jsonLen + 8;
  const bin = buf.subarray(binStart);

  const readAcc = (idx) => {
    const a = json.accessors[idx];
    const bv = json.bufferViews[a.bufferView];
    const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const cc = a.type === "VEC3" ? 3 : a.type === "VEC4" ? 4 : a.type === "VEC2" ? 2 : 1;
    const len = a.count * cc;
    if (a.componentType === 5126) {
      return new Float32Array(bin.buffer, bin.byteOffset + off, len).slice();
    }
    if (a.componentType === 5123) {
      return new Uint16Array(bin.buffer, bin.byteOffset + off, len).slice();
    }
    if (a.componentType === 5125) {
      return new Uint32Array(bin.buffer, bin.byteOffset + off, len).slice();
    }
    if (a.componentType === 5121) {
      const u8 = new Uint8Array(bin.buffer, bin.byteOffset + off, len);
      const f = new Float32Array(len);
      for (let i = 0; i < len; i++) f[i] = u8[i] / 255;
      return f;
    }
    throw new Error(`Unsupported accessor componentType ${a.componentType}`);
  };

  const meshes = {};
  for (const m of json.meshes) {
    const p = m.primitives[0];
    const mat = json.materials?.[p.material] ?? {};
    meshes[m.name] = {
      name: m.name,
      positions: readAcc(p.attributes.POSITION),
      normals: readAcc(p.attributes.NORMAL),
      colors: p.attributes.COLOR_0 !== undefined ? readAcc(p.attributes.COLOR_0) : null,
      uvs: p.attributes.TEXCOORD_0 !== undefined ? readAcc(p.attributes.TEXCOORD_0) : null,
      indices: new Uint32Array(readAcc(p.indices)),
      material: {
        name: mat.name ?? m.name.toLowerCase(),
        color: mat.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1],
        metalness: mat.pbrMetallicRoughness?.metallicFactor ?? 0,
        roughness: mat.pbrMetallicRoughness?.roughnessFactor ?? 0.8,
        doubleSided: !!mat.doubleSided,
      },
    };
  }
  return meshes;
}

// ───────────────────── Geometry Processing Helpers ─────────────────────
function computeSmoothNormals(positions, indices) {
  const n = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz;
    n[b] += nx; n[b + 1] += ny; n[b + 2] += nz;
    n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

function computeTriangleAOandCurv(positions, normals, indices) {
  const nV = positions.length / 3;
  const adj = Array.from({ length: nV }, () => new Set());
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i + 1], c = indices[i + 2];
    adj[a].add(b); adj[a].add(c);
    adj[b].add(a); adj[b].add(c);
    adj[c].add(a); adj[c].add(b);
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
    const px = positions[i * 3], py = positions[i * 3 + 1], pz = positions[i * 3 + 2];
    const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
    let avgDot = 0;
    let avgProj = 0;
    for (const u of s) {
      const dx = positions[u * 3] - px;
      const dy = positions[u * 3 + 1] - py;
      const dz = positions[u * 3 + 2] - pz;
      const l = Math.hypot(dx, dy, dz) || 1;
      const d = (dx * nx + dy * ny + dz * nz) / l;
      avgDot += d;
      avgProj += dx * nx + dy * ny + dz * nz;
    }
    avgDot /= s.size;
    avgProj /= s.size;
    ao[i] = clamp(1.0 - Math.max(0, avgDot) * 2.2, 0.22, 1.0);
    curv[i] = clamp(0.5 - avgProj * 185, 0, 1);
  }
  return { ao, curv };
}

/** Uniform 1-to-4 midpoint triangle subdivision (crack-free on shared edges) */
function subdivideTriangles(positions, indices) {
  const posList = Array.from(positions);
  const edgeMid = new Map();
  const getMid = (a, b) => {
    const k = a < b ? `${a}_${b}` : `${b}_${a}`;
    let m = edgeMid.get(k);
    if (m === undefined) {
      m = posList.length / 3;
      edgeMid.set(k, m);
      posList.push(
        (posList[a * 3] + posList[b * 3]) * 0.5,
        (posList[a * 3 + 1] + posList[b * 3 + 1]) * 0.5,
        (posList[a * 3 + 2] + posList[b * 3 + 2]) * 0.5
      );
    }
    return m;
  };
  const newIdx = [];
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i], i1 = indices[i + 1], i2 = indices[i + 2];
    const m01 = getMid(i0, i1);
    const m12 = getMid(i1, i2);
    const m20 = getMid(i2, i0);
    newIdx.push(i0, m01, m20, i1, m12, m01, i2, m20, m12, m01, m12, m20);
  }
  return {
    positions: new Float32Array(posList),
    indices: new Uint32Array(newIdx),
  };
}

// ───────────────────── Load Base Bust ─────────────────────
console.log("▶ Refining CHEIKH.EXE MakeHuman CC0 bust...");
const rawMeshes = readGLB(BASE_GLB);

// ───────────────────── 0. Unified Craniofacial Likeness Morph ─────────────────────
function warpHeadPoint(x, y, z) {
  const headMask = smoothstep(-0.145, -0.055, y);
  if (headMask <= 0.0001) return [x, y, z];

  const ax = Math.abs(x);
  // 1. Slender oval lower face & cheeks while gently preserving natural cheekbones
  const lowerTaper = smoothstep(0.02, -0.10, y) * smoothstep(0.02, 0.085, z);
  const cheekKeep =
    smoothstep(0.026, 0.045, ax) *
    smoothstep(-0.045, -0.015, y) *
    smoothstep(0.01, -0.015, y) *
    smoothstep(0.035, 0.070, z);
  const noseWing =
    smoothstep(0.025, 0.010, ax) *
    smoothstep(-0.060, -0.046, y) *
    smoothstep(-0.022, -0.036, y) *
    smoothstep(0.082, 0.102, z);

  const xScale = 1.0 - headMask * (0.055 + 0.045 * lowerTaper - 0.022 * cheekKeep) - 0.04 * noseWing;

  // 2. Gentle vertical oval elongation
  const yShift = headMask * (y < -0.02 ? (y + 0.02) * 0.065 : (y - 0.02) * 0.025);

  // 3. Soft lip fullness forward cushion (calm neutral closed expression)
  const lipPush =
    0.0012 *
    smoothstep(0.026, 0.012, ax) *
    smoothstep(-0.090, -0.078, y) *
    smoothstep(-0.060, -0.070, y) *
    smoothstep(0.092, 0.105, z);

  // 4. Subtle organic micro-asymmetry so the face feels genuinely human
  const asymX = (vnoise(x * 19 + 3.1, y * 19 + 1.4, z * 19) - 0.5) * 0.00045 * headMask;
  const asymY = (vnoise(x * 23 + 7.2, y * 23, z * 23 + 4.1) - 0.5) * 0.00045 * headMask;

  return [x * xScale + asymX, y + yShift + asymY, z + lipPush];
}

// ───────────────────── 1. Refine Skin (Float32 Rich Dark-Brown Skin + Almond Lids + Stippled Fade) ─────────────────────
function refineSkin(skin) {
  const rawPos = skin.positions;
  const idx = skin.indices;
  const nV = rawPos.length / 3;
  const pos = new Float32Array(rawPos.length);

  for (let i = 0; i < nV; i++) {
    let [wx, wy, wz] = warpHeadPoint(rawPos[i * 3], rawPos[i * 3 + 1], rawPos[i * 3 + 2]);
    // Calm slightly almond-shaped eye aperture applied ONLY to Skin eyelid margins (not eyeballs)
    const ax = Math.abs(wx);
    if (wz > 0.080 && ax > 0.013 && ax < 0.048) {
      const upperLidMask =
        smoothstep(0.018, 0.0, Math.abs(ax - 0.028)) *
        smoothstep(0.0005, 0.003, wy) *
        smoothstep(0.013, 0.005, wy);
      wy -= 0.0016 * upperLidMask;
      // Cushion upper lid margin forward +0.8mm so it drapes over cornea without poking through
      wz += 0.0008 * upperLidMask;

      const outerCornerLift =
        smoothstep(0.032, 0.042, ax) *
        smoothstep(0.050, 0.045, ax) *
        smoothstep(-0.009, -0.002, wy) *
        smoothstep(0.009, 0.002, wy);
      wy += 0.0012 * outerCornerLift;
    }
    pos[i * 3] = wx;
    pos[i * 3 + 1] = wy;
    pos[i * 3 + 2] = wz;
  }

  const nor = computeSmoothNormals(pos, idx);
  const { ao, curv } = computeTriangleAOandCurv(pos, nor, idx);

  const SKIN = lin(0x3a2015);
  const SKIN_DARK = lin(0x21100a);
  const SKIN_WARM = lin(0x4f2d1e);
  const LIP_UP = lin(0x2b1514);
  const LIP_LOW = lin(0x472421);
  const LIP_LINE = lin(0x130807);
  const BROW = lin(0x070505);

  const eyeX = 0.0278;
  const hairlineY = (x, z) => {
    const ax = Math.abs(x);
    if (z > 0.014) {
      const temple = smoothstep(0.040, 0.056, ax);
      return 0.060 - 0.015 * temple + 0.06 * (z - 0.065);
    }
    return 0.024 + 0.65 * z;
  };

  const browCoverage = (x, y, z) => {
    const ax = Math.abs(x);
    if (z < 0.072 || y < 0.013 || y > 0.042) return 0;
    const u = (ax - (eyeX + 0.001)) / 0.024;
    const archY = 0.025 + 0.0038 * (1 - (u - 0.14) * (u - 0.14));
    const thick = 0.0060 * (1.0 - 0.34 * smoothstep(0.15, 1.0, u));
    const v = (y - archY) / thick;
    return 1 - smoothstep(0.42, 0.98, u * u + v * v);
  };

  const lipCoverage = (x, y, z) => {
    const ax = Math.abs(x);
    if (z < 0.088 || y > -0.056 || y < -0.104 || ax > 0.030) return 0;
    const u = ax / 0.0245;
    const cy = -0.0785 + 0.0022 * u * u;
    const halfH = 0.0136 * Math.sqrt(Math.max(0, 1 - u * u * 0.92));
    const v = Math.abs(y - cy) / Math.max(0.001, halfH);
    return 1 - smoothstep(0.65, 1.05, v);
  };

  const colors = new Float32Array(nV * 4);
  const uvs = new Float32Array(nV * 2);

  for (let i = 0; i < nV; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const ax = Math.abs(x);
    let col = SKIN;

    const n1 = vnoise(x * 260, y * 260, z * 260);
    const n2 = vnoise(x * 55 + 4, y * 55, z * 55);
    col = mix3(col, SKIN_DARK, 0.22 * n2 + 0.10 * n1);

    // Warm subtle cheekbone, nose bridge & brow highlights
    const cheekWarm =
      smoothstep(0.048, 0.0, Math.abs(ax - 0.034) + Math.abs(y + 0.026)) *
      smoothstep(0.04, 0.09, z);
    const noseWarm = smoothstep(0.016, 0.0, ax) * smoothstep(-0.06, -0.01, y) * smoothstep(0.095, 0.12, z);
    col = mix3(col, SKIN_WARM, clamp(0.32 * cheekWarm + 0.22 * noseWarm, 0, 0.36));

    // Natural orbital socket depth + crisp upper-eyelash crease line
    const eyeDist = Math.hypot((ax - eyeX) * 0.85, (y + 0.001) * 1.9);
    col = mix3(col, SKIN_DARK, 0.46 * smoothstep(0.020, 0.004, eyeDist) * smoothstep(0.045, 0.08, z));
    const lashLine =
      smoothstep(0.016, 0.004, Math.abs(ax - eyeX)) *
      smoothstep(0.0005, 0.003, y) *
      smoothstep(0.0075, 0.0035, y) *
      smoothstep(0.084, 0.092, z);
    col = mix3(col, BROW, lashLine * 0.62);

    // Gradual stippled barber taper-fade below hairline across forehead, temples & nape
    const hl = hairlineY(x, z);
    const diffHL = y - hl;
    if (diffHL > -0.022) {
      const stipple = smoothstep(0.36, 0.78, vnoise(x * 1350, y * 1350, z * 1350));
      const bandT = smoothstep(-0.022, 0.005, diffHL);
      const fadeDensity = bandT * (0.28 + 0.72 * stipple);
      col = mix3(col, SKIN_DARK, 0.56 * bandT);
      col = mix3(col, BROW, 0.62 * fadeDensity * smoothstep(-0.014, 0.008, diffHL));
    }
    col = mix3(col, SKIN_DARK, 0.28 * smoothstep(-0.108, -0.16, y));

    // Full natural lips + dark mouth-parting crease
    const lm = lipCoverage(x, y, z);
    if (lm > 0) {
      const isLower = smoothstep(-0.0755, -0.0815, y);
      let lipCol = mix3(LIP_UP, LIP_LOW, isLower);
      const crease = smoothstep(0.0036, 0.0, Math.abs(y + 0.078)) * smoothstep(0.024, 0.0, ax);
      lipCol = mix3(lipCol, LIP_LINE, crease * 0.88);
      col = mix3(col, lipCol, lm * 0.94);
    }

    // Crisp full black eyebrows with subtle hair-strand frequency noise
    const bm = browCoverage(x, y, z);
    if (bm > 0) {
      const hairTex = 0.86 + 0.14 * vnoise(x * 1750, y * 760, z * 760);
      col = mix3(col, BROW, clamp(bm * 1.28, 0, 1) * hairTex);
    }

    colors.set([col[0], col[1], col[2], ao[i]], i * 4);
    uvs[i * 2] = Math.max(bm, lm * 0.65);
    uvs[i * 2 + 1] = curv[i];
  }

  return {
    ...skin,
    positions: pos,
    normals: nor,
    colors,
    uvs,
    colorFloat: true,
  };
}

// ───────────────────── 2. Refine Eyes (Deep Dark Iris, Grounded Sclera, Focused Eyelid Shadow) ─────────────────────
function refineEyes(eyes) {
  const rawPos = eyes.positions;
  const nV = rawPos.length / 3;
  const pos = new Float32Array(rawPos.length);
  const sumL = [0, 0, 0];
  const sumR = [0, 0, 0];
  let cntL = 0;
  let cntR = 0;

  for (let i = 0; i < nV; i++) {
    const [wx, wy, wz] = warpHeadPoint(rawPos[i * 3], rawPos[i * 3 + 1], rawPos[i * 3 + 2]);
    pos[i * 3] = wx;
    pos[i * 3 + 1] = wy;
    pos[i * 3 + 2] = wz;
    if (wx >= 0) {
      sumL[0] += wx; sumL[1] += wy; sumL[2] += wz; cntL++;
    } else {
      sumR[0] += wx; sumR[1] += wy; sumR[2] += wz; cntR++;
    }
  }

  const nor = computeSmoothNormals(pos, eyes.indices);
  const eyeLM = sumL.map((v) => v / Math.max(1, cntL));
  const eyeRM = sumR.map((v) => v / Math.max(1, cntR));

  const SCLERA = lin(0x948a82);
  const SCLERA_SHADE = lin(0x52453e);
  const IRIS = lin(0x1e0e06);
  const IRIS_RIM = lin(0x0a0402);
  const PUPIL = lin(0x020202);

  const colors = new Float32Array(nV * 4);
  const uvs = new Float32Array(nV * 2);

  for (let i = 0; i < nV; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const c = x >= 0 ? eyeLM : eyeRM;
    const dx = x - c[0], dy = y - c[1], dz = z - c[2];
    const l = Math.hypot(dx, dy, dz) || 1;
    const deg = (Math.acos(clamp(dz / l, -1, 1)) * 180) / Math.PI;

    let col;
    if (deg < 11.5) {
      col = PUPIL;
    } else if (deg < 30.8) {
      const t = (deg - 11.5) / 19.3;
      const fib = 0.85 + 0.15 * Math.sin(Math.atan2(dy, dx) * 44);
      col = mix3(IRIS, IRIS_RIM, Math.pow(t, 2.0)).map((v) => v * fib);
    } else if (deg < 33.4) {
      col = mix3(IRIS_RIM, SCLERA, (deg - 30.8) / 2.6);
    } else {
      col = mix3(SCLERA, SCLERA_SHADE, smoothstep(34, 72, deg));
    }

    // Grounded upper-eyelid occlusion shadow for calm, serious, focused gaze
    const lidShade = smoothstep(-0.001, 0.0095, dy);
    col = col.map((v) => v * (1.0 - lidShade * 0.66));

    colors.set([col[0], col[1], col[2], 1.0], i * 4);
    uvs[i * 2] = deg < 30.8 ? 1.0 : 0.14;
    uvs[i * 2 + 1] = 0.5;
  }

  return {
    ...eyes,
    positions: pos,
    normals: nor,
    colors,
    uvs,
    colorFloat: true,
  };
}

// ───────────────────── 3. Refine Hair (Rounded Coily Afro-Taper Crown + Organic Silhouette) ─────────────────────
function refineHair(hair) {
  console.log(`  Subdividing Hair (${hair.positions.length / 3}v -> 4x tri density)...`);
  const warpedBase = new Float32Array(hair.positions.length);
  for (let i = 0; i < hair.positions.length; i += 3) {
    const [wx, wy, wz] = warpHeadPoint(hair.positions[i], hair.positions[i + 1], hair.positions[i + 2]);
    warpedBase[i] = wx;
    warpedBase[i + 1] = wy;
    warpedBase[i + 2] = wz;
  }

  const sub = subdivideTriangles(warpedBase, hair.indices);
  const pos = sub.positions;
  const idx = sub.indices;
  const rawNor = computeSmoothNormals(pos, idx);
  const nV = pos.length / 3;

  const hairlineY = (x, z) => {
    const ax = Math.abs(x);
    if (z > 0.014) {
      const temple = smoothstep(0.040, 0.056, ax);
      return 0.060 - 0.015 * temple + 0.06 * (z - 0.065);
    }
    return 0.024 + 0.65 * z;
  };

  const displaced = new Float32Array(pos.length);
  const curlDepth = new Float32Array(nV);

  for (let i = 0; i < nV; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const ax = Math.abs(x);
    const nx = rawNor[i * 3], ny = rawNor[i * 3 + 1], nz = rawNor[i * 3 + 2];

    const hl = hairlineY(x, z);
    const above = y - hl;
    const earDist = Math.hypot((ax - 0.070) * 1.15, (y + 0.015) * 0.9, (z + 0.010) * 0.9);
    const earClear = smoothstep(0.024, 0.041, earDist);
    const coverage = smoothstep(-0.008, 0.022, above) * earClear;

    if (coverage <= 0.001) {
      displaced[i * 3] = x - nx * 0.0032;
      displaced[i * 3 + 1] = y - ny * 0.0032;
      displaced[i * 3 + 2] = z - nz * 0.0032;
      curlDepth[i] = 0.22;
      continue;
    }

    // Naturally rounded coily crown (fuller on top without a boxy flat-top) + organic contour
    const domeCurve = Math.cos(clamp(ax / 0.072, 0, 1) * Math.PI * 0.45);
    const topDome =
      smoothstep(0.036, 0.095, y) *
      smoothstep(0.088, 0.020, ax) *
      smoothstep(-0.098, 0.055, z) *
      (0.45 + 0.55 * domeCurve);

    const macroIrreg = (vnoise(x * 32 + 1.7, y * 32, z * 32 + 2.3) - 0.5) * 0.0032;
    const extraCrownPush = (0.0056 * topDome + macroIrreg * (0.4 + 0.6 * topDome)) * coverage;
    const extraUpLift = 0.0032 * topDome * coverage;

    // Multi-scale 3D Worley coily 4C curl geometry (dense visible short tight coils)
    const f1 = 1 / 0.0058;
    const [w1a, w1b] = worleyF12(x * f1, y * f1, z * f1);
    const [w2a] = worleyF12(x * f1 * 2.1 + 4.1, y * f1 * 2.1, z * f1 * 2.1);

    const puff1 = clamp(1.0 - w1a * 1.48, -0.35, 1.0);
    const crevice = smoothstep(0.015, 0.145, w1b - w1a);
    const puff2 = clamp(0.68 - w2a * 1.38, -0.3, 0.85);

    const fadeTaper = smoothstep(0.004, 0.026, above);
    const curlAmp = (0.0012 + 0.0044 * topDome) * fadeTaper * coverage;
    const rimSink = -0.0032 * (1 - smoothstep(0.0, 0.018, above));
    const baseThick = rimSink + coverage * 0.0016;
    const disp = baseThick + extraCrownPush + (puff1 * 0.62 + puff2 * 0.38) * curlAmp * (0.52 + 0.48 * crevice);

    displaced[i * 3] = x + nx * disp;
    displaced[i * 3 + 1] = y + ny * disp + extraUpLift;
    displaced[i * 3 + 2] = z + nz * disp;
    curlDepth[i] = clamp(0.28 + 0.72 * (puff1 * 0.55 + 0.45) * crevice, 0.14, 1.0);
  }

  const normals = computeSmoothNormals(displaced, idx);
  const { ao, curv } = computeTriangleAOandCurv(displaced, normals, idx);
  const HAIR_DEEP = lin(0x040405);
  const HAIR_TIP = lin(0x13100f);
  const colors = new Float32Array(nV * 4);
  const uvs = new Float32Array(nV * 2);

  for (let i = 0; i < nV; i++) {
    const x = displaced[i * 3], y = displaced[i * 3 + 1], z = displaced[i * 3 + 2];
    const micro = 0.85 + 0.3 * vnoise(x * 700, y * 700, z * 700);
    const col = mix3(HAIR_DEEP, HAIR_TIP, curlDepth[i] * micro * 0.85);
    const combinedAO = clamp(ao[i] * (0.42 + 0.58 * curlDepth[i]), 0.20, 1.0);
    colors.set([col[0], col[1], col[2], combinedAO], i * 4);
    uvs[i * 2] = curlDepth[i];
    uvs[i * 2 + 1] = curv[i];
  }

  console.log(`  Refined Hair: ${nV} verts, ${idx.length / 3} tris`);
  return {
    ...hair,
    positions: displaced,
    normals,
    indices: idx,
    colors,
    uvs,
    colorFloat: true,
  };
}

// ───────────────────── 4. Refine Garments (Jacket Collar Thickness + Float32 Fabric Tone) ─────────────────────
function refineJacket(jacket) {
  // Smooth open boundary curve along stand collar & V-opening with 1D boundary Laplacian smoothing
  // so jacket collar & lapels are razor-clean and tailored (zero sawtooth notches!).
  const pos = new Float32Array(jacket.positions);
  const idx = new Uint32Array(jacket.indices);
  const nV = pos.length / 3;

  const edgeCounts = new Map();
  const addEdge = (a, b) => {
    const k = a < b ? `${a}_${b}` : `${b}_${a}`;
    let entry = edgeCounts.get(k);
    if (!entry) {
      entry = { a, b, count: 0 };
      edgeCounts.set(k, entry);
    }
    entry.count++;
  };

  for (let i = 0; i < idx.length; i += 3) {
    addEdge(idx[i], idx[i + 1]);
    addEdge(idx[i + 1], idx[i + 2]);
    addEdge(idx[i + 2], idx[i]);
  }

  const boundaryAdj = new Map();
  for (const e of edgeCounts.values()) {
    if (e.count !== 1) continue;
    const ay = pos[e.a * 3 + 1];
    const by = pos[e.b * 3 + 1];
    if (ay <= -0.49 && by <= -0.49) continue;
    if (!boundaryAdj.has(e.a)) boundaryAdj.set(e.a, []);
    if (!boundaryAdj.has(e.b)) boundaryAdj.set(e.b, []);
    boundaryAdj.get(e.a).push(e.b);
    boundaryAdj.get(e.b).push(e.a);
  }

  // 3 iterations of 1D boundary-curve smoothing on open collar/lapel rim
  for (let iter = 0; iter < 3; iter++) {
    const nextPos = new Float32Array(pos);
    for (const [vi, nbrs] of boundaryAdj.entries()) {
      if (nbrs.length !== 2) continue;
      const n0 = nbrs[0], n1 = nbrs[1];
      nextPos[vi * 3] = pos[vi * 3] * 0.5 + (pos[n0 * 3] + pos[n1 * 3]) * 0.25;
      nextPos[vi * 3 + 1] = pos[vi * 3 + 1] * 0.5 + (pos[n0 * 3 + 1] + pos[n1 * 3 + 1]) * 0.25;
      nextPos[vi * 3 + 2] = pos[vi * 3 + 2] * 0.5 + (pos[n0 * 3 + 2] + pos[n1 * 3 + 2]) * 0.25;
    }
    pos.set(nextPos);
  }

  const finalNor = computeSmoothNormals(pos, idx);
  const { ao, curv } = computeTriangleAOandCurv(pos, finalNor, idx);

  const JACKET_COL = lin(0x121720);
  const colors = new Float32Array(nV * 4);
  const uvs = new Float32Array(nV * 2);
  for (let i = 0; i < nV; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const weave = 0.90 + 0.18 * vnoise(x * 380, y * 380, z * 380);
    const col = JACKET_COL.map((c) => c * weave);
    colors.set([col[0], col[1], col[2], ao[i]], i * 4);
    uvs[i * 2] = 0.14;
    uvs[i * 2 + 1] = curv[i];
  }

  console.log(`  Refined Jacket: smoothed ${boundaryAdj.size} collar/lapel boundary verts (${nV} verts)`);
  return {
    ...jacket,
    positions: pos,
    normals: finalNor,
    indices: idx,
    colors,
    uvs,
    colorFloat: true,
    material: { ...jacket.material, doubleSided: true },
  };
}

function refineSimpleMesh(mesh, baseHex, noiseAmp = 0.08) {
  const pos = mesh.positions;
  const nV = pos.length / 3;
  const nor = computeSmoothNormals(pos, mesh.indices);
  const { ao, curv } = computeTriangleAOandCurv(pos, nor, mesh.indices);
  const BASE = lin(baseHex);
  const colors = new Float32Array(nV * 4);
  const uvs = new Float32Array(nV * 2);
  for (let i = 0; i < nV; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const n = 1.0 - noiseAmp * 0.5 + noiseAmp * vnoise(x * 260, y * 260, z * 260);
    const c = BASE.map((v) => v * n);
    colors.set([c[0], c[1], c[2], ao[i]], i * 4);
    uvs[i * 2] = 0.14;
    uvs[i * 2 + 1] = curv[i];
  }
  return { ...mesh, normals: nor, colors, uvs, colorFloat: true };
}

// ───────────────────── 5. Precision Biometric Scan Contours ─────────────────────
function buildScanContours(meshList) {
  const allPos = [];
  for (const m of meshList) {
    for (let i = 0; i < m.positions.length; i += 3) {
      allPos.push([m.positions[i], m.positions[i + 1], m.positions[i + 2]]);
    }
  }
  const minY = allPos.reduce((acc, p) => Math.min(acc, p[1]), Infinity);
  const maxY = allPos.reduce((acc, p) => Math.max(acc, p[1]), -Infinity);
  const strokes = [];
  const round = (v) => Math.round(v * 10000) / 10000;

  for (let y = minY + 0.02; y <= maxY - 0.008; y += 0.016) {
    const band = allPos.filter((p) => Math.abs(p[1] - y) < 0.0055);
    if (band.length < 24) continue;
    const bins = 64;
    const maxR = new Float32Array(bins);
    const cnt = new Uint16Array(bins);
    let cz = 0;
    for (const p of band) cz += p[2];
    cz /= band.length;

    for (const p of band) {
      const ang = Math.atan2(p[0], p[2] - cz);
      const bi = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * bins) % bins;
      const r = Math.hypot(p[0], p[2] - cz);
      if (r > maxR[bi]) maxR[bi] = r;
      cnt[bi]++;
    }
    const pts = [];
    for (let b = 0; b < bins; b++) {
      if (cnt[b] === 0) continue;
      const ang = ((b + 0.5) / bins) * Math.PI * 2 - Math.PI;
      const r = maxR[b] + 0.0016;
      pts.push(round(Math.sin(ang) * r), round(y), round(cz + Math.cos(ang) * r));
    }
    if (pts.length >= 24) {
      const group = y < -0.17 ? 7 : y < 0.055 ? 5 : 6;
      strokes.push({ g: group, c: 1, p: pts });
    }
  }
  return strokes;
}

const skinMesh = refineSkin(rawMeshes.Skin);
const eyesMesh = refineEyes(rawMeshes.Eyes);
const hairMesh = refineHair(rawMeshes.Hair);
const tshirtMesh = refineSimpleMesh(rawMeshes.Tshirt, 0x38414d, 0.08);
const jacketMesh = refineJacket(rawMeshes.Jacket);
const zipperMesh = refineSimpleMesh(rawMeshes.Zipper, 0x7b8896, 0.04);

const outMeshes = [skinMesh, eyesMesh, hairMesh, tshirtMesh, jacketMesh, zipperMesh];
const glbPath = path.join(OUT_DIR, "cheikh-avatar.glb");
const size = writeGLB(glbPath, outMeshes, {
  generator: "CHEIKH.EXE Refined Studio Bust Pipeline v2",
});
fs.copyFileSync(glbPath, path.join(OUT_DIR, "cheikh-avatar-lite.glb"));
console.log(`✓ Wrote cheikh-avatar.glb (${(size / 1e6).toFixed(2)} MB)`);

const strokes = buildScanContours([skinMesh, hairMesh, jacketMesh]);
fs.writeFileSync(
  path.join(OUT_DIR, "cheikh-strokes.json"),
  JSON.stringify({
    version: 3,
    units: "m",
    groups: ["scan", "eyes", "brows", "nose", "lips", "face", "hair", "clothes"],
    strokes,
  })
);
console.log(`✓ Wrote cheikh-strokes.json (${strokes.length} contour rings)`);
