"use client";

import * as THREE from "three";
import type { ProjectItem } from "@/data/projects";

/** Deterministic PRNG for repeatable high-craft PBR textures */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function toTexture(
  canvas: HTMLCanvasElement,
  { repeat = [1, 1], srgb = true }: { repeat?: [number, number]; srgb?: boolean } = {}
) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Sobel tangent-space normal map generator from a grayscale height canvas */
export function heightCanvasToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength = 2.2,
  repeat: [number, number] = [1, 1]
) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext("2d")!;
  const src = srcCtx.getImageData(0, 0, w, h).data;
  const { canvas: outCanvas, ctx: outCtx } = makeCanvas(w, h);
  const out = outCtx.createImageData(w, h);
  const dst = out.data;

  const sample = (x: number, y: number) => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const len = Math.hypot(dx, dy, dz) || 1;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  outCtx.putImageData(out, 0, 0);
  return toTexture(outCanvas, { repeat, srgb: false });
}

/** Soft circular glowing bokeh particle sprite (mint-tinted for hologram) */
export function createGlowParticleTexture() {
  const { canvas, ctx } = makeCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  g.addColorStop(0.22, "rgba(205, 255, 238, 0.92)");
  g.addColorStop(0.55, "rgba(78, 242, 184, 0.32)");
  g.addColorStop(1.0, "rgba(78, 242, 184, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Neutral warm-white soft optical lens flare sprite (for stadium floodlights) */
export function createWhiteFlareTexture() {
  const { canvas, ctx } = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  g.addColorStop(0.18, "rgba(248, 252, 255, 0.78)");
  g.addColorStop(0.48, "rgba(216, 236, 255, 0.18)");
  g.addColorStop(1.0, "rgba(216, 236, 255, 0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Calibrated aerospace satin-brushed titanium PBR texture set (never crushed black!) */
export function createBrushedMetalTextures(repeat: [number, number] = [2, 2]) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const { canvas: rCanvas, ctx: rCtx } = makeCanvas(512, 512);
  const { canvas: hCanvas, ctx: hCtx } = makeCanvas(512, 512);
  const rand = mulberry32(4211);

  ctx.fillStyle = "#4c5a6a";
  ctx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = "#565656";
  rCtx.fillRect(0, 0, 512, 512);
  hCtx.fillStyle = "#808080";
  hCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2800; i++) {
    const y = rand() * 512;
    const x = rand() * 512;
    const len = 45 + rand() * 210;
    const shade = 62 + Math.floor(rand() * 44);
    ctx.fillStyle = `rgba(${shade}, ${shade + 12}, ${shade + 26}, ${0.14 + rand() * 0.2})`;
    ctx.fillRect(x, y, len, 1);

    const rShade = 68 + Math.floor(rand() * 70);
    rCtx.fillStyle = `rgba(${rShade},${rShade},${rShade},0.32)`;
    rCtx.fillRect(x, y, len, 1.2);

    const hShade = 105 + Math.floor(rand() * 50);
    hCtx.fillStyle = `rgba(${hShade},${hShade},${hShade},0.35)`;
    hCtx.fillRect(x, y, len, 1);
  }

  return {
    map: toTexture(canvas, { repeat, srgb: true }),
    roughnessMap: toTexture(rCanvas, { repeat, srgb: false }),
    bumpMap: toTexture(hCanvas, { repeat, srgb: false }),
    normalMap: heightCanvasToNormalTexture(hCanvas, 1.6, repeat),
  };
}

/** Architectural observatory deck floor: 1024x1024 anodized carbon-slate & titanium panels (no loud green grid!) */
export function createLabFloorTextures(repeat: [number, number] = [5, 5]) {
  const S = 1024;
  const { canvas, ctx } = makeCanvas(S, S);
  const { canvas: rCanvas, ctx: rCtx } = makeCanvas(S, S);
  const { canvas: hCanvas, ctx: hCtx } = makeCanvas(S, S);
  const rand = mulberry32(8081);

  ctx.fillStyle = "#1b222c";
  ctx.fillRect(0, 0, S, S);
  rCtx.fillStyle = "#626262";
  rCtx.fillRect(0, 0, S, S);
  hCtx.fillStyle = "#909090";
  hCtx.fillRect(0, 0, S, S);

  // Subtle tile-by-tile tonal variation (architectural slate slabs)
  const step = 256;
  for (let ty = 0; ty < S; ty += step) {
    for (let tx = 0; tx < S; tx += step) {
      const shift = Math.floor((rand() - 0.5) * 10);
      ctx.fillStyle = `rgb(${27 + shift}, ${35 + shift}, ${45 + shift})`;
      ctx.fillRect(tx + 3, ty + 3, step - 6, step - 6);

      const rVal = 88 + Math.floor((rand() - 0.5) * 20);
      rCtx.fillStyle = `rgb(${rVal}, ${rVal}, ${rVal})`;
      rCtx.fillRect(tx + 3, ty + 3, step - 6, step - 6);
    }
  }

  // Fine mineral/anodized micro-speckle
  for (let i = 0; i < 16000; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const v = 24 + Math.floor(rand() * 24);
    ctx.fillStyle = `rgba(${v},${v + 6},${v + 12},0.22)`;
    ctx.fillRect(x, y, 2, 2);
    const rv = 70 + Math.floor(rand() * 75);
    rCtx.fillStyle = `rgba(${rv},${rv},${rv},0.16)`;
    rCtx.fillRect(x, y, 2, 2);
  }

  // Chamfered architectural expansion joints (dark recessed seam + crisp metallic bevel highlight)
  for (let p = 0; p <= S; p += step) {
    ctx.fillStyle = "#0e131a";
    ctx.fillRect(p - 3, 0, 6, S);
    ctx.fillRect(0, p - 3, S, 6);

    ctx.fillStyle = "rgba(130, 154, 178, 0.16)";
    ctx.fillRect(p + 3, 0, 2, S);
    ctx.fillRect(0, p + 3, S, 2);

    rCtx.fillStyle = "#c8c8c8";
    rCtx.fillRect(p - 3, 0, 6, S);
    rCtx.fillRect(0, p - 3, S, 6);

    hCtx.fillStyle = "#282828";
    hCtx.fillRect(p - 3, 0, 6, S);
    hCtx.fillRect(0, p - 3, S, 6);
  }

  // Machined corner fasteners
  ctx.fillStyle = "rgba(148, 172, 196, 0.25)";
  hCtx.fillStyle = "#c0c0c0";
  for (let y = 0; y < S; y += step) {
    for (let x = 0; x < S; x += step) {
      for (const [ox, oy] of [
        [12, 12],
        [step - 16, 12],
        [12, step - 16],
        [step - 16, step - 16],
      ]) {
        ctx.fillRect(x + ox, y + oy, 4, 4);
        hCtx.fillRect(x + ox, y + oy, 4, 4);
      }
    }
  }

  return {
    map: toTexture(canvas, { repeat, srgb: true }),
    roughnessMap: toTexture(rCanvas, { repeat, srgb: false }),
    bumpMap: toTexture(hCanvas, { repeat, srgb: false }),
    normalMap: heightCanvasToNormalTexture(hCanvas, 2.2, repeat),
  };
}

/** Architectural travertine / basalt stone coping tiles for the Swimming Pod deck */
export function createStoneCopingTextures(repeat: [number, number] = [3, 2]) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  const { canvas: rCanvas, ctx: rCtx } = makeCanvas(S, S);
  const { canvas: hCanvas, ctx: hCtx } = makeCanvas(S, S);
  const rand = mulberry32(31415);

  ctx.fillStyle = "#3a4654";
  ctx.fillRect(0, 0, S, S);
  rCtx.fillStyle = "#989898";
  rCtx.fillRect(0, 0, S, S);
  hCtx.fillStyle = "#888888";
  hCtx.fillRect(0, 0, S, S);

  // Travertine horizontal mineral veins
  for (let i = 0; i < 1800; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const w = 14 + rand() * 55;
    const v = 50 + Math.floor(rand() * 38);
    ctx.fillStyle = `rgba(${v}, ${v + 8}, ${v + 16}, 0.16)`;
    ctx.fillRect(x, y, w, 2);
    const hv = 115 + Math.floor(rand() * 45);
    hCtx.fillStyle = `rgba(${hv}, ${hv}, ${hv}, 0.2)`;
    hCtx.fillRect(x, y, w, 2);
  }

  // Stone slab seams (running bond 2x4)
  ctx.fillStyle = "#222a34";
  hCtx.fillStyle = "#383838";
  rCtx.fillStyle = "#d0d0d0";
  for (let row = 0; row < 4; row++) {
    const y = row * 128;
    ctx.fillRect(0, y - 2, S, 4);
    hCtx.fillRect(0, y - 2, S, 4);
    rCtx.fillRect(0, y - 2, S, 4);
    const offset = (row % 2) * 128;
    for (let col = 0; col < 2; col++) {
      const x = (col * 256 + offset) % S;
      ctx.fillRect(x - 2, y, 4, 128);
      hCtx.fillRect(x - 2, y, 4, 128);
      rCtx.fillRect(x - 2, y, 4, 128);
    }
  }

  return {
    map: toTexture(canvas, { repeat, srgb: true }),
    roughnessMap: toTexture(rCanvas, { repeat, srgb: false }),
    normalMap: heightCanvasToNormalTexture(hCanvas, 2.0, repeat),
  };
}

/** Fine woven square stadium goal net alpha texture */
export function createGoalNetTexture(repeat: [number, number] = [9, 4]) {
  const S = 128;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.clearRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(232, 242, 248, 0.88)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, S - 4, S - 4);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(S / 2, 0);
  ctx.lineTo(S / 2, S);
  ctx.moveTo(0, S / 2);
  ctx.lineTo(S, S / 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Realistic detailed telephoto-grade Moon surface (organic FBM maria + regolith + subtle craters & ejecta rays) */
export function createMoonTextures() {
  const W = 1024;
  const H = 512;
  const { canvas, ctx } = makeCanvas(W, H);
  const { canvas: bCanvas, ctx: bCtx } = makeCanvas(W, H);
  const rand = mulberry32(19690720);

  const hash2Wrap = (ix: number, iy: number, px: number, py: number) => {
    const x = ((ix % px) + px) % px;
    const y = ((iy % py) + py) % py;
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };

  const vnoiseWrap = (x: number, y: number, px: number, py: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2Wrap(ix, iy, px, py);
    const b = hash2Wrap(ix + 1, iy, px, py);
    const c = hash2Wrap(ix, iy + 1, px, py);
    const d = hash2Wrap(ix + 1, iy + 1, px, py);
    return a + (b - a) * ux + (c - a + (a - b - c + d) * ux) * uy;
  };

  const img = ctx.createImageData(W, H);
  const bImg = bCtx.createImageData(W, H);
  const dst = img.data;
  const bDst = bImg.data;

  // Multi-octave organic FBM lunar maria (#5f6570) vs highland anorthosite (#c4c8cf)
  for (let y = 0; y < H; y++) {
    const v = y / H;
    const latWeight = Math.sin(v * Math.PI);
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const n1 = vnoiseWrap(u * 4, v * 2, 4, 2);
      const n2 = vnoiseWrap(u * 8 + 1.3, v * 4 + 0.7, 8, 4);
      const n3 = vnoiseWrap(u * 16 + 3.1, v * 8 + 2.4, 16, 8);
      const n4 = vnoiseWrap(u * 32 + 5.7, v * 16 + 4.1, 32, 16);
      const fine = vnoiseWrap(u * 96, v * 48, 96, 48);

      const mariaFbm = n1 * 0.54 + n2 * 0.28 + n3 * 0.13 + n4 * 0.05;
      const mariaMask = Math.max(0, Math.min(1, (mariaFbm - 0.34) / 0.34)) * (0.35 + 0.65 * latWeight);

      const baseR = 196 * (1 - mariaMask) + 95 * mariaMask + (fine - 0.5) * 20;
      const baseG = 200 * (1 - mariaMask) + 101 * mariaMask + (fine - 0.5) * 20;
      const baseB = 207 * (1 - mariaMask) + 112 * mariaMask + (fine - 0.5) * 22;

      const idx = (y * W + x) * 4;
      dst[idx] = Math.max(0, Math.min(255, Math.round(baseR)));
      dst[idx + 1] = Math.max(0, Math.min(255, Math.round(baseG)));
      dst[idx + 2] = Math.max(0, Math.min(255, Math.round(baseB)));
      dst[idx + 3] = 255;

      const hVal = Math.round(128 + (1 - mariaMask) * 22 + (n3 - 0.5) * 32 + (fine - 0.5) * 24);
      const bh = Math.max(0, Math.min(255, hVal));
      bDst[idx] = bh;
      bDst[idx + 1] = bh;
      bDst[idx + 2] = bh;
      bDst[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  // Subtle fine regolith micro-speckle
  for (let i = 0; i < 6500; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 1 + rand() * 2.2;
    const v = 110 + Math.floor(rand() * 95);
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.10)`;
    ctx.fillRect(x, y, r, r);
    bCtx.fillStyle = `rgba(${v},${v},${v},0.12)`;
    bCtx.fillRect(x, y, r, r);
  }

  // 4 Major Rayed Craters (Tycho/Copernicus style subtle bright ejecta) + 216 small/medium craters
  for (let i = 0; i < 220; i++) {
    const x = rand() * W;
    const y = 30 + rand() * (H - 60);
    const r = i < 4 ? 7 + rand() * 4 : 2 + rand() * 8.5;

    if (i < 4) {
      for (let ray = 0; ray < 9; ray++) {
        const ang = (ray / 9) * Math.PI * 2 + rand() * 0.45;
        const len = r * (2.6 + rand() * 3.8);
        const rg = ctx.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len * 0.72);
        rg.addColorStop(0, "rgba(222, 226, 232, 0.24)");
        rg.addColorStop(1, "rgba(222, 226, 232, 0.0)");
        ctx.strokeStyle = rg;
        ctx.lineWidth = 1.2 + rand() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len * 0.72);
        ctx.stroke();
      }
    }

    const cg = ctx.createRadialGradient(x, y, r * 0.12, x, y, r * 1.2);
    cg.addColorStop(0, "rgba(88, 93, 102, 0.26)");
    cg.addColorStop(0.66, "rgba(116, 121, 130, 0.16)");
    cg.addColorStop(0.88, "rgba(218, 222, 228, 0.30)");
    cg.addColorStop(1, "rgba(180, 184, 190, 0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    const bg = bCtx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.18);
    bg.addColorStop(0, "rgba(62,62,62,0.52)");
    bg.addColorStop(0.68, "rgba(92,92,92,0.38)");
    bg.addColorStop(0.88, "rgba(186,186,186,0.56)");
    bg.addColorStop(1, "rgba(128,128,128,0)");
    bCtx.fillStyle = bg;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 1.18, 0, Math.PI * 2);
    bCtx.fill();
  }

  return {
    map: toTexture(canvas, { repeat: [1, 1], srgb: true }),
    bumpMap: toTexture(bCanvas, { repeat: [1, 1], srgb: false }),
  };
}

/** Manicured stadium pitch texture with alternating stripes & white field markings */
export function createPitchTexture() {
  const W = 1024;
  const H = 640;
  const { canvas, ctx } = makeCanvas(W, H);
  const rand = mulberry32(2026);

  const stripes = 12;
  const sw = W / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#185936" : "#1d683f";
    ctx.fillRect(i * sw, 0, sw + 1, H);
  }
  for (let i = 0; i < 14000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    ctx.fillStyle = rand() > 0.5 ? "rgba(95, 190, 120, 0.10)" : "rgba(10, 42, 24, 0.14)";
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.strokeStyle = "rgba(236, 245, 240, 0.92)";
  ctx.lineWidth = 6;
  const m = 38;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  ctx.beginPath();
  ctx.moveTo(W / 2, m);
  ctx.lineTo(W / 2, H - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ECF3F7";
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeRect(m, H / 2 - 150, 140, 300);
  ctx.strokeRect(W - m - 140, H / 2 - 150, 140, 300);
  ctx.strokeRect(m, H / 2 - 70, 52, 140);
  ctx.strokeRect(W - m - 52, H / 2 - 70, 52, 140);

  return toTexture(canvas, { repeat: [1, 1], srgb: true });
}

/** Realistic match football texture (geometric panels + micro-pebble bump & normal) */
export function createFootballBallTextures() {
  const W = 512;
  const H = 256;
  const { canvas, ctx } = makeCanvas(W, H);
  const { canvas: bCanvas, ctx: bCtx } = makeCanvas(W, H);

  ctx.fillStyle = "#eef2f6";
  ctx.fillRect(0, 0, W, H);
  bCtx.fillStyle = "#a0a0a0";
  bCtx.fillRect(0, 0, W, H);

  const drawPentagon = (cx: number, cy: number, r: number, fill: string, stroke: string) => {
    ctx.beginPath();
    bCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
        bCtx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    bCtx.closePath();
    bCtx.strokeStyle = "#222222";
    bCtx.lineWidth = 5;
    bCtx.stroke();
  };

  for (let row = 0; row < 4; row++) {
    const y = 32 + row * 64;
    for (let col = 0; col < 6; col++) {
      const x = col * 86 + (row % 2) * 43;
      drawPentagon(x, y, 22, "#151a22", "#4EF2B8");
    }
  }

  return {
    map: toTexture(canvas, { repeat: [1, 1], srgb: true }),
    bumpMap: toTexture(bCanvas, { repeat: [1, 1], srgb: false }),
    normalMap: heightCanvasToNormalTexture(bCanvas, 1.8, [1, 1]),
  };
}

/** High-DPI terminal screen texture generated dynamically from a real audited GitHub project */
export function createProjectScreenTexture(project: ProjectItem) {
  const W = 768;
  const H = 460;
  const { canvas, ctx } = makeCanvas(W, H);

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#070c12");
  grad.addColorStop(1, "#0d1622");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(159, 176, 190, 0.08)";
  for (let y = 24; y < H; y += 22) {
    for (let x = 24; x < W; x += 22) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  ctx.fillStyle = "rgba(18, 28, 40, 0.92)";
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = project.accentColor;
  ctx.fillRect(0, 43, W, 2);

  const dots = ["#ef4444", "#f59e0b", "#4ef2b8"];
  dots.forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(24 + idx * 18, 22, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#9FB0BE";
  ctx.font = "600 15px monospace";
  ctx.fillText(`CHEIKH.EXE // REPO :: ${project.owner}/${project.slug}`, 92, 27);

  ctx.fillStyle = "rgba(78, 242, 184, 0.14)";
  ctx.fillRect(W - 210, 10, 190, 24);
  ctx.fillStyle = project.accentColor;
  ctx.font = "600 13px monospace";
  ctx.fillText(`● ${project.statusLabel.toUpperCase().slice(0, 20)}`, W - 198, 27);

  ctx.fillStyle = "#ECF3F7";
  ctx.font = "700 34px sans-serif";
  ctx.fillText(project.title, 34, 102);

  ctx.fillStyle = project.accentColor;
  ctx.font = "600 15px monospace";
  ctx.fillText(project.categoryLabel.toUpperCase(), 34, 128);

  ctx.fillStyle = "#C3D1DC";
  ctx.font = "400 18px sans-serif";
  wrapText(ctx, project.tagline, 34, 164, W - 68, 24);

  ctx.fillStyle = "rgba(16, 25, 36, 0.85)";
  ctx.strokeStyle = "rgba(78, 242, 184, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.fillRect(34, 218, W - 68, 76);
  ctx.strokeRect(34, 218, W - 68, 76);
  ctx.fillStyle = "#4EF2B8";
  ctx.font = "600 13px monospace";
  ctx.fillText("ARCHITECTURE VERIFIEE", 48, 240);
  ctx.fillStyle = "#DCE6EE";
  ctx.font = "400 15px monospace";
  wrapText(ctx, project.architecture, 48, 263, W - 96, 20);

  let px = 34;
  let py = 320;
  ctx.font = "600 14px monospace";
  for (const tech of project.technologies.slice(0, 8)) {
    const w = ctx.measureText(tech).width + 24;
    if (px + w > W - 34) {
      px = 34;
      py += 34;
    }
    ctx.fillStyle = "rgba(78, 242, 184, 0.12)";
    ctx.fillRect(px, py, w, 26);
    ctx.strokeStyle = "rgba(78, 242, 184, 0.35)";
    ctx.strokeRect(px, py, w, 26);
    ctx.fillStyle = "#ECF3F7";
    ctx.fillText(tech, px + 12, py + 18);
    px += w + 10;
  }

  ctx.fillStyle = "rgba(159, 176, 190, 0.72)";
  ctx.font = "500 13px monospace";
  ctx.fillText(
    `[CLICK TO INSPECT]  •  UPDATED ${project.pushedAt}  •  ${project.demoUrl ? "LIVE DEMO AVAILABLE" : "SOURCE ON GITHUB"}`,
    34,
    H - 22
  );

  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

  return toTexture(canvas, { repeat: [1, 1], srgb: true });
}

/** Animated-feeling high-density code editor texture for main lab coding monitors */
export function createCodeScreenTexture(variant: "shader" | "system" | "telemetry") {
  const W = 768;
  const H = 440;
  const { canvas, ctx } = makeCanvas(W, H);

  ctx.fillStyle = "#060b11";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0c141f";
  ctx.fillRect(0, 0, W, 34);
  ctx.fillStyle = "#4EF2B8";
  ctx.fillRect(0, 33, W, 1.5);
  ctx.font = "600 13px monospace";
  ctx.fillStyle = "#9FB0BE";
  const titles = {
    shader: "hologram.glsl — CHEIKH.EXE // WebGL Render Pipeline",
    system: "matching-graph.ts — SynKro k-factor Engine (Next.js 16)",
    telemetry: "SYS.MONITOR — C0D3R-CHEIKH06 // 16 REPOS SYNCED",
  };
  ctx.fillText(titles[variant], 18, 22);

  const lines =
    variant === "shader"
      ? [
          "uniform float uRevealY, uScanY, uSolidMix;",
          "float fresnel = pow(1.0 - dot(N, V), 3.8);",
          "vec3 mint = vec3(0.306, 0.949, 0.722);",
          "float scan = exp(-abs(pos.y - uScanY) * 80.0);",
          "// Progressive 9-phase laser fabrication",
          "if (uRevealY - pos.y < -0.012) discard;",
          "vec3 holo = mix(holoShell, litPortrait, uSolidMix);",
          "holo += mint * (fresnel * 0.62 + scan * 1.15);",
          "gl_FragColor = vec4(holo, alpha);",
          "",
          "[OK] Volumetric 3D laser beams locked",
          "[OK] Studio subsurface skin + Float32 active",
          "[OK] 60 FPS WebGL pipeline locked",
        ]
      : variant === "system"
      ? [
          "export function generateKFactorCycle(students, k = 3) {",
          "  // Strict inter-group constraint: g(A) !== g(B)",
          "  const edges = buildUndirectedGraph(students);",
          "  assertZeroIntraGroupPairs(edges);",
          "  return persistTransaction(prisma, edges);",
          "}",
          "",
          "// FastAPI + Groq Text-to-SQL Validator",
          "BLOCKED_SQL = {'SLEEP', 'BENCHMARK', 'DROP', 'DELETE'}",
          "assert sqlparse.parse(query)[0].get_type() == 'SELECT'",
          "// Real-time Socket.IO State Machine",
          "PHASE = ['IDLE', 'OPEN', 'CLOSED', 'RESULTS', 'REVEALED']",
        ]
      : [
          "KERNEL     : CHEIKH.EXE v2.5 // BEYOND THE CODE",
          "IDENTITY   : Cheikh Thiam (C0D3R-CHEIKH06)",
          "SKY ENGINE : VOLUMETRIC PERLIN-WORLEY CLOUDS + MIE",
          "HOLOGRAM   : ANATOMICAL 3D HOLOGRAM + LASER RIG",
          "GITHUB API : 15 OWNED REPOS + 1 COLLAB AUDITED",
          "STACK      : TS / NEXT.JS / PYTHON / FASTAPI / PHP / JAVA",
          "3D MODULES : LAB · SKILLS · FOOTBALL · GAMING · SWIMMING",
          "STATUS     : ALL INTERACTIVE SYSTEMS NOMINAL",
        ];

  ctx.font = "500 15px monospace";
  lines.forEach((line, i) => {
    const y = 68 + i * 26;
    ctx.fillStyle = "rgba(159,176,190,0.35)";
    ctx.fillText(String(i + 1).padStart(2, "0"), 16, y);
    if (line.startsWith("//")) ctx.fillStyle = "#5c768a";
    else if (line.startsWith("[OK]") || line.includes("NOMINAL")) ctx.fillStyle = "#4EF2B8";
    else if (line.includes("uniform") || line.includes("export")) ctx.fillStyle = "#38BDF8";
    else ctx.fillStyle = "#DDE8F0";
    ctx.fillText(line, 52, y);
  });

  ctx.strokeStyle = "#4EF2B8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 24; x < W - 24; x += 6) {
    const y = H - 36 + Math.sin(x * 0.04) * 10 + Math.cos(x * 0.11) * 6;
    if (x === 24) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  return toTexture(canvas, { repeat: [1, 1], srgb: true });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}
