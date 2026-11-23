"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { createHologramMaterial } from "@/lib/glsl/hologramShader";
import {
  holoRingFragmentShader,
  holoRingVertexShader,
  laserBeamFragmentShader,
  laserBeamVertexShader,
  projectionConeFragmentShader,
  projectionConeVertexShader,
} from "@/lib/glsl/energyShader";
import { createGlowParticleTexture } from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

interface StrokeEntry {
  g: number;
  c: number;
  p: number[];
}

interface StrokesData {
  version: number;
  groups: string[];
  strokes: StrokeEntry[];
}

const PART_INDEX: Record<string, number> = {
  Skin: 0,
  Eyes: 1,
  Hair: 2,
  Tshirt: 3,
  Jacket: 4,
  Zipper: 5,
};

const UP_AXIS = new THREE.Vector3(0, 1, 0);

const smooth01 = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};
const rangeProgress = (t: number, a: number, b: number) => smooth01((t - a) / (b - a));

/**
 * Centerpiece Studio 3D Hologram of Cheikh Thiam:
 *  - Refined MakeHuman CC0 studio anatomical bust with sculpted coily crown & Float32 albedo
 *  - 4 articulated emitter turrets projecting volumetric 3D GLSL laser beams + impact flares
 *  - Soft rising holographic projection light column + coalescing quantum bokeh particles
 *  - Full 9-phase cinematic reconstruction sequence settling into a crystal-clear human hologram
 */
export function HologramAvatar() {
  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const activePanel = useUniverseStore((s) => s.activePanel);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const replayCount = useUniverseStore((s) => s.hologramReplayCount);
  const focusZone = useUniverseStore((s) => s.focusZone);
  const setHologramStatus = useUniverseStore((s) => s.setHologramStatus);

  const gltf = useGLTF("/models/cheikh-avatar.glb");

  const [strokesData, setStrokesData] = useState<StrokesData | null>(null);
  const [hovered, setHovered] = useState(false);

  const bustGroupRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);
  const turretHeadRefs = useRef<(THREE.Group | null)[]>([]);
  const muzzleFlareRefs = useRef<(THREE.Sprite | null)[]>([]);
  const impactFlareRefs = useRef<(THREE.Sprite | null)[]>([]);
  const hoverSmoothRef = useRef(0);
  const buildClockRef = useRef(0);
  const lastStageRef = useRef("");
  const lastUiReportRef = useRef(0);

  // Scratch vectors to avoid per-frame GC allocations
  const scratchStart = useMemo(() => new THREE.Vector3(), []);
  const scratchEnd = useMemo(() => new THREE.Vector3(), []);
  const scratchMid = useMemo(() => new THREE.Vector3(), []);
  const scratchDir = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let active = true;
    fetch("/models/cheikh-strokes.json")
      .then((r) => r.json())
      .then((data: StrokesData) => {
        if (active) setStrokesData(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      buildClockRef.current = 10;
      setHologramStatus(1, "09 · HOLOGRAM LOCKED");
      return;
    }
    if (phase === "entering" || phase === "active") {
      buildClockRef.current = 0;
    }
  }, [phase, replayCount, reducedMotion, setHologramStatus]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  // Clone scene & bind bespoke holographic shader per anatomical mesh
  const { clonedScene, partMaterials } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const mats: Record<string, THREE.ShaderMaterial> = {};
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const partId = PART_INDEX[mesh.name] ?? 0;
        const mat = createHologramMaterial(partId);
        mats[mesh.name] = mat;
        mesh.material = mat;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return { clonedScene: root, partMaterials: mats };
  }, [gltf.scene]);

  const particleSprite = useMemo(() => createGlowParticleTexture(), []);

  // Anatomical contour slices (only illuminated around active laser scan front!)
  const strokeLines = useMemo(() => {
    if (!strokesData) return [];
    return strokesData.strokes.map((s) => {
      const pts: THREE.Vector3[] = [];
      let avgY = 0;
      for (let i = 0; i < s.p.length; i += 3) {
        pts.push(new THREE.Vector3(s.p[i], s.p[i + 1], s.p[i + 2]));
        avgY += s.p[i + 1];
      }
      if (s.c === 1 && pts.length > 2) pts.push(pts[0].clone());
      avgY /= Math.max(1, s.p.length / 3);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: avgY > -0.14 ? "#B4FFE9" : "#4EF2B8",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return { line: new THREE.Line(geo, mat), avgY };
    });
  }, [strokesData]);

  // Coalescing quantum particles sampled directly from the sculpted bust surface
  const particleCount = 820;
  const particleData = useMemo(() => {
    const start = new Float32Array(particleCount * 3);
    const target = new Float32Array(particleCount * 3);
    const current = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const allVerts: number[] = [];
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const pos = (obj as THREE.Mesh).geometry.attributes.position;
        const step = Math.max(1, Math.floor(pos.count / 240));
        for (let i = 0; i < pos.count; i += step) {
          allVerts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        }
      }
    });
    const total = Math.max(1, allVerts.length / 3);

    for (let i = 0; i < particleCount; i++) {
      const idx = Math.floor((i * 7919) % total) * 3;
      target[i * 3] = allVerts[idx] ?? 0;
      target[i * 3 + 1] = allVerts[idx + 1] ?? -0.15;
      target[i * 3 + 2] = allVerts[idx + 2] ?? 0;

      const ang = i * 2.39996;
      const rad = 0.22 + ((i * 53) % 100) / 220;
      start[i * 3] = Math.cos(ang) * rad;
      start[i * 3 + 1] = -0.58 + ((i * 29) % 100) / 145;
      start[i * 3 + 2] = Math.sin(ang) * rad;

      current[i * 3] = start[i * 3];
      current[i * 3 + 1] = start[i * 3 + 1];
      current[i * 3 + 2] = start[i * 3 + 2];

      const white = i % 4 === 0;
      colors[i * 3] = white ? 0.94 : 0.31;
      colors[i * 3 + 1] = white ? 0.99 : 0.95;
      colors[i * 3 + 2] = white ? 0.97 : 0.72;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(current, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geo, start, target };
  }, [clonedScene]);

  // Volumetric laser cylinder geometry & shader
  const laserCylGeo = useMemo(() => new THREE.CylinderGeometry(0.0085, 0.014, 1, 12, 1, true), []);
  const laserMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: laserBeamVertexShader,
        fragmentShader: laserBeamFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#4EF2B8") },
        },
      }),
    []
  );

  // Soft rising holographic projection column from pedestal lens
  const coneMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: projectionConeVertexShader,
        fragmentShader: projectionConeFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0.9 },
          uColor: { value: new THREE.Color("#4EF2B8") },
        },
      }),
    []
  );

  const floorRingMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoRingVertexShader,
        fragmentShader: holoRingFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0.9 },
          uColor: { value: new THREE.Color("#4EF2B8") },
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(partMaterials).forEach((m) => m.dispose());
      strokeLines.forEach((s) => {
        s.line.geometry.dispose();
        (s.line.material as THREE.Material).dispose();
      });
      particleData.geo.dispose();
      particleSprite.dispose();
      laserCylGeo.dispose();
      laserMat.dispose();
      coneMat.dispose();
      floorRingMat.dispose();
    };
  }, [
    partMaterials,
    strokeLines,
    particleData,
    particleSprite,
    laserCylGeo,
    laserMat,
    coneMat,
    floorRingMat,
  ]);

  const bustScale = 2.02;
  const bustBaseY = 1.78;

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    const t = state.clock.elapsedTime;
    const dayFactor = useUniverseStore.getState().dayFactor;

    hoverSmoothRef.current = THREE.MathUtils.lerp(
      hoverSmoothRef.current,
      hovered ? 1 : 0,
      Math.min(1, dt * 8)
    );
    const hov = hoverSmoothRef.current;

    // 9-phase reconstruction variables
    let pGather = 1;
    let pAlpha = 0.04;
    let revealY = 0.22;
    let scanY = 0.22;
    let scanStr = 0;
    let solidMix = 1;
    let meshGridStrength = 0.0;
    let laserAlpha = 0;
    let coneIntensity = 0.85;
    let clothesA = 1;
    let skinA = 1;
    let eyesA = 1;
    let hairA = 1;
    let strokeGlow = 0;
    let glitch = 0;

    if (phase === "intro") {
      // Live biometric silhouette & volumetric laser scan behind the title overlay
      const sweep = -0.48 + (Math.sin(t * 0.65) * 0.5 + 0.5) * 0.64;
      pGather = 0.85;
      pAlpha = 0.52;
      revealY = sweep;
      scanY = sweep;
      scanStr = 0.92;
      solidMix = 0.28;
      meshGridStrength = 0.72;
      laserAlpha = 0.65;
      coneIntensity = 0.95;
      clothesA = 0.9;
      skinA = 0.9;
      eyesA = 0.9;
      hairA = 0.9;
      strokeGlow = 0.75;
      glitch = 0.08;
    } else {
      if (!reducedMotion) buildClockRef.current = Math.min(7.2, buildClockRef.current + dt);
      const c = buildClockRef.current;
      const DURATION = 6.5;
      const norm = Math.min(1, c / DURATION);

      // Phase 1 (0.0 -> 0.55s): Scene activation & projection light cone rise
      coneIntensity = 0.35 + 0.85 * rangeProgress(c, 0.0, 0.65);

      // Phase 2 (0.4 -> 1.65s): Quantum particle formation & upward coalescence
      pGather = rangeProgress(c, 0.45, 2.05);
      pAlpha = rangeProgress(c, 0.35, 0.8) * (1 - 0.93 * rangeProgress(c, 5.2, 6.4));

      // Phase 3 -> 6 (1.2 -> 5.05s): 4 Volumetric lasers lock & sweep torso -> face -> coily hair!
      laserAlpha = rangeProgress(c, 1.25, 1.75) * (1 - rangeProgress(c, 5.4, 6.15));
      const torsoSweep = rangeProgress(c, 1.85, 3.15);
      const faceSweep = rangeProgress(c, 3.15, 4.35);
      const hairSweep = rangeProgress(c, 4.35, 5.05);

      if (c < 3.15) {
        revealY = THREE.MathUtils.lerp(-0.54, -0.10, torsoSweep);
      } else if (c < 4.35) {
        revealY = THREE.MathUtils.lerp(-0.10, 0.055, faceSweep);
      } else {
        revealY = THREE.MathUtils.lerp(0.055, 0.21, hairSweep);
      }

      // Phase 7 (5.05 -> 5.65s): Top-to-bottom holographic mesh stabilization scan pulse
      const stabDown = rangeProgress(c, 5.05, 5.65);
      scanY = c < 5.05 ? revealY : THREE.MathUtils.lerp(0.18, -0.46, stabDown);
      scanStr = rangeProgress(c, 1.25, 1.75) * (1 - rangeProgress(c, 5.55, 6.25));
      strokeGlow = scanStr;

      // Staged anatomical appearance
      clothesA = rangeProgress(c, 1.85, 2.45);
      skinA = rangeProgress(c, 2.75, 3.35);
      eyesA = rangeProgress(c, 3.65, 4.15);
      hairA = rangeProgress(c, 4.25, 4.85);

      // Phase 7 & 8: Visible holographic lattice -> cleanly fades to 0 by 6.2s when stabilized
      const gridIn = rangeProgress(c, 1.9, 2.8);
      const gridPeak = rangeProgress(c, 4.8, 5.3);
      const gridFadeOut = rangeProgress(c, 5.45, 6.2);
      meshGridStrength = gridIn * (0.55 + 0.45 * gridPeak) * (1 - gridFadeOut);

      solidMix = rangeProgress(c, 4.9, 6.25);
      glitch = (1 - solidMix) * 0.16;

      // Detailed 9-phase telemetry readout
      const stage =
        norm < 0.08
          ? "01 · SCENE ACTIVATION"
          : norm < 0.21
          ? "02 · PARTICLE FORMATION"
          : norm < 0.30
          ? "03 · LASER BEAM LOCK"
          : norm < 0.48
          ? "04 · SILHOUETTE BUILD"
          : norm < 0.67
          ? "05 · FACIAL RECONSTRUCTION"
          : norm < 0.78
          ? "06 · HAIR RECONSTRUCTION"
          : norm < 0.87
          ? "07 · MESH STABILIZATION"
          : norm < 0.96
          ? "08 · HOLOGRAPHIC SHADER"
          : "09 · HOLOGRAM LOCKED";

      if (stage !== lastStageRef.current || t - lastUiReportRef.current > 0.12) {
        lastStageRef.current = stage;
        lastUiReportRef.current = t;
        setHologramStatus(norm, stage);
      }
    }

    // Update shader uniforms across every anatomical mesh
    for (const [name, mat] of Object.entries(partMaterials)) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uRevealY.value = revealY;
      mat.uniforms.uSolidMix.value = solidMix;
      mat.uniforms.uMeshGridStrength.value = meshGridStrength;
      mat.uniforms.uScanY.value = scanY;
      mat.uniforms.uScanStrength.value = scanStr;
      mat.uniforms.uHover.value = hov;
      mat.uniforms.uDayFactor.value = dayFactor;
      mat.uniforms.uGlitch.value = glitch;

      if (name === "Skin") mat.uniforms.uPartAlpha.value = skinA;
      else if (name === "Eyes") mat.uniforms.uPartAlpha.value = eyesA;
      else if (name === "Hair") mat.uniforms.uPartAlpha.value = hairA;
      else mat.uniforms.uPartAlpha.value = clothesA;
    }

    // Contours illuminate ONLY near the active scanning plane -> zero zebra stripes left on face!
    for (const s of strokeLines) {
      const mat = s.line.material as THREE.LineBasicMaterial;
      const nearFront = Math.exp(-Math.abs(s.avgY - scanY) * 58) * strokeGlow;
      const revealed = s.avgY <= revealY + 0.01 ? 1 : 0;
      const op = revealed * nearFront * 0.78;
      mat.opacity = Math.min(0.85, op);
      s.line.visible = op > 0.02;
    }

    // Update coalescing circular glow particles
    if (particlesRef.current) {
      const posAttr = particleData.geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const swirl = (1 - pGather) * 2.4;
        const cs = Math.cos(swirl + t * 0.65);
        const sn = Math.sin(swirl + t * 0.65);
        const sx = particleData.start[i3];
        const sz = particleData.start[i3 + 2];
        arr[i3] = THREE.MathUtils.lerp(sx * cs - sz * sn, particleData.target[i3], pGather);
        arr[i3 + 1] =
          THREE.MathUtils.lerp(particleData.start[i3 + 1], particleData.target[i3 + 1], pGather) +
          Math.sin(t * 1.6 + i) * 0.003 * (1 - pGather * 0.7);
        arr[i3 + 2] = THREE.MathUtils.lerp(sx * sn + sz * cs, particleData.target[i3 + 2], pGather);
      }
      posAttr.needsUpdate = true;
      (particlesRef.current.material as THREE.PointsMaterial).opacity = pAlpha + hov * 0.05;
    }

    // Update active horizontal laser scanner ring
    if (scanRingRef.current) {
      scanRingRef.current.position.y = scanY;
      scanRingRef.current.rotation.z = t * 1.4;
      scanRingRef.current.visible = scanStr > 0.02;
      (scanRingRef.current.material as THREE.MeshBasicMaterial).opacity = scanStr * 0.85;
    }

    // Update 4 volumetric 3D cylindrical laser beams + turret pitch + muzzle/impact flares
    laserMat.uniforms.uTime.value = t;
    laserMat.uniforms.uOpacity.value = laserAlpha;

    const targetYWorld = bustBaseY + scanY * bustScale;
    const turretR = 1.24;
    const targetRingR = scanY > -0.14 ? 0.22 : 0.38;

    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2 + Math.PI / 4;
      scratchStart.set(Math.cos(ang) * turretR, 0.41, Math.sin(ang) * turretR);

      const spinAng = ang + t * 1.85;
      scratchEnd.set(
        Math.cos(spinAng) * targetRingR,
        targetYWorld,
        Math.sin(spinAng) * targetRingR
      );

      // Aim optical turret head toward live target
      const turret = turretHeadRefs.current[k];
      if (turret) {
        turret.lookAt(scratchEnd);
      }

      const beam = beamRefs.current[k];
      if (beam) {
        beam.visible = laserAlpha > 0.02;
        if (beam.visible) {
          scratchDir.subVectors(scratchEnd, scratchStart);
          const len = scratchDir.length();
          scratchMid.addVectors(scratchStart, scratchEnd).multiplyScalar(0.5);
          beam.position.copy(scratchMid);
          beam.scale.set(1, len, 1);
          beam.quaternion.setFromUnitVectors(UP_AXIS, scratchDir.normalize());
        }
      }

      const mFlare = muzzleFlareRefs.current[k];
      if (mFlare) {
        mFlare.visible = laserAlpha > 0.02;
        mFlare.position.copy(scratchStart);
        (mFlare.material as THREE.SpriteMaterial).opacity = laserAlpha * 0.85;
      }

      const iFlare = impactFlareRefs.current[k];
      if (iFlare) {
        iFlare.visible = laserAlpha > 0.02;
        iFlare.position.copy(scratchEnd);
        (iFlare.material as THREE.SpriteMaterial).opacity = laserAlpha * 0.9;
      }
    }

    // Update projection column & floor calibration rings
    coneMat.uniforms.uTime.value = t;
    coneMat.uniforms.uIntensity.value = coneIntensity * (1 - dayFactor * 0.25) + hov * 0.25;

    floorRingMat.uniforms.uTime.value = t;
    floorRingMat.uniforms.uIntensity.value = 0.78 + hov * 0.35 + laserAlpha * 0.32;

    // Dignified forward-facing presence in Main & Avatar views (never spins his back to visitor!)
    if (bustGroupRef.current && !reducedMotion) {
      const targetYaw =
        activeZone === "avatar"
          ? 0.04
          : Math.sin(t * 0.42) * 0.085;
      bustGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        bustGroupRef.current.rotation.y,
        targetYaw,
        Math.min(1, dt * 3.5)
      );
      bustGroupRef.current.position.y = bustBaseY + Math.sin(t * 1.1) * 0.011;
    }
  });

  return (
    <group name="HologramCenterpiece" position={[0, 0, 0]}>
      {/* Sculpted Multi-Tiered Brushed-Titanium Emitter Pedestal */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.44, 1.62, 0.22, 64]} />
          <meshStandardMaterial color="#273240" metalness={0.78} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <cylinderGeometry args={[1.20, 1.34, 0.08, 64]} />
          <meshStandardMaterial color="#344354" metalness={0.82} roughness={0.26} />
        </mesh>
        <mesh position={[0, 0.305, 0]} receiveShadow>
          <cylinderGeometry args={[1.02, 1.12, 0.04, 64]} />
          <meshStandardMaterial color="#1D2733" metalness={0.86} roughness={0.24} />
        </mesh>
        {/* Recessed optical projector glass lens */}
        <mesh position={[0, 0.33, 0]}>
          <cylinderGeometry args={[0.90, 0.90, 0.02, 64]} />
          <meshPhysicalMaterial
            color="#0B2220"
            emissive="#4EF2B8"
            emissiveIntensity={0.38}
            roughness={0.1}
            metalness={0.16}
            clearcoat={1}
          />
        </mesh>

        {/* 4 Articulated Optical Laser Emitter Turrets (rotated 45° so front face stays clear!) */}
        {[0, 1, 2, 3].map((k) => {
          const ang = (k * Math.PI) / 2 + Math.PI / 4;
          return (
            <group
              key={k}
              position={[Math.cos(ang) * 1.24, 0.33, Math.sin(ang) * 1.24]}
            >
              {/* Turret mounting base */}
              <mesh position={[0, 0.02, 0]} castShadow>
                <cylinderGeometry args={[0.075, 0.095, 0.06, 16]} />
                <meshStandardMaterial color="#3A495B" metalness={0.85} roughness={0.26} />
              </mesh>
              {/* Articulated aiming barrel head */}
              <group
                position={[0, 0.08, 0]}
                ref={(el) => {
                  turretHeadRefs.current[k] = el;
                }}
              >
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.028, 0.042, 0.14, 14]} />
                  <meshStandardMaterial color="#253140" metalness={0.88} roughness={0.22} />
                </mesh>
                <mesh position={[0, 0, 0.072]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.01, 14]} />
                  <meshBasicMaterial color="#7BFFDA" />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* Precision Holographic Calibration Floor Rings */}
        <mesh
          position={[0, 0.345, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={floorRingMat}
        >
          <planeGeometry args={[3.2, 3.2]} />
        </mesh>

        {/* Soft Rising Volumetric Projection Light Column */}
        <mesh position={[0, 1.02, 0]} material={coneMat}>
          <cylinderGeometry args={[0.64, 0.90, 1.36, 48, 1, true]} />
        </mesh>
      </group>

      {/* 4 Volumetric 3D Cylindrical Laser Beams + Muzzle & Impact Flares */}
      {[0, 1, 2, 3].map((k) => (
        <group key={k}>
          <mesh
            ref={(el) => {
              beamRefs.current[k] = el;
            }}
            geometry={laserCylGeo}
            material={laserMat}
            visible={false}
          />
          <sprite
            ref={(el) => {
              muzzleFlareRefs.current[k] = el;
            }}
            scale={[0.16, 0.16, 1]}
            visible={false}
          >
            <spriteMaterial
              map={particleSprite}
              color="#CCFFF0"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          <sprite
            ref={(el) => {
              impactFlareRefs.current[k] = el;
            }}
            scale={[0.14, 0.14, 1]}
            visible={false}
          >
            <spriteMaterial
              map={particleSprite}
              color="#FFFFFF"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </group>
      ))}

      {/* Main Interactive Holographic Bust */}
      <group
        ref={bustGroupRef}
        position={[0, bustBaseY, 0]}
        scale={bustScale}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 5) return;
          focusZone("avatar", true);
        }}
      >
        <primitive object={clonedScene} />

        {/* Dynamic Scan Contour Slices (only light up right under active laser front!) */}
        <group>
          {strokeLines.map((s, idx) => (
            <primitive key={idx} object={s.line} />
          ))}
        </group>

        {/* Soft Circular Glowing Quantum Particles */}
        <points ref={particlesRef} geometry={particleData.geo}>
          <pointsMaterial
            map={particleSprite}
            vertexColors
            size={0.022}
            transparent
            opacity={0}
            alphaTest={0.02}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Razor-thin Horizontal Laser Scanner Ring */}
        <mesh ref={scanRingRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.265, 0.278, 64]} />
          <meshBasicMaterial
            color="#B8FFE9"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Compact non-blocking tooltip ONLY in Main view & above head (never covers face!) */}
        {phase === "active" && hovered && activeZone === "main" && !activePanel && (
          <Html
            position={[0, 0.25, 0]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap rounded-full border border-[#4EF2B8]/40 bg-[#070C12]/90 px-3 py-1 backdrop-blur-md shadow-lg">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
                CHEIKH THIAM
              </span>
              <span className="ml-2 font-mono text-[10px] text-[#ECF3F7]/85">
                · Cliquer pour inspecter
              </span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload("/models/cheikh-avatar.glb");
