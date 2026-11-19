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

/** Helper to generate a curved monitor screen geometry (cylindrical arc facing +Z) */
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

/** Mechanical keyboard with instanced sculpted keycaps (single draw call!) */
function MechanicalKeyboard({ position }: { position: [number, number, number] }) {
  const keysRef = useRef<THREE.InstancedMesh>(null);
  const keyPositions = useMemo(() => {
    const list: { x: number; z: number; sx: number }[] = [];
    const rows = [14, 14, 13, 12, 7];
    rows.forEach((cols, r) => {
      const z = -0.056 + r * 0.027;
      if (r === 4) {
        // Bottom row with wide spacebar
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
      {/* CNC anodized aluminum case */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.41, 0.02, 0.155]} />
        <meshStandardMaterial color="#1A222C" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* Subtle mint underglow switch plate */}
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.385, 0.002, 0.135]} />
        <meshBasicMaterial color="#4EF2B8" transparent opacity={0.5} />
      </mesh>
      {/* Instanced PBT matte keycaps */}
      <instancedMesh ref={keysRef} args={[undefined, undefined, keyPositions.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#10151C" roughness={0.65} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}

/** Transparent tempered-glass high-end PC tower with visible GPU, RAM, AIO cooler & spinning fans */
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
    <group position={position} rotation={[0, -0.22, 0]}>
      {/* Chassis structural frame (back, bottom, top, PSU shroud) */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.08, 0.56]} />
        <meshStandardMaterial color="#121820" metalness={0.82} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow>
        <boxGeometry args={[0.28, 0.03, 0.56]} />
        <meshStandardMaterial color="#18202B" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* Back steel panel & motherboard tray */}
      <mesh position={[0.125, 0.29, 0]} castShadow>
        <boxGeometry args={[0.022, 0.48, 0.54]} />
        <meshStandardMaterial color="#11171F" metalness={0.75} roughness={0.4} />
      </mesh>
      {/* Rear panel */}
      <mesh position={[0, 0.29, -0.27]}>
        <boxGeometry args={[0.28, 0.48, 0.02]} />
        <meshStandardMaterial color="#141C26" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Internal Motherboard PCB */}
      <mesh position={[0.095, 0.31, -0.05]}>
        <boxGeometry args={[0.015, 0.34, 0.34]} />
        <meshStandardMaterial color="#0A0E14" metalness={0.45} roughness={0.5} />
      </mesh>

      {/* AIO CPU Liquid Cooler Block with glowing mint ring */}
      <mesh position={[0.065, 0.33, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.042, 0.04, 24]} />
        <meshStandardMaterial color="#1C2430" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0.043, 0.33, -0.04]} rotation={[0, -Math.PI / 2, 0]}>
        <ringGeometry args={[0.024, 0.031, 24]} />
        <meshBasicMaterial color="#4EF2B8" side={THREE.DoubleSide} />
      </mesh>

      {/* Curved AIO Liquid Cooling Tubes */}
      {aioTubes.map((geo, i) => (
        <mesh key={i} position={[0.03, 0.06, -0.02]} geometry={geo}>
          <meshStandardMaterial color="#0E1319" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* 4 Illuminated DDR5 RAM DIMM Sticks */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0.068, 0.34, 0.035 + i * 0.018]}>
          <mesh>
            <boxGeometry args={[0.036, 0.13, 0.008]} />
            <meshStandardMaterial color="#1E2733" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[-0.019, 0, 0]}>
            <boxGeometry args={[0.004, 0.125, 0.006]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#4EF2B8" : "#7DE9F8"} />
          </mesh>
        </group>
      ))}

      {/* Heavyweight Dual-Slot Flagship GPU */}
      <group position={[0.01, 0.19, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.052, 0.31]} />
          <meshStandardMaterial color="#1E2632" metalness={0.85} roughness={0.26} />
        </mesh>
        {/* GPU side accent LED strip */}
        <mesh position={[-0.081, 0.006, 0]}>
          <boxGeometry args={[0.003, 0.01, 0.24]} />
          <meshBasicMaterial color="#4EF2B8" />
        </mesh>
      </group>

      {/* 3 Front Actively Spinning Mint-Halo Intake Fans */}
      {[0.17, 0.30, 0.43].map((fy, idx) => (
        <group key={idx} position={[0, fy, 0.245]}>
          {/* Fan housing ring */}
          <mesh>
            <torusGeometry args={[0.056, 0.007, 10, 24]} />
            <meshBasicMaterial color="#4EF2B8" />
          </mesh>
          {/* Rotating blades */}
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
                  Math.cos((b / 5) * Math.PI * 2) * 0.025,
                  Math.sin((b / 5) * Math.PI * 2) * 0.025,
                  0,
                ]}
              >
                <boxGeometry args={[0.044, 0.014, 0.004]} />
                <meshStandardMaterial color="#273444" metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Tempered Glass Side Panel & Front Glass Panel */}
      <mesh position={[-0.138, 0.295, 0]}>
        <boxGeometry args={[0.008, 0.47, 0.54]} />
        <meshPhysicalMaterial
          color="#9FD8E8"
          transparent
          opacity={0.22}
          roughness={0.08}
          metalness={0.12}
          reflectivity={0.95}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 0.295, 0.278]}>
        <boxGeometry args={[0.27, 0.47, 0.008]} />
        <meshPhysicalMaterial
          color="#9FD8E8"
          transparent
          opacity={0.18}
          roughness={0.08}
          metalness={0.1}
          clearcoat={1}
        />
      </mesh>
    </group>
  );
}

/** Interactive Project Terminal Kiosk displaying a verified GitHub project */
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
  const curvedGeo = useMemo(() => createCurvedScreenGeo(1.36, 0.82, 3.6, 20), []);
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
      {/* Brushed aluminum pedestal column */}
      <mesh position={[0, 0.54, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 1.08, 0.14]} />
        <meshStandardMaterial color="#18202B" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* Weighted base plate */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.06, 24]} />
        <meshStandardMaterial color="#141C25" metalness={0.82} roughness={0.32} />
      </mesh>
      {/* Curved monitor chassis backing */}
      <mesh position={[0, 1.24, -0.025]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.44, 0.89, 0.04]} />
        <meshStandardMaterial
          color="#131A24"
          metalness={0.86}
          roughness={0.24}
          emissive={hovered ? project.accentColor : "#000000"}
          emissiveIntensity={hovered ? 0.25 : 0}
        />
      </mesh>
      {/* Luminous project display screen */}
      <mesh position={[0, 1.24, 0.01]} rotation={[-0.08, 0, 0]} geometry={curvedGeo}>
        <meshStandardMaterial
          map={screenTex}
          emissiveMap={screenTex}
          emissive="#ffffff"
          emissiveIntensity={hovered ? 1.05 : 0.72}
          roughness={0.18}
          metalness={0.08}
        />
      </mesh>
      {/* Top status bar light */}
      <mesh position={[0, 1.70, -0.04]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.68, 0.016, 0.018]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : project.accentColor} />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 1.92, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 text-[11px] font-mono text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#4EF2B8]">PROJECT //</span> {project.title}
          </div>
        </Html>
      )}
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
  const mainMonitorGeo = useMemo(() => createCurvedScreenGeo(1.42, 0.66, 3.2, 24), []);
  const sideMonitorGeo = useMemo(() => createCurvedScreenGeo(0.92, 0.58, 2.8, 18), []);

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

  // Select the 6 featured projects for the interactive terminals around the lab
  const featuredSix = useMemo(() => {
    const f = projects.filter((p) => p.featured).slice(0, 6);
    return f.length >= 6 ? f : projects.slice(0, 6);
  }, [projects]);

  // Curved arc positions flanking the rear laboratory observatory
  const terminalPlacements: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [-3.95, 0, -4.15], rot: [0, 0.56, 0] },
    { pos: [-2.45, 0, -5.05], rot: [0, 0.28, 0] },
    { pos: [-0.82, 0, -5.45], rot: [0, 0.08, 0] },
    { pos: [0.82, 0, -5.45], rot: [0, -0.08, 0] },
    { pos: [2.45, 0, -5.05], rot: [0, -0.28, 0] },
    { pos: [3.95, 0, -4.15], rot: [0, -0.56, 0] },
  ];

  // Skybridges connecting Main Lab to the 3 Satellite Hobby Pods
  const walkways = [
    // To Football Arena (7.5, 2.3)
    { pos: [4.95, -0.06, 1.55] as [number, number, number], rotY: -0.31, len: 3.1 },
    // To Gaming Pod (6.8, -4.2)
    { pos: [4.75, -0.06, -2.95] as [number, number, number], rotY: 0.56, len: 3.0 },
    // To Swimming Pod (-7.3, -5.0)
    { pos: [-4.95, -0.06, -3.4] as [number, number, number], rotY: -0.59, len: 3.3 },
  ];

  return (
    <group name="TechLab">
      {/* Main Circular Observatory Deck */}
      <group position={[0, 0, -0.4]}>
        {/* Primary matte carbon-slate deck surface */}
        <mesh position={[0, -0.14, 0]} receiveShadow>
          <cylinderGeometry args={[6.4, 6.75, 0.28, 64]} />
          <meshStandardMaterial
            map={floorTex.map}
            roughnessMap={floorTex.roughnessMap}
            bumpMap={floorTex.bumpMap}
            bumpScale={0.015}
            metalness={0.35}
            roughness={0.58}
          />
        </mesh>
        {/* Brushed titanium architectural rim ring */}
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[6.12, 6.45, 64]} />
          <meshStandardMaterial
            map={metalTex.map}
            roughnessMap={metalTex.roughnessMap}
            metalness={0.86}
            roughness={0.28}
          />
        </mesh>
        {/* Subtle glowing mint perimeter light channel */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.06, 6.11, 64]} />
          <meshBasicMaterial color="#4EF2B8" transparent opacity={0.62} />
        </mesh>
        {/* Under-deck aerospace superstructure hull */}
        <mesh position={[0, -0.58, 0]}>
          <cylinderGeometry args={[5.8, 3.6, 0.64, 32]} />
          <meshStandardMaterial color="#0A1017" metalness={0.78} roughness={0.42} />
        </mesh>
      </group>

      {/* Architectural Observatory Ribs & Overhead Light Canopies (depth & silhouette from every 360° angle) */}
      {[-0.95, -0.42, 0.42, 0.95].map((ang, i) => {
        const rx = Math.sin(ang) * 6.2;
        const rz = -0.4 - Math.cos(ang) * 6.2;
        return (
          <group key={i} position={[rx, 0, rz]} rotation={[0, -ang, 0]}>
            {/* Slanted brushed-titanium structural rib column */}
            <mesh position={[0, 1.9, 0]} rotation={[0.16, 0, 0]} castShadow>
              <boxGeometry args={[0.24, 3.9, 0.34]} />
              <meshStandardMaterial
                map={metalTex.map}
                metalness={0.85}
                roughness={0.3}
                color="#202A36"
              />
            </mesh>
            {/* Vertical subtle mint architectural light slit */}
            <mesh position={[0, 1.9, 0.18]} rotation={[0.16, 0, 0]}>
              <boxGeometry args={[0.03, 3.1, 0.015]} />
              <meshBasicMaterial color="#4EF2B8" transparent opacity={0.75} />
            </mesh>
            {/* Upper curved cantilever rib arm */}
            <mesh position={[0, 3.78, 0.72]} rotation={[1.22, 0, 0]} castShadow>
              <boxGeometry args={[0.20, 1.9, 0.22]} />
              <meshStandardMaterial color="#18212C" metalness={0.84} roughness={0.32} />
            </mesh>
          </group>
        );
      })}

      {/* Translucent Glass Safety Balustrade segments along rear observatory edge */}
      {[-0.68, 0, 0.68].map((ang, i) => (
        <mesh
          key={i}
          position={[Math.sin(ang) * 6.18, 0.52, -0.4 - Math.cos(ang) * 6.18]}
          rotation={[0, -ang, 0]}
        >
          <boxGeometry args={[2.7, 0.92, 0.03]} />
          <meshPhysicalMaterial
            color="#A8DCF0"
            transparent
            opacity={0.14}
            roughness={0.08}
            metalness={0.1}
            clearcoat={1}
          />
        </mesh>
      ))}

      {/* Glowing Skybridges linking Main Lab to Football, Gaming & Swimming Pods */}
      {walkways.map((w, idx) => (
        <group key={idx} position={w.pos} rotation={[0, w.rotY, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[w.len, 0.12, 1.15]} />
            <meshStandardMaterial color="#121A24" metalness={0.78} roughness={0.36} />
          </mesh>
          {/* Twin subtle LED guide rails */}
          <mesh position={[0, 0.068, 0.52]}>
            <boxGeometry args={[w.len, 0.018, 0.025]} />
            <meshBasicMaterial color="#4EF2B8" transparent opacity={0.75} />
          </mesh>
          <mesh position={[0, 0.068, -0.52]}>
            <boxGeometry args={[w.len, 0.018, 0.025]} />
            <meshBasicMaterial color="#4EF2B8" transparent opacity={0.75} />
          </mesh>
        </group>
      ))}

      {/* ═══════════════ HERO DEVELOPER WORKSTATION (behind hologram, z = -2.95) ═══════════════ */}
      <group
        position={[0, 0, -2.95]}
        onClick={(e) => {
          e.stopPropagation();
          focusZone("projects", true);
        }}
      >
        {/* Executive Carbon & Brushed Aluminum Desk */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 0.065, 1.02]} />
          <meshStandardMaterial
            map={metalTex.map}
            roughnessMap={metalTex.roughnessMap}
            color="#151C25"
            metalness={0.68}
            roughness={0.34}
          />
        </mesh>
        {/* Front glass inlay strip & ambient underglow */}
        <mesh position={[0, 0.75, 0.50]}>
          <boxGeometry args={[3.2, 0.015, 0.015]} />
          <meshBasicMaterial color="#4EF2B8" />
        </mesh>
        {/* Sculpted angled brushed-aluminum desk legs */}
        {[-1.56, 1.56].map((lx, i) => (
          <group key={i} position={[lx, 0.38, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.1, 0.76, 0.86]} />
              <meshStandardMaterial color="#1C2531" metalness={0.86} roughness={0.26} />
            </mesh>
            <mesh position={[0, -0.36, 0]}>
              <boxGeometry args={[0.24, 0.04, 0.94]} />
              <meshStandardMaterial color="#121820" metalness={0.88} roughness={0.24} />
            </mesh>
          </group>
        ))}

        {/* Desk Mat */}
        <mesh position={[-0.18, 0.816, 0.16]} receiveShadow>
          <boxGeometry args={[1.15, 0.005, 0.46]} />
          <meshStandardMaterial color="#0C1117" roughness={0.88} metalness={0.05} />
        </mesh>

        {/* Mechanical Keyboard + Sculpted Ergonomic Mouse */}
        <MechanicalKeyboard position={[-0.24, 0.822, 0.18]} />
        <group position={[0.18, 0.825, 0.19]}>
          <mesh scale={[0.036, 0.022, 0.062]} castShadow>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#161E27" roughness={0.4} metalness={0.35} />
          </mesh>
          {/* Scroll wheel mint accent */}
          <mesh position={[0, 0.016, -0.02]}>
            <boxGeometry args={[0.008, 0.008, 0.018]} />
            <meshBasicMaterial color="#4EF2B8" />
          </mesh>
        </group>

        {/* Triple Curved Developer Monitors on Articulated VESA Stand */}
        <group position={[-0.18, 0.82, -0.28]}>
          {/* Heavy aluminum central monitor spine */}
          <mesh position={[0, 0.36, -0.08]} castShadow>
            <cylinderGeometry args={[0.036, 0.045, 0.72, 16]} />
            <meshStandardMaterial color="#212B38" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Center Ultrawide Curved Screen */}
          <group position={[0, 0.56, 0.02]}>
            <mesh position={[0, 0, -0.025]} castShadow>
              <boxGeometry args={[1.48, 0.71, 0.032]} />
              <meshStandardMaterial color="#111720" metalness={0.82} roughness={0.26} />
            </mesh>
            <mesh geometry={mainMonitorGeo}>
              <meshStandardMaterial
                map={codeCenter}
                emissiveMap={codeCenter}
                emissive="#ffffff"
                emissiveIntensity={0.82}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
          {/* Left Angled Curved Screen */}
          <group position={[-1.14, 0.54, 0.24]} rotation={[0, 0.42, 0]}>
            <mesh position={[0, 0, -0.025]} castShadow>
              <boxGeometry args={[0.97, 0.62, 0.03]} />
              <meshStandardMaterial color="#111720" metalness={0.82} roughness={0.26} />
            </mesh>
            <mesh geometry={sideMonitorGeo}>
              <meshStandardMaterial
                map={codeLeft}
                emissiveMap={codeLeft}
                emissive="#ffffff"
                emissiveIntensity={0.78}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
          {/* Right Angled Curved Screen */}
          <group position={[1.14, 0.54, 0.24]} rotation={[0, -0.42, 0]}>
            <mesh position={[0, 0, -0.025]} castShadow>
              <boxGeometry args={[0.97, 0.62, 0.03]} />
              <meshStandardMaterial color="#111720" metalness={0.82} roughness={0.26} />
            </mesh>
            <mesh geometry={sideMonitorGeo}>
              <meshStandardMaterial
                map={codeRight}
                emissiveMap={codeRight}
                emissive="#ffffff"
                emissiveIntensity={0.78}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
        </group>

        {/* Transparent Tempered-Glass High-Performance PC Tower on right end of desk */}
        <TransparentPCTower position={[1.42, 0.815, -0.04]} />
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
