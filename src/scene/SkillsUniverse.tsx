"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SKILL_CATEGORIES, SKILLS_INVENTORY, type SkillCategoryMeta } from "@/data/skills";
import { useUniverseStore } from "@/store/useUniverseStore";

interface NodeSpec {
  category: SkillCategoryMeta;
  position: [number, number, number];
  count: number;
  firstSkillId: string;
}

/**
 * Refined 3D Skills Universe Gyroscopic Tech Constellation (Left Wing -5.0, 0, -0.7):
 *  - Precision brushed-titanium emitter plinth (ZERO fake translucent cylinder!)
 *  - Rotating machined gyroscopic armillary rings + 8 faceted glass-and-metal tech modules
 *  - Crisp synaptic connections + hover highlight + click opens interactive Skills HUD
 */
export function SkillsUniverse() {
  const focusZone = useUniverseStore((s) => s.focusZone);
  const selectSkill = useUniverseStore((s) => s.selectSkill);
  const phase = useUniverseStore((s) => s.phase);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const orbitGroupRef = useRef<THREE.Group>(null);
  const gyroARef = useRef<THREE.Mesh>(null);
  const gyroBRef = useRef<THREE.Mesh>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const nodes = useMemo<NodeSpec[]>(() => {
    return SKILL_CATEGORIES.map((cat, idx) => {
      const angle = (idx / SKILL_CATEGORIES.length) * Math.PI * 2;
      const radius = idx % 2 === 0 ? 1.24 : 0.94;
      const y = 1.52 + ((idx % 3) - 1) * 0.34;
      const matching = SKILLS_INVENTORY.filter((s) => s.category === cat.id);
      return {
        category: cat,
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        count: matching.length,
        firstSkillId: matching[0]?.id ?? "typescript",
      };
    });
  }, []);

  const filaments = useMemo(() => {
    const pts: number[] = [];
    const center = [0, 1.52, 0];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i].position;
      const b = nodes[(i + 1) % nodes.length].position;
      pts.push(...center, ...a);
      pts.push(...a, ...b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [nodes]);

  useEffect(() => {
    return () => filaments.dispose();
  }, [filaments]);

  useEffect(() => {
    document.body.style.cursor = hoveredCat ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hoveredCat]);

  useFrame((state, rawDelta) => {
    if (reducedMotion) return;
    const d = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y += d * (hoveredCat ? 0.05 : 0.2);
      orbitGroupRef.current.position.y = Math.sin(t * 1.05) * 0.045;
    }
    if (gyroARef.current) {
      gyroARef.current.rotation.x = t * 0.38;
      gyroARef.current.rotation.y = t * 0.22;
    }
    if (gyroBRef.current) {
      gyroBRef.current.rotation.z = -t * 0.32;
      gyroBRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.4) * 0.2;
    }
  });

  return (
    <group name="SkillsUniverse" position={[-5.0, 0, -0.7]}>
      {/* Machined Brushed-Titanium Emitter Plinth */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.22, 0.2, 48]} />
        <meshStandardMaterial color="#161F2B" metalness={0.86} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[0.84, 0.94, 0.05, 48]} />
        <meshStandardMaterial color="#202C3B" metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.70, 0.75, 48]} />
        <meshBasicMaterial color="#4EF2B8" transparent opacity={0.75} />
      </mesh>

      {/* Orbital Gyroscopic Tech Constellation */}
      <group ref={orbitGroupRef}>
        {/* Precision Central Core & Dual Armillary Rings */}
        <mesh
          position={[0, 1.52, 0]}
          onClick={(e) => {
            e.stopPropagation();
            focusZone("skills", true);
          }}
        >
          <icosahedronGeometry args={[0.20, 0]} />
          <meshStandardMaterial
            color="#1A2B32"
            emissive="#4EF2B8"
            emissiveIntensity={0.65}
            metalness={0.75}
            roughness={0.18}
          />
        </mesh>
        <mesh ref={gyroARef} position={[0, 1.52, 0]}>
          <torusGeometry args={[0.42, 0.011, 12, 48]} />
          <meshStandardMaterial color="#6FF7C9" metalness={0.9} roughness={0.15} emissive="#4EF2B8" emissiveIntensity={0.4} />
        </mesh>
        <mesh ref={gyroBRef} position={[0, 1.52, 0]}>
          <torusGeometry args={[0.58, 0.008, 12, 56]} />
          <meshStandardMaterial color="#8AD8F8" metalness={0.9} roughness={0.15} emissive="#38BDF8" emissiveIntensity={0.35} />
        </mesh>

        {/* Delicate Synaptic Constellation Lines */}
        <lineSegments geometry={filaments}>
          <lineBasicMaterial
            color="#4EF2B8"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {/* 8 Interactive Category Tech Modules */}
        {nodes.map((n) => {
          const isHov = hoveredCat === n.category.id;
          return (
            <group
              key={n.category.id}
              position={n.position}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredCat(n.category.id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredCat(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectSkill(n.firstSkillId);
              }}
            >
              <mesh scale={isHov ? 1.25 : 1}>
                <octahedronGeometry args={[0.14, 0]} />
                <meshPhysicalMaterial
                  color={n.category.color}
                  emissive={n.category.color}
                  emissiveIntensity={isHov ? 1.0 : 0.35}
                  roughness={0.14}
                  metalness={0.65}
                  clearcoat={1}
                />
              </mesh>
              {/* Sleek machined equatorial ring around each node */}
              <mesh rotation={[Math.PI / 2, 0, 0]} scale={isHov ? 1.25 : 1}>
                <torusGeometry args={[0.185, 0.006, 8, 28]} />
                <meshBasicMaterial color={n.category.color} transparent opacity={isHov ? 0.9 : 0.45} />
              </mesh>

              {phase === "active" && isHov && (
                <Html position={[0, 0.32, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
                  <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
                    <span style={{ color: n.category.color }}>{n.category.shortLabel.toUpperCase()}</span>{" "}
                    · {n.count} techs
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}
