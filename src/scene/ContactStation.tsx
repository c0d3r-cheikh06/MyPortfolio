"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Generates a crisp holographic comms screen canvas texture for the Contact Console */
function createCommsScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#060B11";
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = "rgba(78, 242, 184, 0.25)";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 604);

  ctx.fillStyle = "#4EF2B8";
  ctx.font = "600 18px monospace";
  ctx.fillText("COMMS // UPLINK ACTIVE", 40, 68);

  ctx.fillStyle = "#ECF3F7";
  ctx.font = "700 36px sans-serif";
  ctx.fillText("CONTACT STATION", 40, 122);

  ctx.fillStyle = "#9FB0BE";
  ctx.font = "500 18px monospace";
  ctx.fillText("CHEIKH THIAM · C0D3R-CHEIKH06", 40, 158);

  const channels = [
    ["WHATSAPP", "+221 77 535 44 23", "#4EF2B8"],
    ["GITHUB", "github.com/c0d3r-cheikh06", "#ECF3F7"],
    ["INSTAGRAM", "@_xtypx01_", "#38BDF8"],
    ["EMAIL SLOT", "CONFIGURABLE CHANNEL", "#9FB0BE"],
  ];
  channels.forEach(([title, val, col], idx) => {
    const y = 212 + idx * 86;
    ctx.fillStyle = "rgba(18, 28, 40, 0.88)";
    ctx.fillRect(40, y, 432, 68);
    ctx.fillStyle = col;
    ctx.fillRect(40, y, 4, 68);
    ctx.font = "600 15px monospace";
    ctx.fillText(title, 60, y + 27);
    ctx.fillStyle = "#ECF3F7";
    ctx.font = "500 19px monospace";
    ctx.fillText(val, 60, y + 52);
  });

  ctx.fillStyle = "#4EF2B8";
  ctx.font = "600 15px monospace";
  ctx.fillText("[ CLICK TO OPEN CHANNELS ]", 118, 592);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Architectural Cantilevered Glass & Titanium Comms Console (Front-Left Deck -3.6, 0, 3.2):
 *  - Tiered circular brushed-titanium pedestal + angled sculptural rear spine
 *  - Tilted beveled glass communications panel + cantilevered touch-console shelf
 *  - Precision orbital transceiver beacon rotating above the crown
 */
export function ContactStation() {
  const focusZone = useUniverseStore((s) => s.focusZone);
  const phase = useUniverseStore((s) => s.phase);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const [hovered, setHovered] = useState(false);
  const beaconRef = useRef<THREE.Group>(null);
  const screenTex = useMemo(() => createCommsScreenTexture(), []);

  useEffect(() => {
    return () => screenTex.dispose();
  }, [screenTex]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, rawDelta) => {
    if (reducedMotion || !beaconRef.current) return;
    const d = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    beaconRef.current.rotation.y += d * 0.7;
    beaconRef.current.position.y = 2.04 + Math.sin(t * 2.0) * 0.03;
  });

  return (
    <group
      name="ContactStation"
      position={[-3.6, 0, 3.2]}
      rotation={[0, 0.78, 0]}
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
        focusZone("contact", true);
      }}
    >
      {/* Weighted Tiered Brushed-Titanium Circular Base */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.58, 0.68, 0.12, 36]} />
        <meshStandardMaterial color="#2B3746" metalness={0.84} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.42, 0.50, 0.04, 36]} />
        <meshStandardMaterial color="#3B4B5E" metalness={0.86} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.158, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.475, 36]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#4EF2B8"} transparent opacity={0.75} />
      </mesh>

      {/* Sculpted Cantilevered Rear Spine & Side Stanchions (cleanly behind glass console!) */}
      <mesh position={[0, 0.86, -0.15]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.14, 1.56, 0.09]} />
        <meshStandardMaterial color="#364658" metalness={0.86} roughness={0.26} />
      </mesh>
      {[-0.41, 0.41].map((x, i) => (
        <mesh key={i} position={[x, 1.18, -0.05]} rotation={[-0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.045, 1.05, 0.065]} />
          <meshStandardMaterial color="#47596E" metalness={0.88} roughness={0.22} />
        </mesh>
      ))}

      {/* Angled Holographic Touch-Console Deck Shelf */}
      <group position={[0, 0.72, 0.10]} rotation={[-0.45, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.68, 0.036, 0.28]} />
          <meshStandardMaterial color="#344355" metalness={0.84} roughness={0.26} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.54, 0.008, 0.16]} />
          <meshPhysicalMaterial
            color="#0B2222"
            emissive="#4EF2B8"
            emissiveIntensity={0.42}
            roughness={0.1}
            clearcoat={1}
          />
        </mesh>
      </group>

      {/* Tilted Bevel-Framed Glass Communications Panel */}
      <group position={[0, 1.24, -0.02]} rotation={[-0.12, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.78, 0.98, 0.034]} />
          <meshStandardMaterial color="#253242" metalness={0.86} roughness={0.24} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.70, 0.90]} />
          <meshStandardMaterial
            map={screenTex}
            emissiveMap={screenTex}
            emissive="#ffffff"
            emissiveIntensity={hovered ? 0.92 : 0.68}
            roughness={0.14}
            metalness={0.08}
          />
        </mesh>
        {/* Top Arch Header Trim */}
        <mesh position={[0, 0.51, 0]}>
          <boxGeometry args={[0.84, 0.036, 0.05]} />
          <meshStandardMaterial color="#425368" metalness={0.88} roughness={0.22} />
        </mesh>
      </group>

      {/* Precision Phased-Array Orbital Transceiver Beacon */}
      <group ref={beaconRef} position={[0, 2.04, -0.04]}>
        <mesh>
          <octahedronGeometry args={[0.095, 0]} />
          <meshStandardMaterial
            color="#4EF2B8"
            emissive="#4EF2B8"
            emissiveIntensity={hovered ? 1.15 : 0.65}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, 0, 0]}>
          <torusGeometry args={[0.19, 0.008, 10, 36]} />
          <meshStandardMaterial
            color="#8ADCC4"
            emissive="#4EF2B8"
            emissiveIntensity={0.45}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 3, 0, Math.PI / 4]}>
          <torusGeometry args={[0.24, 0.005, 8, 36]} />
          <meshBasicMaterial color="#9BFFDF" transparent opacity={0.58} />
        </mesh>
      </group>

      {phase === "active" && hovered && (
        <Html position={[0, 2.40, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#4EF2B8]/40 bg-[#070C12]/92 px-3 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md shadow-lg">
            <span className="text-[#4EF2B8]">COMMS {"//"}</span> CONTACT STATION
          </div>
        </Html>
      )}
    </group>
  );
}
