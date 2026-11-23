"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { ProjectItem } from "@/data/projects";
import { useUniverseStore } from "@/store/useUniverseStore";
import { SkyUniverse } from "./SkyUniverse";
import { LightingRig } from "./LightingRig";
import { CameraRig } from "./CameraRig";
import { HologramAvatar } from "./HologramAvatar";
import { TechLab } from "./TechLab";
import { SkillsUniverse } from "./SkillsUniverse";
import { ContactStation } from "./ContactStation";
import { FootballArena } from "./hobbies/FootballArena";
import { GamingPod } from "./hobbies/GamingPod";
import { SwimmingPod } from "./hobbies/SwimmingPod";

interface UniverseCanvasProps {
  projects: ProjectItem[];
}

export function UniverseCanvas({ projects }: UniverseCanvasProps) {
  const quality = useUniverseStore((s) => s.quality);
  const [contextLost, setContextLost] = useState(false);

  const dpr: [number, number] =
    quality === "high" ? [1, 1.6] : quality === "medium" ? [1, 1.25] : [0.85, 1.0];

  if (contextLost) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#04070B] p-8 text-center">
        <div className="holo-glass max-w-md rounded-xl p-6">
          <p className="font-mono text-xs tracking-widest text-[#4EF2B8]">WEBGL CONTEXT LOST</p>
          <p className="mt-2 text-sm text-[#9FB0BE]">
            Le contexte graphique 3D s&apos;est interrompu. Vous pouvez recharger la page ou basculer en mode Classique.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-full w-full">
      <Canvas
        shadows={quality !== "low"}
        dpr={dpr}
        camera={{ position: [0.6, 3.8, 12.2], fov: 46, near: 0.1, far: 280 }}
        gl={{
          antialias: quality !== "low",
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.06,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setContextLost(true);
          });
        }}
      >
        <SkyUniverse />
        <LightingRig />
        <CameraRig />

        <TechLab projects={projects} />
        <SkillsUniverse />
        <ContactStation />
        <FootballArena />
        <GamingPod />
        <SwimmingPod />

        <Suspense fallback={null}>
          <HologramAvatar />
        </Suspense>

        {/* Subtle photographic selective Bloom (only true emissive highlights, never washes out the face!) */}
        {quality !== "low" && (
          <EffectComposer multisampling={quality === "high" ? 4 : 0}>
            <Bloom
              intensity={0.24}
              luminanceThreshold={0.96}
              luminanceSmoothing={0.24}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.28} darkness={0.34} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
