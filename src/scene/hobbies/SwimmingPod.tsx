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
import { useUniverseStore } from "@/store/useUniverseStore";

/** Instanced floating lane divider buoys */
function LaneRope({ z }: { z: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
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

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.036, 0.036, 0.11, 12]} />
      <meshStandardMaterial roughness={0.32} metalness={0.1} />
    </instancedMesh>
  );
}

/**
 * Swimming Aquatic Infinity Pool Satellite Pod (x = -7.3, z = -5.0):
 *  - Architectural slate & light-stone pool deck surround
 *  - Recessed basin with custom GLSL mosaic tiles + animated Voronoi aquatic caustics
 *  - Custom GLSL rippling reflective water surface with Fresnel reflections & specular glints
 *  - Floating Olympic-style lane buoy dividers + stainless steel pool ladder + underwater blue-cyan LEDs
 */
export function SwimmingPod() {
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const phase = useUniverseStore((s) => s.phase);
  const [hovered, setHovered] = useState(false);

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
    };
  }, [waterMat, floorMat]);

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
        selectHobby("swimming");
      }}
    >
      {/* Architectural Pool Surround Deck (4 coping borders forming a real recessed basin!) */}
      {/* North & South Coping Borders */}
      <mesh position={[0, -0.04, -1.52]} receiveShadow castShadow>
        <boxGeometry args={[4.85, 0.36, 0.72]} />
        <meshStandardMaterial color="#182330" metalness={0.42} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.04, 1.52]} receiveShadow castShadow>
        <boxGeometry args={[4.85, 0.36, 0.72]} />
        <meshStandardMaterial color="#182330" metalness={0.42} roughness={0.45} />
      </mesh>
      {/* East & West Coping Borders */}
      <mesh position={[-2.14, -0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.58, 0.36, 2.34]} />
        <meshStandardMaterial color="#182330" metalness={0.42} roughness={0.45} />
      </mesh>
      <mesh position={[2.14, -0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.58, 0.36, 2.34]} />
        <meshStandardMaterial color="#182330" metalness={0.42} roughness={0.45} />
      </mesh>

      {/* Outer Under-Hull */}
      <mesh position={[0, -0.48, 0]}>
        <boxGeometry args={[4.55, 0.54, 3.45]} />
        <meshStandardMaterial color="#0A121C" metalness={0.75} roughness={0.4} />
      </mesh>

      {/* Underwater Illuminated Pool Walls */}
      <mesh position={[0, -0.18, -1.14]}>
        <boxGeometry args={[3.72, 0.54, 0.04]} />
        <meshStandardMaterial color="#0A3A54" emissive="#127FA8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, -0.18, 1.14]}>
        <boxGeometry args={[3.72, 0.54, 0.04]} />
        <meshStandardMaterial color="#0A3A54" emissive="#127FA8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-1.84, -0.18, 0]}>
        <boxGeometry args={[0.04, 0.54, 2.32]} />
        <meshStandardMaterial color="#0A3A54" emissive="#127FA8" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[1.84, -0.18, 0]}>
        <boxGeometry args={[0.04, 0.54, 2.32]} />
        <meshStandardMaterial color="#0A3A54" emissive="#127FA8" emissiveIntensity={0.45} />
      </mesh>

      {/* Animated Underwater Caustics Tiled Pool Floor */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[3.7, 2.32]} />
      </mesh>

      {/* Rippling Reflective GLSL Water Surface */}
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]} material={waterMat}>
        <planeGeometry args={[3.7, 2.32, 48, 32]} />
      </mesh>

      {/* Floating Swimming Lane Divider Rope */}
      <LaneRope z={0} />

      {/* Starting Block & Brushed Stainless Steel Pool Ladder */}
      <group position={[-1.96, 0.16, -0.58]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.34, 0.24, 0.34]} />
          <meshStandardMaterial color="#212E3D" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0.04, 0.25, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.38, 0.04, 0.36]} />
          <meshStandardMaterial color="#DCE8F0" roughness={0.45} metalness={0.15} />
        </mesh>
      </group>
      {/* Stainless handrails */}
      <group position={[1.76, 0.14, 0.85]}>
        {[-0.18, 0.18].map((rz, idx) => (
          <group key={idx} position={[0, 0, rz]}>
            <mesh position={[0.12, 0.24, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.52, 10]} />
              <meshStandardMaterial color="#C8D6E0" metalness={0.94} roughness={0.14} />
            </mesh>
            <mesh position={[-0.02, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.016, 0.016, 0.30, 10]} />
              <meshStandardMaterial color="#C8D6E0" metalness={0.94} roughness={0.14} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Subtle Underwater Cyan Glow Accent Light */}
      <pointLight position={[0, 0.45, 0]} color="#22D3EE" intensity={hovered ? 2.6 : 1.65} distance={6.5} decay={2} />

      {/* Outer Coping Trim Light */}
      <mesh position={[0, 0.145, -1.86]}>
        <boxGeometry args={[4.6, 0.016, 0.02]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#22D3EE"} />
      </mesh>
      <mesh position={[0, 0.145, 1.86]}>
        <boxGeometry args={[4.6, 0.016, 0.02]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#22D3EE"} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.32, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#22D3EE]/45 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#22D3EE]">HOBBY //</span> AQUATIC INFINITY POOL
          </div>
        </Html>
      )}
    </group>
  );
}
