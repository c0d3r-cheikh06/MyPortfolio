"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/** Curved cylindrical-arc screen geometry facing +Z */
export function createCurvedScreenGeo(
  width: number,
  height: number,
  radius: number,
  segments = 24
) {
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

/**
 * Solid curved beveled rear housing matching `createCurvedScreenGeo` curvature
 * so curved displays never separate from flat boxy rectangles.
 */
export function createCurvedShellGeo(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments = 24
) {
  const cols = segments + 1;
  const halfH = height * 0.5;
  const positions: number[] = [];
  const indices: number[] = [];

  // Ring 0..cols-1: front-top, front-bottom; Ring cols..2*cols-1: back-top, back-bottom
  const frontTopStart = 0;
  const frontBotStart = cols;
  const backTopStart = cols * 2;
  const backBotStart = cols * 3;

  const pushArc = (y: number, zOff: number) => {
    for (let i = 0; i <= segments; i++) {
      const u = i / segments - 0.5;
      const angle = (u * width) / radius;
      const sx = Math.sin(angle) * radius;
      const sz = (1 - Math.cos(angle)) * radius + zOff;
      positions.push(sx, y, sz);
    }
  };

  pushArc(halfH, 0);
  pushArc(-halfH, 0);
  pushArc(halfH - 0.008, -depth);
  pushArc(-halfH + 0.008, -depth);

  for (let i = 0; i < segments; i++) {
    const ft0 = frontTopStart + i;
    const ft1 = ft0 + 1;
    const fb0 = frontBotStart + i;
    const fb1 = fb0 + 1;
    const bt0 = backTopStart + i;
    const bt1 = bt0 + 1;
    const bb0 = backBotStart + i;
    const bb1 = bb0 + 1;

    // Front face (+Z)
    indices.push(ft0, fb0, fb1, ft0, fb1, ft1);
    // Back face (-Z)
    indices.push(bt1, bb1, bb0, bt1, bb0, bt0);
    // Top bevel
    indices.push(bt0, ft0, ft1, bt0, ft1, bt1);
    // Bottom bevel
    indices.push(fb0, bb0, bb1, fb0, bb1, fb1);
  }

  // Left & Right side caps
  indices.push(
    backTopStart,
    backBotStart,
    frontBotStart,
    backTopStart,
    frontBotStart,
    frontTopStart
  );
  indices.push(
    frontTopStart + segments,
    frontBotStart + segments,
    backBotStart + segments,
    frontTopStart + segments,
    backBotStart + segments,
    backTopStart + segments
  );

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  const nonIndexed = geo.toNonIndexed();
  geo.dispose();
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}

/** Mechanical 65% keyboard with instanced sculpted PBT keycaps & accent keys */
export function MechanicalKeyboard({
  position,
  accentColor = "#4EF2B8",
}: {
  position: [number, number, number];
  accentColor?: string;
}) {
  const keysRef = useRef<THREE.InstancedMesh>(null);
  const keySpecs = useMemo(() => {
    const list: { x: number; z: number; sx: number; accent: boolean }[] = [];
    const rows = [14, 14, 13, 12, 7];
    rows.forEach((cols, r) => {
      const z = -0.056 + r * 0.027;
      if (r === 4) {
        const spec: [number, number, boolean][] = [
          [-0.175, 0.028, false],
          [-0.142, 0.028, false],
          [-0.108, 0.028, false],
          [0.0, 0.145, false],
          [0.105, 0.028, false],
          [0.138, 0.028, false],
          [0.172, 0.028, true],
        ];
        spec.forEach(([x, sx, accent]) => list.push({ x, z, sx, accent }));
      } else {
        const w = 0.37;
        const step = w / cols;
        for (let c = 0; c < cols; c++) {
          const isEsc = r === 0 && c === 0;
          const isEnter = r === 2 && c === cols - 1;
          list.push({
            x: -w / 2 + step * (c + 0.5),
            z,
            sx: step * 0.84,
            accent: isEsc || isEnter,
          });
        }
      }
    });
    return list;
  }, []);

  useEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const baseCol = new THREE.Color("#202A37");
    const accCol = new THREE.Color(accentColor);
    keySpecs.forEach((k, i) => {
      dummy.position.set(k.x, 0.017, k.z);
      dummy.scale.set(k.sx, 0.011, 0.021);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, k.accent ? accCol : baseCol);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [keySpecs, accentColor]);

  return (
    <group position={position} rotation={[0.07, 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.022, 0.16]} />
        <meshStandardMaterial color="#344254" metalness={0.82} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.011, 0]}>
        <boxGeometry args={[0.39, 0.002, 0.138]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.38} />
      </mesh>
      <instancedMesh ref={keysRef} args={[undefined, undefined, keySpecs.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.14} />
      </instancedMesh>
    </group>
  );
}

function makeRoundedRectShape(w: number, h: number, r: number) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const cr = Math.min(r, hw * 0.45, hh * 0.45);
  const s = new THREE.Shape();
  s.moveTo(-hw + cr, -hh);
  s.lineTo(hw - cr, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  s.lineTo(hw, hh - cr);
  s.quadraticCurveTo(hw, hh, hw - cr, hh);
  s.lineTo(-hw + cr, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  s.lineTo(-hw, -hh + cr);
  s.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
  return s;
}

/** Sculpted ergonomic studio / gaming chair with beveled cushions & 5-spoke aluminum caster base */
export function ErgonomicChair({
  position,
  rotationY = 0,
  accentColor = "#4EF2B8",
}: {
  position: [number, number, number];
  rotationY?: number;
  accentColor?: string;
}) {
  const { seatGeo, backShellGeo, backPadGeo, headGeo } = useMemo(() => {
    const seatShape = makeRoundedRectShape(0.46, 0.44, 0.08);
    const sGeo = new THREE.ExtrudeGeometry(seatShape, {
      depth: 0.042,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.016,
      bevelSegments: 4,
    });
    sGeo.center();

    const backShape = new THREE.Shape();
    backShape.moveTo(-0.18, -0.26);
    backShape.lineTo(0.18, -0.26);
    backShape.quadraticCurveTo(0.22, -0.25, 0.21, -0.10);
    backShape.lineTo(0.17, 0.22);
    backShape.quadraticCurveTo(0.15, 0.27, 0.0, 0.27);
    backShape.quadraticCurveTo(-0.15, 0.27, -0.17, 0.22);
    backShape.lineTo(-0.21, -0.10);
    backShape.quadraticCurveTo(-0.22, -0.25, -0.18, -0.26);

    const bShellGeo = new THREE.ExtrudeGeometry(backShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.014,
      bevelSegments: 4,
    });
    bShellGeo.center();

    const padShape = makeRoundedRectShape(0.35, 0.47, 0.07);
    const bPadGeo = new THREE.ExtrudeGeometry(padShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
    });
    bPadGeo.center();

    const hShape = makeRoundedRectShape(0.24, 0.11, 0.045);
    const hGeo = new THREE.ExtrudeGeometry(hShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.014,
      bevelSegments: 4,
    });
    hGeo.center();

    return { seatGeo: sGeo, backShellGeo: bShellGeo, backPadGeo: bPadGeo, headGeo: hGeo };
  }, []);

  useEffect(() => {
    return () => {
      seatGeo.dispose();
      backShellGeo.dispose();
      backPadGeo.dispose();
      headGeo.dispose();
    };
  }, [seatGeo, backShellGeo, backPadGeo, headGeo]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 5-Spoke Brushed Aluminum Star Base + Casters */}
      <mesh position={[0, 0.085, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.052, 0.04, 18]} />
        <meshStandardMaterial color="#46566A" metalness={0.86} roughness={0.24} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const ang = (i / 5) * Math.PI * 2;
        const cx = Math.cos(ang);
        const cz = Math.sin(ang);
        return (
          <group key={i}>
            <mesh
              position={[cx * 0.165, 0.068, cz * 0.165]}
              rotation={[0, -ang, 0.09]}
              castShadow
            >
              <boxGeometry args={[0.31, 0.024, 0.034]} />
              <meshStandardMaterial color="#48596D" metalness={0.86} roughness={0.24} />
            </mesh>
            <mesh position={[cx * 0.30, 0.028, cz * 0.30]} rotation={[0, -ang, Math.PI / 2]}>
              <cylinderGeometry args={[0.026, 0.026, 0.024, 16]} />
              <meshStandardMaterial color="#18202B" roughness={0.62} metalness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Pneumatic Gas-Lift Column */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.032, 0.36, 18]} />
        <meshStandardMaterial color="#374556" metalness={0.88} roughness={0.22} />
      </mesh>

      {/* Seat Mechanism Plate & Beveled Ergonomic Seat Cushion */}
      <mesh position={[0, 0.45, -0.02]} castShadow>
        <boxGeometry args={[0.32, 0.036, 0.30]} />
        <meshStandardMaterial color="#253140" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.495, 0.01]} rotation={[-Math.PI / 2, 0, 0]} geometry={seatGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#1C2430" roughness={0.72} metalness={0.12} />
      </mesh>
      {/* Contoured Side Seat Bolsters */}
      {[-0.242, 0.242].map((sx, idx) => (
        <mesh
          key={idx}
          position={[sx, 0.515, 0.015]}
          rotation={[Math.PI / 2, 0, sx < 0 ? 0.22 : -0.22]}
          castShadow
        >
          <capsuleGeometry args={[0.028, 0.34, 6, 12]} />
          <meshStandardMaterial color="#243040" roughness={0.62} metalness={0.18} />
        </mesh>
      ))}

      {/* Sculpted Tubular Armrests */}
      {[-0.285, 0.285].map((ax, idx) => (
        <group key={idx} position={[ax, 0.57, 0.02]}>
          <mesh position={[0, -0.045, -0.02]} castShadow>
            <cylinderGeometry args={[0.016, 0.02, 0.14, 12]} />
            <meshStandardMaterial color="#405062" metalness={0.85} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0.032, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.022, 0.20, 6, 12]} />
            <meshStandardMaterial color="#19212C" roughness={0.68} metalness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Articulated Rear Spine + Beveled Tapered Backrest + Lumbar + Headrest */}
      <group position={[0, 0.52, -0.21]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, 0.28, -0.032]} castShadow>
          <boxGeometry args={[0.072, 0.54, 0.032]} />
          <meshStandardMaterial color="#445568" metalness={0.86} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.36, 0.005]} geometry={backShellGeo} castShadow>
          <meshStandardMaterial color="#253140" metalness={0.55} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.36, 0.034]} geometry={backPadGeo}>
          <meshStandardMaterial color="#18212C" roughness={0.82} metalness={0.08} />
        </mesh>
        {/* Contoured Lumbar Pad */}
        <mesh position={[0, 0.19, 0.056]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.034, 0.27, 6, 14]} />
          <meshStandardMaterial color="#202B3A" roughness={0.7} metalness={0.15} />
        </mesh>
        {/* Subtle Signature Accent Trim Strip */}
        <mesh position={[0, 0.57, 0.044]}>
          <boxGeometry args={[0.16, 0.01, 0.018]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
        {/* Sculpted Beveled Headrest */}
        <mesh position={[0, 0.72, 0.03]} rotation={[0.14, 0, 0]} geometry={headGeo} castShadow>
          <meshStandardMaterial color="#1D2735" roughness={0.68} metalness={0.16} />
        </mesh>
      </group>
    </group>
  );
}
