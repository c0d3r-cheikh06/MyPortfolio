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
 *  - Uses smooth quintic/cubic interpolation with gentle Y-arc lift over obstacles on long glides
 *  - Enforces floor safety bounds and hands control immediately when dragging/zooming manually
 *  - Supports Escape key shortcut to return cleanly to the Main Observatory view
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
    toPos: new THREE.Vector3(0.25, 3.25, 9.5),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(0, 1.55, -0.7),
    fromFov: 44,
    toFov: 44,
    arcLift: 0,
  });

  // Escape key returns smoothly to Main view when focused on a zone or panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useUniverseStore.getState();
      if (st.phase === "active" && (st.activeZone !== "main" || st.activePanel !== null)) {
        st.returnToMain();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    tr.fromTarget.copy(controls ? controls.target : new THREE.Vector3(0, 1.55, -0.7));
    tr.toTarget.set(...preset.target);
    tr.fromFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 44;
    tr.toFov = preset.fov ?? 44;
    const travelDist = tr.fromPos.distanceTo(tr.toPos);
    tr.arcLift = travelDist > 4.5 ? Math.min(0.65, (travelDist - 4.5) * 0.065) : 0;
    tr.elapsed = 0;
    tr.duration = reducedMotion ? 0.01 : phase === "entering" ? 1.8 : 1.3;
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

  useFrame((state, rawDelta) => {
    const tr = transition.current;

    if (phase === "intro") {
      if (!reducedMotion && camera instanceof THREE.PerspectiveCamera) {
        const px = THREE.MathUtils.clamp(state.pointer.x, -1, 1);
        const py = THREE.MathUtils.clamp(state.pointer.y, -1, 1);
        const targetX = 0.6 + px * 0.35;
        const targetY = 3.8 + py * 0.16;
        const lerpF = Math.min(1, Math.min(rawDelta, 0.08) * 3.2);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, lerpF);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, lerpF);
        camera.lookAt(0, 1.55, 0);
      }
      return;
    }

    if (tr.active) {
      const dt = Math.min(rawDelta, 0.08);
      tr.elapsed += dt;
      const rawT = Math.min(1, tr.elapsed / tr.duration);
      // Smooth quintic easeInOut for natural acceleration & deceleration
      const ease =
        rawT < 0.5
          ? 16 * rawT * rawT * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 5) / 2;

      camera.position.lerpVectors(tr.fromPos, tr.toPos, ease);
      if (tr.arcLift > 0) {
        camera.position.y += Math.sin(Math.PI * ease) * tr.arcLift;
      }

      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(tr.fromTarget, tr.toTarget, ease);
        controlsRef.current.update();
      } else {
        camera.lookAt(tr.toTarget);
      }

      if (camera instanceof THREE.PerspectiveCamera) {
        const fovBreath = reducedMotion ? 0 : Math.sin(Math.PI * ease) * 3.0;
        const nextFov = THREE.MathUtils.lerp(tr.fromFov, tr.toFov, ease) + fovBreath;
        if (Math.abs(camera.fov - nextFov) > 0.01) {
          camera.fov = nextFov;
          camera.updateProjectionMatrix();
        }
      }

      if (rawT >= 1) tr.active = false;
    }

    // Floor collision safety clamp so camera never clips below the observatory deck
    if (camera.position.y < 0.55) {
      camera.position.y = 0.55;
    }
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
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI * 0.56}
    />
  );
}
