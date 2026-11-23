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
import {
  createCurvedScreenGeo,
  createCurvedShellGeo,
  ErgonomicChair,
  MechanicalKeyboard,
} from "./props/LabFurniture";

/** High-detail tempered-glass custom PC tower with VRM heatsink, GPU heatpipes & spinning fans */
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
    return [
      new THREE.TubeGeometry(c1, 18, 0.009, 8, false),
      new THREE.TubeGeometry(c2, 18, 0.009, 8, false),
    ];
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
      {/* PSU shroud + top radiator grill + brushed titanium frame posts */}
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.30, 0.09, 0.58]} />
        <meshStandardMaterial color="#202A37" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[0.30, 0.032, 0.58]} />
        <meshStandardMaterial color="#2B3848" metalness={0.84} roughness={0.24} />
      </mesh>
      <mesh position={[0.135, 0.30, 0]} castShadow>
        <boxGeometry args={[0.024, 0.50, 0.56]} />
        <meshStandardMaterial color="#1A232E" metalness={0.78} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.30, -0.28]}>
        <boxGeometry args={[0.30, 0.50, 0.022]} />
        <meshStandardMaterial color="#212C3A" metalness={0.82} roughness={0.3} />
      </mesh>
      {/* Brushed titanium corner pillars */}
      {[
        [-0.14, 0.28],
        [-0.14, -0.28],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.30, pz]}>
          <boxGeometry args={[0.018, 0.50, 0.018]} />
          <meshStandardMaterial color="#4C5D72" metalness={0.88} roughness={0.22} />
        </mesh>
      ))}

      {/* Motherboard PCB + Machined VRM Heatsink */}
      <mesh position={[0.102, 0.32, -0.05]}>
        <boxGeometry args={[0.015, 0.36, 0.36]} />
        <meshStandardMaterial color="#0D141D" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[0.088, 0.42, -0.14]}>
        <boxGeometry args={[0.024, 0.14, 0.06]} />
        <meshStandardMaterial color="#405064" metalness={0.88} roughness={0.22} />
      </mesh>

      {/* AIO CPU Liquid Cooler Block */}
      <mesh position={[0.072, 0.34, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.042, 0.04, 24]} />
        <meshStandardMaterial color="#2C3A4C" metalness={0.88} roughness={0.18} />
      </mesh>
      <mesh position={[0.05, 0.34, -0.04]} rotation={[0, -Math.PI / 2, 0]}>
        <ringGeometry args={[0.026, 0.031, 24]} />
        <meshBasicMaterial color="#4EF2B8" side={THREE.DoubleSide} />
      </mesh>

      {aioTubes.map((geo, i) => (
        <mesh key={i} position={[0.03, 0.07, -0.02]} geometry={geo}>
          <meshStandardMaterial color="#141A22" roughness={0.68} metalness={0.2} />
        </mesh>
      ))}

      {/* 4 DDR5 RAM Modules */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0.072, 0.35, 0.038 + i * 0.019]}>
          <mesh>
            <boxGeometry args={[0.038, 0.135, 0.008]} />
            <meshStandardMaterial color="#2B3848" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh position={[-0.02, 0, 0]}>
            <boxGeometry args={[0.004, 0.128, 0.006]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#4EF2B8" : "#7DE9F8"} />
          </mesh>
        </group>
      ))}

      {/* Flagship GPU + Copper Heatpipes */}
      <group position={[0.012, 0.20, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.17, 0.055, 0.33]} />
          <meshStandardMaterial color="#2B3746" metalness={0.86} roughness={0.24} />
        </mesh>
        <mesh position={[-0.068, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.26, 10]} />
          <meshStandardMaterial color="#C87A4B" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[-0.086, 0.007, 0]}>
          <boxGeometry args={[0.004, 0.007, 0.24]} />
          <meshBasicMaterial color="#4EF2B8" />
        </mesh>
      </group>

      {/* 3 Refined Thin-Ring Spinning Intake Fans */}
      {[0.175, 0.31, 0.445].map((fy, idx) => (
        <group key={idx} position={[0, fy, 0.255]}>
          <mesh>
            <torusGeometry args={[0.058, 0.0038, 10, 28]} />
            <meshBasicMaterial color="#4EF2B8" transparent opacity={0.85} />
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
                <meshStandardMaterial color="#3A495C" metalness={0.62} roughness={0.34} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Tempered Glass Side & Front Panels */}
      <mesh position={[-0.148, 0.305, 0]}>
        <boxGeometry args={[0.008, 0.49, 0.56]} />
        <meshPhysicalMaterial
          color="#A6DCEB"
          transparent
          opacity={0.18}
          roughness={0.06}
          metalness={0.1}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 0.305, 0.288]}>
        <boxGeometry args={[0.29, 0.49, 0.008]} />
        <meshPhysicalMaterial
          color="#A6DCEB"
          transparent
          opacity={0.14}
          roughness={0.06}
          metalness={0.08}
          clearcoat={1}
        />
      </mesh>
    </group>
  );
}

/** Interactive Curved Project Lab Terminal mounted on the elevated rear terrace */
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
  const curvedGeo = useMemo(() => createCurvedScreenGeo(1.30, 0.78, 3.6, 20), []);
  const shellGeo = useMemo(() => createCurvedShellGeo(1.38, 0.85, 0.044, 3.6, 20), []);
  const phase = useUniverseStore((s) => s.phase);

  useEffect(() => {
    return () => {
      screenTex.dispose();
      curvedGeo.dispose();
      shellGeo.dispose();
    };
  }, [screenTex, curvedGeo, shellGeo]);

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
        if (e.delta > 5) return;
        onSelect(project.slug);
      }}
    >
      {/* Sculpted tapered brushed-titanium pedestal (elevates terminal cleanly above desk!) */}
      <mesh position={[0, 0.72, -0.09]} rotation={[0.06, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.052, 0.086, 1.44, 18]} />
        <meshStandardMaterial color="#384759" metalness={0.84} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.30, 0.36, 0.06, 32]} />
        <meshStandardMaterial color="#273342" metalness={0.84} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.064, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.285, 32]} />
        <meshBasicMaterial
          color={hovered ? "#ECF3F7" : project.accentColor}
          transparent
          opacity={0.72}
        />
      </mesh>

      {/* Matching Curved Beveled Metallic Display Shell */}
      <group position={[0, 1.56, 0]} rotation={[-0.05, 0, 0]}>
        <mesh geometry={shellGeo} castShadow>
          <meshStandardMaterial
            color="#293647"
            metalness={0.86}
            roughness={0.24}
            emissive={hovered ? project.accentColor : "#000000"}
            emissiveIntensity={hovered ? 0.18 : 0}
          />
        </mesh>
        {/* Curved Luminous Project Screen */}
        <mesh position={[0, 0, 0.004]} geometry={curvedGeo}>
          <meshStandardMaterial
            map={screenTex}
            emissiveMap={screenTex}
            emissive="#ffffff"
            emissiveIntensity={hovered ? 0.88 : 0.65}
            roughness={0.16}
            metalness={0.08}
          />
        </mesh>
        {/* Slim Status Accent Bar */}
        <mesh position={[0, 0.435, -0.01]}>
          <boxGeometry args={[0.52, 0.012, 0.014]} />
          <meshBasicMaterial color={hovered ? "#ECF3F7" : project.accentColor} />
        </mesh>
      </group>

      {phase === "active" && hovered && (
        <Html position={[0, 2.22, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#4EF2B8]/40 bg-[#070C12]/92 px-3 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md shadow-lg">
            <span className="text-[#4EF2B8]">PROJECT {"//"}</span> {project.title}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Twin-Rail Aerospace Observatory Canopy Arches:
 *  - Calibrated satin brushed titanium (visible in Night moonlight & Day sunlight!)
 *  - Mathematically aligned upper crown ring beam + flush subtle light filament (zero floating drift!)
 *  - Smoked architectural glass skylight louvers between arch upper spans
 */
function ObservatoryCanopyArches({
  metalTex,
}: {
  metalTex: ReturnType<typeof createBrushedMetalTextures>;
}) {
  const { outerRibs, innerRibs, struts, crownBeam, crownLight, skylightPanels } = useMemo(() => {
    const angles = [-1.08, -0.54, 0, 0.54, 1.08];
    const cz = -0.4;

    const oRibs = angles.map((ang) => {
      const s = Math.sin(ang);
      const c = Math.cos(ang);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 6.24, 0.0, cz - c * 6.24),
        new THREE.Vector3(s * 6.42, 1.85, cz - c * 6.42),
        new THREE.Vector3(s * 5.82, 3.68, cz - c * 5.82),
        new THREE.Vector3(s * 4.30, 4.78, cz - c * 4.30),
      ]);
      return new THREE.TubeGeometry(curve, 32, 0.062, 10, false);
    });

    const iRibs = angles.map((ang) => {
      const s = Math.sin(ang);
      const c = Math.cos(ang);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 6.06, 0.0, cz - c * 6.06),
        new THREE.Vector3(s * 6.24, 1.80, cz - c * 6.24),
        new THREE.Vector3(s * 5.66, 3.55, cz - c * 5.66),
        new THREE.Vector3(s * 4.24, 4.64, cz - c * 4.24),
      ]);
      return new THREE.TubeGeometry(curve, 32, 0.036, 8, false);
    });

    const stList: { pos: [number, number, number]; rotY: number; rotX: number; len: number }[] = [];
    for (const ang of angles) {
      const s = Math.sin(ang);
      const c = Math.cos(ang);
      for (const [rOut, yOut, rIn, yIn] of [
        [6.39, 1.5, 6.21, 1.46],
        [5.96, 3.3, 5.80, 3.20],
      ]) {
        const p1 = new THREE.Vector3(s * rOut, yOut, cz - c * rOut);
        const p2 = new THREE.Vector3(s * rIn, yIn, cz - c * rIn);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        stList.push({
          pos: [mid.x, mid.y, mid.z],
          rotY: -ang,
          rotX: 0.25,
          len: p1.distanceTo(p2),
        });
      }
    }

    // Crown ring & flush embedded light filament built along the EXACT same curve!
    const crownPts: THREE.Vector3[] = [];
    const lightPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 36; i++) {
      const ang = -1.10 + (2.20 * i) / 36;
      const x = Math.sin(ang) * 4.28;
      const z = cz - Math.cos(ang) * 4.28;
      crownPts.push(new THREE.Vector3(x, 4.74, z));
      lightPts.push(new THREE.Vector3(x, 4.66, z));
    }
    const cBeam = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crownPts), 44, 0.068, 12, false);
    const cLight = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lightPts), 44, 0.015, 8, false);

    // Subtle smoked glass skylight fins between upper arch spans
    const panels: { pos: [number, number, number]; rotY: number; width: number }[] = [];
    for (let i = 0; i < angles.length - 1; i++) {
      const midA = (angles[i] + angles[i + 1]) * 0.5;
      panels.push({
        pos: [Math.sin(midA) * 4.92, 4.26, cz - Math.cos(midA) * 4.92],
        rotY: -midA,
        width: 2.35,
      });
    }

    return {
      outerRibs: oRibs,
      innerRibs: iRibs,
      struts: stList,
      crownBeam: cBeam,
      crownLight: cLight,
      skylightPanels: panels,
    };
  }, []);

  useEffect(() => {
    return () => {
      outerRibs.forEach((g) => g.dispose());
      innerRibs.forEach((g) => g.dispose());
      crownBeam.dispose();
      crownLight.dispose();
    };
  }, [outerRibs, innerRibs, crownBeam, crownLight]);

  const angles = [-1.08, -0.54, 0, 0.54, 1.08];

  return (
    <group name="ObservatoryCanopy">
      {outerRibs.map((geo, i) => (
        <mesh key={`or-${i}`} geometry={geo} castShadow>
          <meshStandardMaterial
            map={metalTex.map}
            normalMap={metalTex.normalMap}
            roughnessMap={metalTex.roughnessMap}
            color="#9BAEC2"
            metalness={0.56}
            roughness={0.32}
          />
        </mesh>
      ))}
      {innerRibs.map((geo, i) => (
        <mesh key={`ir-${i}`} geometry={geo}>
          <meshStandardMaterial color="#4D5F73" metalness={0.8} roughness={0.28} />
        </mesh>
      ))}
      {struts.map((st, i) => (
        <mesh key={`st-${i}`} position={st.pos} rotation={[st.rotX, st.rotY, 0]}>
          <boxGeometry args={[0.045, 0.045, st.len]} />
          <meshStandardMaterial color="#586B80" metalness={0.82} roughness={0.26} />
        </mesh>
      ))}
      {/* Machined Base Anchor Shoes */}
      {angles.map((ang, i) => (
        <mesh
          key={`shoe-${i}`}
          position={[Math.sin(ang) * 6.15, 0.06, -0.4 - Math.cos(ang) * 6.15]}
          rotation={[0, -ang, 0]}
          castShadow
        >
          <boxGeometry args={[0.22, 0.12, 0.34]} />
          <meshStandardMaterial color="#374658" metalness={0.84} roughness={0.28} />
        </mesh>
      ))}
      {/* Upper Crown Ring Beam + Flush Aligned Mint Accent Strip */}
      <mesh geometry={crownBeam}>
        <meshStandardMaterial
          map={metalTex.map}
          normalMap={metalTex.normalMap}
          color="#9BAEC2"
          metalness={0.56}
          roughness={0.32}
        />
      </mesh>
      <mesh geometry={crownLight}>
        <meshBasicMaterial color="#4EF2B8" transparent opacity={0.48} />
      </mesh>
      {/* Smoked Architectural Skylight Louvers */}
      {skylightPanels.map((p, i) => (
        <mesh key={`sky-${i}`} position={p.pos} rotation={[0.72, p.rotY, 0]}>
          <boxGeometry args={[p.width, 0.02, 1.35]} />
          <meshPhysicalMaterial
            color="#88BED4"
            transparent
            opacity={0.14}
            roughness={0.08}
            metalness={0.1}
            clearcoat={1}
          />
        </mesh>
      ))}
    </group>
  );
}

interface TechLabProps {
  projects: ProjectItem[];
}

export function TechLab({ projects }: TechLabProps) {
  const selectProject = useUniverseStore((s) => s.selectProject);
  const focusZone = useUniverseStore((s) => s.focusZone);

  const floorTex = useMemo(() => createLabFloorTextures([5, 5]), []);
  const metalTex = useMemo(() => createBrushedMetalTextures([2, 2]), []);
  const codeCenter = useMemo(() => createCodeScreenTexture("system"), []);
  const codeLeft = useMemo(() => createCodeScreenTexture("shader"), []);
  const codeRight = useMemo(() => createCodeScreenTexture("telemetry"), []);

  const mainMonitorGeo = useMemo(() => createCurvedScreenGeo(1.52, 0.72, 3.2, 24), []);
  const mainShellGeo = useMemo(() => createCurvedShellGeo(1.58, 0.78, 0.042, 3.2, 24), []);
  const sideMonitorGeo = useMemo(() => createCurvedScreenGeo(0.98, 0.62, 2.8, 18), []);
  const sideShellGeo = useMemo(() => createCurvedShellGeo(1.04, 0.67, 0.04, 2.8, 18), []);

  // Elevated curved rear terrace arc geometry + edge light trim
  const { terraceGeo, terraceTrimGeo } = useMemo(() => {
    const startA = -1.16;
    const endA = 1.16;
    const rIn = 4.18;
    const rOut = 5.96;

    const shape = new THREE.Shape();
    // Shape in XY -> rotated -PI/2 around X maps (x, y) -> (x, 0, -y)
    // Angle `a` from +Y axis toward +X maps: sx = sin(a)*r, sy = cos(a)*r -> world z = -0.4 - cos(a)*r
    for (let i = 0; i <= 40; i++) {
      const a = startA + ((endA - startA) * i) / 40;
      const x = Math.sin(a) * rOut;
      const y = Math.cos(a) * rOut;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const a = startA + ((endA - startA) * i) / 40;
      shape.lineTo(Math.sin(a) * rIn, Math.cos(a) * rIn);
    }
    shape.closePath();

    const tGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
    });
    tGeo.rotateX(-Math.PI / 2);

    const trimPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 36; i++) {
      const a = startA + ((endA - startA) * i) / 36;
      trimPts.push(new THREE.Vector3(Math.sin(a) * (rIn - 0.01), 0.25, -Math.cos(a) * (rIn - 0.01)));
    }
    const trim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trimPts), 40, 0.011, 8, false);
    return { terraceGeo: tGeo, terraceTrimGeo: trim };
  }, []);

  useEffect(() => {
    return () => {
      floorTex.map.dispose();
      floorTex.roughnessMap.dispose();
      floorTex.bumpMap.dispose();
      floorTex.normalMap.dispose();
      metalTex.map.dispose();
      metalTex.roughnessMap.dispose();
      metalTex.bumpMap.dispose();
      metalTex.normalMap.dispose();
      codeCenter.dispose();
      codeLeft.dispose();
      codeRight.dispose();
      mainMonitorGeo.dispose();
      mainShellGeo.dispose();
      sideMonitorGeo.dispose();
      sideShellGeo.dispose();
      terraceGeo.dispose();
      terraceTrimGeo.dispose();
    };
  }, [
    floorTex,
    metalTex,
    codeCenter,
    codeLeft,
    codeRight,
    mainMonitorGeo,
    mainShellGeo,
    sideMonitorGeo,
    sideShellGeo,
    terraceGeo,
    terraceTrimGeo,
  ]);

  const featuredSix = useMemo(() => {
    const f = projects.filter((p) => p.featured).slice(0, 6);
    return f.length >= 6 ? f : projects.slice(0, 6);
  }, [projects]);

  // 6 unobstructed elevated project terminals along the rear terrace arc (y = 0.26)
  const terminalPlacements = useMemo(() => {
    const angles = [-0.95, -0.57, -0.19, 0.19, 0.57, 0.95];
    const r = 5.15;
    return angles.map((ang) => ({
      pos: [Math.sin(ang) * r, 0.26, -0.4 - Math.cos(ang) * r] as [number, number, number],
      rot: [0, -ang, 0] as [number, number, number],
    }));
  }, []);

  // Architectural skybridges bridging Main Deck (r=6.35 around [0,0,-0.4]) -> Satellite Pods
  const walkways = useMemo(() => {
    const targets: [number, number, number][] = [
      [9.9, 0, 2.3],
      [8.9, 0, -5.3],
      [-9.3, 0, -5.4],
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
            normalMap={floorTex.normalMap}
            roughnessMap={floorTex.roughnessMap}
            color="#B8C4D2"
            metalness={0.34}
            roughness={0.52}
          />
        </mesh>
        {/* Brushed Titanium Outer Rim Ring */}
        <mesh position={[0, -0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[6.04, 6.40, 72]} />
          <meshStandardMaterial
            map={metalTex.map}
            normalMap={metalTex.normalMap}
            roughnessMap={metalTex.roughnessMap}
            color="#96A8BC"
            metalness={0.8}
            roughness={0.28}
          />
        </mesh>
        {/* Fine Recessed Mint Perimeter Light Channel */}
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.00, 6.035, 72]} />
          <meshBasicMaterial color="#4EF2B8" transparent opacity={0.45} />
        </mesh>
        {/* Aerospace Under-Deck Superstructure */}
        <mesh position={[0, -0.58, 0]}>
          <cylinderGeometry args={[5.75, 3.4, 0.66, 48]} />
          <meshStandardMaterial color="#19222E" metalness={0.78} roughness={0.38} />
        </mesh>

        {/* Elevated Curved Rear Terrace Riser for Unobstructed Project Terminals */}
        <mesh geometry={terraceGeo} receiveShadow castShadow>
          <meshStandardMaterial
            map={metalTex.map}
            normalMap={metalTex.normalMap}
            roughnessMap={metalTex.roughnessMap}
            color="#5C6C80"
            metalness={0.62}
            roughness={0.38}
          />
        </mesh>
        <mesh geometry={terraceTrimGeo}>
          <meshBasicMaterial color="#4EF2B8" transparent opacity={0.55} />
        </mesh>

        {/* Architectural Perimeter Smoked-Glass Balustrades & Titanium Stanchions (clear of skybridges) */}
        {[0.72, 1.02, 2.12, 2.42].map((ang, idx) => {
          const rBal = 6.20;
          const bx = Math.cos(ang) * rBal;
          const bz = Math.sin(ang) * rBal;
          return (
            <group key={`bal-${idx}`} position={[bx, 0, bz]} rotation={[0, -ang + Math.PI / 2, 0]}>
              {/* Brushed titanium stanchions */}
              {[-0.45, 0.45].map((sx, k) => (
                <mesh key={k} position={[sx, 0.19, 0]} castShadow>
                  <cylinderGeometry args={[0.022, 0.026, 0.38, 12]} />
                  <meshStandardMaterial color="#5A6C80" metalness={0.86} roughness={0.24} />
                </mesh>
              ))}
              {/* Low smoked-glass infill panel + top titanium handrail */}
              <mesh position={[0, 0.19, 0]}>
                <boxGeometry args={[0.92, 0.30, 0.022]} />
                <meshPhysicalMaterial
                  color="#9BD8EA"
                  transparent
                  opacity={0.16}
                  roughness={0.08}
                  clearcoat={1}
                />
              </mesh>
              <mesh position={[0, 0.365, 0]} castShadow>
                <boxGeometry args={[0.98, 0.024, 0.042]} />
                <meshStandardMaterial color="#6D7F94" metalness={0.88} roughness={0.22} />
              </mesh>
            </group>
          );
        })}

        {/* Recessed Floor Data/Power Cable Conduits: Hologram Pedestal -> Developer Workstation */}
        {[-0.62, 0.62].map((cx, idx) => (
          <group key={`conduit-${idx}`} position={[cx, 0.006, -0.82]}>
            <mesh receiveShadow>
              <boxGeometry args={[0.072, 0.012, 2.65]} />
              <meshStandardMaterial color="#273240" metalness={0.82} roughness={0.30} />
            </mesh>
            <mesh position={[0, 0.007, 0]}>
              <boxGeometry args={[0.014, 0.004, 2.58]} />
              <meshBasicMaterial color="#4EF2B8" transparent opacity={0.40} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Twin-Rail Aerospace Observatory Canopy Arches */}
      <ObservatoryCanopyArches metalTex={metalTex} />

      {/* Architectural Skybridges */}
      {walkways.map((w, idx) => (
        <group key={idx} position={w.pos} rotation={[0, w.rotY, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[w.len, 0.14, 1.25]} />
            <meshStandardMaterial
              map={metalTex.map}
              normalMap={metalTex.normalMap}
              color="#76889B"
              metalness={0.76}
              roughness={0.32}
            />
          </mesh>
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
                <boxGeometry args={[w.len, 0.014, 0.04]} />
                <meshBasicMaterial color="#4EF2B8" transparent opacity={0.55} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* ═══════════════ HERO DEVELOPER WORKSTATION (z = -2.80) ═══════════════ */}
      <group
        position={[0, 0, -2.80]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 5) return;
          focusZone("projects", true);
        }}
      >
        {/* Executive Beveled Carbon-Slate & Brushed Titanium Desk */}
        <mesh position={[0, 0.79, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.80, 0.068, 1.06]} />
          <meshStandardMaterial
            map={metalTex.map}
            normalMap={metalTex.normalMap}
            roughnessMap={metalTex.roughnessMap}
            color="#58687A"
            metalness={0.62}
            roughness={0.34}
          />
        </mesh>
        {/* Brushed Aluminum Front Bevel Fascia + Ambient Accent Line */}
        <mesh position={[0, 0.79, 0.535]}>
          <boxGeometry args={[3.80, 0.032, 0.014]} />
          <meshStandardMaterial color="#6D7F94" metalness={0.88} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.752, 0.52]}>
          <boxGeometry args={[3.35, 0.01, 0.012]} />
          <meshBasicMaterial color="#4EF2B8" transparent opacity={0.68} />
        </mesh>
        {/* Tapered Wing-Profile Aluminum Legs + Rear Cable Spine */}
        {[-1.66, 1.66].map((lx, i) => (
          <group key={i} position={[lx, 0.39, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.095, 0.76, 0.84]} />
              <meshStandardMaterial color="#3E4E60" metalness={0.85} roughness={0.26} />
            </mesh>
            <mesh position={[0, -0.37, 0]}>
              <boxGeometry args={[0.24, 0.038, 0.96]} />
              <meshStandardMaterial color="#2D3947" metalness={0.88} roughness={0.24} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.56, -0.38]}>
          <boxGeometry args={[2.8, 0.09, 0.08]} />
          <meshStandardMaterial color="#273240" metalness={0.8} roughness={0.32} />
        </mesh>

        {/* Extended Acoustic Desk Mat */}
        <mesh position={[-0.22, 0.827, 0.16]} receiveShadow>
          <boxGeometry args={[1.24, 0.006, 0.48]} />
          <meshStandardMaterial color="#131922" roughness={0.88} metalness={0.05} />
        </mesh>

        {/* Sculpted Mechanical Keyboard + Contoured Mouse */}
        <MechanicalKeyboard position={[-0.28, 0.834, 0.18]} />
        <group position={[0.18, 0.838, 0.19]}>
          <mesh scale={[0.038, 0.023, 0.065]} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial color="#222D3A" roughness={0.36} metalness={0.38} />
          </mesh>
          <mesh position={[0, 0.017, -0.02]}>
            <boxGeometry args={[0.008, 0.008, 0.018]} />
            <meshBasicMaterial color="#4EF2B8" />
          </mesh>
        </group>

        {/* Smartphone / Tablet Stand Dock */}
        <group position={[0.56, 0.86, 0.18]} rotation={[0, -0.35, 0]}>
          <mesh position={[0, -0.025, 0]}>
            <boxGeometry args={[0.12, 0.014, 0.09]} />
            <meshStandardMaterial color="#445468" metalness={0.86} roughness={0.24} />
          </mesh>
          <mesh position={[0, 0.05, -0.01]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[0.10, 0.16, 0.009]} />
            <meshStandardMaterial color="#16202C" metalness={0.78} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.052, -0.004]} rotation={[-0.35, 0, 0]}>
            <planeGeometry args={[0.088, 0.145]} />
            <meshBasicMaterial color="#1D4A48" />
          </mesh>
        </group>

        {/* Studio Reference Speakers flanking monitors */}
        {[-1.56, 1.12].map((sx, idx) => (
          <group
            key={idx}
            position={[sx, 0.94, -0.14]}
            rotation={[0, sx < 0 ? 0.34 : -0.34, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.16, 0.24, 0.18]} />
              <meshStandardMaterial color="#1D2632" metalness={0.45} roughness={0.48} />
            </mesh>
            <mesh position={[0, -0.03, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.052, 0.048, 0.012, 20]} />
              <meshStandardMaterial color="#384758" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.06, 0.092]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
              <meshStandardMaterial color="#4EF2B8" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Sleek Articulated Architect Task Lamp */}
        <group position={[-1.42, 0.83, 0.16]}>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.024, 24]} />
            <meshStandardMaterial color="#3B4B5D" metalness={0.86} roughness={0.24} />
          </mesh>
          <mesh position={[0.04, 0.24, -0.02]} rotation={[0, 0, -0.16]} castShadow>
            <cylinderGeometry args={[0.012, 0.014, 0.48, 12]} />
            <meshStandardMaterial color="#47586B" metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0.20, 0.46, 0.02]} rotation={[0.1, 0, -0.22]}>
            <boxGeometry args={[0.32, 0.022, 0.045]} />
            <meshStandardMaterial color="#334254" metalness={0.86} roughness={0.24} />
          </mesh>
          <mesh position={[0.21, 0.446, 0.02]} rotation={[0.1, 0, -0.22]}>
            <boxGeometry args={[0.26, 0.006, 0.026]} />
            <meshBasicMaterial color="#FFF3DC" />
          </mesh>
        </group>

        {/* Triple Curved Developer Monitors with Matching Curved Rear Shells */}
        <group position={[-0.2, 0.83, -0.26]}>
          {/* Heavy Articulated Monitor Mast + Dual Arms */}
          <mesh position={[0, 0.34, -0.09]} castShadow>
            <cylinderGeometry args={[0.036, 0.046, 0.68, 16]} />
            <meshStandardMaterial color="#3B4B5E" metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.46, -0.05]}>
            <boxGeometry args={[1.45, 0.032, 0.036]} />
            <meshStandardMaterial color="#435468" metalness={0.86} roughness={0.24} />
          </mesh>

          {/* Center Ultrawide */}
          <group position={[0, 0.44, 0.03]}>
            <mesh geometry={mainShellGeo} castShadow>
              <meshStandardMaterial color="#212B38" metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh position={[0, 0, 0.004]} geometry={mainMonitorGeo}>
              <meshStandardMaterial
                map={codeCenter}
                emissiveMap={codeCenter}
                emissive="#ffffff"
                emissiveIntensity={0.76}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
            {/* Slim Webcam / Light Bar */}
            <mesh position={[0, 0.395, 0.015]}>
              <boxGeometry args={[0.14, 0.022, 0.032]} />
              <meshStandardMaterial color="#354354" metalness={0.86} roughness={0.22} />
            </mesh>
          </group>

          {/* Left Curved Monitor */}
          <group position={[-1.22, 0.42, 0.25]} rotation={[0, 0.42, 0]}>
            <mesh geometry={sideShellGeo} castShadow>
              <meshStandardMaterial color="#212B38" metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh position={[0, 0, 0.004]} geometry={sideMonitorGeo}>
              <meshStandardMaterial
                map={codeLeft}
                emissiveMap={codeLeft}
                emissive="#ffffff"
                emissiveIntensity={0.72}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>

          {/* Right Curved Monitor */}
          <group position={[1.22, 0.42, 0.25]} rotation={[0, -0.42, 0]}>
            <mesh geometry={sideShellGeo} castShadow>
              <meshStandardMaterial color="#212B38" metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh position={[0, 0, 0.004]} geometry={sideMonitorGeo}>
              <meshStandardMaterial
                map={codeRight}
                emissiveMap={codeRight}
                emissive="#ffffff"
                emissiveIntensity={0.72}
                roughness={0.16}
                metalness={0.08}
              />
            </mesh>
          </group>
        </group>

        {/* Transparent Tempered-Glass High-Performance PC Tower */}
        <TransparentPCTower position={[1.48, 0.825, -0.02]} />

        {/* Sculpted Ergonomic Studio Chair tucked neatly in front of workstation */}
        <ErgonomicChair position={[-0.22, 0, 0.72]} rotationY={Math.PI - 0.14} accentColor="#4EF2B8" />
      </group>

      {/* ═══════════════ 6 UNOBSTRUCTED ELEVATED PROJECT TERMINALS ═══════════════ */}
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
