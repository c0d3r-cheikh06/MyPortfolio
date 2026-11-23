"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { ZONES } from "@/data/zones";
import { useUniverseStore } from "@/store/useUniverseStore";

/**
 * Rock-Solid Cinematic Camera Controller:
 *  - Uses smooth, frame-rate independent cubic interpolation in useFrame (never stalls on slow GPUs!)
 *  - Glides smoothly to every zone preset (position + target + FOV)
 *  - Immediately hands control to manual OrbitControls when user drags or zooms
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const cameraVersion = useUniverseStore((s) => s.cameraVersion);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const transition = useRef({
    active: false,
    elapsed: 0,
    duration: 1.35,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(0.4, 3.3, 8.6),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(0, 1.35, -0.4),
    fromFov: 44,
    toFov: 44,
  });

  useEffect(() => {
    const controls = controlsRef.current;
    const tr = transition.current;

    if (phase === "intro") {
      tr.active = false;
      camera.position.set(0.6, 3.8, 12.2);
      if (controls) {
        controls.target.set(0, 1.55, 0);
        controls.update();
      } else {
        camera.lookAt(0, 1.55, 0);
      }
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 46;
        camera.updateProjectionMatrix();
      }
      return;
    }

    const preset = ZONES[activeZone] ?? ZONES.main;
    tr.fromPos.copy(camera.position);
    tr.toPos.set(...preset.position);
    tr.fromTarget.copy(controls ? controls.target : new THREE.Vector3(0, 1.4, 0));
    tr.toTarget.set(...preset.target);
    tr.fromFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 44;
    tr.toFov = preset.fov ?? 44;
    tr.elapsed = 0;
    tr.duration = reducedMotion ? 0.01 : phase === "entering" ? 1.8 : 1.25;
    tr.active = true;
  }, [phase, activeZone, cameraVersion, reducedMotion, camera]);

  // Cancel camera glide immediately when the visitor drags/zooms manually
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      transition.current.active = false;
    };
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("start", onStart);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const tr = transition.current;
    if (!tr.active) return;

    const dt = Math.min(rawDelta, 0.08);
    tr.elapsed += dt;
    const rawT = Math.min(1, tr.elapsed / tr.duration);
    // Cinematic easeInOutCubic
    const ease = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

    camera.position.lerpVectors(tr.fromPos, tr.toPos, ease);
    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(tr.fromTarget, tr.toTarget, ease);
      controlsRef.current.update();
    } else {
      camera.lookAt(tr.toTarget);
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      const nextFov = THREE.MathUtils.lerp(tr.fromFov, tr.toFov, ease);
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }

    if (rawT >= 1) tr.active = false;
  });

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
      minDistance={1.45}
      maxDistance={24}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI * 0.485}
    />
  );
}
