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
 * Interactive 3D Skills Universe located on the Left Wing of the Laboratory (-5.3, 0, -0.8):
 *  - Architectural holographic emitter plinth
 *  - Rotating orbital core + 8 floating crystalline tech category modules
 *  - Glowing synaptic filaments linking the tech ecosystem
 *  - Hover highlight + click focuses Skills Universe and opens the detailed Skills HUD
 */
export function SkillsUniverse() {
  const focusZone = useUniverseStore((s) => s.focusZone);
  const selectSkill = useUniverseStore((s) => s.selectSkill);
  const phase = useUniverseStore((s) => s.phase);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const orbitGroupRef = useRef<THREE.Group>(null);
  const coreRingRef = useRef<THREE.Mesh>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const nodes = useMemo<NodeSpec[]>(() => {
    return SKILL_CATEGORIES.map((cat, idx) => {
      const angle = (idx / SKILL_CATEGORIES.length) * Math.PI * 2;
      const radius = idx % 2 === 0 ? 1.38 : 1.05;
      const y = 1.48 + (idx % 3 - 1) * 0.42;
      const matching = SKILLS_INVENTORY.filter((s) => s.category === cat.id);
      return {
        category: cat,
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        count: matching.length,
        firstSkillId: matching[0]?.id ?? "typescript",
      };
    });
  }, []);

  // Synaptic constellation connections between core and nodes
  const filaments = useMemo(() => {
    const pts: number[] = [];
    const center = [0, 1.55, 0];
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
      orbitGroupRef.current.rotation.y += d * (hoveredCat ? 0.06 : 0.22);
      orbitGroupRef.current.position.y = Math.sin(t * 1.1) * 0.06;
    }
    if (coreRingRef.current) {
      coreRingRef.current.rotation.x = t * 0.55;
      coreRingRef.current.rotation.z = t * 0.35;
    }
  });

  return (
    <group name="SkillsUniverse" position={[-5.3, 0, -0.8]}>
      {/* Holographic Emitter Base */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.18, 1.34, 0.24, 36]} />
        <meshStandardMaterial color="#141C27" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <ringGeometry args={[0.78, 0.86, 36]} />
        <meshBasicMaterial color="#2DD4BF" side={THREE.DoubleSide} />
      </mesh>
      {/* Subtle vertical holographic projection column */}
      <mesh position={[0, 1.38, 0]}>
        <cylinderGeometry args={[0.62, 0.86, 2.2, 24, 1, true]} />
        <meshBasicMaterial
          color="#2DD4BF"
          transparent
          opacity={0.055}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital Floating Tech Constellation */}
      <group ref={orbitGroupRef}>
        {/* Central Core Polyhedron + Gyro Ring */}
        <mesh
          position={[0, 1.55, 0]}
          onClick={(e) => {
            e.stopPropagation();
            focusZone("skills", true);
          }}
        >
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color="#4EF2B8"
            emissive="#4EF2B8"
            emissiveIntensity={0.85}
            metalness={0.4}
            roughness={0.2}
            wireframe
          />
        </mesh>
        <mesh ref={coreRingRef} position={[0, 1.55, 0]}>
          <torusGeometry args={[0.42, 0.012, 12, 48]} />
          <meshBasicMaterial color="#8FF7DC" transparent opacity={0.75} />
        </mesh>

        {/* Synaptic Energy Filaments */}
        <lineSegments geometry={filaments}>
          <lineBasicMaterial
            color="#4EF2B8"
            transparent
            opacity={0.24}
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
              {/* Outer glass frame */}
              <mesh scale={isHov ? 1.24 : 1}>
                <octahedronGeometry args={[0.17, 1]} />
                <meshPhysicalMaterial
                  color={n.category.color}
                  emissive={n.category.color}
                  emissiveIntensity={isHov ? 1.15 : 0.45}
                  roughness={0.18}
                  metalness={0.5}
                  transparent
                  opacity={0.86}
                />
              </mesh>
              {/* Inner luminous wireframe crystal */}
              <mesh scale={isHov ? 1.38 : 1.15}>
                <octahedronGeometry args={[0.18, 0]} />
                <meshBasicMaterial
                  color="#ECF3F7"
                  wireframe
                  transparent
                  opacity={isHov ? 0.72 : 0.25}
                />
              </mesh>

              {phase === "active" && isHov && (
                <Html position={[0, 0.34, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
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
