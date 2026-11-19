"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import {
  skyDomeFragmentShader,
  skyDomeVertexShader,
  starfieldFragmentShader,
  starfieldVertexShader,
} from "@/lib/glsl/skyShader";
import { createMoonTextures } from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Deterministic pseudo-random helper */
function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 3D constellation star chains placed in the night hemisphere */
const CONSTELLATIONS: [number, number, number][][] = [
  // Orion-inspired celestial figure
  [
    [-38, 42, -72],
    [-29, 34, -76],
    [-25, 33, -78],
    [-21, 32, -79],
    [-16, 44, -74],
    [-25, 33, -78],
    [-32, 22, -77],
    [-19, 21, -78],
  ],
  // Cygnus / Cross constellation
  [
    [34, 48, -68],
    [40, 38, -70],
    [46, 28, -72],
    [40, 38, -70],
    [29, 34, -74],
    [52, 41, -66],
  ],
  // Cassiopeia W-chain
  [
    [-62, 36, -34],
    [-55, 42, -38],
    [-48, 37, -41],
    [-42, 44, -44],
    [-35, 38, -46],
  ],
];

interface ShootingStarState {
  active: boolean;
  progress: number;
  start: THREE.Vector3;
  dir: THREE.Vector3;
  cooldown: number;
}

export function SkyUniverse() {
  const theme = useUniverseStore((s) => s.theme);
  const quality = useUniverseStore((s) => s.quality);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const setDayFactor = useUniverseStore((s) => s.setDayFactor);
  const { gl } = useThree();

  const dayRef = useRef({ value: theme === "day" ? 1 : 0 });
  const sunGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const cloudsGroupRef = useRef<THREE.Group>(null);
  const constellationsRef = useRef<THREE.Group>(null);
  const meteorRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);

  const meteorState = useRef<ShootingStarState>({
    active: false,
    progress: 0,
    start: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    cooldown: 3.5,
  });

  // Smooth cinematic Day <-> Night transition via GSAP
  useEffect(() => {
    const target = theme === "day" ? 1 : 0;
    if (reducedMotion) {
      dayRef.current.value = target;
      setDayFactor(target);
      return;
    }
    const tween = gsap.to(dayRef.current, {
      value: target,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: () => {
        setDayFactor(dayRef.current.value);
      },
    });
    return () => {
      tween.kill();
    };
  }, [theme, reducedMotion, setDayFactor]);

  // Sky Dome shader material
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyDomeVertexShader,
        fragmentShader: skyDomeFragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uDayFactor: { value: theme === "day" ? 1 : 0 },
          uTime: { value: 0 },
          uSunDir: { value: new THREE.Vector3(0.55, 0.45, -0.7).normalize() },
          uMoonDir: { value: new THREE.Vector3(-0.48, 0.42, -0.77).normalize() },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Detailed cratered Moon textures (disposed cleanly on unmount)
  const moonTextures = useMemo(() => createMoonTextures(), []);

  // Multi-layer Starfield geometry + custom scintillation shader
  const starCount = quality === "low" ? 1100 : quality === "medium" ? 2000 : 3000;
  const { starGeo, starMat } = useMemo(() => {
    const rand = seededRand(90210);
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color("#EBF4FF"),
      new THREE.Color("#C7E2FF"),
      new THREE.Color("#FFF4DC"),
      new THREE.Color("#9EF7DB"),
      new THREE.Color("#FFFFFF"),
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute across upper + horizon celestial sphere at varying depth layers
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(Math.max(-0.22, 1 - v * 1.18));
      const r = 82 + rand() * 44;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = rand() < 0.08 ? 2.4 + rand() * 2.2 : 0.8 + rand() * 1.3;
      phases[i] = rand();
      const c = palette[Math.floor(rand() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: starfieldVertexShader,
      fragmentShader: starfieldFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      },
    });
    return { starGeo: geo, starMat: mat };
  }, [starCount, gl]);

  // Constellation line geometries
  const constellationLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#7CECD0",
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return CONSTELLATIONS.map((pts) => {
      const geo = new THREE.BufferGeometry().setFromPoints(
        pts.map((p) => new THREE.Vector3(...p))
      );
      return new THREE.Line(geo, mat);
    });
  }, []);

  // Layered volumetric-style 3D cloud clusters (instanced puffs for low draw calls!)
  const cloudClusterCount = quality === "low" ? 12 : 24;
  const cloudClusters = useMemo(() => {
    const rand = seededRand(55123);
    const list: {
      angle: number;
      radius: number;
      y: number;
      speed: number;
      scale: number;
      puffs: { pos: [number, number, number]; s: [number, number, number] }[];
    }[] = [];

    for (let i = 0; i < cloudClusterCount; i++) {
      const angle = (i / cloudClusterCount) * Math.PI * 2 + (rand() - 0.5) * 0.25;
      const isHigh = i % 3 === 0;
      const radius = isHigh ? 38 + rand() * 34 : 26 + rand() * 32;
      const y = isHigh ? 14 + rand() * 14 : -5.5 - rand() * 5.5;
      const puffCount = 4 + Math.floor(rand() * 3);
      const puffs = Array.from({ length: puffCount }, (_, k) => ({
        pos: [
          (k - puffCount / 2) * (1.8 + rand() * 1.2),
          (rand() - 0.35) * 1.1,
          (rand() - 0.5) * 2.1,
        ] as [number, number, number],
        s: [
          2.6 + rand() * 2.4,
          1.2 + rand() * 1.0,
          2.0 + rand() * 1.8,
        ] as [number, number, number],
      }));
      list.push({
        angle,
        radius,
        y,
        speed: (0.004 + rand() * 0.008) * (isHigh ? 1.4 : 0.7),
        scale: isHigh ? 1.05 : 1.55,
        puffs,
      });
    }
    return list;
  }, [cloudClusterCount]);

  const cloudMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#25374c"),
        roughness: 0.96,
        metalness: 0.0,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    []
  );

  // Subtle ambient energy dust motes drifting around the laboratory
  const dustGeo = useMemo(() => {
    const rand = seededRand(7741);
    const n = quality === "low" ? 120 : 280;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 24;
      pos[i * 3 + 1] = 0.2 + rand() * 7.5;
      pos[i * 3 + 2] = (rand() - 0.5) * 22;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [quality]);

  // Clean GPU disposal on unmount
  useEffect(() => {
    return () => {
      skyMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      moonTextures.map.dispose();
      moonTextures.bumpMap.dispose();
      cloudMat.dispose();
      dustGeo.dispose();
      constellationLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
    };
  }, [skyMat, starGeo, starMat, moonTextures, cloudMat, dustGeo, constellationLines]);

  const tmpColorA = useMemo(() => new THREE.Color("#1f3045"), []);
  const tmpColorB = useMemo(() => new THREE.Color("#f0f6fc"), []);
  const tmpEmissiveA = useMemo(() => new THREE.Color("#0e1e30"), []);
  const tmpEmissiveB = useMemo(() => new THREE.Color("#a8c8e8"), []);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const d = dayRef.current.value;

    // Celestial arc positions: Sun rises high as d -> 1, Moon descends below horizon
    const sunElev = THREE.MathUtils.lerp(-0.22, 0.54, d);
    const moonElev = THREE.MathUtils.lerp(0.46, -0.28, d);
    const sunDir = new THREE.Vector3(0.56, sunElev, -0.72).normalize();
    const moonDir = new THREE.Vector3(-0.46, moonElev, -0.78).normalize();

    skyMat.uniforms.uDayFactor.value = d;
    skyMat.uniforms.uTime.value = t;
    skyMat.uniforms.uSunDir.value.copy(sunDir);
    skyMat.uniforms.uMoonDir.value.copy(moonDir);

    // Stars & constellations fade out smoothly in day mode
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uOpacity.value = Math.max(0, 1 - d * 1.45);
    if (constellationsRef.current) {
      constellationsRef.current.visible = d < 0.72;
      const mat = constellationLines[0]?.material as THREE.LineBasicMaterial | undefined;
      if (mat) mat.opacity = (1 - Math.min(1, d * 1.4)) * 0.24;
    }

    // Position 3D Sun
    if (sunGroupRef.current) {
      sunGroupRef.current.position.copy(sunDir).multiplyScalar(78);
      sunGroupRef.current.visible = d > 0.06;
      const s = 0.7 + d * 0.45;
      sunGroupRef.current.scale.setScalar(s);
    }

    // Position & slowly rotate detailed 3D Moon
    if (moonGroupRef.current) {
      moonGroupRef.current.position.copy(moonDir).multiplyScalar(72);
      moonGroupRef.current.visible = d < 0.92;
      moonGroupRef.current.rotation.y = t * 0.015;
    }

    // Animate volumetric cloud colors, opacity and slow orbital drift
    cloudMat.color.copy(tmpColorA).lerp(tmpColorB, d);
    cloudMat.emissive.copy(tmpEmissiveA).lerp(tmpEmissiveB, d);
    cloudMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 0.24, d);
    cloudMat.opacity = THREE.MathUtils.lerp(0.32, 0.68, d);
    if (cloudsGroupRef.current && !reducedMotion) {
      cloudsGroupRef.current.rotation.y = t * 0.008;
    }

    // Gentle drift of ambient energy dust motes
    if (dustRef.current && !reducedMotion) {
      dustRef.current.rotation.y = t * 0.012;
      dustRef.current.position.y = Math.sin(t * 0.35) * 0.18;
    }

    // Shooting star animation during night mode
    const m = meteorState.current;
    if (meteorRef.current) {
      if (d > 0.55 || reducedMotion) {
        meteorRef.current.visible = false;
      } else if (!m.active) {
        m.cooldown -= delta;
        if (m.cooldown <= 0) {
          m.active = true;
          m.progress = 0;
          const side = Math.random() > 0.5 ? 1 : -1;
          m.start.set(side * (20 + Math.random() * 35), 32 + Math.random() * 20, -55 - Math.random() * 25);
          m.dir.set(-side * (0.75 + Math.random() * 0.3), -0.45 - Math.random() * 0.2, 0.1).normalize();
          meteorRef.current.visible = true;
        }
      } else {
        m.progress += delta * 1.45;
        const pos = m.start.clone().addScaledVector(m.dir, m.progress * 55);
        meteorRef.current.position.copy(pos);
        meteorRef.current.lookAt(pos.clone().add(m.dir));
        const fade = Math.sin(Math.min(1, m.progress) * Math.PI);
        (meteorRef.current.material as THREE.MeshBasicMaterial).opacity = fade * (1 - d * 1.5);
        if (m.progress >= 1) {
          m.active = false;
          m.cooldown = 4.5 + Math.random() * 6.5;
          meteorRef.current.visible = false;
        }
      }
    }
  });

  return (
    <group name="SkyUniverse">
      {/* Atmospheric Day/Night Sky Dome */}
      <mesh material={skyMat} renderOrder={-10}>
        <sphereGeometry args={[145, 48, 32]} />
      </mesh>

      {/* Multi-layer Scintillating Starfield */}
      <points geometry={starGeo} material={starMat} frustumCulled={false} />

      {/* Subtle Night Constellations */}
      <group ref={constellationsRef}>
        {constellationLines.map((lineObj, i) => (
          <primitive key={i} object={lineObj} />
        ))}
      </group>

      {/* Shooting Star Streak */}
      <mesh ref={meteorRef} visible={false}>
        <cylinderGeometry args={[0.02, 0.14, 7.5, 6]} />
        <meshBasicMaterial
          color="#D4FFF0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Detailed 3D Cratered Moon (Night) */}
      <group ref={moonGroupRef}>
        <mesh>
          <sphereGeometry args={[6.2, 48, 48]} />
          <meshStandardMaterial
            map={moonTextures.map}
            bumpMap={moonTextures.bumpMap}
            bumpScale={0.22}
            roughness={0.92}
            metalness={0.02}
            emissive="#87A6C4"
            emissiveMap={moonTextures.map}
            emissiveIntensity={0.42}
          />
        </mesh>
        {/* Soft Lunar Atmospheric Halo */}
        <mesh>
          <sphereGeometry args={[7.4, 24, 24]} />
          <meshBasicMaterial
            color="#9EC8EB"
            transparent
            opacity={0.11}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Blazing 3D Sun + Corona (Day) */}
      <group ref={sunGroupRef} visible={false}>
        <mesh>
          <sphereGeometry args={[5.4, 32, 32]} />
          <meshBasicMaterial color="#FFF6DC" />
        </mesh>
        <mesh>
          <sphereGeometry args={[8.5, 24, 24]} />
          <meshBasicMaterial
            color="#FFE29E"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[14.0, 24, 24]} />
          <meshBasicMaterial
            color="#FFD080"
            transparent
            opacity={0.09}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Layered Volumetric 3D Cloud Sea & Sky Clouds */}
      <group ref={cloudsGroupRef}>
        {cloudClusters.map((c, idx) => (
          <group
            key={idx}
            position={[Math.cos(c.angle) * c.radius, c.y, Math.sin(c.angle) * c.radius]}
            rotation={[0, -c.angle + Math.PI / 2, 0]}
            scale={c.scale}
          >
            {c.puffs.map((p, j) => (
              <mesh key={j} position={p.pos} scale={p.s} material={cloudMat}>
                <icosahedronGeometry args={[1, 2]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Ambient Floating Atmospheric Particles */}
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          color="#6DF5C7"
          size={0.055}
          transparent
          opacity={0.45}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
