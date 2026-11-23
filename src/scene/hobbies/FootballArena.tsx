"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  createFootballBallTextures,
  createGlowParticleTexture,
  createPitchTexture,
} from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Realistic aluminum goal frame with stanchions and fine mesh net */
function GoalFrame({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.28, -0.44]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.28, 0.44]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.90, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0.24, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.88, 10]} />
        <meshStandardMaterial color="#9FB0BE" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0.13, 0.28, 0]}>
        <boxGeometry args={[0.26, 0.52, 0.86, 4, 5, 8]} />
        <meshBasicMaterial color="#DCEBF0" wireframe transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

/**
 * Football Mini-Stadium Satellite Pod (cleanly separated at x = 9.9, z = 2.3):
 *  - Architectural stadium deck with brushed-titanium rim
 *  - Manicured striped turf pitch, crisp FIFA markings, two aluminum goals & corner flags
 *  - 4 Tapered Stadium Floodlight Gantries with soft optical lens flares (ZERO ugly grey cones!)
 *  - Animated match football spinning & bouncing cleanly over center circle
 */
export function FootballArena() {
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const phase = useUniverseStore((s) => s.phase);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const [hovered, setHovered] = useState(false);
  const ballRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  const pitchTex = useMemo(() => createPitchTexture(), []);
  const ballTex = useMemo(() => createFootballBallTextures(), []);
  const flareTex = useMemo(() => createGlowParticleTexture(), []);

  useEffect(() => {
    return () => {
      pitchTex.dispose();
      ballTex.map.dispose();
      ballTex.bumpMap.dispose();
      flareTex.dispose();
    };
  }, [pitchTex, ballTex, flareTex]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, rawDelta) => {
    if (reducedMotion || !ballRef.current) return;
    const d = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const bounce = Math.abs(Math.sin(t * 2.15)) * 0.42;
    ballRef.current.position.y = 0.44 + bounce;
    ballRef.current.rotation.y += d * 1.15;
    ballRef.current.rotation.x += d * 0.55;
    if (shadowRef.current) {
      shadowRef.current.scale.setScalar(Math.max(0.45, 1 - bounce * 0.62));
    }
  });

  const floodlights: [number, number, number][] = [
    [-1.95, 0, -1.36],
    [1.95, 0, -1.36],
    [-1.95, 0, 1.36],
    [1.95, 0, 1.36],
  ];

  return (
    <group
      name="FootballArena"
      position={[9.9, 0, 2.3]}
      rotation={[0, -0.35, 0]}
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
        selectHobby("football");
      }}
    >
      {/* Elevated Circular Stadium Deck (radius 2.65m — cleanly separated from Main Lab!) */}
      <mesh position={[0, -0.14, 0]} receiveShadow>
        <cylinderGeometry args={[2.65, 2.88, 0.28, 56]} />
        <meshStandardMaterial color="#131B25" metalness={0.8} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[2.35, 1.45, 0.34, 36]} />
        <meshStandardMaterial color="#0A1017" metalness={0.78} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.46, 2.52, 56]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#4EF2B8"} transparent opacity={0.68} />
      </mesh>

      {/* Recessed Stadium Pitch Base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[3.72, 0.12, 2.44]} />
        <meshStandardMaterial color="#192430" metalness={0.65} roughness={0.38} />
      </mesh>
      {/* Manicured Striped Pitch Turf */}
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.56, 2.26]} />
        <meshStandardMaterial map={pitchTex} roughness={0.86} metalness={0.04} />
      </mesh>

      {/* Sleek Pitch Perimeter Advertising Rim */}
      <mesh position={[0, 0.18, -1.16]}>
        <boxGeometry args={[3.58, 0.11, 0.035]} />
        <meshStandardMaterial color="#111A24" emissive="#4EF2B8" emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[0, 0.18, 1.16]}>
        <boxGeometry args={[3.58, 0.11, 0.035]} />
        <meshStandardMaterial color="#111A24" emissive="#4EF2B8" emissiveIntensity={0.22} />
      </mesh>

      {/* Goals */}
      <GoalFrame position={[1.64, 0.12, 0]} rotationY={0} />
      <GoalFrame position={[-1.64, 0.12, 0]} rotationY={Math.PI} />

      {/* 4 Stadium Floodlight Towers with Soft Optical Glow Sprites */}
      {floodlights.map(([fx, fy, fz], idx) => {
        const aimY = Math.atan2(-fx, -fz);
        return (
          <group key={idx} position={[fx, fy, fz]} rotation={[0, aimY, 0]}>
            <mesh position={[0, 1.12, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.052, 2.24, 12]} />
              <meshStandardMaterial color="#253342" metalness={0.86} roughness={0.26} />
            </mesh>
            {/* Multi-lamp Stadium Head */}
            <group position={[0, 2.24, 0.06]} rotation={[0.52, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.38, 0.16, 0.05]} />
                <meshStandardMaterial color="#1A2330" metalness={0.85} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={[0.32, 0.11]} />
                <meshBasicMaterial color="#F2FFF9" />
              </mesh>
            </group>
            {/* Soft Optical Halo Sprite (clean, photographic — zero hard triangle cones!) */}
            <sprite position={[0, 2.24, 0.12]} scale={[0.75, 0.75, 1]}>
              <spriteMaterial
                map={flareTex}
                color="#E6FFF7"
                transparent
                opacity={0.55}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </sprite>
          </group>
        );
      })}

      {/* Warm-Crisp Pitch Overhead Illumination */}
      <pointLight position={[0, 2.35, 0]} color="#EAFFF7" intensity={hovered ? 2.8 : 1.7} distance={7.5} decay={2} />

      {/* Match Football + Ground Shadow */}
      <mesh ref={ballRef} position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.26, 40, 40]} />
        <meshStandardMaterial
          map={ballTex.map}
          bumpMap={ballTex.bumpMap}
          bumpScale={0.016}
          roughness={0.36}
          metalness={0.08}
        />
      </mesh>
      <mesh ref={shadowRef} position={[0, 0.132, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#031208" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.72, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#4EF2B8]">HOBBY {"//"}</span> FOOTBALL ARENA
          </div>
        </Html>
      )}
    </group>
  );
}
