"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useUniverseStore } from "@/store/useUniverseStore";

/**
 * Photographic Studio Lighting Rig:
 *  - Dynamically modulates Key/Fill/Rim lights, Environment IBL intensity, and Fog
 *    coherently across Nocturnal Lunar Observatory -> Golden Twilight -> Sunlit Day
 *  - Keeps brushed titanium, glass, stone, and water responsive without crushed blacks or neon washout
 */
export function LightingRig() {
  const quality = useUniverseStore((s) => s.quality);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const holoLightRef = useRef<THREE.PointLight>(null);
  const labFillRef = useRef<THREE.PointLight>(null);
  const { scene } = useThree();

  const shadowSize = quality === "high" ? 2048 : 1024;

  const nightKeyCol = useMemo(() => new THREE.Color("#9EC6F0"), []);
  const duskKeyCol = useMemo(() => new THREE.Color("#FFB87A"), []);
  const dayKeyCol = useMemo(() => new THREE.Color("#FFF3DC"), []);
  const nightSkyCol = useMemo(() => new THREE.Color("#385A82"), []);
  const daySkyCol = useMemo(() => new THREE.Color("#BCE0FF"), []);
  const nightGroundCol = useMemo(() => new THREE.Color("#121A26"), []);
  const dayGroundCol = useMemo(() => new THREE.Color("#5B6C7D"), []);
  const nightFogCol = useMemo(() => new THREE.Color("#050B14"), []);
  const duskFogCol = useMemo(() => new THREE.Color("#6B5A72"), []);
  const dayFogCol = useMemo(() => new THREE.Color("#A6CAE8"), []);

  useFrame((state) => {
    const d = useUniverseStore.getState().dayFactor;
    const twilight = Math.sin(d * Math.PI);
    const t = state.clock.elapsedTime;

    // Coherent IBL reflection strength across Night & Bright Daylight
    scene.environmentIntensity = THREE.MathUtils.lerp(0.68, 1.50, d);

    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(nightFogCol).lerp(dayFogCol, d).lerp(duskFogCol, twilight * 0.45);
      scene.fog.density = THREE.MathUtils.lerp(0.0062, 0.0036, d);
    }

    if (keyLightRef.current) {
      keyLightRef.current.color
        .copy(nightKeyCol)
        .lerp(dayKeyCol, d)
        .lerp(duskKeyCol, twilight * 0.6);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(1.85, 3.55, d);
      keyLightRef.current.position.set(
        THREE.MathUtils.lerp(-11, 14, d),
        THREE.MathUtils.lerp(14, 21, d),
        THREE.MathUtils.lerp(-8, 12, d)
      );
    }

    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(nightSkyCol).lerp(daySkyCol, d);
      hemiLightRef.current.groundColor.copy(nightGroundCol).lerp(dayGroundCol, d);
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.78, 1.65, d);
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.lerp(1.05, 0.40, d);
    }

    // Controlled mint reflection on pedestal (subtler in daylight so titanium stays crisp!)
    if (holoLightRef.current) {
      const pulse = 0.96 + 0.04 * Math.sin(t * 2.2);
      holoLightRef.current.intensity = THREE.MathUtils.lerp(1.55, 0.55, d) * pulse;
    }

    if (labFillRef.current) {
      labFillRef.current.intensity = THREE.MathUtils.lerp(1.55, 0.65, d);
    }
  });

  return (
    <group name="LightingRig">
      <fogExp2 attach="fog" args={["#050B14", 0.0062]} />

      {/* Key Light: Silver-blue Moonlight -> Golden Twilight -> Warm Sunlit Daylight */}
      <directionalLight
        ref={keyLightRef}
        position={[-11, 14, -8]}
        intensity={1.85}
        castShadow={quality !== "low"}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={54}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      {/* Ambient Sky / Deck Fill */}
      <hemisphereLight ref={hemiLightRef} args={["#385A82", "#121A26", 0.78]} />

      {/* Controlled Cool Edge Rim Light */}
      <directionalLight
        ref={rimLightRef}
        position={[7, 9, -12]}
        color="#6CEFD0"
        intensity={1.05}
      />

      {/* Subtle Hologram Pedestal Bounce Light */}
      <pointLight
        ref={holoLightRef}
        position={[0, 1.7, 0.35]}
        color="#4EF2B8"
        intensity={1.55}
        distance={9.0}
        decay={2}
      />

      {/* Workstation Screen Ambient Bounce */}
      <pointLight
        ref={labFillRef}
        position={[0, 2.0, -2.95]}
        color="#9CD8FF"
        intensity={1.55}
        distance={8.5}
        decay={2}
      />

      {/* Studio & Sky IBL Lightformers for Tactile Brushed-Titanium & Glass Reflections */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#EAF6FF"
          position={[0, 12, 5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[22, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#6CEFD0"
          position={[-11, 3.5, -5]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#9FD0FF"
          position={[11, 4.5, 5]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.3}
          color="#FFF7EA"
          position={[0, 7, -14]}
          scale={10}
        />
      </Environment>
    </group>
  );
}
