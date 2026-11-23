"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  gamingScreenFragmentShader,
  gamingScreenVertexShader,
} from "@/lib/glsl/energyShader";
import { useUniverseStore } from "@/store/useUniverseStore";
import {
  createCurvedScreenGeo,
  createCurvedShellGeo,
  ErgonomicChair,
  MechanicalKeyboard,
} from "../props/LabFurniture";

/** Sculpted Ergonomic Dual-Stick Game Controller */
function GameController({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  useFrame((state) => {
    if (reducedMotion || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 2.0) * 0.01;
    ref.current.rotation.y = Math.sin(t * 0.7) * 0.16;
  });

  return (
    <group ref={ref} position={position} rotation={[-0.36, 0.12, 0]} scale={1.15}>
      <mesh castShadow>
        <boxGeometry args={[0.21, 0.044, 0.11]} />
        <meshStandardMaterial color="#25303E" roughness={0.34} metalness={0.35} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.105, -0.02, 0.045]}
          rotation={[0.25, 0, side * 0.34]}
          castShadow
        >
          <capsuleGeometry args={[0.032, 0.085, 8, 16]} />
          <meshStandardMaterial color="#1A222E" roughness={0.48} metalness={0.25} />
        </mesh>
      ))}
      {[-0.048, 0.048].map((x, idx) => (
        <group key={idx} position={[x, 0.03, 0.015]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.014, 0.018, 16]} />
            <meshStandardMaterial color="#0D1218" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.011, 0]}>
            <cylinderGeometry args={[0.018, 0.016, 0.006, 16]} />
            <meshStandardMaterial color="#384759" roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.078, 0.025, -0.015]}>
        <boxGeometry args={[0.03, 0.008, 0.01]} />
        <meshStandardMaterial color="#3B495B" roughness={0.4} />
      </mesh>
      <mesh position={[-0.078, 0.025, -0.015]}>
        <boxGeometry args={[0.01, 0.008, 0.03]} />
        <meshStandardMaterial color="#3B495B" roughness={0.4} />
      </mesh>
      {[
        [0.078, -0.028, "#4EF2B8"],
        [0.078, -0.002, "#38BDF8"],
        [0.064, -0.015, "#A78BFA"],
        [0.092, -0.015, "#FB7185"],
      ].map(([bx, bz, col], idx) => (
        <mesh key={idx} position={[bx as number, 0.026, bz as number]}>
          <cylinderGeometry args={[0.0065, 0.0065, 0.008, 12]} />
          <meshBasicMaterial color={col as string} />
        </mesh>
      ))}
      <mesh position={[0, 0.024, -0.026]}>
        <boxGeometry args={[0.068, 0.006, 0.036]} />
        <meshStandardMaterial color="#141C26" roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.015, -0.056]}>
        <boxGeometry args={[0.075, 0.008, 0.006]} />
        <meshBasicMaterial color="#38BDF8" />
      </mesh>
    </group>
  );
}

/** Sculpted Over-Ear Gaming Headset on Brushed Aluminum Stand */
function GamingHeadsetStand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.35, 0]}>
      <mesh position={[0, 0.008, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.078, 0.016, 24]} />
        <meshStandardMaterial color="#39485A" metalness={0.86} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.066, 24]} />
        <meshBasicMaterial color="#38BDF8" />
      </mesh>
      <mesh position={[0, 0.14, -0.02]} castShadow>
        <cylinderGeometry args={[0.01, 0.012, 0.26, 12]} />
        <meshStandardMaterial color="#44566A" metalness={0.88} roughness={0.22} />
      </mesh>
      {/* Headset headband */}
      <mesh position={[0, 0.25, 0.01]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.068, 0.012, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#1F2936" roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Earcups */}
      {[-0.068, 0.068].map((ex, i) => (
        <group key={i} position={[ex, 0.20, 0.01]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.026, 20]} />
            <meshStandardMaterial color="#253140" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, ex < 0 ? 0.015 : -0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.025, 0.003, 8, 20]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Gaming Alcove Satellite Pod (x = 8.9, z = -5.3):
 *  - Hexagonal titanium/carbon gaming deck with cyan accent ring
 *  - Acoustic slatted backdrop wall bathed in calibrated architectural cyan/warm bias light
 *  - Pro gaming desk with curved ultrawide + vertical telemetry screens (matching curved shells!)
 *  - Sculpted instanced MechanicalKeyboard, mouse, GameController, GamingHeadsetStand & ErgonomicChair
 */
export function GamingPod() {
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const phase = useUniverseStore((s) => s.phase);
  const [hovered, setHovered] = useState(false);

  const ultrawideGeo = useMemo(() => createCurvedScreenGeo(1.36, 0.58, 2.8, 22), []);
  const ultrawideShellGeo = useMemo(() => createCurvedShellGeo(1.42, 0.63, 0.04, 2.8, 22), []);

  const screenMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gamingScreenVertexShader,
        fragmentShader: gamingScreenFragmentShader,
        uniforms: {
          uTime: { value: 0 },
        },
      }),
    []
  );

  useEffect(() => {
    return () => {
      screenMat.dispose();
      ultrawideGeo.dispose();
      ultrawideShellGeo.dispose();
    };
  }, [screenMat, ultrawideGeo, ultrawideShellGeo]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state) => {
    screenMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group
      name="GamingPod"
      position={[8.9, 0, -5.3]}
      rotation={[0, -2.25, 0]}
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
        selectHobby("gaming");
      }}
    >
      {/* Hexagonal Titanium-Slate Pod Deck */}
      <mesh position={[0, -0.14, 0]} receiveShadow>
        <cylinderGeometry args={[2.45, 2.65, 0.28, 6]} />
        <meshStandardMaterial color="#232E3C" metalness={0.76} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.24, 2.30, 6]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#38BDF8"} transparent opacity={0.72} />
      </mesh>

      {/* Architectural Acoustic Slatted Back Wall + Calibrated Bias Wash Light */}
      <group position={[0, 1.25, -1.28]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, 2.35, 0.12]} />
          <meshStandardMaterial color="#1D2634" metalness={0.45} roughness={0.52} />
        </mesh>
        {Array.from({ length: 13 }, (_, i) => (
          <mesh key={i} position={[-1.2 + i * 0.2, 0, 0.075]}>
            <boxGeometry args={[0.075, 2.15, 0.04]} />
            <meshStandardMaterial color="#2B3848" metalness={0.48} roughness={0.44} />
          </mesh>
        ))}
        <mesh position={[-1.34, 0, 0.07]}>
          <boxGeometry args={[0.025, 2.1, 0.02]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
        <mesh position={[1.34, 0, 0.07]}>
          <boxGeometry args={[0.025, 2.1, 0.02]} />
          <meshBasicMaterial color="#4EF2B8" />
        </mesh>
      </group>

      {/* Calibrated Alcove Wash Light (ensures crisp depth on wall, chair & hardware!) */}
      <pointLight
        position={[0, 2.25, -0.35]}
        color="#9AD8FF"
        intensity={hovered ? 3.2 : 2.3}
        distance={6.2}
        decay={2}
      />

      {/* Pro Gaming Desk */}
      <group position={[0, 0, -0.35]}>
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.35, 0.06, 0.92]} />
          <meshStandardMaterial color="#293545" metalness={0.72} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.78, 0.465]}>
          <boxGeometry args={[2.1, 0.014, 0.012]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
        {[-1.02, 1.02].map((lx, i) => (
          <mesh key={i} position={[lx, 0.38, 0]} castShadow>
            <boxGeometry args={[0.08, 0.76, 0.78]} />
            <meshStandardMaterial color="#374658" metalness={0.84} roughness={0.26} />
          </mesh>
        ))}

        {/* Ultrawide Curved Main Gaming Monitor with Matching Curved Shell */}
        <group position={[-0.14, 1.24, -0.22]}>
          <mesh position={[0, -0.26, -0.05]} castShadow>
            <cylinderGeometry args={[0.032, 0.04, 0.42, 14]} />
            <meshStandardMaterial color="#3E4F63" metalness={0.86} roughness={0.24} />
          </mesh>
          <mesh geometry={ultrawideShellGeo} castShadow>
            <meshStandardMaterial color="#202936" metalness={0.84} roughness={0.24} />
          </mesh>
          <mesh position={[0, 0, 0.004]} geometry={ultrawideGeo} material={screenMat} />
        </group>

        {/* Secondary Vertical Telemetry Screen */}
        <group position={[0.78, 1.25, -0.08]} rotation={[0, -0.45, 0]}>
          <mesh position={[0, -0.24, -0.03]}>
            <cylinderGeometry args={[0.022, 0.028, 0.38, 12]} />
            <meshStandardMaterial color="#3E4F63" metalness={0.86} roughness={0.24} />
          </mesh>
          <mesh position={[0, 0, -0.02]} castShadow>
            <boxGeometry args={[0.42, 0.64, 0.03]} />
            <meshStandardMaterial color="#202936" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh material={screenMat}>
            <planeGeometry args={[0.37, 0.59]} />
          </mesh>
        </group>

        {/* Desk Mat + Real Sculpted Mechanical Keyboard + Gaming Mouse */}
        <mesh position={[-0.15, 0.813, 0.16]} receiveShadow>
          <boxGeometry args={[1.05, 0.005, 0.42]} />
          <meshStandardMaterial color="#111720" roughness={0.9} />
        </mesh>
        <MechanicalKeyboard position={[-0.24, 0.819, 0.18]} accentColor="#38BDF8" />
        <mesh position={[0.16, 0.828, 0.19]} scale={[0.035, 0.022, 0.06]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#253140" roughness={0.35} metalness={0.35} />
        </mesh>

        {/* Sculpted Controller + Illuminated Gaming Headset Stand */}
        <GameController position={[-0.84, 0.89, 0.16]} />
        <GamingHeadsetStand position={[0.68, 0.812, 0.22]} />
      </group>

      {/* Sculpted Ergonomic Gaming Chair */}
      <ErgonomicChair position={[-0.1, 0, 0.72]} rotationY={Math.PI} accentColor="#38BDF8" />

      {phase === "active" && hovered && (
        <Html position={[0, 2.48, -0.4]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#38BDF8]/45 bg-[#070C12]/92 px-3 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md shadow-lg">
            <span className="text-[#38BDF8]">HOBBY //</span> GAMING STATION
          </div>
        </Html>
      )}
    </group>
  );
}
