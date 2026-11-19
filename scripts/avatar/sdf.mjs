/**
 * CHEIKH.EXE — Procedural avatar sculpt (signed distance fields)
 * ---------------------------------------------------------------
 * Refined anatomical bust sculpted from the physical description:
 *  - Young Black man, dark brown skin, balanced slightly elongated oval face
 *  - Short black kinky/coily hair, crisp line-up, tapered shorter sides,
 *    accentuated natural volume & height on top
 *  - Full natural black eyebrows, dark almond eyes (calm, serious, confident gaze)
 *  - Medium-width nose, full natural lips, clean-shaven, defined chin & jaw
 *  - Frontal ID-photo upright posture, aligned shoulders
 *  - Black zipped tech/bomber jacket over light-grey crew-neck t-shirt
 *
 * Units: metres. Local frame: y = 0 at eye line, +z = facing forward.
 */

const sqrt = Math.sqrt;
const abs = Math.abs;
const max = Math.max;
const min = Math.min;

export function len3(x, y, z) {
  return sqrt(x * x + y * y + z * z);
}

export function sdEllipsoid(px, py, pz, rx, ry, rz) {
  const ax = px / rx, ay = py / ry, az = pz / rz;
  const k0 = sqrt(ax * ax + ay * ay + az * az);
  const bx = px / (rx * rx), by = py / (ry * ry), bz = pz / (rz * rz);
  const k1 = sqrt(bx * bx + by * by + bz * bz);
  return k1 === 0 ? -min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

export function sdSphere(px, py, pz, r) {
  return sqrt(px * px + py * py + pz * pz) - r;
}

export function sdCapsule(px, py, pz, ax, ay, az, bx, by, bz, r) {
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  let h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz);
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  return len3(pax - bax * h, pay - bay * h, paz - baz * h) - r;
}

export function sdRoundCone(px, py, pz, ax, ay, az, bx, by, bz, r1, r2) {
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const y = pax * bax + pay * bay + paz * baz;
  const z = y - l2;
  const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y;
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

export function smin(a, b, k) {
  const h = max(k - abs(a - b), 0) / k;
  return min(a, b) - h * h * k * 0.25;
}

export function smax(a, b, k) {
  const h = max(k - abs(a - b), 0) / k;
  return max(a, b) + h * h * k * 0.25;
}

export function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function sdAlmond(px, py, halfLen, halfWidth) {
  const b = halfLen, w = halfWidth;
  const r = (b * b / w + w) * 0.5;
  const d = (b * b / w - w) * 0.5;
  const X = abs(py), Y = abs(px);
  if ((Y - b) * d > X * b) return sqrt(X * X + (Y - b) * (Y - b));
  return sqrt((X + d) * (X + d) + Y * Y) - r;
}

function hash3(i, j, k) {
  let h = (i * 374761393 + j * 668265263 + k * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export function worley(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let best = 9;
  for (let k = -1; k <= 1; k++)
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const cx = ix + i, cy = iy + j, cz = iz + k;
        const fx = cx + hash3(cx, cy, cz) - x;
        const fy = cy + hash3(cy, cz, cx) - y;
        const fz = cz + hash3(cz, cx, cy) - z;
        const d = fx * fx + fy * fy + fz * fz;
        if (d < best) best = d;
      }
  return sqrt(best);
}

export function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  const c000 = hash3(ix, iy, iz), c100 = hash3(ix + 1, iy, iz);
  const c010 = hash3(ix, iy + 1, iz), c110 = hash3(ix + 1, iy + 1, iz);
  const c001 = hash3(ix, iy, iz + 1), c101 = hash3(ix + 1, iy, iz + 1);
  const c011 = hash3(ix, iy + 1, iz + 1), c111 = hash3(ix + 1, iy + 1, iz + 1);
  return l(l(l(c000, c100, ux), l(c010, c110, ux), uy), l(l(c001, c101, ux), l(c011, c111, ux), uy), uz);
}

// ───────────────────────── anatomy constants ─────────────────────────
// Natural IPD ~ 66mm (half = 0.033m), recessed naturally inside the orbital rim
export const EYE = { x: 0.0335, y: 0.0, z: 0.068, r: 0.0124 };
const EYE_TILT = 0.075; // subtle almond cant (outer corner gently higher)

// ───────────────────────── skull (shared) ─────────────────────────
function skull(x, y, z) {
  // Balanced cranial proportions: slightly wider than before for natural oval face
  let d = sdEllipsoid(x, y - 0.024, z + 0.014, 0.077, 0.102, 0.099);
  d = smin(d, sdEllipsoid(x, y - 0.006, z + 0.048, 0.070, 0.084, 0.074), 0.024); // occiput
  d = smin(d, sdEllipsoid(x, y - 0.046, z - 0.026, 0.068, 0.058, 0.064), 0.032); // forehead
  return d;
}

// ───────────────────────── HEAD SKIN ─────────────────────────
export function headSkin(x, y, z) {
  const ax = abs(x);
  let d = skull(x, y, z);

  // Subtle temple planes
  d = smax(d, ax - 0.0755 - 0.018 * smoothstep(0.025, -0.055, y), 0.024);

  // Oval facial volume: balanced mid-face + sculpted jaw + strong chin
  d = smin(d, sdEllipsoid(x, y + 0.032, z - 0.033, 0.065, 0.072, 0.065), 0.032);
  d = smin(d, sdEllipsoid(x, y + 0.078, z - 0.018, 0.054, 0.048, 0.068), 0.030);

  // Defined masculine mandibular angles (gonion)
  d = smin(d, sdEllipsoid(ax - 0.050, y + 0.073, z + 0.008, 0.017, 0.026, 0.030), 0.026);
  // Smooth jaw line sweeping cleanly to chin
  d = smin(d, sdCapsule(ax, y, z, 0.049, -0.084, 0.002, 0.017, -0.119, 0.064, 0.013), 0.022);
  // Confident chin (projected nicely in profile, aligned under lower lip)
  d = smin(d, sdEllipsoid(x, y + 0.117, z - 0.066, 0.0245, 0.0195, 0.021), 0.020);

  // Zygomatic arches / cheekbones (broad, refined structure)
  d = smin(d, sdEllipsoid(ax - 0.051, y + 0.012, z - 0.046, 0.026, 0.018, 0.028), 0.022);
  // Soft mid-cheek contour
  d = smin(d, sdEllipsoid(ax - 0.039, y + 0.048, z - 0.060, 0.025, 0.028, 0.022), 0.026);

  // Supraorbital brow ridge & glabella (calm, confident, NOT furrowed/angry)
  d = smin(d, sdEllipsoid(ax - 0.028, y - 0.024, z - 0.075, 0.028, 0.010, 0.013), 0.015);
  d = smin(d, sdEllipsoid(x, y - 0.019, z - 0.082, 0.013, 0.011, 0.009), 0.012);

  // Eye sockets (gentle depth)
  d = smax(d, -sdEllipsoid(ax - EYE.x, y - 0.001, z - 0.084, 0.0205, 0.0135, 0.016), 0.013);

  // Eyelids: calm, relaxed almond opening (upper lid slightly resting over top of iris)
  {
    const ex = ax - EYE.x, ey = y - EYE.y, ez = z - EYE.z;
    let lid = sdEllipsoid(ex, ey, ez, 0.0148, 0.0136, 0.0142);
    const c = Math.cos(EYE_TILT), s = Math.sin(EYE_TILT);
    const rx = ex * c + ey * s;
    const ry = -ex * s + ey * c;
    // Narrower vertical almond aperture (halfWidth 0.0044 vs 0.0054 -> calm & confident, not startled)
    // Shifted slightly downward (-0.0010) so upper lid naturally drapes across upper iris
    const slit2d = sdAlmond(rx + 0.0004, ry + 0.0008, 0.0136, 0.0042);
    const slit = max(slit2d, -(ez + 0.001));
    lid = smax(lid, -slit, 0.0022);
    // Soft upper eyelid crease
    lid = smax(lid, -sdEllipsoid(rx, ry - 0.0076, ez - 0.0122, 0.0125, 0.0016, 0.0032), 0.0022);
    d = smin(d, lid, 0.006);
    // Natural infraorbital (under-eye) support
    d = smin(d, sdEllipsoid(ex, ey + 0.0115, ez - 0.007, 0.0145, 0.0052, 0.009), 0.007);
  }

  // ── nose (medium width, harmonious proportions) ──
  {
    let n = sdRoundCone(x, y, z, 0, 0.010, 0.081, 0, -0.036, 0.102, 0.0070, 0.0102);
    n = smin(n, sdSphere(x, y + 0.043, z - 0.102, 0.0126), 0.011); // rounded nose tip
    n = smin(n, sdEllipsoid(ax - 0.0148, y + 0.0485, z - 0.090, 0.0104, 0.0084, 0.0102), 0.0075); // alae (medium width)
    n = smin(n, sdEllipsoid(x, y + 0.0525, z - 0.099, 0.0065, 0.0042, 0.008), 0.005); // columella
    d = smin(d, n, 0.010);
    // Soft nostrils (wide enough for clean meshing)
    d = smax(d, -sdEllipsoid(ax - 0.0092, y + 0.0555, z - 0.0955, 0.0046, 0.0030, 0.0052), 0.003);
  }

  // ── mouth region & full natural lips ──
  {
    // Subtle muzzle fullness
    d = smin(d, sdEllipsoid(x, y + 0.080, z - 0.072, 0.036, 0.030, 0.025), 0.022);
    // Soft philtrum
    d = smin(d, sdEllipsoid(ax - 0.0048, y + 0.064, z - 0.0955, 0.0028, 0.0072, 0.0032), 0.0045);
    // Full upper lip with soft cupid's bow
    let lips = sdEllipsoid(x, y + 0.0748, z - 0.0935, 0.0255, 0.0078, 0.0108);
    lips = smin(lips, sdEllipsoid(ax - 0.0062, y + 0.0722, z - 0.0962, 0.0088, 0.0052, 0.0072), 0.005);
    // Full lower lip
    lips = smin(lips, sdEllipsoid(x, y + 0.0905, z - 0.0928, 0.0235, 0.0092, 0.0108), 0.006);
    d = smin(d, lips, 0.0065);
    // Smooth, voxel-clean closed mouth parting (relaxed, slight confident neutral line)
    const mouthCurve = 0.0830 - 0.55 * x * x;
    d = smax(d, -sdEllipsoid(x, y + mouthCurve, z - 0.100, 0.0258, 0.0020, 0.0115), 0.0032);
    // Mentolabial fold (soft curve between lower lip and chin)
    d = smax(d, -sdEllipsoid(x, y + 0.1035, z - 0.0985, 0.0185, 0.0042, 0.0065), 0.0075);
  }

  // ── ears (well-proportioned, tucked naturally) ──
  {
    const ex = ax - 0.0775, ey = y + 0.008, ez = z + 0.014;
    const c = Math.cos(0.18), s = Math.sin(0.18);
    const ty = ey * c - ez * s, tz = ey * s + ez * c;
    let ear = sdEllipsoid(ex - 0.0035, ty, tz, 0.0092, 0.0285, 0.0175);
    ear = smax(ear, -sdEllipsoid(ex - 0.011, ty + 0.004, tz + 0.001, 0.0068, 0.0175, 0.0098), 0.004);
    ear = smin(ear, sdEllipsoid(ex - 0.003, ty + 0.026, tz - 0.002, 0.0055, 0.008, 0.0072), 0.0045);
    d = smin(d, ear, 0.0075);
  }

  // ── neck (athletic, straight upright posture) ──
  {
    let n = sdCapsule(x, y, z, 0, -0.075, -0.020, 0, -0.29, -0.024, 0.059);
    n = smin(n, sdCapsule(ax, y, z, 0.059, -0.048, -0.022, 0.016, -0.245, 0.036, 0.0125), 0.018);
    n = smin(n, sdEllipsoid(x, y + 0.148, z - 0.030, 0.011, 0.014, 0.011), 0.013);
    d = smin(d, n, 0.024);
  }

  return d;
}

// ───────────────────────── EYES ─────────────────────────
export function eyes(x, y, z) {
  const ax = abs(x);
  return sdSphere(ax - EYE.x, y - EYE.y, z - EYE.z, EYE.r);
}

// ───────────────────────── HAIR (short coily tapered fade, higher volume on top) ─────────────────────────
function hairlineY(x, z) {
  const ax = abs(x);
  // Crisp natural frontal hairline (slightly lower at forehead, clean temple corner, tapers behind ear)
  if (z > 0.015) {
    // Front hairline: clean straight-ish line across forehead (~y=0.068 at center) stepping cleanly down at temples
    const temple = smoothstep(0.050, 0.067, ax);
    return 0.067 - 0.018 * temple + 0.08 * (z - 0.065);
  }
  // Sides & nape
  return 0.026 + 0.78 * z;
}

export function hairBase(x, y, z) {
  const ax = abs(x);
  const s = skull(x, y, z);
  const yb = hairlineY(x, z);
  const edge = smoothstep(-0.002, 0.018, y - yb);
  // Tapered fade: short close-cropped sides (0.004m), noticeably taller coily volume on top (0.030m)
  const topZone = smoothstep(0.055, 0.125, y) * smoothstep(0.078, 0.042, ax);
  const crownLift = smoothstep(0.045, 0.118, y) * (1.0 - 0.15 * smoothstep(0.05, 0.095, z));
  const thick = 0.001 + edge * (0.0042 + 0.016 * crownLift + 0.018 * topZone + 0.0025 * smoothstep(-0.02, -0.09, z));
  let d = s - thick;
  // Slightly flatten/shape top into a stylish modern natural afro-taper silhouette
  d = smin(d, sdEllipsoid(x, y - 0.104, z + 0.006, 0.072, 0.050, 0.088), 0.018);
  // Keep sides sleek/tapered
  d = smax(d, ax - (0.0815 - 0.006 * smoothstep(0.095, 0.02, y)), 0.014);
  // Cut cleanly around ears
  d = smax(d, -sdEllipsoid(ax - 0.078, y + 0.009, z + 0.014, 0.028, 0.034, 0.027), 0.006);
  // Crisp hairline boundary
  d = smax(d, (yb - y) * 0.92, 0.0035);
  return d;
}

export function hair(x, y, z) {
  const base = hairBase(x, y, z);
  if (abs(base) > 0.014) return base;
  // Tight natural coily / kinky curls texture (more pronounced on top volume, finer on tapered sides)
  const topFactor = 0.45 + 0.65 * smoothstep(0.04, 0.11, y);
  const f = 1 / 0.0052;
  const w1 = worley(x * f, y * f, z * f);
  const w2 = worley(x * f * 2.0 + 7.3, y * f * 2.0, z * f * 2.0);
  const edge = smoothstep(0.0, 0.022, y - hairlineY(x, z));
  return base + (0.0028 * (w1 - 0.52) + 0.0011 * (w2 - 0.52)) * topFactor * (0.35 + 0.65 * edge);
}

// ───────────────────────── BODY & CLOTHING ─────────────────────────
export const CUT_Y = -0.60;

function torso(x, y, z) {
  const ax = abs(x);
  // Upright, aligned athletic torso (professional ID-photo posture)
  let d = sdEllipsoid(x, y + 0.42, z + 0.010, 0.155, 0.23, 0.098);
  d = smin(d, sdEllipsoid(ax - 0.056, y + 0.335, z - 0.026, 0.070, 0.056, 0.048), 0.042);
  d = smin(d, sdEllipsoid(x, y + 0.36, z + 0.048, 0.144, 0.17, 0.084), 0.042);
  // Clean straight shoulder slope
  d = smin(d, sdCapsule(x, y, z, -0.155, -0.268, -0.024, 0.155, -0.268, -0.024, 0.046), 0.055);
  d = smin(d, sdCapsule(ax, y, z, 0.028, -0.205, -0.028, 0.155, -0.260, -0.026, 0.031), 0.044);
  d = smin(d, sdEllipsoid(ax - 0.180, y + 0.305, z + 0.016, 0.048, 0.068, 0.054), 0.038);
  d = smin(d, sdCapsule(ax, y, z, 0.192, -0.33, -0.016, 0.204, -0.68, -0.024, 0.044), 0.032);
  return d;
}

function neckHole(x, y, z) {
  const r = sqrt(x * x + (z + 0.022) * (z + 0.022));
  const neckY = -0.214 - 0.026 * smoothstep(-0.01, 0.055, z);
  return max(r - 0.0645, neckY - y);
}

export function tshirt(x, y, z) {
  let d = torso(x, y, z) - 0.004;
  d = smax(d, -neckHole(x, y, z), 0.004);
  {
    const r = sqrt(x * x + (z + 0.022) * (z + 0.022));
    const neckY = -0.214 - 0.026 * smoothstep(-0.01, 0.055, z);
    const tor = sqrt((r - 0.068) * (r - 0.068) + (y - neckY + 0.003) * (y - neckY + 0.003)) - 0.0052;
    d = smin(d, tor, 0.004);
  }
  d += 0.0010 * (vnoise(x * 38, y * 24, z * 38) - 0.5);
  const region = max(abs(x) - 0.13, max(y - -0.17, -0.47 - y));
  return max(max(d, region), CUT_Y - y);
}

function openingW(y) {
  return 0.0022 + 0.072 * smoothstep(-0.345, -0.215, y);
}

export function jacket(x, y, z) {
  const ax = abs(x);
  let d = torso(x, y, z) - 0.0145;
  // Crisp tailored fabric drape (less bubbly than before)
  d += 0.0014 * (vnoise(x * 20, y * 14, z * 20) - 0.5);
  // Subtle shoulder seam structure
  d -= 0.002 * smoothstep(0.015, 0.0, abs(y + 0.258 + 0.12 * ax)) * smoothstep(0.07, 0.16, ax);

  // Clean structured stand collar (modern minimalist zipped jacket)
  {
    const r = sqrt(x * x + (z + 0.019) * (z + 0.019));
    const rr = 0.076 + 0.14 * max(0, y + 0.232);
    const topY = -0.172 - 0.028 * smoothstep(-0.02, 0.07, z);
    let collar = abs(r - rr) - 0.0038;
    collar = max(collar, y - topY);
    collar = max(collar, -0.27 - y);
    d = smin(d, collar, 0.010);
  }
  {
    const r = sqrt(x * x + (z + 0.020) * (z + 0.020));
    d = smax(d, -max(r - 0.072, -0.255 - y), 0.004);
  }
  {
    const w = openingW(y);
    const open = max(ax - w, -(z - 0.0));
    d = smax(d, -open, 0.0028);
  }
  d -= 0.0022 * smoothstep(0.018, 0.0, abs(ax - openingW(y) - 0.011)) * smoothstep(-0.34, -0.24, y) * (z > 0 ? 1 : 0);
  return max(d, CUT_Y - y);
}

export function sceneSDF(x, y, z) {
  let d = headSkin(x, y, z);
  d = min(d, eyes(x, y, z));
  d = min(d, hairBase(x, y, z));
  d = min(d, tshirt(x, y, z));
  d = min(d, jacket(x, y, z));
  return d;
}

export function lipsShape(x, y, z) {
  const ax = abs(x);
  let lips = sdEllipsoid(x, y + 0.0748, z - 0.0935, 0.0255, 0.0078, 0.0108);
  lips = smin(lips, sdEllipsoid(ax - 0.0062, y + 0.0722, z - 0.0962, 0.0088, 0.0052, 0.0072), 0.005);
  lips = smin(lips, sdEllipsoid(x, y + 0.0905, z - 0.0928, 0.0235, 0.0092, 0.0108), 0.006);
  return lips;
}

/** Eyebrow coverage mask 0..1: natural masculine arch, full & dark. */
export function browMask(x, y, z) {
  const ax = abs(x);
  if (z < 0.058) return 0;
  // Natural brow arch: peaks slightly around ax = 0.040, gently drops at outer tail
  const u = (ax - 0.034) / 0.0215; // -1 inner .. +1 outer
  const arch = 0.0215 + 0.0032 * (1 - (u - 0.25) * (u - 0.25));
  const thick = 0.0046 * (1.0 - 0.35 * smoothstep(0.1, 1.0, u));
  const v = (y - arch) / thick;
  const e = u * u + v * v;
  return 1 - smoothstep(0.55, 1.05, e);
}

export { openingW, hairlineY };
