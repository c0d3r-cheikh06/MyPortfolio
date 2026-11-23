"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  moonFragmentShader,
  moonVertexShader,
  parallaxCloudFragmentShader,
  parallaxCloudVertexShader,
  skyDomeFragmentShader,
  skyDomeVertexShader,
  starfieldFragmentShader,
  starfieldVertexShader,
  sunCoronaFragmentShader,
  sunCoronaVertexShader,
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

interface CloudCardSpec {
  angle: number;
  radius: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  seed: number;
}

/**
 * Living 3D Astronomical Sky Universe:
 *  - True 3D spherical-shell Perlin-Worley ray-marched clouds & infinite sea of clouds
 *  - 12 drifting 3D parallax volumetric cloud cards outside the platform for spatial parallax
 *  - Realistic cratered gibbous Moon with bump relief & shadow terminator framed clearly in sky
 *  - Smooth radial Mie-corona Solar disc rising during Day Mode
 *  - Multi-layer twinkling starfield, constellations with star anchor nodes, and shooting stars
 */
export function SkyUniverse() {
  const theme = useUniverseStore((s) => s.theme);
  const quality = useUniverseStore((s) => s.quality);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);
  const setDayFactor = useUniverseStore((s) => s.setDayFactor);
  const { gl } = useThree();

  const dayFactorRef = useRef(theme === "day" ? 1 : 0);
  const sunBillboardRef = useRef<THREE.Mesh>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const constellationsRef = useRef<THREE.Group>(null);
  const meteorRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const cloudCardRefs = useRef<(THREE.Mesh | null)[]>([]);

  const meteorState = useRef<ShootingStarState>({
    active: false,
    progress: 0,
    start: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    cooldown: 4.0,
  });

  const cloudSteps = quality === "high" ? 20 : quality === "medium" ? 14 : 8;

  // Volumetric Perlin-Worley Sky & Clouds Dome material
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
          uSunDir: { value: new THREE.Vector3(0.37, 0.25, -0.89).normalize() },
          uMoonDir: { value: new THREE.Vector3(-0.36, 0.24, -0.89).normalize() },
          uCloudSteps: { value: 20 },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Cratered Moon Textures & Custom Gibbous Phase Shader
  const moonTextures = useMemo(() => createMoonTextures(), []);
  const moonMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: moonVertexShader,
        fragmentShader: moonFragmentShader,
        transparent: true,
        uniforms: {
          uMap: { value: moonTextures.map },
          uBumpMap: { value: moonTextures.bumpMap },
          uSunLightDir: { value: new THREE.Vector3(0.68, 0.36, 0.64).normalize() },
          uDayFactor: { value: 0 },
        },
      }),
    [moonTextures]
  );

  // Smooth Solar Photosphere & Radial Mie Corona Billboard Shader
  const sunMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sunCoronaVertexShader,
        fragmentShader: sunCoronaFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
        },
      }),
    []
  );

  // 3D Parallax Volumetric Cloud Clusters outside orbital platform
  const cloudSpecs = useMemo<CloudCardSpec[]>(() => {
    const rand = seededRand(44881);
    const count = quality === "low" ? 6 : 12;
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + rand() * 0.35,
      radius: 36 + rand() * 26,
      y: -3.5 + rand() * 15.0,
      width: 22 + rand() * 14,
      height: 11 + rand() * 6,
      speed: 0.003 + rand() * 0.005,
      seed: i * 1.37 + rand(),
    }));
  }, [quality]);

  const cloudCardMats = useMemo(
    () =>
      cloudSpecs.map(
        (spec) =>
          new THREE.ShaderMaterial({
            vertexShader: parallaxCloudVertexShader,
            fragmentShader: parallaxCloudFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
              uTime: { value: 0 },
              uDayFactor: { value: 0 },
              uSeed: { value: spec.seed },
            },
          })
      ),
    [cloudSpecs]
  );

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
      const phi = Math.acos(Math.max(0.02, 1 - v * 0.98));
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

  // Constellations lines + star anchor nodes
  const { constellationLines, constellationStarsGeo } = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#7CECD0",
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lines = CONSTELLATIONS.map((pts) => {
      const geo = new THREE.BufferGeometry().setFromPoints(
        pts.map((p) => new THREE.Vector3(...p))
      );
      return new THREE.Line(geo, mat);
    });
    const uniqueVerts: number[] = [];
    CONSTELLATIONS.flat().forEach((p) => uniqueVerts.push(...p));
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.Float32BufferAttribute(uniqueVerts, 3));
    return { constellationLines: lines, constellationStarsGeo: sGeo };
  }, []);

  // Subtle Circular Bokeh Ambient Motes
  const dustGeo = useMemo(() => {
    const rand = seededRand(7741);
    const n = quality === "low" ? 70 : 140;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 24;
      pos[i * 3 + 1] = 0.5 + rand() * 7.2;
      pos[i * 3 + 2] = (rand() - 0.5) * 22;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [quality]);

  useEffect(() => {
    return () => {
      skyMat.dispose();
      moonMat.dispose();
      sunMat.dispose();
      cloudCardMats.forEach((m) => m.dispose());
      starGeo.dispose();
      starMat.dispose();
      moonTextures.map.dispose();
      moonTextures.bumpMap.dispose();
      dustSprite.dispose();
      dustGeo.dispose();
      constellationStarsGeo.dispose();
      constellationLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
    };
  }, [
    skyMat,
    moonMat,
    sunMat,
    cloudCardMats,
    starGeo,
    starMat,
    moonTextures,
    dustSprite,
    dustGeo,
    constellationStarsGeo,
    constellationLines,
  ]);

  const sunVec = useMemo(() => new THREE.Vector3(), []);
  const moonVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.08);
    const t = state.clock.elapsedTime;
    const targetDay = theme === "day" ? 1 : 0;

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

    const rawD = dayFactorRef.current;
    const d = rawD * rawD * (3 - 2 * rawD);
    if (Math.abs(useUniverseStore.getState().dayFactor - d) > 0.002) {
      setDayFactor(d);
    }

    // Framed cleanly in open sky BELOW top HUD bars and ABOVE observatory canopy!
    const sunElev = THREE.MathUtils.lerp(-0.20, 0.25, d);
    const moonElev = THREE.MathUtils.lerp(0.24, -0.36, d);
    sunVec.set(0.37, sunElev, -0.89).normalize();
    moonVec.set(-0.36, moonElev, -0.89).normalize();

    skyMat.uniforms.uDayFactor.value = d;
    skyMat.uniforms.uTime.value = t;
    skyMat.uniforms.uSunDir.value.copy(sunVec);
    skyMat.uniforms.uMoonDir.value.copy(moonVec);
    skyMat.uniforms.uCloudSteps.value = cloudSteps;

    // Stars & constellations fade seamlessly at sunrise
    const nightVis = Math.max(0, 1 - d * 1.45);
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uOpacity.value = nightVis;
    if (constellationsRef.current) {
      constellationsRef.current.visible = d < 0.7;
      const mat = constellationLines[0]?.material as THREE.LineBasicMaterial | undefined;
      if (mat) mat.opacity = nightVis * 0.2;
    }

    // Sun Corona Billboard always faces camera cleanly
    if (sunBillboardRef.current) {
      sunBillboardRef.current.position.copy(sunVec).multiplyScalar(86);
      sunBillboardRef.current.quaternion.copy(state.camera.quaternion);
      sunBillboardRef.current.visible = d > 0.08;
      sunMat.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(d, 0.08, 0.72);
    }

    // Realistic Gibbous Cratered Moon
    if (moonGroupRef.current) {
      moonGroupRef.current.position.copy(moonVec).multiplyScalar(82);
      moonGroupRef.current.visible = d < 0.72;
      moonGroupRef.current.rotation.y = 0.65 + t * 0.008;
      moonMat.uniforms.uDayFactor.value = d;
    }

    // Drifting 3D Parallax Cloud Cards outside the orbital platform
    for (let i = 0; i < cloudSpecs.length; i++) {
      const mesh = cloudCardRefs.current[i];
      const mat = cloudCardMats[i];
      if (!mesh || !mat) continue;
      const sp = cloudSpecs[i];
      const ang = sp.angle + (reducedMotion ? 0 : t * sp.speed);
      mesh.position.set(Math.cos(ang) * sp.radius, sp.y, Math.sin(ang) * sp.radius);
      mesh.quaternion.copy(state.camera.quaternion);
      mat.uniforms.uTime.value = t;
      mat.uniforms.uDayFactor.value = d;
    }

    if (dustRef.current && !reducedMotion) {
      dustRef.current.rotation.y = t * 0.009;
      (dustRef.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp(0.30, 0.08, d);
    }

    // Shooting star across night sky
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
          m.start.set(
            side * (24 + Math.random() * 32),
            34 + Math.random() * 18,
            -68 - Math.random() * 18
          );
          m.dir
            .set(-side * (0.78 + Math.random() * 0.25), -0.42 - Math.random() * 0.18, 0.08)
            .normalize();
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
      {/* True 3D Volumetric Perlin-Worley Sky + Cumulus Clouds + Cloud Sea */}
      <mesh material={skyMat} renderOrder={-10}>
        <sphereGeometry args={[150, 64, 40]} />
      </mesh>

      {/* Multi-Layer Scintillating Spectral Starfield */}
      <points geometry={starGeo} material={starMat} frustumCulled={false} />

      {/* Constellations + Star Anchor Nodes */}
      <group ref={constellationsRef}>
        {constellationLines.map((lineObj, i) => (
          <primitive key={i} object={lineObj} />
        ))}
        <points geometry={constellationStarsGeo}>
          <pointsMaterial
            map={dustSprite}
            color="#B8FFF0"
            size={0.95}
            transparent
            opacity={0.75}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
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

      {/* Realistic Gibbous Cratered Moon with Shadow Terminator */}
      <group ref={moonGroupRef}>
        <mesh material={moonMat}>
          <sphereGeometry args={[4.1, 56, 56]} />
        </mesh>
        <mesh>
          <sphereGeometry args={[4.75, 28, 28]} />
          <meshBasicMaterial
            color="#8EB8E0"
            transparent
            opacity={0.075}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Smooth Radial Solar Photosphere & Mie Corona */}
      <mesh ref={sunBillboardRef} material={sunMat} visible={false}>
        <planeGeometry args={[11, 11]} />
      </mesh>

      {/* 3D Parallax Volumetric Cumulus Cloud Cards surrounding the orbital deck */}
      <group name="ParallaxCloudCards">
        {cloudSpecs.map((spec, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              cloudCardRefs.current[idx] = el;
            }}
            material={cloudCardMats[idx]}
            renderOrder={-2}
          >
            <planeGeometry args={[spec.width, spec.height]} />
          </mesh>
        ))}
      </group>

      {/* Delicate Circular Bokeh Ambient Motes */}
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          map={dustSprite}
          color="#7DF7CE"
          size={0.11}
          transparent
          opacity={0.30}
          alphaTest={0.02}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
