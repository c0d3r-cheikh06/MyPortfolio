"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  createFootballBallTextures,
  createGoalNetTexture,
  createPitchTexture,
  createWhiteFlareTexture,
} from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Realistic brushed aluminum goal frame with curved stanchions and fine woven net */
function GoalFrame({
  position,
  rotationY = 0,
  netTex,
}: {
  position: [number, number, number];
  rotationY?: number;
  netTex: THREE.CanvasTexture;
}) {
  const stanchions = useMemo(() => {
    const mk = (zOff: number) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.56, zOff),
          new THREE.Vector3(0.16, 0.54, zOff),
          new THREE.Vector3(0.26, 0.28, zOff),
          new THREE.Vector3(0.28, 0.02, zOff),
        ]),
        16,
        0.013,
        8,
        false
      );
    return [mk(-0.44), mk(0.44)];
  }, []);

  useEffect(() => {
    return () => stanchions.forEach((g) => g.dispose());
  }, [stanchions]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Aluminum Posts & Crossbar */}
      <mesh position={[0, 0.28, -0.44]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.68} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.28, 0.44]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.68} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.90, 12]} />
        <meshStandardMaterial color="#ECF3F7" metalness={0.68} roughness={0.22} />
      </mesh>
      {/* Curved Back Stanchions & Ground Bar */}
      {stanchions.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color="#B8C6D4" metalness={0.78} roughness={0.26} />
        </mesh>
      ))}
      <mesh position={[0.27, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.88, 10]} />
        <meshStandardMaterial color="#A8B8C8" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Real Fine-Mesh Woven Stadium Nets (back, top, left & right sides) */}
      <mesh position={[0.27, 0.28, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.88, 0.54]} />
        <meshStandardMaterial
          map={netTex}
          transparent
          alphaTest={0.12}
          opacity={0.86}
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </mesh>
      <mesh position={[0.135, 0.555, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.27, 0.88]} />
        <meshStandardMaterial
          map={netTex}
          transparent
          alphaTest={0.12}
          opacity={0.82}
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </mesh>
      {[-0.44, 0.44].map((zOff, i) => (
        <mesh key={i} position={[0.135, 0.28, zOff]}>
          <planeGeometry args={[0.27, 0.54]} />
          <meshStandardMaterial
            map={netTex}
            transparent
            alphaTest={0.12}
            opacity={0.82}
            side={THREE.DoubleSide}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Football Mini-Stadium Satellite Pod (x = 9.9, z = 2.3):
 *  - Architectural stadium deck with smoked-glass perimeter parapet & brushed-titanium rim
 *  - Manicured striped turf pitch, FIFA markings, curved aluminum goals with fine woven nets, corner flags
 *  - 4 Tapered Floodlight Towers with neutral warm-white LED arrays & subtle white lens flares
 *  - Animated match football with pebble normal map & gravity-arc bounce
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
  const netTex = useMemo(() => createGoalNetTexture([9, 4]), []);
  const flareTex = useMemo(() => createWhiteFlareTexture(), []);

  useEffect(() => {
    return () => {
      pitchTex.dispose();
      ballTex.map.dispose();
      ballTex.bumpMap.dispose();
      ballTex.normalMap.dispose();
      netTex.dispose();
      flareTex.dispose();
    };
  }, [pitchTex, ballTex, netTex, flareTex]);

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
    const bounce = Math.pow(Math.abs(Math.sin(t * 2.1)), 0.78) * 0.42;
    ballRef.current.position.y = 0.42 + bounce;
    ballRef.current.rotation.y += d * 1.1;
    ballRef.current.rotation.x += d * 0.5;
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

  const cornerFlags: [number, number][] = [
    [-1.68, -1.04],
    [1.68, -1.04],
    [-1.68, 1.04],
    [1.68, 1.04],
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
        if (e.delta > 5) return;
        selectHobby("football");
      }}
    >
      {/* Elevated Circular Stadium Deck */}
      <mesh position={[0, -0.14, 0]} receiveShadow>
        <cylinderGeometry args={[2.65, 2.88, 0.28, 56]} />
        <meshStandardMaterial color="#25313F" metalness={0.78} roughness={0.32} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[2.35, 1.45, 0.34, 36]} />
        <meshStandardMaterial color="#16202C" metalness={0.76} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.46, 2.52, 56]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#4EF2B8"} transparent opacity={0.65} />
      </mesh>
      {/* Architectural Smoked-Glass Stadium Parapet Rim */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[2.56, 2.56, 0.20, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#9AD8EE"
          transparent
          opacity={0.14}
          roughness={0.08}
          clearcoat={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Recessed Stadium Pitch Base + Turf */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[3.72, 0.12, 2.44]} />
        <meshStandardMaterial color="#283645" metalness={0.62} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.56, 2.26]} />
        <meshStandardMaterial map={pitchTex} roughness={0.86} metalness={0.04} />
      </mesh>

      {/* Pitch Perimeter Sideline Boards */}
      <mesh position={[0, 0.18, -1.16]}>
        <boxGeometry args={[3.58, 0.11, 0.035]} />
        <meshStandardMaterial color="#1B2634" emissive="#4EF2B8" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.18, 1.16]}>
        <boxGeometry args={[3.58, 0.11, 0.035]} />
        <meshStandardMaterial color="#1B2634" emissive="#4EF2B8" emissiveIntensity={0.18} />
      </mesh>

      {/* Realistic Goals with Fine Woven Nets */}
      <GoalFrame position={[1.64, 0.12, 0]} rotationY={0} netTex={netTex} />
      <GoalFrame position={[-1.64, 0.12, 0]} rotationY={Math.PI} netTex={netTex} />

      {/* 4 Corner Flags */}
      {cornerFlags.map(([cx, cz], i) => (
        <group key={i} position={[cx, 0.12, cz]}>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.18, 8]} />
            <meshStandardMaterial color="#ECF3F7" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0.025, 0.16, 0]}>
            <boxGeometry args={[0.045, 0.032, 0.004]} />
            <meshBasicMaterial color="#4EF2B8" />
          </mesh>
        </group>
      ))}

      {/* 4 Tapered Stadium Floodlight Towers + Warm-White LED Halo */}
      {floodlights.map(([fx, fy, fz], idx) => {
        const aimY = Math.atan2(-fx, -fz);
        return (
          <group key={idx} position={[fx, fy, fz]} rotation={[0, aimY, 0]}>
            <mesh position={[0, 1.12, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.054, 2.24, 14]} />
              <meshStandardMaterial color="#3A495C" metalness={0.86} roughness={0.26} />
            </mesh>
            <group position={[0, 2.24, 0.06]} rotation={[0.52, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.40, 0.16, 0.05]} />
                <meshStandardMaterial color="#273444" metalness={0.85} roughness={0.26} />
              </mesh>
              <mesh position={[0, 0, 0.028]}>
                <planeGeometry args={[0.34, 0.11]} />
                <meshBasicMaterial color="#FFFDF5" />
              </mesh>
            </group>
            <sprite position={[0, 2.24, 0.11]} scale={[0.42, 0.42, 1]}>
              <spriteMaterial
                map={flareTex}
                color="#FFF8EC"
                transparent
                opacity={0.42}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </sprite>
          </group>
        );
      })}

      {/* Warm-Crisp Pitch Overhead Illumination */}
      <pointLight
        position={[0, 2.35, 0]}
        color="#F8FFF9"
        intensity={hovered ? 2.8 : 1.85}
        distance={7.5}
        decay={2}
      />

      {/* Match Football + Ground Shadow */}
      <mesh ref={ballRef} position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.26, 40, 40]} />
        <meshStandardMaterial
          map={ballTex.map}
          normalMap={ballTex.normalMap}
          bumpMap={ballTex.bumpMap}
          bumpScale={0.016}
          roughness={0.34}
          metalness={0.08}
        />
      </mesh>
      <mesh ref={shadowRef} position={[0, 0.132, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#031208" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.72, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#4EF2B8]/40 bg-[#070C12]/92 px-3 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md shadow-lg">
            <span className="text-[#4EF2B8]">HOBBY {"//"}</span> FOOTBALL ARENA
          </div>
        </Html>
      )}
    </group>
  );
}
