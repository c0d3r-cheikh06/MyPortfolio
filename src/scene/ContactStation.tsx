"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Generates a crisp holographic comms screen canvas texture for the Contact Monolith */
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
 * Architectural Holographic Communications Monolith (Front-Left Deck -3.6, 0, 3.2):
 *  - Brushed titanium & glass freestanding comms kiosk (zero clipping arcs!)
 *  - Crisp high-DPI contact channels screen + elevated rotating signal transmitter
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
    beaconRef.current.position.y = 2.02 + Math.sin(t * 2.0) * 0.035;
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
        focusZone("contact", true);
      }}
    >
      {/* Weighted Brushed-Titanium Circular Base */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.56, 0.66, 0.12, 36]} />
        <meshStandardMaterial color="#151E2A" metalness={0.86} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.52, 36]} />
        <meshBasicMaterial color={hovered ? "#ECF3F7" : "#4EF2B8"} transparent opacity={0.75} />
      </mesh>

      {/* Twin Vertical Brushed-Aluminum Support Stanchions */}
      {[-0.36, 0.36].map((x, i) => (
        <mesh key={i} position={[x, 0.92, -0.02]} castShadow>
          <boxGeometry args={[0.055, 1.66, 0.09]} />
          <meshStandardMaterial color="#1E2937" metalness={0.88} roughness={0.24} />
        </mesh>
      ))}
      {/* Top & Bottom Crossbeams */}
      <mesh position={[0, 1.74, -0.02]} castShadow>
        <boxGeometry args={[0.82, 0.05, 0.1]} />
        <meshStandardMaterial color="#233040" metalness={0.88} roughness={0.22} />
      </mesh>

      {/* Frameless Glass Holographic Comms Panel */}
      <mesh position={[0, 1.12, 0.02]} castShadow>
        <boxGeometry args={[0.74, 0.96, 0.028]} />
        <meshStandardMaterial color="#0F1722" metalness={0.78} roughness={0.26} />
      </mesh>
      <mesh position={[0, 1.12, 0.038]}>
        <planeGeometry args={[0.68, 0.88]} />
        <meshStandardMaterial
          map={screenTex}
          emissiveMap={screenTex}
          emissive="#ffffff"
          emissiveIntensity={hovered ? 0.95 : 0.68}
          roughness={0.14}
          metalness={0.08}
        />
      </mesh>

      {/* Clean Elevated Orbital Signal Beacon above Monolith */}
      <group ref={beaconRef} position={[0, 2.02, 0]}>
        <mesh>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial
            color="#4EF2B8"
            emissive="#4EF2B8"
            emissiveIntensity={hovered ? 1.2 : 0.65}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, 0, 0]}>
          <torusGeometry args={[0.21, 0.008, 10, 36]} />
          <meshBasicMaterial color="#9BFFDF" transparent opacity={0.75} />
        </mesh>
      </group>

      {phase === "active" && hovered && (
        <Html position={[0, 2.42, 0]} center distanceFactor={6.5} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded border border-[#4EF2B8]/40 bg-[#070C12]/90 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] backdrop-blur-md">
            <span className="text-[#4EF2B8]">COMMS {"//"}</span> CONTACT STATION
          </div>
        </Html>
      )}
    </group>
  );
}
