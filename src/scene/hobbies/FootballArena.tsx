"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { createFootballBallTextures, createPitchTexture } from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Realistic goal frame (aluminum posts, crossbar, back stanchions & mesh netting) */
function GoalFrame({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Left & Right Posts */}
      <mesh position={[0, 0.28, -0.44]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.28, 0.44]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.65} roughness={0.25} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.90, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.65} roughness={0.25} />
      </mesh>
      {/* Back support frame */}
      <mesh position={[0.24, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.88, 10]} />
        <meshStandardMaterial color="#9FB0BE" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Translucent wireframe goal netting */}
      <mesh position={[0.13, 0.28, 0]}>
        <boxGeometry args={[0.26, 0.52, 0.86, 4, 5, 8]} />
        <meshBasicMaterial color="#DCEBF0" wireframe transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

/**
 * Football Mini-Stadium Satellite Pod (x = 7.5, z = 2.3):
 *  - Circular elevated arena platform with metallic stadium rim
 *  - Manicured striped football pitch with crisp chalk lines & two goals
 *  - 4 Stadium floodlight towers with luminous light banks & volumetric cones
 *  - Animated realistic match football spinning & bouncing gracefully above center spot
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

  useEffect(() => {
    return () => {
      pitchTex.dispose();
      ballTex.map.dispose();
      ballTex.bumpMap.dispose();
    };
  }, [pitchTex, ballTex]);

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
    ballRef.current.position.y = 0.46 + bounce;
    ballRef.current.rotation.y += d * 1.15;
    ballRef.current.rotation.x += d * 0.55;
    if (shadowRef.current) {
      const s = 1 - bounce * 0.65;
      shadowRef.current.scale.setScalar(Math.max(0.45, s));
    }
  });

  const floodlights: [number, number, number][] = [
    [-1.95, 0, -1.35],
    [1.95, 0, -1.35],
    [-1.95, 0, 1.35],
    [1.95, 0, 1.35],
  ];

  return (
    <group
      name="FootballArena"
      position={[7.5, 0, 2.3]}
      rotation={[0, -0.32, 0]}
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
      {/* Elevated Architectural Arena Deck */}
      <mesh position={[0, -0.14, 0]} receiveShadow>
        <cylinderGeometry args={[2.75, 2.95, 0.28, 48]} />
        <meshStandardMaterial color="#121922" metalness={0.78} roughness={0.34} />
      </mesh>
      {/* Stadium perimeter illuminated trim */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.56, 2.62, 48]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#4EF2B8"} transparent opacity={0.75} />
      </mesh>

      {/* Recessed Stadium Pitch Base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[3.72, 0.12, 2.44]} />
        <meshStandardMaterial color="#19232E" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Manicured Striped Pitch Turf */}
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.56, 2.26]} />
        <meshStandardMaterial map={pitchTex} roughness={0.86} metalness={0.04} />
      </mesh>

      {/* Perimeter LED Boards */}
      <mesh position={[0, 0.19, -1.16]}>
        <boxGeometry args={[3.6, 0.12, 0.04]} />
        <meshStandardMaterial color="#101822" emissive="#4EF2B8" emissiveIntensity={0.28} />
      </mesh>
      <mesh position={[0, 0.19, 1.16]}>
        <boxGeometry args={[3.6, 0.12, 0.04]} />
        <meshStandardMaterial color="#101822" emissive="#4EF2B8" emissiveIntensity={0.28} />
      </mesh>

      {/* Goals at East & West Touchlines */}
      <GoalFrame position={[1.64, 0.12, 0]} rotationY={0} />
      <GoalFrame position={[-1.64, 0.12, 0]} rotationY={Math.PI} />

      {/* 4 Stadium Floodlight Towers with Volumetric Cones */}
      {floodlights.map(([fx, fy, fz], idx) => {
        const aimY = Math.atan2(-fx, -fz);
        return (
          <group key={idx} position={[fx, fy, fz]} rotation={[0, aimY, 0]}>
            {/* Tapered metal floodlight pylon */}
            <mesh position={[0, 1.15, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.055, 2.3, 12]} />
              <meshStandardMaterial color="#24303E" metalness={0.85} roughness={0.28} />
            </mesh>
            {/* Floodlight LED head tilted toward center spot */}
            <mesh position={[0, 2.28, 0.08]} rotation={[0.52, 0, 0]}>
              <boxGeometry args={[0.36, 0.16, 0.06]} />
              <meshStandardMaterial
                color="#ECF3F7"
                emissive="#E8FFF6"
                emissiveIntensity={hovered ? 2.4 : 1.5}
              />
            </mesh>
            {/* Subtle Volumetric Light Cone */}
            <mesh position={[0, 1.38, 0.72]} rotation={[0.66, 0, 0]}>
              <coneGeometry args={[0.78, 2.0, 16, 1, true]} />
              <meshBasicMaterial
                color="#DDFCF2"
                transparent
                opacity={0.045}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Animated Match Football + Ground Shadow Disc */}
      <mesh ref={ballRef} position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.26, 36, 36]} />
        <meshStandardMaterial
          map={ballTex.map}
          bumpMap={ballTex.bumpMap}
          bumpScale={0.015}
          roughness={0.38}
          metalness={0.08}
        />
      </mesh>
      <mesh ref={shadowRef} position={[0, 0.132, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#031208" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.65, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#4EF2B8]">HOBBY //</span> FOOTBALL ARENA
          </div>
        </Html>
      )}
    </group>
  );
}
