"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  createBrushedMetalTextures,
  createCodeScreenTexture,
  createLabFloorTextures,
  createProjectScreenTexture,
} from "@/lib/textures";
import type { ProjectItem } from "@/data/projects";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Curved cylindrical-arc monitor geometry facing +Z */
function createCurvedScreenGeo(width: number, height: number, radius: number, segments = 24) {
  const geo = new THREE.PlaneGeometry(width, height, segments, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const angle = x / radius;
    pos.setX(i, Math.sin(angle) * radius);
    pos.setZ(i, (1 - Math.cos(angle)) * radius);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Mechanical 65% keyboard with instanced sculpted PBT keycaps */
function MechanicalKeyboard({ position }: { position: [number, number, number] }) {
  const keysRef = useRef<THREE.InstancedMesh>(null);
  const keyPositions = useMemo(() => {
    const list: { x: number; z: number; sx: number }[] = [];
    const rows = [14, 14, 13, 12, 7];
    rows.forEach((cols, r) => {
      const z = -0.056 + r * 0.027;
      if (r === 4) {
        const spec = [
          [-0.175, 0.028],
          [-0.142, 0.028],
          [-0.108, 0.028],
          [0.0, 0.145],
          [0.105, 0.028],
          [0.138, 0.028],
          [0.172, 0.028],
        ];
        spec.forEach(([x, sx]) => list.push({ x, z, sx }));
      } else {
        const w = 0.37;
        const step = w / cols;
        for (let c = 0; c < cols; c++) {
          list.push({ x: -w / 2 + step * (c + 0.5), z, sx: step * 0.84 });
        }
      }
    });
    return list;
  }, []);

  useEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    keyPositions.forEach((k, i) => {
      dummy.position.set(k.x, 0.017, k.z);
      dummy.scale.set(k.sx, 0.011, 0.021);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [keyPositions]);

  return (
    <group position={position} rotation={[0.07, 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.022, 0.16]} />
        <meshStandardMaterial color="#1D2632" metalness={0.86} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.39, 0.002, 0.136]} />
        <meshBasicMaterial color="#4EF2B8" transparent opacity={0.42} />
      </mesh>
      <instancedMesh ref={keysRef} args={[undefined, undefined, keyPositions.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#12171F" roughness={0.62} metalness={0.14} />
      </instancedMesh>
    </group>
  );
}

/** High-detail transparent tempered-glass custom PC tower with GPU, DDR5 RAM, AIO tubes & spinning fans */
function TransparentPCTower({ position }: { position: [number, number, number] }) {
  const fanRefs = useRef<(THREE.Group | null)[]>([]);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const aioTubes = useMemo(() => {
    const c1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.25, -0.02),
      new THREE.Vector3(0.06, 0.34, 0.05),
      new THREE.Vector3(0.04, 0.44, 0.14),
      new THREE.Vector3(0.0, 0.46, 0.21),
    ]);
    const c2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.22, -0.02),
      new THREE.Vector3(0.08, 0.30, 0.06),
      new THREE.Vector3(0.06, 0.41, 0.16),
      new THREE.Vector3(0.0, 0.44, 0.21),
    ]);
    return [new THREE.TubeGeometry(c1, 18, 0.009, 8, false), new THREE.TubeGeometry(c2, 18, 0.009, 8, false)];
  }, []);

  useEffect(() => {
    return () => aioTubes.forEach((g) => g.dispose());
  }, [aioTubes]);

  useFrame((_, rawDelta) => {
    if (reducedMotion) return;
    const d = Math.min(rawDelta, 0.05);
    fanRefs.current.forEach((g, idx) => {
      if (g) g.rotation.z += d * (9.5 + idx * 0.8);
    });
  });

  return (
    <group position={position} rotation={[0, -0.26, 0]}>
      {/* Aluminum corner rails & base PSU shroud */}
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.30, 0.09, 0.58]} />
        <meshStandardMaterial color="#141C26" metalness={0.84} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[0.30, 0.032, 0.58]} />
        <meshStandardMaterial color="#1B2533" metalness={0.86} roughness={0.25} />
      </mesh>
      <mesh position={[0.135, 0.30, 0]} castShadow>
        <boxGeometry args={[0.024, 0.50, 0.56]} />
        <meshStandardMaterial color="#121922" metalness={0.78} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.30, -0.28]}>
        <boxGeometry args={[0.30, 0.50, 0.022]} />
        <meshStandardMaterial color="#16202C" metalness={0.82} roughness={0.32} />
      </mesh>

      {/* Motherboard PCB */}
      <mesh position={[0.102, 0.32, -0.05]}>
        <boxGeometry args={[0.015, 0.36, 0.36]} />
        <meshStandardMaterial color="#0A0F15" metalness={0.45} roughness={0.5} />
      </mesh>

      {/* AIO CPU Liquid Cooler Block + Mint Halo */}
      <mesh position={[0.072, 0.34, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.044, 0.044, 0.042, 24]} />
        <meshStandardMaterial color="#1E2835" metalness={0.88} roughness={0.18} />
      </mesh>
      <mesh position={[0.049, 0.34, -0.04]} rotation={[0, -Math.PI / 2, 0]}>
        <ringGeometry args={[0.025, 0.033, 24]} />
        <meshBasicMaterial color="#4EF2B8" side={THREE.DoubleSide} />
      </mesh>

      {aioTubes.map((geo, i) => (
        <mesh key={i} position={[0.03, 0.07, -0.02]} geometry={geo}>
          <meshStandardMaterial color="#0F141B" roughness={0.68} metalness={0.2} />
        </mesh>
      ))}

      {/* 4 Illuminated DDR5 RAM Modules */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0.072, 0.35, 0.038 + i * 0.019]}>
          <mesh>
            <boxGeometry args={[0.038, 0.135, 0.008]} />
            <meshStandardMaterial color="#1E2836" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh position={[-0.02, 0, 0]}>
            <boxGeometry args={[0.004, 0.128, 0.006]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#4EF2B8" : "#7DE9F8"} />
          </mesh>
        </group>
      ))}

      {/* Flagship Dual-Slot GPU */}
      <group position={[0.012, 0.20, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.055, 0.33]} />
          <meshStandardMaterial color="#202A37" metalness={0.86} roughness={0.24} />
        </mesh>
        <mesh position={[-0.086, 0.007, 0]}>
          <boxGeometry args={[0.004, 0.011, 0.25]} />
          <meshBasicMaterial color="#4EF2B8" />
        </mesh>
      </group>

      {/* 3 Spinning Mint-Halo Intake Fans */}
      {[0.175, 0.31, 0.445].map((fy, idx) => (
        <group key={idx} position={[0, fy, 0.255]}>
          <mesh>
            <torusGeometry args={[0.058, 0.007, 10, 24]} />
            <meshBasicMaterial color="#4EF2B8" />
          </mesh>
          <group
            ref={(el) => {
              fanRefs.current[idx] = el;
            }}
          >
            {[0, 1, 2, 3, 4].map((b) => (
              <mesh
                key={b}
                rotation={[0.25, 0, (b / 5) * Math.PI * 2]}
                position={[
                  Math.cos((b / 5) * Math.PI * 2) * 0.026,
                  Math.sin((b / 5) * Math.PI * 2) * 0.026,
                  0,
                ]}
              >
                <boxGeometry args={[0.046, 0.015, 0.004]} />
                <meshStandardMaterial color="#2A3848" metalness={0.62} roughness={0.36} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Tempered Glass Side & Front Panels */}
      <mesh position={[-0.148, 0.305, 0]}>
        <boxGeometry args={[0.008, 0.49, 0.56]} />
        <meshPhysicalMaterial
          color="#9FD8E8"
          transparent
          opacity={0.2}
          roughness={0.07}
          metalness={0.12}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 0.305, 0.288]}>
        <boxGeometry args={[0.29, 0.49, 0.008]} />
        <meshPhysicalMaterial
          color="#9FD8E8"
          transparent
          opacity={0.16}
          roughness={0.07}
          metalness={0.1}
          clearcoat={1}
        />
      </mesh>
    </group>
  );
}

/** Interactive Curved Project Lab Terminal displaying a verified GitHub project */
function ProjectTerminal({
  project,
  position,
  rotation,
  onSelect,
}: {
  project: ProjectItem;
  position: [number, number, number];
  rotation: [number, number, number];
  onSelect: (slug: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const screenTex = useMemo(() => createProjectScreenTexture(project), [project]);
  const curvedGeo = useMemo(() => createCurvedScreenGeo(1.32, 0.80, 3.6, 20), []);
  const phase = useUniverseStore((s) => s.phase);

  useEffect(() => {
    return () => {
      screenTex.dispose();
      curvedGeo.dispose();
    };
  }, [screenTex, curvedGeo]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  return (
    <group
      position={position}
      rotation={rotation}
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
        onSelect(project.slug);
      }}
    >
      {/* Sculpted tapered aluminum pedestal */}
      <mesh position={[0, 0.56, -0.09]} rotation={[0.08, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.085, 1.12, 16]} />
        <meshStandardMaterial color="#1C2634" metalness={0.86} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.30, 0.36, 0.06, 32]} />
        <meshStandardMaterial color="#151E2A" metalness={0.84} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.27, 0.295, 32]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : project.accentColor} transparent opacity={0.7} />
      </mesh>

      {/* Beveled Metallic Display Housing */}
      <mesh position={[0, 1.24, -0.025]} rotation={[-0.07, 0, 0]} castShadow>
        <boxGeometry args={[1.40, 0.87, 0.038]} />
        <meshStandardMaterial
          color="#16202C"
          metalness={0.88}
          roughness={0.22}
          emissive={hovered ? project.accentColor : "#000000"}
          emissiveIntensity={hovered ? 0.22 : 0}
        />
      </mesh>
      {/* Curved Luminous Project Screen */}
      <mesh position={[0, 1.24, 0.012]} rotation={[-0.07, 0, 0]} geometry={curvedGeo}>
        <meshStandardMaterial
          map={screenTex}
          emissiveMap={screenTex}
          emissive="#ffffff"
          emissiveIntensity={hovered ? 0.92 : 0.68}
          roughness={0.16}
          metalness={0.08}
        />
      </mesh>
      {/* Thin Top Accent Bar */}
      <mesh position={[0, 1.69, -0.038]} rotation={[-0.07, 0, 0]}>
        <boxGeometry args={[0.56, 0.014, 0.016]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : project.accentColor} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.9, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 text-[11px] font-mono text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#4EF2B8]">PROJECT {"//"}</span> {project.title}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Graceful Sweeping Aerospace Observatory Arch Ribs (replaces flat boxy pillars!) */
function ObservatoryCanopyArches({ metalTex }: { metalTex: ReturnType<typeof createBrushedMetalTextures> }) {
  const { ribs, ringBeam } = useMemo(() => {
    const angles = [-1.08, -0.54, 0, 0.54, 1.08];
    const rList = angles.map((ang) => {
      const s = Math.sin(ang);
      const c = Math.cos(ang);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 6.22, -0.05, -0.4 - c * 6.22),
        new THREE.Vector3(s * 6.38, 1.85, -0.4 - c * 6.38),
        new THREE.Vector3(s * 5.75, 3.65, -0.4 - c * 5.75),
        new THREE.Vector3(s * 4.25, 4.75, -0.4 - c * 4.25),
      ]);
      return new THREE.TubeGeometry(curve, 28, 0.085, 10, false);
    });

    // Sweeping upper crown ring beam connecting all 5 arch tips smoothly
    const crownPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const ang = -1.12 + (2.24 * i) / 32;
      crownPts.push(new THREE.Vector3(Math.sin(ang) * 4.25, 4.75, -0.4 - Math.cos(ang) * 4.25));
    }
    const rBeam = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crownPts), 40, 0.065, 10, false);

    return { ribs: rList, ringBeam: rBeam };
  }, []);

  useEffect(() => {
    return () => {
      ribs.forEach((g) => g.dispose());
      ringBeam.dispose();
    };
  }, [ribs, ringBeam]);

  return (
    <group name="ObservatoryCanopy">
      {ribs.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow>
          <meshStandardMaterial
            map={metalTex.map}
            roughnessMap={metalTex.roughnessMap}
            color="#24303E"
            metalness={0.86}
            roughness={0.28}
          />
        </mesh>
      ))}
      <mesh geometry={ringBeam}>
        <meshStandardMaterial color="#1F2B38" metalness={0.88} roughness={0.24} />
      </mesh>
      {/* Subtle architectural grazing light halo along upper crown */}
      <mesh position={[0, 4.69, -4.64]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.25, 0.015, 8, 48, 2.2]} />
        <meshBasicMaterial color="#4EF2B8" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

interface TechLabProps {
  projects: ProjectItem[];
}

export function TechLab({ projects }: TechLabProps) {
  const selectProject = useUniverseStore((s) => s.selectProject);
  const focusZone = useUniverseStore((s) => s.focusZone);

  const floorTex = useMemo(() => createLabFloorTextures([7, 7]), []);
  const metalTex = useMemo(() => createBrushedMetalTextures([2, 2]), []);
  const codeCenter = useMemo(() => createCodeScreenTexture("system"), []);
  const codeLeft = useMemo(() => createCodeScreenTexture("shader"), []);
  const codeRight = useMemo(() => createCodeScreenTexture("telemetry"), []);
  const mainMonitorGeo = useMemo(() => createCurvedScreenGeo(1.52, 0.72, 3.2, 24), []);
  const sideMonitorGeo = useMemo(() => createCurvedScreenGeo(0.98, 0.62, 2.8, 18), []);

  useEffect(() => {
    return () => {
      floorTex.map.dispose();
      floorTex.roughnessMap.dispose();
      floorTex.bumpMap.dispose();
      metalTex.map.dispose();
      metalTex.roughnessMap.dispose();
      metalTex.bumpMap.dispose();
      codeCenter.dispose();
      codeLeft.dispose();
      codeRight.dispose();
      mainMonitorGeo.dispose();
      sideMonitorGeo.dispose();
    };
  }, [floorTex, metalTex, codeCenter, codeLeft, codeRight, mainMonitorGeo, sideMonitorGeo]);

  const featuredSix = useMemo(() => {
    const f = projects.filter((p) => p.featured).slice(0, 6);
    return f.length >= 6 ? f : projects.slice(0, 6);
  }, [projects]);

  const terminalPlacements: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [-3.95, 0, -4.15], rot: [0, 0.56, 0] },
    { pos: [-2.45, 0, -5.05], rot: [0, 0.28, 0] },
    { pos: [-0.82, 0, -5.45], rot: [0, 0.08, 0] },
    { pos: [0.82, 0, -5.45], rot: [0, -0.08, 0] },
    { pos: [2.45, 0, -5.05], rot: [0, -0.28, 0] },
    { pos: [3.95, 0, -4.15], rot: [0, -0.56, 0] },
  ];

  // Cleanly computed skybridges bridging Main Deck (r=6.35 around [0,0,-0.4]) -> Satellite Pods
  const walkways = useMemo(() => {
    const targets: [number, number, number][] = [
      [9.9, 0, 2.3], // Football Arena (radius 2.65)
      [8.9, 0, -5.3], // Gaming Pod (radius 2.45)
      [-9.3, 0, -5.4], // Swimming Pod (radius ~2.4)
    ];
    const radii = [2.6, 2.4, 2.35];
    const origin = new THREE.Vector2(0, -0.4);
    return targets.map((t, i) => {
      const dest = new THREE.Vector2(t[0], t[2]);
      const diff = dest.clone().sub(origin);
      const dist = diff.length();
      const dir = diff.clone().normalize();
      const startDist = 6.2;
      const endDist = dist - radii[i] + 0.15;
      const midDist = (startDist + endDist) * 0.5;
      const len = Math.max(0.8, endDist - startDist);
      const mid = origin.clone().addScaledVector(dir, midDist);
      const rotY = -Math.atan2(dir.y, dir.x);
      return { pos: [mid.x, -0.08, mid.y] as [number, number, number], rotY, len };
    });
  }, []);

  return (
    <group name="TechLab">
      {/* Main Circular Observatory Deck */}
      <group position={[0, 0, -0.4]}>
        <mesh position={[0, -0.14, 0]} receiveShadow>
          <cylinderGeometry args={[6.35, 6.72, 0.28, 72]} />
          <meshStandardMaterial
            map={floorTex.map}
            roughnessMap={floorTex.roughnessMap}
            bumpMap={floorTex.bumpMap}
            bumpScale={0.015}
            metalness={0.38}
            roughness={0.54}
          />
        </mesh>
        {/* Brushed Titanium Outer Rim Ring */}
        <mesh position={[0, -0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[6.06, 6.40, 72]} />
          <meshStandardMaterial
            map={metalTex.map}
            roughnessMap={metalTex.roughnessMap}
            metalness={0.86}
            roughness={0.26}
          />
        </mesh>
        {/* Fine Recessed Mint Perimeter Light Channel */}
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.02, 6.055, 72]} />
          <meshBasicMaterial color="#4EF2B8" transparent opacity={0.52} />
        </mesh>
        {/* Aerospace Under-Deck Superstructure */}
        <mesh position={[0, -0.58, 0]}>
          <cylinderGeometry args={[5.75, 3.4, 0.66, 48]} />
          <meshStandardMaterial color="#0A1017" metalness={0.8} roughness={0.4} />
        </mesh>
      </group>

      {/* Graceful Sweeping Observatory Canopy Arches */}
      <ObservatoryCanopyArches metalTex={metalTex} />

      {/* Architectural Skybridges (zero overlap, clean chamfered aluminum railings!) */}
      {walkways.map((w, idx) => (
        <group key={idx} position={w.pos} rotation={[0, w.rotY, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[w.len, 0.14, 1.25]} />
            <meshStandardMaterial
              map={metalTex.map}
              color="#16202C"
              metalness={0.8}
              roughness={0.32}
            />
          </mesh>
          {/* Low smoked glass side curbs + slim mint guide rails */}
          {[-0.58, 0.58].map((sz, j) => (
            <group key={j} position={[0, 0.16, sz]}>
              <mesh>
                <boxGeometry args={[w.len, 0.22, 0.03]} />
                <meshPhysicalMaterial
                  color="#9BD8EA"
                  transparent
                  opacity={0.18}
                  roughness={0.08}
                  clearcoat={1}
                />
              </mesh>
              <mesh position={[0, -0.085, 0]}>
                <boxGeometry args={[w.len, 0.016, 0.04]} />
                <meshBasicMaterial color="#4EF2B8" transparent opacity={0.62} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* ═══════════════ HERO DEVELOPER WORKSTATION (z = -2.95) ═══════════════ */}
      <group
        position={[0, 0, -2.95]}
        onClick={(e) => {
          e.stopPropagation();
          focusZone("projects", true);
        }}
      >
        {/* Executive Beveled Carbon-Slate & Aluminum Desk */}
        <mesh position={[0, 0.79, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.72, 0.072, 1.08]} />
          <meshStandardMaterial
            map={metalTex.map}
            roughnessMap={metalTex.roughnessMap}
            color="#18212C"
            metalness={0.7}
            roughness={0.32}
          />
        </mesh>
        {/* Brushed Aluminum Front Bevel Fascia + Ambient Light Line */}
        <mesh position={[0, 0.79, 0.545]}>
          <boxGeometry args={[3.72, 0.036, 0.012]} />
          <meshStandardMaterial color="#2C3A4A" metalness={0.9} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.752, 0.53]}>
          <boxGeometry args={[3.3, 0.012, 0.012]} />
          <meshBasicMaterial color="#4EF2B8" transparent opacity={0.78} />
        </mesh>
        {/* Cantilevered Brushed Aluminum A-Frame Legs */}
        {[-1.62, 1.62].map((lx, i) => (
          <group key={i} position={[lx, 0.39, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.11, 0.76, 0.88]} />
              <meshStandardMaterial color="#1F2A38" metalness={0.86} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.37, 0]}>
              <boxGeometry args={[0.26, 0.04, 0.98]} />
              <meshStandardMaterial color="#141C25" metalness={0.88} roughness={0.24} />
            </mesh>
          </group>
        ))}

        {/* Extended Acoustic Desk Mat */}
        <mesh position={[-0.20, 0.83, 0.16]} receiveShadow>
          <boxGeometry args={[1.22, 0.006, 0.48]} />
          <meshStandardMaterial color="#0C1118" roughness={0.88} metalness={0.05} />
        </mesh>

        {/* Mechanical Keyboard + Ergonomic Mouse */}
        <MechanicalKeyboard position={[-0.26, 0.836, 0.18]} />
        <group position={[0.18, 0.84, 0.19]}>
          <mesh scale={[0.038, 0.023, 0.065]} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial color="#18212C" roughness={0.36} metalness={0.38} />
          </mesh>
          <mesh position={[0, 0.017, -0.02]}>
            <boxGeometry args={[0.008, 0.008, 0.018]} />
            <meshBasicMaterial color="#4EF2B8" />
          </mesh>
        </group>

        {/* Triple Curved Developer Monitors on Heavy Articulated Aluminum Arm */}
        <group position={[-0.2, 0.83, -0.28]}>
          <mesh position={[0, 0.38, -0.08]} castShadow>
            <cylinderGeometry args={[0.038, 0.048, 0.76, 16]} />
            <meshStandardMaterial color="#253140" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Center Ultrawide */}
          <group position={[0, 0.58, 0.02]}>
            <mesh position={[0, 0, -0.026]} castShadow>
              <boxGeometry args={[1.58, 0.77, 0.034]} />
              <meshStandardMaterial color="#131B25" metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh geometry={mainMonitorGeo}>
              <meshStandardMaterial
                map={codeCenter}
                emissiveMap={codeCenter}
                emissive="#ffffff"
                emissiveIntensity={0.78}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
          {/* Left Curved Monitor */}
          <group position={[-1.22, 0.56, 0.25]} rotation={[0, 0.42, 0]}>
            <mesh position={[0, 0, -0.024]} castShadow>
              <boxGeometry args={[1.03, 0.66, 0.032]} />
              <meshStandardMaterial color="#131B25" metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh geometry={sideMonitorGeo}>
              <meshStandardMaterial
                map={codeLeft}
                emissiveMap={codeLeft}
                emissive="#ffffff"
                emissiveIntensity={0.74}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
          {/* Right Curved Monitor */}
          <group position={[1.22, 0.56, 0.25]} rotation={[0, -0.42, 0]}>
            <mesh position={[0, 0, -0.024]} castShadow>
              <boxGeometry args={[1.03, 0.66, 0.032]} />
              <meshStandardMaterial color="#131B25" metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh geometry={sideMonitorGeo}>
              <meshStandardMaterial
                map={codeRight}
                emissiveMap={codeRight}
                emissive="#ffffff"
                emissiveIntensity={0.74}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
        </group>

        {/* Transparent Tempered-Glass High-Performance PC Tower */}
        <TransparentPCTower position={[1.48, 0.83, -0.02]} />
      </group>

      {/* ═══════════════ 6 INTERACTIVE GITHUB PROJECT TERMINALS ═══════════════ */}
      <group name="ProjectsArc">
        {featuredSix.map((proj, idx) => {
          const placement = terminalPlacements[idx];
          if (!placement) return null;
          return (
            <ProjectTerminal
              key={proj.slug}
              project={proj}
              position={placement.pos}
              rotation={placement.rot}
              onSelect={selectProject}
            />
          );
        })}
      </group>
    </group>
  );
}
