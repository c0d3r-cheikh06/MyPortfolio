"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  skyDomeFragmentShader,
  skyDomeVertexShader,
  starfieldFragmentShader,
  starfieldVertexShader,
} from "@/lib/glsl/skyShader";
import { createGlowParticleTexture, createMoonTextures } from "@/lib/textures";
import { useUniverseStore } from "@/store/useUniverseStore";

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 3D constellation star chains placed cleanly across the night sky dome */
const CONSTELLATIONS: [number, number, number][][] = [
  [
    [-40, 44, -76],
    [-31, 35, -80],
    [-27, 34, -82],
    [-23, 33, -83],
    [-17, 45, -78],
    [-27, 34, -82],
    [-34, 24, -81],
    [-20, 23, -82],
  ],
  [
    [34, 48, -74],
    [40, 38, -76],
    [46, 28, -78],
    [40, 38, -76],
    [29, 34, -80],
    [52, 41, -72],
  ],
  [
    [-64, 38, -36],
    [-57, 44, -40],
    [-50, 39, -43],
    [-44, 46, -46],
    [-37, 40, -48],
  ],
];

interface ShootingStarState {
  active: boolean;
  progress: number;
  start: THREE.Vector3;
  dir: THREE.Vector3;
  cooldown: number;
}

/**
 * Living 3D Astronomical Sky Universe:
 *  - Volumetric GPU ray-marched clouds & infinite below-deck sea of clouds (ZERO sphere blobs!)
 *  - Detailed cratered Moon with bump relief framed cleanly over the observatory night skyline
 *  - Blazing 3D Sun + corona arc rising during Day Mode
 *  - Multi-layer twinkling starfield, constellations, and occasional shooting stars
 *  - Smooth, frame-independent Day <-> Night transition that never stalls on any GPU
 */
export function SkyUniverse() {
  const theme = useUniverseStore((s) => s.theme);
  const quality = useUniverseStore((s) => s.quality);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const setDayFactor = useUniverseStore((s) => s.setDayFactor);
  const { gl } = useThree();

  const dayFactorRef = useRef(theme === "day" ? 1 : 0);
  const sunGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const constellationsRef = useRef<THREE.Group>(null);
  const meteorRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);

  const meteorState = useRef<ShootingStarState>({
    active: false,
    progress: 0,
    start: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    cooldown: 4.0,
  });

  // Volumetric Sky + Ray-marched Clouds Dome material
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
          uSunDir: { value: new THREE.Vector3(0.42, 0.36, -0.83).normalize() },
          uMoonDir: { value: new THREE.Vector3(-0.34, 0.33, -0.88).normalize() },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // High-res cratered Moon textures & soft circular bokeh dust sprite
  const moonTextures = useMemo(() => createMoonTextures(), []);
  const dustSprite = useMemo(() => createGlowParticleTexture(), []);

  // Multi-layer Starfield
  const starCount = quality === "low" ? 1400 : 2800;
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
      new THREE.Color("#A8F7DE"),
      new THREE.Color("#FFFFFF"),
    ];

    for (let i = 0; i < starCount; i++) {
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(Math.max(0.02, 1 - v * 0.98)); // keep stars cleanly above horizon
      const r = 90 + rand() * 38;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      sizes[i] = rand() < 0.07 ? 2.1 + rand() * 1.9 : 0.75 + rand() * 1.15;
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

  // Subtle Constellation Lines
  const constellationLines = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#7CECD0",
      transparent: true,
      opacity: 0.18,
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

  // Delicate Circular Bokeh Ambient Motes
  const dustGeo = useMemo(() => {
    const rand = seededRand(7741);
    const n = quality === "low" ? 90 : 180;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 26;
      pos[i * 3 + 1] = 0.4 + rand() * 7.5;
      pos[i * 3 + 2] = (rand() - 0.5) * 24;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [quality]);

  useEffect(() => {
    return () => {
      skyMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      moonTextures.map.dispose();
      moonTextures.bumpMap.dispose();
      dustSprite.dispose();
      dustGeo.dispose();
      constellationLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
    };
  }, [skyMat, starGeo, starMat, moonTextures, dustSprite, dustGeo, constellationLines]);

  const sunVec = useMemo(() => new THREE.Vector3(), []);
  const moonVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    const t = state.clock.elapsedTime;
    const targetDay = theme === "day" ? 1 : 0;

    // Frame-rate independent smooth cinematic Day <-> Night transition (~2.0s)
    if (reducedMotion) {
      dayFactorRef.current = targetDay;
    } else if (Math.abs(dayFactorRef.current - targetDay) > 0.0005) {
      const step = dt * 0.55;
      if (dayFactorRef.current < targetDay) {
        dayFactorRef.current = Math.min(targetDay, dayFactorRef.current + step);
      } else {
        dayFactorRef.current = Math.max(targetDay, dayFactorRef.current - step);
      }
    } else {
      dayFactorRef.current = targetDay;
    }

    // Smoothstep S-curve for filmic sunrise/moonrise pacing
    const rawD = dayFactorRef.current;
    const d = rawD * rawD * (3 - 2 * rawD);
    if (Math.abs(useUniverseStore.getState().dayFactor - d) > 0.002) {
      setDayFactor(d);
    }

    // Hero framing: Moon sits gracefully upper-left over rear skyline at Night; Sun arcs upper-right in Day
    const sunElev = THREE.MathUtils.lerp(-0.22, 0.38, d);
    const moonElev = THREE.MathUtils.lerp(0.34, -0.26, d);
    sunVec.set(0.42, sunElev, -0.83).normalize();
    moonVec.set(-0.34, moonElev, -0.88).normalize();

    skyMat.uniforms.uDayFactor.value = d;
    skyMat.uniforms.uTime.value = t;
    skyMat.uniforms.uSunDir.value.copy(sunVec);
    skyMat.uniforms.uMoonDir.value.copy(moonVec);

    // Stars & constellations fade seamlessly at sunrise
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uOpacity.value = Math.max(0, 1 - d * 1.45);
    if (constellationsRef.current) {
      constellationsRef.current.visible = d < 0.7;
      const mat = constellationLines[0]?.material as THREE.LineBasicMaterial | undefined;
      if (mat) mat.opacity = (1 - Math.min(1, d * 1.45)) * 0.2;
    }

    if (sunGroupRef.current) {
      sunGroupRef.current.position.copy(sunVec).multiplyScalar(82);
      sunGroupRef.current.visible = d > 0.08;
      sunGroupRef.current.scale.setScalar(0.75 + d * 0.4);
    }

    if (moonGroupRef.current) {
      moonGroupRef.current.position.copy(moonVec).multiplyScalar(76);
      moonGroupRef.current.visible = d < 0.92;
      moonGroupRef.current.rotation.y = 0.65 + t * 0.012;
    }

    if (dustRef.current && !reducedMotion) {
      dustRef.current.rotation.y = t * 0.01;
      (dustRef.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp(0.42, 0.16, d);
    }

    // Occasional graceful shooting star across the night dome
    const m = meteorState.current;
    if (meteorRef.current) {
      if (d > 0.5 || reducedMotion) {
        meteorRef.current.visible = false;
      } else if (!m.active) {
        m.cooldown -= dt;
        if (m.cooldown <= 0) {
          m.active = true;
          m.progress = 0;
          const side = Math.random() > 0.5 ? 1 : -1;
          m.start.set(side * (24 + Math.random() * 32), 34 + Math.random() * 18, -68 - Math.random() * 18);
          m.dir.set(-side * (0.78 + Math.random() * 0.25), -0.42 - Math.random() * 0.18, 0.08).normalize();
          meteorRef.current.visible = true;
        }
      } else {
        m.progress += dt * 1.5;
        const pos = m.start.clone().addScaledVector(m.dir, m.progress * 56);
        meteorRef.current.position.copy(pos);
        meteorRef.current.lookAt(pos.clone().add(m.dir));
        const fade = Math.sin(Math.min(1, m.progress) * Math.PI);
        (meteorRef.current.material as THREE.MeshBasicMaterial).opacity = fade * (1 - d * 1.6);
        if (m.progress >= 1) {
          m.active = false;
          m.cooldown = 5.5 + Math.random() * 6.5;
          meteorRef.current.visible = false;
        }
      }
    }
  });

  return (
    <group name="SkyUniverse">
      {/* Volumetric Atmospheric Sky + GPU Ray-Marched Cumulus Clouds + Cloud Sea */}
      <mesh material={skyMat} renderOrder={-10}>
        <sphereGeometry args={[150, 64, 40]} />
      </mesh>

      {/* Multi-Layer Scintillating Starfield */}
      <points geometry={starGeo} material={starMat} frustumCulled={false} />

      {/* Constellations */}
      <group ref={constellationsRef}>
        {constellationLines.map((lineObj, i) => (
          <primitive key={i} object={lineObj} />
        ))}
      </group>

      {/* Shooting Star Streak */}
      <mesh ref={meteorRef} visible={false}>
        <cylinderGeometry args={[0.015, 0.11, 6.8, 6]} />
        <meshBasicMaterial
          color="#D8FFF2"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Detailed 3D Cratered Moon with Realistic Maria & Bump Relief */}
      <group ref={moonGroupRef}>
        <mesh>
          <sphereGeometry args={[5.8, 56, 56]} />
          <meshStandardMaterial
            map={moonTextures.map}
            bumpMap={moonTextures.bumpMap}
            bumpScale={0.28}
            roughness={0.92}
            metalness={0.02}
            emissive="#9BB4CE"
            emissiveMap={moonTextures.map}
            emissiveIntensity={0.48}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[6.9, 28, 28]} />
          <meshBasicMaterial
            color="#9EC8EB"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Blazing 3D Sun + Corona Halo (Day Mode) */}
      <group ref={sunGroupRef} visible={false}>
        <mesh>
          <sphereGeometry args={[4.8, 36, 36]} />
          <meshBasicMaterial color="#FFF7E2" />
        </mesh>
        <mesh>
          <sphereGeometry args={[7.8, 28, 28]} />
          <meshBasicMaterial
            color="#FFE5A8"
            transparent
            opacity={0.26}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[13.2, 24, 24]} />
          <meshBasicMaterial
            color="#FFD286"
            transparent
            opacity={0.09}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Soft Circular Bokeh Ambient Dust Motes */}
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          map={dustSprite}
          color="#7DF7CE"
          size={0.14}
          transparent
          opacity={0.42}
          alphaTest={0.02}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
