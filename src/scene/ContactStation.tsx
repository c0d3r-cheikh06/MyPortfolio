"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useUniverseStore } from "@/store/useUniverseStore";

/**
 * Holographic Communications Station positioned on the Front-Left Deck (-3.6, 0, 3.2):
 *  - Sculpted aluminum comms console with tilted glass display
 *  - Rotating holographic signal transmitter beacon + pulsing orbital rings
 *  - Click opens the interactive Contact Station overlay (WhatsApp, Instagram, GitHub, Email slot)
 */
export function ContactStation() {
  const focusZone = useUniverseStore((s) => s.focusZone);
  const phase = useUniverseStore((s) => s.phase);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const [hovered, setHovered] = useState(false);
  const beaconRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, rawDelta) => {
    if (reducedMotion) return;
    const d = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    if (beaconRef.current) {
      beaconRef.current.rotation.y += d * 0.75;
      beaconRef.current.position.y = 1.56 + Math.sin(t * 2.1) * 0.05;
    }
    if (pulseRingRef.current) {
      const p = (t * 0.45) % 1;
      pulseRingRef.current.scale.setScalar(0.5 + p * 1.4);
      (pulseRingRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.55;
    }
  });

  return (
    <group
      name="ContactStation"
      position={[-3.6, 0, 3.2]}
      rotation={[0, 0.75, 0]}
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
        focusZone("contact", true);
      }}
    >
      {/* Brushed Titanium Pedestal Base */}
      <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.58, 0.68, 0.14, 32]} />
        <meshStandardMaterial color="#141C26" metalness={0.86} roughness={0.28} />
      </mesh>
      {/* Sculpted Angled Console Column */}
      <mesh position={[0, 0.58, -0.06]} rotation={[0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.38, 0.96, 0.24]} />
        <meshStandardMaterial color="#1B2532" metalness={0.84} roughness={0.28} />
      </mesh>
      {/* Tilted Holographic Glass Console Deck */}
      <mesh position={[0, 1.04, 0.08]} rotation={[-0.48, 0, 0]} castShadow>
        <boxGeometry args={[0.92, 0.04, 0.48]} />
        <meshPhysicalMaterial
          color="#0F2626"
          emissive="#4EF2B8"
          emissiveIntensity={hovered ? 0.42 : 0.2}
          roughness={0.14}
          metalness={0.35}
          clearcoat={1}
        />
      </mesh>
      {/* Console Rim Light */}
      <mesh position={[0, 1.06, 0.28]} rotation={[-0.48, 0, 0]}>
        <boxGeometry args={[0.84, 0.014, 0.014]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#4EF2B8"} />
      </mesh>

      {/* Floating Holographic Comms Beacon */}
      <group ref={beaconRef} position={[0, 1.56, 0]}>
        <mesh>
          <icosahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial
            color="#4EF2B8"
            emissive="#4EF2B8"
            emissiveIntensity={hovered ? 1.4 : 0.8}
            wireframe
          />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.32, 0.01, 10, 40]} />
          <meshBasicMaterial color="#9BFFDF" transparent opacity={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[0.42, 0.008, 10, 40]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Expanding Signal Pulse Ring */}
      <mesh ref={pulseRingRef} position={[0, 1.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.41, 36]} />
        <meshBasicMaterial
          color="#4EF2B8"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {phase === "active" && hovered && (
        <Html position={[0, 2.22, 0]} center distanceFactor={6.5} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#4EF2B8]">COMMS //</span> CONTACT STATION
          </div>
        </Html>
      )}
    </group>
  );
}
