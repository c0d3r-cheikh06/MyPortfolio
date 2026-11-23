"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { createHologramMaterial } from "@/lib/glsl/hologramShader";
import { holoRingFragmentShader, holoRingVertexShader } from "@/lib/glsl/energyShader";
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

const smooth01 = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};
const rangeProgress = (t: number, a: number, b: number) => smooth01((t - a) / (b - a));

/**
 * Centerpiece Studio 3D Hologram of Cheikh Thiam:
 *  - Loads our MakeHuman CC0 studio anatomical bust (`cheikh-avatar.glb`, 2.04 MB)
 *  - 4 converged precision emitter laser beams trace the active build height upward
 *    as quantum particles coalesce and the real sculpted 3D human bust materializes
 *  - Uses real clamped frame progression (never stalls or remounts on quality shifts!)
 *  - Hover enhances Fresnel edges & precision scan contours; Click focuses eye-level ID framing
 */
export function HologramAvatar() {
  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const replayCount = useUniverseStore((s) => s.hologramReplayCount);
  const focusZone = useUniverseStore((s) => s.focusZone);
  const setHologramStatus = useUniverseStore((s) => s.setHologramStatus);

  // Always load our single fast 2.04MB studio bust -> zero Suspense remount flicker!
  const gltf = useGLTF("/models/cheikh-avatar.glb");

  const [strokesData, setStrokesData] = useState<StrokesData | null>(null);
  const [hovered, setHovered] = useState(false);

  const bustGroupRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const laserLinesRef = useRef<THREE.LineSegments>(null);
  const hoverSmoothRef = useRef(0);
  const buildClockRef = useRef(0);
  const lastStageRef = useRef("");
  const lastUiReportRef = useRef(0);

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

  // Reset build timer cleanly whenever entering active mode or user clicks Replay Laser
  useEffect(() => {
    if (reducedMotion) {
      buildClockRef.current = 10;
      setHologramStatus(1, "HOLOGRAM LOCKED");
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

  // Soft circular glowing bokeh texture for particles (zero square points!)
  const particleSprite = useMemo(() => createGlowParticleTexture(), []);

  // Precision anatomical contour slices from the real MakeHuman bust
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
        color: avgY > -0.14 ? "#A6FFE4" : "#4EF2B8",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return { line: new THREE.Line(geo, mat), avgY, totalPoints: pts.length };
    });
  }, [strokesData]);

  // Coalescing quantum reconstruction particles sampled directly from the sculpted bust surface
  const particleCount = 640;
  const particleData = useMemo(() => {
    const start = new Float32Array(particleCount * 3);
    const target = new Float32Array(particleCount * 3);
    const current = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const allVerts: number[] = [];
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const pos = (obj as THREE.Mesh).geometry.attributes.position;
        const step = Math.max(1, Math.floor(pos.count / 180));
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
      const rad = 0.36 + ((i * 53) % 100) / 160;
      start[i * 3] = Math.cos(ang) * rad;
      start[i * 3 + 1] = -0.54 + ((i * 29) % 100) / 135;
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

  // 4 Precision Converging Laser Beams (from the 4 optical emitter turrets -> active scan ring!)
  // Crisp thin laser rays instead of a blinding white cylinder!
  const laserGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // 4 outer beams + 4 inner white core beams = 8 line segments = 16 vertices
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    return geo;
  }, []);

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
          uIntensity: { value: 0.88 },
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
      laserGeo.dispose();
      floorRingMat.dispose();
    };
  }, [partMaterials, strokeLines, particleData, particleSprite, laserGeo, floorRingMat]);

  const bustScale = 2.02;
  const bustBaseY = 1.78;

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    const t = state.clock.elapsedTime;
    const dayFactor = useUniverseStore.getState().dayFactor;

    // Smooth hover transition
    hoverSmoothRef.current = THREE.MathUtils.lerp(
      hoverSmoothRef.current,
      hovered ? 1 : 0,
      Math.min(1, dt * 8)
    );
    const hov = hoverSmoothRef.current;

    // Real-time staged reconstruction progression (5.2s total, never stalls!)
    let pGather = 1;
    let pAlpha = 0.08;
    let revealY = 0.22;
    let scanY = 0.22;
    let scanStr = 0;
    let solidMix = 1;
    let laserAlpha = 0;
    let clothesA = 1;
    let skinA = 1;
    let eyesA = 1;
    let hairA = 1;
    let strokeGlobalFade = 0.09;
    let glitch = 0;

    if (phase === "intro") {
      // Elegant live preview behind the title: hovering biometric silhouette & slow vertical laser sweep
      const sweep = -0.52 + ((Math.sin(t * 0.7) * 0.5 + 0.5) * 0.68);
      pGather = 0.82;
      pAlpha = 0.62;
      revealY = sweep;
      scanY = sweep;
      scanStr = 0.95;
      solidMix = 0.25;
      laserAlpha = 0.65;
      clothesA = 0.85;
      skinA = 0.85;
      eyesA = 0.85;
      hairA = 0.85;
      strokeGlobalFade = 0.48;
      glitch = 0.12;
    } else {
      if (!reducedMotion) buildClockRef.current = Math.min(6.0, buildClockRef.current + dt);
      const c = buildClockRef.current;
      const DURATION = 4.8;
      const norm = Math.min(1, c / DURATION);

      // Stage 1 (0.0 -> 1.1s): Particles coalesce from emitter into bust silhouette
      pGather = rangeProgress(c, 0.05, 1.5);
      pAlpha =
        rangeProgress(c, 0.0, 0.4) * (1 - 0.88 * rangeProgress(c, 3.6, 4.8));

      // Stage 2 (0.4 -> 3.3s): 4 focused laser beams sweep upward building jacket -> neck -> face -> eyes -> hair!
      const sweepUp = rangeProgress(c, 0.45, 3.35);
      revealY = THREE.MathUtils.lerp(-0.55, 0.21, sweepUp);
      scanY = revealY;
      scanStr =
        rangeProgress(c, 0.35, 0.7) * (1 - rangeProgress(c, 3.6, 4.6));
      laserAlpha =
        rangeProgress(c, 0.3, 0.65) * (1 - rangeProgress(c, 3.4, 4.4));

      // Stage 3: Anatomical parts appear cleanly in vertical sequence
      clothesA = rangeProgress(c, 0.45, 1.05);
      skinA = rangeProgress(c, 1.25, 1.95);
      eyesA = rangeProgress(c, 2.15, 2.65);
      hairA = rangeProgress(c, 2.55, 3.25);

      // Stage 4 (2.7 -> 4.6s): Volumetric stabilization from holographic ghost -> crystal-clear realistic hologram!
      solidMix = rangeProgress(c, 2.4, 4.5);
      glitch = (1 - solidMix) * 0.22;
      strokeGlobalFade = THREE.MathUtils.lerp(0.62, 0.08, rangeProgress(c, 3.2, 4.7));

      // Throttled HUD progress updates
      const stage =
        norm < 0.22
          ? "PARTICLE COALESCENCE"
          : norm < 0.48
          ? "SILHOUETTE LASER BUILD"
          : norm < 0.72
          ? "FACIAL RECONSTRUCTION"
          : norm < 0.96
          ? "VOLUMETRIC STABILIZATION"
          : "HOLOGRAM LOCKED";
      if (stage !== lastStageRef.current || t - lastUiReportRef.current > 0.14) {
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

    // Update horizontal scan contour rings (only visible below active laser front!)
    for (const s of strokeLines) {
      const mat = s.line.material as THREE.LineBasicMaterial;
      const nearFront = Math.exp(-Math.abs(s.avgY - scanY) * 26) * scanStr;
      const revealed = s.avgY <= revealY + 0.015 ? 1 : 0;
      const op = revealed * (strokeGlobalFade + nearFront * 0.78 + hov * 0.28);
      mat.opacity = Math.min(0.9, op);
      s.line.visible = op > 0.015;
    }

    // Update coalescing circular glow particles
    if (particlesRef.current) {
      const posAttr = particleData.geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const swirl = (1 - pGather) * 2.0;
        const cs = Math.cos(swirl + t * 0.55);
        const sn = Math.sin(swirl + t * 0.55);
        const sx = particleData.start[i3];
        const sz = particleData.start[i3 + 2];
        arr[i3] = THREE.MathUtils.lerp(sx * cs - sz * sn, particleData.target[i3], pGather);
        arr[i3 + 1] =
          THREE.MathUtils.lerp(particleData.start[i3 + 1], particleData.target[i3 + 1], pGather) +
          Math.sin(t * 1.6 + i) * 0.003 * (1 - pGather * 0.65);
        arr[i3 + 2] = THREE.MathUtils.lerp(sx * sn + sz * cs, particleData.target[i3 + 2], pGather);
      }
      posAttr.needsUpdate = true;
      (particlesRef.current.material as THREE.PointsMaterial).opacity = pAlpha + hov * 0.1;
    }

    // Update active horizontal laser scan ring
    if (scanRingRef.current) {
      scanRingRef.current.position.y = scanY;
      scanRingRef.current.rotation.z = t * 1.2;
      scanRingRef.current.visible = scanStr > 0.02;
      (scanRingRef.current.material as THREE.MeshBasicMaterial).opacity = scanStr * 0.85;
    }

    // Update 4 precision converging laser beams (pedestal turrets -> active scan plane on bust!)
    if (laserLinesRef.current) {
      laserLinesRef.current.visible = laserAlpha > 0.02;
      if (laserAlpha > 0.02) {
        const posAttr = laserGeo.attributes.position as THREE.BufferAttribute;
        const colAttr = laserGeo.attributes.color as THREE.BufferAttribute;
        const pArr = posAttr.array as Float32Array;
        const cArr = colAttr.array as Float32Array;
        const targetYWorld = bustBaseY + scanY * bustScale;
        const turretR = 1.18;
        const ringR = 0.34;
        for (let k = 0; k < 4; k++) {
          const ang = (k * Math.PI) / 2;
          const sx = Math.cos(ang) * turretR;
          const sy = 0.4;
          const sz = Math.sin(ang) * turretR;
          const spinAng = ang + t * 2.1;
          const tx = Math.cos(spinAng) * ringR;
          const tz = Math.sin(spinAng) * ringR;
          // Primary mint laser ray
          const o = k * 2 * 3;
          pArr[o] = sx; pArr[o + 1] = sy; pArr[o + 2] = sz;
          pArr[o + 3] = tx; pArr[o + 4] = targetYWorld; pArr[o + 5] = tz;
          cArr[o] = 0.31; cArr[o + 1] = 0.95; cArr[o + 2] = 0.72;
          cArr[o + 3] = 0.92; cArr[o + 4] = 1.0; cArr[o + 5] = 0.96;

          // Secondary white cross-scan laser ray aiming directly at the facial/chest focal axis
          const o2 = (4 + k) * 2 * 3;
          pArr[o2] = sx; pArr[o2 + 1] = sy; pArr[o2 + 2] = sz;
          pArr[o2 + 3] = Math.sin(t * 4.2 + k) * 0.14;
          pArr[o2 + 4] = targetYWorld;
          pArr[o2 + 5] = Math.cos(t * 3.8 + k) * 0.14;
          cArr[o2] = 0.88; cArr[o2 + 1] = 0.98; cArr[o2 + 2] = 0.99;
          cArr[o2 + 3] = 0.31; cArr[o2 + 4] = 0.95; cArr[o2 + 5] = 0.72;
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        (laserLinesRef.current.material as THREE.LineBasicMaterial).opacity = laserAlpha * 0.85;
      }
    }

    // Update floor emitter ring shader
    floorRingMat.uniforms.uTime.value = t;
    floorRingMat.uniforms.uIntensity.value = 0.75 + hov * 0.4 + laserAlpha * 0.35;

    // Gentle living movement: straight ID-portrait lock when Avatar is focused; slow dignified showcase orbit otherwise
    if (bustGroupRef.current && !reducedMotion) {
      if (activeZone === "avatar" || phase === "intro") {
        const gentleSway = Math.sin(t * 0.5) * 0.035;
        bustGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          bustGroupRef.current.rotation.y,
          gentleSway,
          Math.min(1, dt * 4.0)
        );
      } else {
        bustGroupRef.current.rotation.y += dt * 0.14;
      }
      bustGroupRef.current.position.y = bustBaseY + Math.sin(t * 1.1) * 0.012;
    }
  });

  return (
    <group name="HologramCenterpiece" position={[0, 0, 0]}>
      {/* Sculpted Brushed-Titanium Emitter Pedestal */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.42, 1.58, 0.24, 64]} />
          <meshStandardMaterial color="#141B24" metalness={0.84} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.28, 0]} receiveShadow>
          <cylinderGeometry args={[1.16, 1.30, 0.08, 64]} />
          <meshStandardMaterial color="#1E2836" metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Recessed optical projector lens */}
        <mesh position={[0, 0.325, 0]}>
          <cylinderGeometry args={[0.92, 0.92, 0.02, 64]} />
          <meshPhysicalMaterial
            color="#091D1B"
            emissive="#4EF2B8"
            emissiveIntensity={0.34}
            roughness={0.12}
            metalness={0.18}
            clearcoat={1}
          />
        </mesh>
        {/* 4 Precision Optical Laser Emitter Turrets */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, i) => (
          <group
            key={i}
            position={[Math.cos(ang) * 1.22, 0.36, Math.sin(ang) * 1.22]}
            rotation={[0, -ang, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.13, 0.12, 0.20]} />
              <meshStandardMaterial color="#24303F" metalness={0.86} roughness={0.24} />
            </mesh>
            <mesh position={[-0.068, 0.02, 0]}>
              <boxGeometry args={[0.02, 0.04, 0.11]} />
              <meshBasicMaterial color="#4EF2B8" />
            </mesh>
          </group>
        ))}

        {/* Precision Holographic Calibration Floor Rings */}
        <mesh
          position={[0, 0.345, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={floorRingMat}
        >
          <planeGeometry args={[3.2, 3.2]} />
        </mesh>
      </group>

      {/* 4 Focused Converging Laser Reconstruction Beams (world pedestal -> moving scan plane) */}
      <lineSegments ref={laserLinesRef} geometry={laserGeo} visible={false}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

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
          focusZone("avatar", true);
        }}
      >
        <primitive object={clonedScene} />

        {/* Subtle Anatomical Topographic Scan Rings */}
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
            size={0.024}
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
          <ringGeometry args={[0.265, 0.282, 64]} />
          <meshBasicMaterial
            color="#A6FFE4"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {phase === "active" && hovered && (
          <Html
            position={[0.34, 0.04, 0]}
            center
            distanceFactor={5.5}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap rounded-md border border-[#4EF2B8]/40 bg-[#070C12]/90 px-3 py-1.5 backdrop-blur-md shadow-lg">
              <div className="font-mono text-[10px] tracking-[0.22em] text-[#4EF2B8]">
                CHEIKH THIAM {"//"} C0D3R-CHEIKH06
              </div>
              <div className="text-[11px] text-[#ECF3F7]/90">
                Cliquer pour ouvrir la présentation
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload("/models/cheikh-avatar.glb");
