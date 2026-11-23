"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SKILL_CATEGORIES, SKILLS_INVENTORY, type SkillCategoryMeta } from "@/data/skills";
import { createGlowParticleTexture } from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

interface NodeSpec {
  category: SkillCategoryMeta;
  position: [number, number, number];
  count: number;
  firstSkillId: string;
}

/**
 * Precision Holographic Quantum Orrery (Left Wing -5.0, 0, -0.7):
 *  - Tiered machined titanium & smoked-glass emitter plinth
 *  - Dual brushed-metal armillary gimbal rings + glass-encased core crystal
 *  - 8 multi-part sculpted tech modules (frosted glass cage + metallic collar + inner core + micro-moon)
 *  - Synaptic filaments with animated traveling data-pulse packets
 */
export function SkillsUniverse() {
  const focusZone = useUniverseStore((s) => s.focusZone);
  const selectSkill = useUniverseStore((s) => s.selectSkill);
  const phase = useUniverseStore((s) => s.phase);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const orbitGroupRef = useRef<THREE.Group>(null);
  const gyroARef = useRef<THREE.Mesh>(null);
  const gyroBRef = useRef<THREE.Mesh>(null);
  const pulsesRef = useRef<THREE.Points>(null);
  const moonRefs = useRef<(THREE.Mesh | null)[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const pulseSprite = useMemo(() => createGlowParticleTexture(), []);

  const nodes = useMemo<NodeSpec[]>(() => {
    return SKILL_CATEGORIES.map((cat, idx) => {
      const angle = (idx / SKILL_CATEGORIES.length) * Math.PI * 2;
      const radius = idx % 2 === 0 ? 1.14 : 0.88;
      const y = 1.54 + ((idx % 3) - 1) * 0.34;
      const matching = SKILLS_INVENTORY.filter((s) => s.category === cat.id);
      return {
        category: cat,
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        count: matching.length,
        firstSkillId: matching[0]?.id ?? "typescript",
      };
    });
  }, []);

  const { filaments, pulseGeo, pulseEdges } = useMemo(() => {
    const pts: number[] = [];
    const edges: { from: [number, number, number]; to: [number, number, number] }[] = [];
    const center: [number, number, number] = [0, 1.54, 0];

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i].position;
      const b = nodes[(i + 1) % nodes.length].position;
      pts.push(...center, ...a);
      pts.push(...a, ...b);
      edges.push({ from: center, to: a });
      edges.push({ from: a, to: b });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edges.length * 3), 3));
    return { filaments: geo, pulseGeo: pGeo, pulseEdges: edges };
  }, [nodes]);

  useEffect(() => {
    return () => {
      filaments.dispose();
      pulseGeo.dispose();
      pulseSprite.dispose();
    };
  }, [filaments, pulseGeo, pulseSprite]);

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
      orbitGroupRef.current.rotation.y += d * (hoveredCat ? 0.05 : 0.18);
      orbitGroupRef.current.position.y = Math.sin(t * 1.05) * 0.04;
    }
    if (gyroARef.current) {
      gyroARef.current.rotation.x = t * 0.36;
      gyroARef.current.rotation.y = t * 0.22;
    }
    if (gyroBRef.current) {
      gyroBRef.current.rotation.z = -t * 0.30;
      gyroBRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.4) * 0.18;
    }
    // Orbiting micro-satellites around each tech module
    moonRefs.current.forEach((m, idx) => {
      if (!m) return;
      const ang = t * (1.35 + (idx % 3) * 0.25) + idx * 0.9;
      m.position.set(Math.cos(ang) * 0.23, Math.sin(ang * 1.4) * 0.04, Math.sin(ang) * 0.23);
    });
    // Animated traveling data pulses along synaptic links
    if (pulsesRef.current) {
      const posAttr = pulseGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < pulseEdges.length; i++) {
        const u = (t * 0.42 + i * 0.19) % 1;
        const { from, to } = pulseEdges[i];
        arr[i * 3] = from[0] + (to[0] - from[0]) * u;
        arr[i * 3 + 1] = from[1] + (to[1] - from[1]) * u;
        arr[i * 3 + 2] = from[2] + (to[2] - from[2]) * u;
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group name="SkillsUniverse" position={[-5.0, 0, -0.7]}>
      {/* Tiered Machined Titanium & Smoked Glass Emitter Plinth */}
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.08, 1.24, 0.18, 48]} />
        <meshStandardMaterial color="#2C3847" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.20, 0]} receiveShadow>
        <cylinderGeometry args={[0.88, 0.98, 0.06, 48]} />
        <meshStandardMaterial color="#3B4A5D" metalness={0.86} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.235, 0]}>
        <cylinderGeometry args={[0.68, 0.68, 0.014, 48]} />
        <meshPhysicalMaterial
          color="#0B2222"
          emissive="#4EF2B8"
          emissiveIntensity={0.34}
          roughness={0.12}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 0.246, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.77, 48]} />
        <meshBasicMaterial color="#4EF2B8" transparent opacity={0.72} />
      </mesh>

      {/* Orbital Quantum Orrery Constellation */}
      <group ref={orbitGroupRef}>
        {/* Central Glass-Encased Core Crystal & Brushed Metal Armillary Rings */}
        <group
          position={[0, 1.54, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (e.delta > 5) return;
            focusZone("skills", true);
          }}
        >
          <mesh>
            <icosahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial
              color="#3CE4AA"
              emissive="#4EF2B8"
              emissiveIntensity={0.85}
              metalness={0.35}
              roughness={0.15}
            />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.23, 0]} />
            <meshPhysicalMaterial
              color="#B8FFF0"
              transparent
              opacity={0.26}
              roughness={0.08}
              metalness={0.1}
              clearcoat={1}
            />
          </mesh>
        </group>

        <mesh ref={gyroARef} position={[0, 1.54, 0]}>
          <torusGeometry args={[0.42, 0.013, 14, 56]} />
          <meshStandardMaterial
            color="#6C8299"
            metalness={0.9}
            roughness={0.18}
            emissive="#4EF2B8"
            emissiveIntensity={0.28}
          />
        </mesh>
        <mesh ref={gyroBRef} position={[0, 1.54, 0]}>
          <torusGeometry args={[0.58, 0.010, 14, 64]} />
          <meshStandardMaterial
            color="#7FA4C8"
            metalness={0.9}
            roughness={0.18}
            emissive="#38BDF8"
            emissiveIntensity={0.26}
          />
        </mesh>

        {/* Synaptic Constellation Filaments + Traveling Data Pulses */}
        <lineSegments geometry={filaments}>
          <lineBasicMaterial
            color="#4EF2B8"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
        <points ref={pulsesRef} geometry={pulseGeo}>
          <pointsMaterial
            map={pulseSprite}
            color="#9BFFE0"
            size={0.085}
            transparent
            opacity={0.85}
            alphaTest={0.02}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* 8 Sculpted Multi-Part Tech Category Modules */}
        {nodes.map((n, idx) => {
          const isHov = hoveredCat === n.category.id;
          return (
            <group
              key={n.category.id}
              position={n.position}
              scale={isHov ? 1.22 : 1}
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
                if (e.delta > 5) return;
                selectSkill(n.firstSkillId);
              }}
            >
              {/* Beveled Hexagonal Holographic Emitter Pod Core */}
              <mesh>
                <cylinderGeometry args={[0.08, 0.08, 0.045, 6]} />
                <meshStandardMaterial
                  color={n.category.color}
                  emissive={n.category.color}
                  emissiveIntensity={isHov ? 1.15 : 0.7}
                  roughness={0.18}
                  metalness={0.35}
                />
              </mesh>
              {/* Outer Clearcoat Optical Lens Dome Housing */}
              <mesh>
                <cylinderGeometry args={[0.135, 0.115, 0.09, 6]} />
                <meshPhysicalMaterial
                  color={n.category.color}
                  transparent
                  opacity={0.28}
                  roughness={0.08}
                  metalness={0.22}
                  clearcoat={1}
                />
              </mesh>
              {/* Dual Counter-Tilted Precision Brushed Metallic Gimbal Rings */}
              <mesh rotation={[Math.PI / 2 - 0.22, 0.18, 0]}>
                <torusGeometry args={[0.168, 0.011, 12, 36]} />
                <meshStandardMaterial color="#64788E" metalness={0.88} roughness={0.22} />
              </mesh>
              <mesh rotation={[Math.PI / 2 + 0.24, -0.20, 0]}>
                <torusGeometry args={[0.195, 0.006, 10, 36]} />
                <meshStandardMaterial color="#46576B" metalness={0.86} roughness={0.24} />
              </mesh>
              {/* Thin accent halo */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.215, 0.004, 8, 36]} />
                <meshBasicMaterial
                  color={n.category.color}
                  transparent
                  opacity={isHov ? 0.92 : 0.45}
                />
              </mesh>
              {/* Orbiting micro-satellite */}
              <mesh
                ref={(el) => {
                  moonRefs.current[idx] = el;
                }}
              >
                <sphereGeometry args={[0.022, 12, 12]} />
                <meshStandardMaterial
                  color="#ECF3F7"
                  emissive={n.category.color}
                  emissiveIntensity={0.6}
                  metalness={0.6}
                  roughness={0.2}
                />
              </mesh>

              {phase === "active" && isHov && (
                <Html position={[0, 0.30, 0]} center style={{ pointerEvents: "none" }}>
                  <div className="whitespace-nowrap rounded-full border border-[#4EF2B8]/40 bg-[#070C12]/92 px-3 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md shadow-lg">
                    <span style={{ color: n.category.color }}>
                      {n.category.shortLabel.toUpperCase()}
                    </span>{" "}
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
