"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useUniverseStore } from "@/store/useUniverseStore";

/**
 * Photographic Studio Lighting Rig:
 *  - Calibrated Key / Fill / Rim hierarchy (no washed-out additive lights!)
 *  - Dynamically shifts color temperature, shadow angle, and atmosphere fog
 *    smoothly between Nocturnal Lunar Observatory and Bright Sunlit Day!
 *  - Procedural studio Lightformers IBL for tactile brushed-metal & glass PBR reflections
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

  const nightKeyCol = useMemo(() => new THREE.Color("#9AC0EB"), []);
  const dayKeyCol = useMemo(() => new THREE.Color("#FFF4DF"), []);
  const nightSkyCol = useMemo(() => new THREE.Color("#314F73"), []);
  const daySkyCol = useMemo(() => new THREE.Color("#B4DBFF"), []);
  const nightGroundCol = useMemo(() => new THREE.Color("#0B131D"), []);
  const dayGroundCol = useMemo(() => new THREE.Color("#455666"), []);
  const nightFogCol = useMemo(() => new THREE.Color("#070D16"), []);
  const dayFogCol = useMemo(() => new THREE.Color("#9AC5E8"), []);

  useFrame((state) => {
    const d = useUniverseStore.getState().dayFactor;
    const t = state.clock.elapsedTime;

    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(nightFogCol).lerp(dayFogCol, d);
      scene.fog.density = THREE.MathUtils.lerp(0.010, 0.006, d);
    }

    if (keyLightRef.current) {
      keyLightRef.current.color.copy(nightKeyCol).lerp(dayKeyCol, d);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(1.45, 3.25, d);
      keyLightRef.current.position.set(
        THREE.MathUtils.lerp(-11, 15, d),
        THREE.MathUtils.lerp(14, 20, d),
        THREE.MathUtils.lerp(-8, 11, d)
      );
    }

    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(nightSkyCol).lerp(daySkyCol, d);
      hemiLightRef.current.groundColor.copy(nightGroundCol).lerp(dayGroundCol, d);
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.68, 1.45, d);
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.lerp(1.2, 0.45, d);
    }

    // Controlled mint reflection cast by hologram pedestal onto brushed titanium deck
    if (holoLightRef.current) {
      const pulse = 0.95 + 0.05 * Math.sin(t * 2.2);
      holoLightRef.current.intensity = THREE.MathUtils.lerp(2.2, 0.75, d) * pulse;
    }

    if (labFillRef.current) {
      labFillRef.current.intensity = THREE.MathUtils.lerp(1.65, 0.65, d);
    }
  });

  return (
    <group name="LightingRig">
      <fogExp2 attach="fog" args={["#070D16", 0.010]} />

      {/* Key Light: Silver-blue Moonlight -> Warm Sunlit Daylight */}
      <directionalLight
        ref={keyLightRef}
        position={[-11, 14, -8]}
        intensity={1.45}
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
      <hemisphereLight ref={hemiLightRef} args={["#314F73", "#0B131D", 0.68]} />

      {/* Cool Mint Edge Rim Light */}
      <directionalLight
        ref={rimLightRef}
        position={[7, 9, -12]}
        color="#4EF2B8"
        intensity={1.2}
      />

      {/* Subtle Mint Hologram Bounce Light */}
      <pointLight
        ref={holoLightRef}
        position={[0, 1.7, 0.35]}
        color="#4EF2B8"
        intensity={2.2}
        distance={9.5}
        decay={2}
      />

      {/* Workstation Screen Ambient Bounce */}
      <pointLight
        ref={labFillRef}
        position={[0, 2.0, -3.1]}
        color="#8FD8FF"
        intensity={1.65}
        distance={8.5}
        decay={2}
      />

      {/* Studio Procedural IBL via Drei Lightformers for Crisp PBR Specular Reflections */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#E2F4FF"
          position={[0, 11, 5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[20, 7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#4EF2B8"
          position={[-11, 3.5, -5]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#8FC6FF"
          position={[11, 4.5, 5]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="ring"
          intensity={1.2}
          color="#ECF3F7"
          position={[0, 7, -14]}
          scale={9}
        />
      </Environment>
    </group>
  );
}
