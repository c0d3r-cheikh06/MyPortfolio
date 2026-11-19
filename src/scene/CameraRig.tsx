"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import gsap from "gsap";
import { ZONES } from "@/data/zones";
import { useUniverseStore } from "@/store/useUniverseStore";

/**
 * Cinematic Camera Controller:
 *  - Starts in a dramatic wide orbital establishing shot during Intro
 *  - Glides into the laboratory when user enters the experience
 *  - Smooth GSAP transitions (position + target + FOV) between all zones
 *  - Yields gracefully to manual 360° OrbitControls dragging / zooming
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const { camera } = useThree();

  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const cameraVersion = useUniverseStore((s) => s.cameraVersion);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  // Intro wide establishing position -> smooth push-in when entering
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    tweenRef.current?.kill();

    if (phase === "intro") {
      camera.position.set(0.8, 4.6, 15.5);
      controls.target.set(0, 1.75, 0);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 48;
        camera.updateProjectionMatrix();
      }
      controls.update();
      return;
    }

    const preset = ZONES[activeZone] ?? ZONES.main;
    const duration = reducedMotion ? 0.01 : phase === "entering" ? 2.1 : 1.35;

    const tl = gsap.timeline();
    tl.to(
      camera.position,
      {
        x: preset.position[0],
        y: preset.position[1],
        z: preset.position[2],
        duration,
        ease: "power3.inOut",
      },
      0
    ).to(
      controls.target,
      {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration,
        ease: "power3.inOut",
        onUpdate: () => {
          controls.update();
        },
      },
      0
    );

    if (camera instanceof THREE.PerspectiveCamera && preset.fov) {
      tl.to(
        camera,
        {
          fov: preset.fov,
          duration,
          ease: "power2.inOut",
          onUpdate: () => camera.updateProjectionMatrix(),
        },
        0
      );
    }

    tweenRef.current = tl;
    return () => {
      tl.kill();
    };
  }, [phase, activeZone, cameraVersion, reducedMotion, camera]);

  // Let manual user interaction take over smoothly without fighting GSAP
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      tweenRef.current?.kill();
    };
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("start", onStart);
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={phase === "active"}
      enableDamping
      dampingFactor={0.055}
      rotateSpeed={0.62}
      zoomSpeed={0.78}
      panSpeed={0.55}
      minDistance={1.55}
      maxDistance={23}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI * 0.485}
    />
  );
}
