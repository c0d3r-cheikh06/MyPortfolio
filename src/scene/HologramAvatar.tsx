"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { createHologramMaterial } from "@/lib/glsl/hologramShader";
import {
  holoRingFragmentShader,
  holoRingVertexShader,
  laserBeamFragmentShader,
  laserBeamVertexShader,
} from "@/lib/glsl/energyShader";
import { useUniverseStore } from "@/store/useUniverseStore";

interface StrokeEntry {
  g: number; // 0=scan, 1=eyes, 2=brows, 3=nose, 4=lips, 5=face, 6=hair, 7=clothes
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

/**
 * Centerpiece 3D Holographic Reconstruction of Cheikh Thiam:
 *  - Loads custom sculpted GLB bust (desktop hi-res or mobile lite)
 *  - Loads 116 anatomically projected laser stroke paths (cheikh-strokes.json)
 *  - Executes a genuine multi-stage GSAP timeline:
 *      1. Luminous particles coalesce in the emitter field
 *      2. Mint & white vertical laser beams ignite + horizontal scanner ring sweeps
 *      3. Body contour scanlines trace the upright silhouette
 *      4. Eyes, eyebrows, nose, lips & facial contours draw progressively
 *      5. Coily hair volume materializes with crown contours
 *      6. Zipped black jacket & light-grey t-shirt holographic mesh builds up
 *      7. Solid volumetric hologram stabilizes with Fresnel glow & breathing
 *  - Supports 360° inspection, hover contour boost, and click -> About Me panel
 */
export function HologramAvatar() {
  const quality = useUniverseStore((s) => s.quality);
  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const replayCount = useUniverseStore((s) => s.hologramReplayCount);
  const focusZone = useUniverseStore((s) => s.focusZone);
  const setHologramStatus = useUniverseStore((s) => s.setHologramStatus);

  const modelUrl =
    quality === "low" ? "/models/cheikh-avatar-lite.glb" : "/models/cheikh-avatar.glb";
  const gltf = useGLTF(modelUrl);

  const [strokesData, setStrokesData] = useState<StrokesData | null>(null);
  const [hovered, setHovered] = useState(false);

  const bustGroupRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const beamsGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Timeline animation state mutated smoothly by GSAP
  const anim = useRef({
    particleGather: 0,
    particleAlpha: 0,
    beamOpacity: 0,
    scanY: -0.66,
    scanStrength: 0,
    revealY: -0.66,
    solidMix: 0,
    skinAlpha: 0,
    eyesAlpha: 0,
    hairAlpha: 0,
    clothesAlpha: 0,
    // stroke group progress 0..1
    gScan: 0,
    gFace: 0,
    gEyes: 0,
    gHair: 0,
    gClothes: 0,
    strokeFade: 1,
    glitch: 0,
    hover: 0,
  });

  // Load laser stroke paths JSON
  useEffect(() => {
    let active = true;
    fetch("/models/cheikh-strokes.json")
      .then((r) => r.json())
      .then((data: StrokesData) => {
        if (active) setStrokesData(data);
      })
      .catch(() => {
        // non-fatal fallback if strokes json unavailable
      });
    return () => {
      active = false;
    };
  }, []);

  // Clone scene & assign dedicated custom GLSL hologram material per anatomical part
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

  // Build Three.js Line objects for all 116 anatomically aligned laser strokes
  const strokeLines = useMemo(() => {
    if (!strokesData) return [];
    const entries: {
      line: THREE.Line;
      group: number;
      totalPoints: number;
      baseOpacity: number;
    }[] = [];

    for (const s of strokesData.strokes) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < s.p.length; i += 3) {
        pts.push(new THREE.Vector3(s.p[i], s.p[i + 1], s.p[i + 2]));
      }
      if (s.c === 1 && pts.length > 2) pts.push(pts[0].clone());
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setDrawRange(0, 0);

      // Facial features gleam crisp mint-white; scan contours are subtle mint
      const isFaceFeature = s.g >= 1 && s.g <= 5;
      const color = isFaceFeature
        ? s.g === 1 || s.g === 4
          ? "#E4FFF6"
          : "#6BF8C8"
        : s.g === 6
        ? "#52F2B8"
        : "#3AD8A4";
      const baseOpacity = s.g === 0 ? 0.42 : isFaceFeature ? 0.92 : 0.68;

      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: baseOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      entries.push({
        line: new THREE.Line(geo, mat),
        group: s.g,
        totalPoints: pts.length,
        baseOpacity,
      });
    }
    return entries;
  }, [strokesData]);

  // Coalescing reconstruction particles (scattered cylinder -> silhouette surface samples)
  const particleCount = quality === "low" ? 360 : 880;
  const particleData = useMemo(() => {
    const start = new Float32Array(particleCount * 3);
    const target = new Float32Array(particleCount * 3);
    const current = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Sample target points directly from the GLB vertices so particles form Cheikh's true silhouette!
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
    const totalSampled = Math.max(1, allVerts.length / 3);

    for (let i = 0; i < particleCount; i++) {
      const idx = Math.floor((i * 19937) % totalSampled) * 3;
      const tx = allVerts[idx] ?? 0;
      const ty = allVerts[idx + 1] ?? -0.2;
      const tz = allVerts[idx + 2] ?? 0;
      target[i * 3] = tx;
      target[i * 3 + 1] = ty;
      target[i * 3 + 2] = tz;

      // Scattered orbital origin around the emitter column
      const ang = i * 2.39996;
      const rad = 0.42 + ((i * 73) % 100) / 140;
      start[i * 3] = Math.cos(ang) * rad;
      start[i * 3 + 1] = -0.65 + ((i * 37) % 100) / 115;
      start[i * 3 + 2] = Math.sin(ang) * rad;

      current[i * 3] = start[i * 3];
      current[i * 3 + 1] = start[i * 3 + 1];
      current[i * 3 + 2] = start[i * 3 + 2];

      const isWhite = i % 5 === 0;
      colors[i * 3] = isWhite ? 0.92 : 0.31;
      colors[i * 3 + 1] = isWhite ? 0.99 : 0.95;
      colors[i * 3 + 2] = isWhite ? 0.97 : 0.72;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(current, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geo, start, target, current };
  }, [clonedScene, particleCount]);

  // Volumetric vertical laser beam materials (mint + cool white)
  const mintBeamMat = useMemo(
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

  const whiteBeamMat = useMemo(
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
          uColor: { value: new THREE.Color("#ECFAFF") },
        },
      }),
    []
  );

  // Pedestal floor holographic projection ring shader
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
          uIntensity: { value: 0.95 },
          uColor: { value: new THREE.Color("#4EF2B8") },
        },
      }),
    []
  );

  // Dispose GPU assets on unmount
  useEffect(() => {
    return () => {
      Object.values(partMaterials).forEach((m) => m.dispose());
      strokeLines.forEach((s) => {
        s.line.geometry.dispose();
        (s.line.material as THREE.Material).dispose();
      });
      particleData.geo.dispose();
      mintBeamMat.dispose();
      whiteBeamMat.dispose();
      floorRingMat.dispose();
    };
  }, [partMaterials, strokeLines, particleData, mintBeamMat, whiteBeamMat, floorRingMat]);

  // Hover glow tween + pointer cursor
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    gsap.to(anim.current, {
      hover: hovered ? 1 : 0,
      duration: 0.35,
      ease: "power2.out",
    });
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  // Master GSAP Holographic Laser Reconstruction Timeline (Part 3 & 20.5)
  useEffect(() => {
    const a = anim.current;

    if (reducedMotion) {
      Object.assign(a, {
        particleGather: 1,
        particleAlpha: 0.12,
        beamOpacity: 0.08,
        scanY: 0.25,
        scanStrength: 0,
        revealY: 0.25,
        solidMix: 1,
        skinAlpha: 1,
        eyesAlpha: 1,
        hairAlpha: 1,
        clothesAlpha: 1,
        gScan: 1,
        gFace: 1,
        gEyes: 1,
        gHair: 1,
        gClothes: 1,
        strokeFade: 0.24,
        glitch: 0,
      });
      setHologramStatus(1, "STABILIZED");
      return;
    }

    // During intro screen: show dramatic early beam & silhouette particle preview!
    if (phase === "intro") {
      const introTl = gsap.timeline();
      introTl
        .set(a, {
          particleGather: 0.2,
          particleAlpha: 0.9,
          beamOpacity: 0.72,
          scanY: -0.64,
          scanStrength: 0.85,
          revealY: -0.66,
          solidMix: 0,
          skinAlpha: 0,
          eyesAlpha: 0,
          hairAlpha: 0,
          clothesAlpha: 0,
          gScan: 0.35,
          gFace: 0,
          gEyes: 0,
          gHair: 0,
          gClothes: 0,
          strokeFade: 0.95,
          glitch: 0.2,
        })
        .to(a, {
          particleGather: 0.72,
          gScan: 0.85,
          gFace: 0.45,
          scanY: 0.16,
          duration: 2.8,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
        });
      setHologramStatus(0.18, "LASER STANDBY");
      return () => {
        introTl.kill();
      };
    }

    // Active Experience (or Replay): Full staged 6-second cinematic laser fabrication!
    const tl = gsap.timeline({
      onUpdate: () => {
        const p = tl.progress();
        const stage =
          p < 0.16
            ? "PARTICLE COALESCENCE"
            : p < 0.34
            ? "SILHOUETTE LASER SCAN"
            : p < 0.56
            ? "FACIAL GEOMETRY SYNTHESIS"
            : p < 0.72
            ? "HAIR & GARMENT MESHING"
            : p < 0.94
            ? "VOLUMETRIC STABILIZATION"
            : "HOLOGRAM LOCKED";
        setHologramStatus(p, stage);
      },
    });

    // Reset to darkness before reconstruction
    tl.set(a, {
      particleGather: 0,
      particleAlpha: 0,
      beamOpacity: 0,
      scanY: -0.66,
      scanStrength: 0,
      revealY: -0.66,
      solidMix: 0,
      skinAlpha: 0,
      eyesAlpha: 0,
      hairAlpha: 0,
      clothesAlpha: 0,
      gScan: 0,
      gFace: 0,
      gEyes: 0,
      gHair: 0,
      gClothes: 0,
      strokeFade: 1,
      glitch: 0.45,
    });

    // 1. Particles appear & coalesce into human skeleton/volume
    tl.to(a, { particleAlpha: 0.95, duration: 0.55, ease: "power2.out" }, 0.05)
      .to(a, { particleGather: 1.0, duration: 2.0, ease: "power3.inOut" }, 0.15)
      // 2. Mint & white vertical laser beams pierce the chamber
      .to(a, { beamOpacity: 0.95, scanStrength: 1.0, duration: 0.5, ease: "power2.out" }, 0.35)
      // 3. Scanner sweeps bottom-to-top + body contour lines draw
      .to(a, { scanY: 0.22, duration: 2.2, ease: "power1.inOut" }, 0.55)
      .to(a, { gScan: 1, duration: 1.7, ease: "power2.out" }, 0.65)
      // 4. Face outline, eyes, eyebrows, nose & lips build progressively via laser strokes
      .to(a, { gFace: 1, duration: 1.3, ease: "power2.inOut" }, 1.6)
      .to(a, { gEyes: 1, duration: 1.2, ease: "power2.inOut" }, 2.05)
      // 5. Coily hair volume contours appear
      .to(a, { gHair: 1, duration: 1.1, ease: "power2.out" }, 2.65)
      // 6. Jacket & t-shirt holographic mesh + vertical surface reveal sweep
      .to(a, { gClothes: 1, duration: 1.1, ease: "power2.out" }, 2.9)
      .to(a, { clothesAlpha: 1, duration: 0.5 }, 2.85)
      .to(a, { skinAlpha: 1, duration: 0.6 }, 3.0)
      .to(a, { eyesAlpha: 1, duration: 0.5 }, 3.25)
      .to(a, { hairAlpha: 1, duration: 0.55 }, 3.45)
      .to(a, { revealY: 0.24, duration: 2.1, ease: "power2.inOut" }, 2.8)
      // Second fine precision scan sweep downward during solidification
      .set(a, { scanY: 0.24 }, 4.55)
      .to(a, { scanY: -0.66, duration: 1.35, ease: "power2.inOut" }, 4.58)
      // 7. Solid volumetric hologram stabilizes; lasers settle into sleek ambient state
      .to(a, { solidMix: 1.0, glitch: 0, duration: 1.4, ease: "power2.out" }, 4.35)
      .to(a, { beamOpacity: 0.10, particleAlpha: 0.14, scanStrength: 0.18, duration: 1.1, ease: "power2.out" }, 5.1)
      .to(a, { strokeFade: 0.22, duration: 1.1, ease: "power2.out" }, 5.1);

    return () => {
      tl.kill();
    };
  }, [phase, replayCount, reducedMotion, setHologramStatus]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const a = anim.current;
    const dayFactor = useUniverseStore.getState().dayFactor;

    // Update all per-part hologram shader uniforms
    for (const [name, mat] of Object.entries(partMaterials)) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uRevealY.value = a.revealY;
      mat.uniforms.uSolidMix.value = a.solidMix;
      mat.uniforms.uScanY.value = a.scanY;
      mat.uniforms.uScanStrength.value = a.scanStrength;
      mat.uniforms.uHover.value = a.hover;
      mat.uniforms.uDayFactor.value = dayFactor;
      mat.uniforms.uGlitch.value = a.glitch;

      if (name === "Skin") mat.uniforms.uPartAlpha.value = a.skinAlpha;
      else if (name === "Eyes") mat.uniforms.uPartAlpha.value = a.eyesAlpha;
      else if (name === "Hair") mat.uniforms.uPartAlpha.value = a.hairAlpha;
      else mat.uniforms.uPartAlpha.value = a.clothesAlpha;
    }

    // Update laser stroke drawRanges & hover gleam
    for (const s of strokeLines) {
      let prog = 0;
      if (s.group === 0) prog = a.gScan;
      else if (s.group === 5) prog = a.gFace;
      else if (s.group >= 1 && s.group <= 4) prog = a.gEyes;
      else if (s.group === 6) prog = a.gHair;
      else if (s.group === 7) prog = a.gClothes;

      s.line.geometry.setDrawRange(0, Math.floor(s.totalPoints * prog));
      const mat = s.line.material as THREE.LineBasicMaterial;
      const hoverBoost = s.group >= 1 && s.group <= 6 ? a.hover * 0.58 : a.hover * 0.35;
      mat.opacity = Math.min(1, s.baseOpacity * (a.strokeFade + hoverBoost));
    }

    // Update coalescing particles positions
    if (particlesRef.current) {
      const posAttr = particleData.geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const g = a.particleGather;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Swirl motion as particles pull inward into Cheikh's silhouette
        const swirl = (1 - g) * 2.2;
        const cs = Math.cos(swirl + t * 0.65);
        const sn = Math.sin(swirl + t * 0.65);
        const sx = particleData.start[i3];
        const sz = particleData.start[i3 + 2];
        const rx = sx * cs - sz * sn;
        const rz = sx * sn + sz * cs;

        arr[i3] = THREE.MathUtils.lerp(rx, particleData.target[i3], g);
        arr[i3 + 1] =
          THREE.MathUtils.lerp(particleData.start[i3 + 1], particleData.target[i3 + 1], g) +
          Math.sin(t * 1.8 + i) * 0.004 * (1 - g * 0.6);
        arr[i3 + 2] = THREE.MathUtils.lerp(rz, particleData.target[i3 + 2], g);
      }
      posAttr.needsUpdate = true;
      (particlesRef.current.material as THREE.PointsMaterial).opacity =
        a.particleAlpha + a.hover * 0.16;
    }

    // Laser scanner ring position & opacity
    if (scanRingRef.current) {
      scanRingRef.current.position.y = a.scanY;
      scanRingRef.current.rotation.z = t * 0.8;
      scanRingRef.current.visible = a.scanStrength > 0.02;
      (scanRingRef.current.material as THREE.MeshBasicMaterial).opacity =
        a.scanStrength * 0.85;
    }

    // Vertical laser beams
    mintBeamMat.uniforms.uTime.value = t;
    mintBeamMat.uniforms.uOpacity.value = a.beamOpacity;
    whiteBeamMat.uniforms.uTime.value = t * 1.3;
    whiteBeamMat.uniforms.uOpacity.value = a.beamOpacity * 0.85;
    if (beamsGroupRef.current) {
      beamsGroupRef.current.rotation.y = t * 0.35;
    }

    // Pedestal floor energy rings
    floorRingMat.uniforms.uTime.value = t;
    floorRingMat.uniforms.uIntensity.value = 0.85 + a.hover * 0.45 + a.beamOpacity * 0.4;

    // Post-reconstruction subtle life: slow rotation in global view, frontal ID-photo lock when focused!
    if (bustGroupRef.current && !reducedMotion) {
      if (activeZone === "avatar") {
        // Align cleanly straight-forward (ID photo composition) with ultra-subtle living sway
        const targetRotY = Math.sin(t * 0.55) * 0.05;
        bustGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          bustGroupRef.current.rotation.y,
          targetRotY,
          delta * 3.5
        );
      } else {
        // Gentle showcase turntable rotation
        bustGroupRef.current.rotation.y += delta * 0.16;
      }
      bustGroupRef.current.position.y = 1.92 + Math.sin(t * 1.15) * 0.016;
    }
  });

  // Scale bust slightly (1.92x -> impressive life-size holographic centerpiece standing ~1.5m tall above pedestal)
  const bustScale = 1.92;

  return (
    <group name="HologramCenterpiece" position={[0, 0, 0]}>
      {/* Architectural Hologram Pedestal */}
      <group position={[0, 0, 0]}>
        {/* Outer brushed dark aluminum plinth */}
        <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.45, 1.62, 0.28, 48]} />
          <meshStandardMaterial color="#131A23" metalness={0.82} roughness={0.3} />
        </mesh>
        {/* Chamfered emitter ring */}
        <mesh position={[0, 0.31, 0]} receiveShadow>
          <cylinderGeometry args={[1.18, 1.32, 0.08, 48]} />
          <meshStandardMaterial color="#1C2633" metalness={0.88} roughness={0.22} />
        </mesh>
        {/* Emitter optical glass core */}
        <mesh position={[0, 0.355, 0]}>
          <cylinderGeometry args={[0.96, 0.96, 0.02, 48]} />
          <meshPhysicalMaterial
            color="#0B2420"
            emissive="#4EF2B8"
            emissiveIntensity={0.45}
            roughness={0.12}
            metalness={0.1}
            transmission={0.35}
          />
        </mesh>
        {/* 4 Precision Emitter Projectors around pedestal rim */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, i) => (
          <group
            key={i}
            position={[Math.cos(ang) * 1.24, 0.36, Math.sin(ang) * 1.24]}
            rotation={[0, -ang, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.14, 0.22]} />
              <meshStandardMaterial color="#25303F" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[-0.075, 0.02, 0]}>
              <boxGeometry args={[0.02, 0.05, 0.12]} />
              <meshBasicMaterial color="#4EF2B8" />
            </mesh>
          </group>
        ))}

        {/* Holographic floor calibration rings */}
        <mesh
          position={[0, 0.37, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={floorRingMat}
        >
          <planeGeometry args={[3.3, 3.3]} />
        </mesh>
      </group>

      {/* Main Interactive Holographic Bust + Laser Strokes + Particles */}
      <group
        ref={bustGroupRef}
        position={[0, 1.92, 0]}
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
        {/* Sculpted GLB Avatar with Custom Hologram Shader */}
        <primitive object={clonedScene} />

        {/* 116 Anatomically Aligned Laser Strokes */}
        <group>
          {strokeLines.map((s, idx) => (
            <primitive key={idx} object={s.line} />
          ))}
        </group>

        {/* Coalescing Hologram Particles */}
        <points ref={particlesRef} geometry={particleData.geo}>
          <pointsMaterial
            vertexColors
            size={0.011}
            transparent
            opacity={0}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* Active Horizontal Laser Scanner Ring */}
        <mesh ref={scanRingRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.31, 0.335, 64]} />
          <meshBasicMaterial
            color="#9BFFDF"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Vertical Mint & White Volumetric Laser Beams */}
        <group ref={beamsGroupRef}>
          {[
            { pos: [0, -0.18, 0] as [number, number, number], r: 0.34, mat: mintBeamMat },
            { pos: [0.22, -0.18, 0.14] as [number, number, number], r: 0.012, mat: whiteBeamMat },
            { pos: [-0.22, -0.18, 0.14] as [number, number, number], r: 0.012, mat: whiteBeamMat },
            { pos: [0.16, -0.18, -0.18] as [number, number, number], r: 0.014, mat: mintBeamMat },
            { pos: [-0.16, -0.18, -0.18] as [number, number, number], r: 0.014, mat: mintBeamMat },
          ].map((b, idx) => (
            <mesh key={idx} position={b.pos} material={b.mat}>
              <cylinderGeometry args={[b.r, b.r, 1.32, 24, 1, true]} />
            </mesh>
          ))}
        </group>

        {/* Subtle Interactive Hover Tag (only visible when active and hovered) */}
        {phase === "active" && hovered && (
          <Html
            position={[0.36, 0.08, 0]}
            center
            distanceFactor={6}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap rounded-md border border-[#4EF2B8]/40 bg-[#070C12]/88 px-3 py-1.5 backdrop-blur-md shadow-lg">
              <div className="font-mono text-[10px] tracking-[0.22em] text-[#4EF2B8]">
                CHEIKH THIAM // C0D3R-CHEIKH06
              </div>
              <div className="text-[11px] text-[#ECF3F7]/90">
                Cliquer pour ouvrir la fiche personnelle
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload("/models/cheikh-avatar.glb");
