"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  poolFloorFragmentShader,
  poolFloorVertexShader,
  waterSurfaceFragmentShader,
  waterSurfaceVertexShader,
} from "@/lib/glsl/waterShader";
import { createStoneCopingTextures } from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Instanced floating lane divider buoys with gentle wave bobbing */
function LaneRope({ z }: { z: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const count = 24;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      dummy.position.set(-1.72 + t * 3.44, 0.08, z);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(i < 4 || i > count - 5 ? "#4EF2B8" : i % 2 === 0 ? "#ECF3F7" : "#22D3EE");
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [z]);

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = Math.sin(t * 1.9) * 0.008;
    groupRef.current.rotation.z = Math.cos(t * 1.4) * 0.005;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[0.036, 0.036, 0.11, 12]} />
        <meshStandardMaterial roughness={0.32} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

/** Curved stainless steel pool handrail */
function StainlessHandrail({ position }: { position: [number, number, number] }) {
  const railGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.14, -0.02, 0),
          new THREE.Vector3(0.14, 0.44, 0),
          new THREE.Vector3(0.02, 0.52, 0),
          new THREE.Vector3(-0.14, 0.46, 0),
          new THREE.Vector3(-0.14, -0.25, 0),
        ]),
        24,
        0.016,
        10,
        false
      ),
    []
  );

  useEffect(() => {
    return () => railGeo.dispose();
  }, [railGeo]);

  return (
    <mesh position={position} geometry={railGeo}>
      <meshStandardMaterial color="#D4E1EC" metalness={0.94} roughness={0.14} />
    </mesh>
  );
}

/**
 * Swimming Aquatic Infinity Pool Satellite Pod (x = -9.3, z = -5.4):
 *  - Architectural travertine/basalt stone coping deck (PBR map + normal + roughness)
 *  - Laminated infinity glass outer basin window showing illuminated azure water depth
 *  - Custom GLSL mosaic tiles + animated Voronoi aquatic caustics
 *  - Rippling reflective GLSL water surface with Fresnel reflections & specular glints
 *  - Dual starting blocks, curved stainless handrails & wave-bobbing Olympic lane dividers
 */
export function SwimmingPod() {
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const phase = useUniverseStore((s) => s.phase);
  const [hovered, setHovered] = useState(false);

  const stoneTex = useMemo(() => createStoneCopingTextures([3, 2]), []);

  const waterMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: waterSurfaceVertexShader,
        fragmentShader: waterSurfaceFragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uDayFactor: { value: 0 },
        },
      }),
    []
  );

  const floorMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: poolFloorVertexShader,
        fragmentShader: poolFloorFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uDayFactor: { value: 0 },
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      waterMat.dispose();
      floorMat.dispose();
      stoneTex.map.dispose();
      stoneTex.roughnessMap.dispose();
      stoneTex.normalMap.dispose();
    };
  }, [waterMat, floorMat, stoneTex]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const d = useUniverseStore.getState().dayFactor;
    waterMat.uniforms.uTime.value = t;
    waterMat.uniforms.uDayFactor.value = d;
    floorMat.uniforms.uTime.value = t;
    floorMat.uniforms.uDayFactor.value = d;
  });

  return (
    <group
      name="SwimmingPod"
      position={[-9.3, 0, -5.4]}
      rotation={[0, 0.56, 0]}
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
        selectHobby("swimming");
      }}
    >
      {/* Architectural Travertine/Basalt Stone Pool Surround Coping */}
      <mesh position={[0, -0.04, -1.52]} receiveShadow castShadow>
        <boxGeometry args={[4.85, 0.36, 0.72]} />
        <meshStandardMaterial
          map={stoneTex.map}
          normalMap={stoneTex.normalMap}
          roughnessMap={stoneTex.roughnessMap}
          color="#92A1B0"
          metalness={0.14}
          roughness={0.62}
        />
      </mesh>
      <mesh position={[0, -0.04, 1.52]} receiveShadow castShadow>
        <boxGeometry args={[4.85, 0.36, 0.72]} />
        <meshStandardMaterial
          map={stoneTex.map}
          normalMap={stoneTex.normalMap}
          roughnessMap={stoneTex.roughnessMap}
          color="#92A1B0"
          metalness={0.14}
          roughness={0.62}
        />
      </mesh>
      <mesh position={[-2.14, -0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.58, 0.36, 2.34]} />
        <meshStandardMaterial
          map={stoneTex.map}
          normalMap={stoneTex.normalMap}
          roughnessMap={stoneTex.roughnessMap}
          color="#92A1B0"
          metalness={0.14}
          roughness={0.62}
        />
      </mesh>
      <mesh position={[2.14, -0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.58, 0.36, 2.34]} />
        <meshStandardMaterial
          map={stoneTex.map}
          normalMap={stoneTex.normalMap}
          roughnessMap={stoneTex.roughnessMap}
          color="#92A1B0"
          metalness={0.14}
          roughness={0.62}
        />
      </mesh>

      {/* Outer Titanium Under-Hull */}
      <mesh position={[0, -0.48, 0]}>
        <boxGeometry args={[4.55, 0.54, 3.45]} />
        <meshStandardMaterial color="#1B2532" metalness={0.75} roughness={0.38} />
      </mesh>

      {/* Laminated Clear Infinity-Edge Glass Side Panel */}
      <mesh position={[0, -0.14, -1.89]}>
        <boxGeometry args={[4.56, 0.28, 0.04]} />
        <meshPhysicalMaterial
          color="#7CE0FF"
          transparent
          opacity={0.32}
          roughness={0.06}
          metalness={0.08}
          clearcoat={1}
        />
      </mesh>

      {/* Underwater Illuminated Pool Walls */}
      <mesh position={[0, -0.18, -1.14]}>
        <boxGeometry args={[3.72, 0.54, 0.04]} />
        <meshStandardMaterial color="#0A3E5B" emissive="#158BB8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, -0.18, 1.14]}>
        <boxGeometry args={[3.72, 0.54, 0.04]} />
        <meshStandardMaterial color="#0A3E5B" emissive="#158BB8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-1.84, -0.18, 0]}>
        <boxGeometry args={[0.04, 0.54, 2.32]} />
        <meshStandardMaterial color="#0A3E5B" emissive="#158BB8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[1.84, -0.18, 0]}>
        <boxGeometry args={[0.04, 0.54, 2.32]} />
        <meshStandardMaterial color="#0A3E5B" emissive="#158BB8" emissiveIntensity={0.45} />
      </mesh>

      {/* Animated Underwater Caustics Tiled Pool Floor */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[3.7, 2.32]} />
      </mesh>

      {/* Rippling Reflective GLSL Water Surface */}
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMat}>
        <planeGeometry args={[3.7, 2.32, 48, 32]} />
      </mesh>

      {/* Wave-Bobbing Floating Swimming Lane Divider */}
      <LaneRope z={0} />

      {/* Dual Competitive Starting Blocks */}
      {[-0.58, 0.58].map((sz, i) => (
        <group key={i} position={[-1.98, 0.16, sz]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.34, 0.24, 0.34]} />
            <meshStandardMaterial color="#314154" metalness={0.82} roughness={0.26} />
          </mesh>
          <mesh position={[0.04, 0.25, 0]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[0.38, 0.04, 0.36]} />
            <meshStandardMaterial color="#DCE8F0" roughness={0.48} metalness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Curved Stainless Steel Handrails */}
      <StainlessHandrail position={[1.76, 0.14, 0.67]} />
      <StainlessHandrail position={[1.76, 0.14, 1.03]} />

      {/* Subtle Underwater Cyan Glow Accent Light */}
      <pointLight
        position={[0, 0.55, 0]}
        color="#33DFFF"
        intensity={hovered ? 2.8 : 1.85}
        distance={6.8}
        decay={2}
      />

      {/* Outer Coping Trim Light */}
      <mesh position={[0, 0.145, -1.86]}>
        <boxGeometry args={[4.6, 0.014, 0.02]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#22D3EE"} />
      </mesh>
      <mesh position={[0, 0.145, 1.86]}>
        <boxGeometry args={[4.6, 0.014, 0.02]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#22D3EE"} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.32, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#22D3EE]/45 bg-[#070C12]/92 px-3 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md shadow-lg">
            <span className="text-[#22D3EE]">HOBBY //</span> AQUATIC INFINITY POOL
          </div>
        </Html>
      )}
    </group>
  );
}
