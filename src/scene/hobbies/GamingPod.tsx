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

/** Sculpted Ergonomic Dual-Stick Game Controller on a floating acrylic display stand */
function GameController({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  useFrame((state) => {
    if (reducedMotion || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 2.0) * 0.012;
    ref.current.rotation.y = Math.sin(t * 0.7) * 0.18;
  });

  return (
    <group ref={ref} position={position} rotation={[-0.38, 0, 0]} scale={1.15}>
      {/* Central sculpted controller chassis */}
      <mesh castShadow>
        <boxGeometry args={[0.21, 0.044, 0.11]} />
        <meshStandardMaterial color="#18202B" roughness={0.34} metalness={0.35} />
      </mesh>
      {/* Ergonomic Left & Right Grips */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.105, -0.02, 0.045]}
          rotation={[0.25, 0, side * 0.34]}
          castShadow
        >
          <capsuleGeometry args={[0.032, 0.085, 8, 16]} />
          <meshStandardMaterial color="#121822" roughness={0.48} metalness={0.25} />
        </mesh>
      ))}
      {/* Twin Analog Thumbsticks */}
      {[-0.048, 0.048].map((x, idx) => (
        <group key={idx} position={[x, 0.03, 0.015]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.014, 0.018, 16]} />
            <meshStandardMaterial color="#0D1218" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.011, 0]}>
            <cylinderGeometry args={[0.018, 0.016, 0.006, 16]} />
            <meshStandardMaterial color="#263242" roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {/* D-pad */}
      <mesh position={[-0.078, 0.025, -0.015]}>
        <boxGeometry args={[0.03, 0.008, 0.01]} />
        <meshStandardMaterial color="#2A3646" roughness={0.4} />
      </mesh>
      <mesh position={[-0.078, 0.025, -0.015]}>
        <boxGeometry args={[0.01, 0.008, 0.03]} />
        <meshStandardMaterial color="#2A3646" roughness={0.4} />
      </mesh>
      {/* 4 Illuminated Face Buttons */}
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
      {/* Signature Front Touchpad & Mint Lightbar */}
      <mesh position={[0, 0.024, -0.026]}>
        <boxGeometry args={[0.068, 0.006, 0.036]} />
        <meshStandardMaterial color="#0E141C" roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.015, -0.056]}>
        <boxGeometry args={[0.075, 0.008, 0.006]} />
        <meshBasicMaterial color="#38BDF8" />
      </mesh>
    </group>
  );
}

/**
 * Gaming Alcove Satellite Pod (x = 6.8, z = -4.2):
 *  - Hexagonal carbon/slate gaming deck with refined cyan/mint ambient edge strips
 *  - Acoustic ribbed backdrop wall with subtle ambient bias lighting
 *  - Pro gaming desk with dual curved monitors running live GLSL abstract gaming shader
 *  - Mechanical keyboard, gaming mouse, sculpted dual-stick controller & headset stand
 */
export function GamingPod() {
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const phase = useUniverseStore((s) => s.phase);
  const [hovered, setHovered] = useState(false);

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
    return () => screenMat.dispose();
  }, [screenMat]);

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
      position={[6.8, 0, -4.2]}
      rotation={[0, -2.18, 0]}
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
        selectHobby("gaming");
      }}
    >
      {/* Hexagonal Carbon-Graphite Pod Deck */}
      <mesh position={[0, -0.14, 0]} receiveShadow>
        <cylinderGeometry args={[2.45, 2.65, 0.28, 6]} />
        <meshStandardMaterial color="#101620" metalness={0.76} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.24, 2.30, 6]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#38BDF8"} transparent opacity={0.75} />
      </mesh>

      {/* Architectural Acoustic Slatted Back Wall with Bias Glow */}
      <group position={[0, 1.25, -1.28]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.8, 2.35, 0.12]} />
          <meshStandardMaterial color="#0D131C" metalness={0.5} roughness={0.55} />
        </mesh>
        {/* Vertical Acoustic Ribs */}
        {Array.from({ length: 13 }, (_, i) => (
          <mesh key={i} position={[-1.2 + i * 0.2, 0, 0.075]}>
            <boxGeometry args={[0.075, 2.15, 0.04]} />
            <meshStandardMaterial color="#182230" metalness={0.45} roughness={0.5} />
          </mesh>
        ))}
        {/* Subtle Cyan / Mint Bias Light Strips */}
        <mesh position={[-1.34, 0, 0.07]}>
          <boxGeometry args={[0.025, 2.1, 0.02]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
        <mesh position={[1.34, 0, 0.07]}>
          <boxGeometry args={[0.025, 2.1, 0.02]} />
          <meshBasicMaterial color="#4EF2B8" />
        </mesh>
      </group>

      {/* Pro Gaming Desk */}
      <group position={[0, 0, -0.35]}>
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.35, 0.06, 0.92]} />
          <meshStandardMaterial color="#141B25" metalness={0.68} roughness={0.32} />
        </mesh>
        {/* Subtle RGB/Cyan Front Edge Strip */}
        <mesh position={[0, 0.78, 0.465]}>
          <boxGeometry args={[2.1, 0.015, 0.012]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
        {/* Sculpted Z-frame Gaming Desk Legs */}
        {[-1.02, 1.02].map((lx, i) => (
          <mesh key={i} position={[lx, 0.38, 0]} castShadow>
            <boxGeometry args={[0.08, 0.76, 0.78]} />
            <meshStandardMaterial color="#1A2431" metalness={0.84} roughness={0.28} />
          </mesh>
        ))}

        {/* Ultrawide Main Gaming Screen + Secondary Angled Screen */}
        <group position={[-0.14, 1.24, -0.22]}>
          <mesh position={[0, -0.26, -0.05]} castShadow>
            <cylinderGeometry args={[0.032, 0.04, 0.42, 14]} />
            <meshStandardMaterial color="#1C2532" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.025]} castShadow>
            <boxGeometry args={[1.38, 0.62, 0.035]} />
            <meshStandardMaterial color="#101620" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh material={screenMat}>
            <planeGeometry args={[1.32, 0.56]} />
          </mesh>
        </group>

        {/* Secondary Vertical Telemetry Screen */}
        <group position={[0.78, 1.25, -0.08]} rotation={[0, -0.45, 0]}>
          <mesh position={[0, 0, -0.02]} castShadow>
            <boxGeometry args={[0.42, 0.64, 0.03]} />
            <meshStandardMaterial color="#101620" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh material={screenMat}>
            <planeGeometry args={[0.37, 0.59]} />
          </mesh>
        </group>

        {/* Compact Gaming Keyboard, Mouse & Extended Mousepad */}
        <mesh position={[-0.15, 0.815, 0.16]} receiveShadow>
          <boxGeometry args={[1.05, 0.005, 0.42]} />
          <meshStandardMaterial color="#0A0F15" roughness={0.9} />
        </mesh>
        <group position={[-0.24, 0.826, 0.18]} rotation={[0.08, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.02, 0.14]} />
            <meshStandardMaterial color="#151D27" metalness={0.75} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.012, 0]}>
            <boxGeometry args={[0.33, 0.005, 0.115]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.65} />
          </mesh>
        </group>
        <mesh position={[0.16, 0.83, 0.19]} scale={[0.035, 0.022, 0.06]} castShadow>
          <sphereGeometry args={[1, 14, 12]} />
          <meshStandardMaterial color="#16202C" roughness={0.35} metalness={0.35} />
        </mesh>

        {/* Sculpted Dual-Stick Controller Showcase */}
        <GameController position={[-0.78, 0.90, 0.16]} />
      </group>

      {/* Modern Ergonomic Gaming Chair facing the desk */}
      <group position={[-0.1, 0, 0.72]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[0.52, 0.08, 0.48]} />
          <meshStandardMaterial color="#131922" roughness={0.65} metalness={0.18} />
        </mesh>
        <mesh position={[0, 0.88, -0.22]} rotation={[-0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.48, 0.78, 0.09]} />
          <meshStandardMaterial color="#161E2A" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.42, 12]} />
          <meshStandardMaterial color="#253140" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.28, 0.30, 0.04, 5]} />
          <meshStandardMaterial color="#1D2632" metalness={0.82} roughness={0.28} />
        </mesh>
      </group>

      {phase === "active" && hovered && (
        <Html position={[0, 2.48, -0.4]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#38BDF8]/45 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#38BDF8]">HOBBY //</span> GAMING STATION
          </div>
        </Html>
      )}
    </group>
  );
}
