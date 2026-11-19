"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useUniverseStore } from "@/store/useUniverseStore";

export function LightingRig() {
  const quality = useUniverseStore((s) => s.quality);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const holoLightRef = useRef<THREE.PointLight>(null);
  const labFillRef = useRef<THREE.PointLight>(null);
  const { scene } = useThree();

  const shadowSize = quality === "high" ? 2048 : quality === "medium" ? 1024 : 512;

  const nightKeyCol = useMemo(() => new THREE.Color("#96BBE8"), []);
  const dayKeyCol = useMemo(() => new THREE.Color("#FFF4DF"), []);
  const nightSkyCol = useMemo(() => new THREE.Color("#294669"), []);
  const daySkyCol = useMemo(() => new THREE.Color("#A8D4FF"), []);
  const nightGroundCol = useMemo(() => new THREE.Color("#0A111A"), []);
  const dayGroundCol = useMemo(() => new THREE.Color("#364552"), []);
  const nightFogCol = useMemo(() => new THREE.Color("#060B12"), []);
  const dayFogCol = useMemo(() => new THREE.Color("#88B8DE"), []);

  useFrame((state) => {
    const d = useUniverseStore.getState().dayFactor;
    const t = state.clock.elapsedTime;

    // Smooth atmospheric fog adaptation
    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(nightFogCol).lerp(dayFogCol, d);
      scene.fog.density = THREE.MathUtils.lerp(0.014, 0.0085, d);
    }

    // Main Sun / Moon directional key light with natural shadow angle shift
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(nightKeyCol).lerp(dayKeyCol, d);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(1.25, 3.1, d);
      keyLightRef.current.position.set(
        THREE.MathUtils.lerp(-10, 14, d),
        THREE.MathUtils.lerp(13, 18, d),
        THREE.MathUtils.lerp(-9, 10, d)
      );
    }

    // Ambient hemisphere sky/ground bounce
    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(nightSkyCol).lerp(daySkyCol, d);
      hemiLightRef.current.groundColor.copy(nightGroundCol).lerp(dayGroundCol, d);
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.58, 1.35, d);
    }

    // Mint silhouette rim light (stronger at night, softer in day)
    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.lerp(1.45, 0.55, d);
    }

    // Center hologram bounce light on surrounding brushed aluminum & glass deck
    if (holoLightRef.current) {
      const pulse = 0.94 + 0.06 * Math.sin(t * 2.4);
      holoLightRef.current.intensity = THREE.MathUtils.lerp(3.6, 1.3, d) * pulse;
    }

    if (labFillRef.current) {
      labFillRef.current.intensity = THREE.MathUtils.lerp(2.2, 0.85, d);
    }
  });

  return (
    <group name="LightingRig">
      <fogExp2 attach="fog" args={["#060B12", 0.014]} />

      {/* Primary Key Light (Moonlight at night -> Warm Sunlight in day) */}
      <directionalLight
        ref={keyLightRef}
        position={[-10, 13, -9]}
        intensity={1.25}
        castShadow={quality !== "low"}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={48}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      {/* Fill Hemisphere */}
      <hemisphereLight ref={hemiLightRef} args={["#294669", "#0A111A", 0.58]} />

      {/* Mint Rim Light for architectural edge separation */}
      <directionalLight
        ref={rimLightRef}
        position={[6, 8, -11]}
        color="#4EF2B8"
        intensity={1.45}
      />

      {/* Hologram Core Emitter Light — casts authentic mint reflections across pedestal & desk */}
      <pointLight
        ref={holoLightRef}
        position={[0, 1.9, 0.35]}
        color="#4EF2B8"
        intensity={3.6}
        distance={10}
        decay={2}
      />

      {/* Workstation Screen Ambient Bounce */}
      <pointLight
        ref={labFillRef}
        position={[0, 2.2, -3.2]}
        color="#7DD3FC"
        intensity={2.2}
        distance={9}
        decay={2}
      />

      {/* Procedural Studio IBL via Lightformers (zero external CDN HDRI dependencies!) */}
      <Environment resolution={quality === "low" ? 64 : 128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#D8F3FF"
          position={[0, 10, 4]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[18, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#4EF2B8"
          position={[-10, 3, -6]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#86C5FF"
          position={[10, 4, 5]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.5}
          color="#ECF3F7"
          position={[0, 6, -12]}
          scale={8}
        />
      </Environment>
    </group>
  );
}
