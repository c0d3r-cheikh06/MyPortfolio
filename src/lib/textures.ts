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

/** Soft circular glowing bokeh particle sprite (eliminates ugly square WebGL point primitives!) */
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

/** Brushed dark titanium / aluminum PBR texture set */
export function createBrushedMetalTextures(repeat: [number, number] = [2, 2]) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const { canvas: rCanvas, ctx: rCtx } = makeCanvas(512, 512);
  const rand = mulberry32(4211);

  ctx.fillStyle = "#222933";
  ctx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = "#6c6c6c";
  rCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2400; i++) {
    const y = rand() * 512;
    const x = rand() * 512;
    const len = 40 + rand() * 190;
    const shade = 28 + Math.floor(rand() * 28);
    ctx.fillStyle = `rgba(${shade + 10}, ${shade + 18}, ${shade + 28}, ${0.14 + rand() * 0.22})`;
    ctx.fillRect(x, y, len, 1);

    const rShade = 75 + Math.floor(rand() * 85);
    rCtx.fillStyle = `rgba(${rShade},${rShade},${rShade},0.35)`;
    rCtx.fillRect(x, y, len, 1.2);
  }

  return {
    map: toTexture(canvas, { repeat, srgb: true }),
    roughnessMap: toTexture(rCanvas, { repeat, srgb: false }),
    bumpMap: toTexture(rCanvas, { repeat, srgb: false }),
  };
}

/** Architectural laboratory deck floor: chamfered carbon-graphite tiles with technical micro-seam */
export function createLabFloorTextures(repeat: [number, number] = [6, 6]) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const { canvas: rCanvas, ctx: rCtx } = makeCanvas(512, 512);
  const rand = mulberry32(8081);

  ctx.fillStyle = "#0e141c";
  ctx.fillRect(0, 0, 512, 512);
  rCtx.fillStyle = "#525252";
  rCtx.fillRect(0, 0, 512, 512);

  // Subtle matte grain
  for (let i = 0; i < 6500; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const v = 14 + Math.floor(rand() * 18);
    ctx.fillStyle = `rgba(${v},${v + 6},${v + 12},0.25)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Architectural modular tile seams
  const step = 128;
  ctx.strokeStyle = "rgba(78, 242, 184, 0.08)";
  ctx.lineWidth = 2;
  rCtx.strokeStyle = "#b8b8b8";
  rCtx.lineWidth = 3;
  for (let p = 0; p <= 512; p += step) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 512);
    ctx.moveTo(0, p);
    ctx.lineTo(512, p);
    ctx.stroke();

    rCtx.beginPath();
    rCtx.moveTo(p, 0);
    rCtx.lineTo(p, 512);
    rCtx.moveTo(0, p);
    rCtx.lineTo(512, p);
    rCtx.stroke();
  }

  // Corner precision rivets
  ctx.fillStyle = "rgba(159, 176, 190, 0.16)";
  for (let y = 0; y < 512; y += step) {
    for (let x = 0; x < 512; x += step) {
      ctx.fillRect(x + 6, y + 6, 3, 3);
      ctx.fillRect(x + step - 9, y + step - 9, 3, 3);
    }
  }

  return {
    map: toTexture(canvas, { repeat, srgb: true }),
    roughnessMap: toTexture(rCanvas, { repeat, srgb: false }),
    bumpMap: toTexture(rCanvas, { repeat, srgb: false }),
  };
}

/** Realistic detailed Moon surface (maria basalt plains + multi-scale craters + bump relief) */
export function createMoonTextures() {
  const W = 1024;
  const H = 512;
  const { canvas, ctx } = makeCanvas(W, H);
  const { canvas: bCanvas, ctx: bCtx } = makeCanvas(W, H);
  const rand = mulberry32(19690720);

  // Highland regolith base
  ctx.fillStyle = "#b8bcc2";
  ctx.fillRect(0, 0, W, H);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, W, H);

  // Dark basaltic maria (Sea of Tranquility, Oceanus Procellarum...)
  for (let i = 0; i < 24; i++) {
    const x = rand() * W;
    const y = 70 + rand() * (H - 140);
    const rx = 55 + rand() * 145;
    const ry = 35 + rand() * 95;
    const g = ctx.createRadialGradient(x, y, rx * 0.1, x, y, rx);
    g.addColorStop(0, "rgba(72, 77, 86, 0.58)");
    g.addColorStop(0.65, "rgba(86, 92, 102, 0.32)");
    g.addColorStop(1, "rgba(184, 188, 194, 0)");
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Regolith micro-mottling
  for (let i = 0; i < 9000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 1 + rand() * 4.5;
    const v = 125 + Math.floor(rand() * 90);
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.16)`;
    ctx.fillRect(x, y, r, r);
    bCtx.fillStyle = `rgba(${v},${v},${v},0.18)`;
    bCtx.fillRect(x, y, r, r);
  }

  // Multi-scale impact craters with sunken floor & bright rim
  for (let i = 0; i < 165; i++) {
    const x = rand() * W;
    const y = 24 + rand() * (H - 48);
    const r = i < 18 ? 16 + rand() * 28 : 3 + rand() * 13;

    // Diffuse crater
    const cg = ctx.createRadialGradient(x, y, r * 0.15, x, y, r * 1.25);
    cg.addColorStop(0, "rgba(82, 86, 94, 0.55)");
    cg.addColorStop(0.7, "rgba(104, 108, 116, 0.38)");
    cg.addColorStop(0.88, "rgba(226, 230, 235, 0.52)");
    cg.addColorStop(1, "rgba(180, 184, 190, 0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Bump crater (dark center = depressed, bright ring = raised ejecta rim)
    const bg = bCtx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.2);
    bg.addColorStop(0, "rgba(35,35,35,0.85)");
    bg.addColorStop(0.68, "rgba(65,65,65,0.65)");
    bg.addColorStop(0.88, "rgba(220,220,220,0.85)");
    bg.addColorStop(1, "rgba(128,128,128,0)");
    bCtx.fillStyle = bg;
    bCtx.beginPath();
    bCtx.arc(x, y, r * 1.2, 0, Math.PI * 2);
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
  // Fine turf blades grain
  for (let i = 0; i < 14000; i++) {
    const x = rand() * W;
    const y = rand() * H;
    ctx.fillStyle = rand() > 0.5 ? "rgba(95, 190, 120, 0.10)" : "rgba(10, 42, 24, 0.14)";
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp FIFA-style chalk markings
  ctx.strokeStyle = "rgba(236, 245, 240, 0.92)";
  ctx.lineWidth = 6;
  const m = 38;
  ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  // Halfway line & center circle
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

  // Penalty boxes
  ctx.strokeRect(m, H / 2 - 150, 140, 300);
  ctx.strokeRect(W - m - 140, H / 2 - 150, 140, 300);
  ctx.strokeRect(m, H / 2 - 70, 52, 140);
  ctx.strokeRect(W - m - 52, H / 2 - 70, 52, 140);

  return toTexture(canvas, { repeat: [1, 1], srgb: true });
}

/** Realistic match football texture (geometric panels + micro-pebble bump) */
export function createFootballBallTextures() {
  const W = 512;
  const H = 256;
  const { canvas, ctx } = makeCanvas(W, H);
  const { canvas: bCanvas, ctx: bCtx } = makeCanvas(W, H);

  ctx.fillStyle = "#eef2f6";
  ctx.fillRect(0, 0, W, H);
  bCtx.fillStyle = "#a0a0a0";
  bCtx.fillRect(0, 0, W, H);

  // Classic modern pentagon/hexagon panel motif in matte obsidian + subtle mint accent trim
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

  // Seam grid lines
  ctx.strokeStyle = "#b8c2cc";
  ctx.lineWidth = 2;
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
  };
}

/**
 * High-DPI terminal screen texture generated dynamically from a real audited GitHub project.
 * Displays authentic architecture, tech badges, verified features & live code aesthetics
 * without fabricating screenshots.
 */
export function createProjectScreenTexture(project: ProjectItem) {
  const W = 768;
  const H = 460;
  const { canvas, ctx } = makeCanvas(W, H);

  // Deep obsidian IDE background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#070c12");
  grad.addColorStop(1, "#0d1622");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle technical dot grid
  ctx.fillStyle = "rgba(159, 176, 190, 0.08)";
  for (let y = 24; y < H; y += 22) {
    for (let x = 24; x < W; x += 22) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // Top chrome bar
  ctx.fillStyle = "rgba(18, 28, 40, 0.92)";
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = project.accentColor;
  ctx.fillRect(0, 43, W, 2);

  // Status dots & path
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

  // Status pill top right
  ctx.fillStyle = "rgba(78, 242, 184, 0.14)";
  ctx.fillRect(W - 210, 10, 190, 24);
  ctx.fillStyle = project.accentColor;
  ctx.font = "600 13px monospace";
  ctx.fillText(`● ${project.statusLabel.toUpperCase().slice(0, 20)}`, W - 198, 27);

  // Project Title
  ctx.fillStyle = "#ECF3F7";
  ctx.font = "700 34px sans-serif";
  ctx.fillText(project.title, 34, 102);

  // Category subtitle
  ctx.fillStyle = project.accentColor;
  ctx.font = "600 15px monospace";
  ctx.fillText(project.categoryLabel.toUpperCase(), 34, 128);

  // Tagline (wrapped)
  ctx.fillStyle = "#C3D1DC";
  ctx.font = "400 18px sans-serif";
  wrapText(ctx, project.tagline, 34, 164, W - 68, 24);

  // Architecture card
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

  // Tech pills
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

  // Footer CTA hint
  ctx.fillStyle = "rgba(159, 176, 190, 0.72)";
  ctx.font = "500 13px monospace";
  ctx.fillText(
    `[CLICK TO INSPECT]  •  UPDATED ${project.pushedAt}  •  ${project.demoUrl ? "LIVE DEMO AVAILABLE" : "SOURCE ON GITHUB"}`,
    34,
    H - 22
  );

  // Scanline sheen
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
          "float fresnel = pow(1.0 - dot(N, V), 2.35);",
          "vec3 mint = vec3(0.306, 0.949, 0.722);",
          "float scan = exp(-abs(pos.y - uScanY) * 68.0);",
          "// Progressive laser fabrication pipeline",
          "if (uRevealY - pos.y < -0.015) discard;",
          "vec3 holo = mix(ghost, litBase, uSolidMix);",
          "holo += mint * (fresnel * 0.85 + scan * 1.4);",
          "gl_FragColor = vec4(holo, alpha);",
          "",
          "[OK] 116 laser contour paths loaded",
          "[OK] PBR vertex AO + curvature active",
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
          "KERNEL     : CHEIKH.EXE v2.0 // BEYOND THE CODE",
          "IDENTITY   : Cheikh Thiam (C0D3R-CHEIKH06)",
          "SKY ENGINE : ATMOSPHERIC RAYLEIGH + MIE ACTIVE",
          "HOLOGRAM   : PROCEDURAL SDF BUST + LASER STROKES",
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

  // Telemetry waveform bottom bar
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
