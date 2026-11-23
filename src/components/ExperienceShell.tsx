"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProjectItem } from "@/data/projects";
import { hydrateThemeFromStorage, useUniverseStore } from "@/store/useUniverseStore";
import { CinematicIntro } from "./intro/CinematicIntro";
import { TopBar } from "./hud/TopBar";
import { ZoneDock } from "./hud/ZoneDock";
import { HoloPanels } from "./hud/HoloPanels";
import { SpatialTransition } from "./hud/SpatialTransition";
import { ClassicPortfolio } from "./classic/ClassicPortfolio";

const UniverseCanvas = dynamic(
  () => import("@/scene/UniverseCanvas").then((m) => m.UniverseCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-[#04070B]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4EF2B8]/25 border-t-[#4EF2B8]" />
          <span className="font-mono text-[11px] tracking-[0.26em] text-[#9FB0BE]">
            INITIALIZING 3D UNIVERSE...
          </span>
        </div>
      </div>
    ),
  }
);

function detectWebGLSupport(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

interface ExperienceShellProps {
  initialProjects: ProjectItem[];
  initialSyncSource: string;
}

export function ExperienceShell({
  initialProjects,
  initialSyncSource,
}: ExperienceShellProps) {
  const viewMode = useUniverseStore((s) => s.viewMode);
  const setViewMode = useUniverseStore((s) => s.setViewMode);
  const setQuality = useUniverseStore((s) => s.setQuality);
  const setReducedMotion = useUniverseStore((s) => s.setReducedMotion);
  const phase = useUniverseStore((s) => s.phase);

  const [webglSupported] = useState<boolean>(() => detectWebGLSupport());
  const [projects] = useState<ProjectItem[]>(initialProjects);

  useEffect(() => {
    hydrateThemeFromStorage();

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);

    // Auto-tune quality tier for mobile / low-power viewports
    if (!webglSupported) {
      setViewMode("classic");
    } else if (window.innerWidth < 768) {
      setQuality("low");
    } else if (window.innerWidth < 1180) {
      setQuality("medium");
    }

    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, [webglSupported, setQuality, setReducedMotion, setViewMode]);

  const isClassic = viewMode === "classic" || !webglSupported;

  return (
    <AnimatePresence initial={false}>
      {isClassic ? (
        <motion.div
          key="view-classic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ClassicPortfolio
            projects={projects}
            syncSource={initialSyncSource}
            webglSupported={webglSupported}
          />
        </motion.div>
      ) : (
        <motion.main
          key="view-3d"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative h-screen w-screen overflow-hidden bg-[#04060A]"
        >
          <UniverseCanvas projects={projects} />
          <SpatialTransition />
          <CinematicIntro />
          <TopBar />
          <ZoneDock />
          <HoloPanels projects={projects} syncSource={initialSyncSource} />

          {/* Subtle First-Visit Exploration Hint (bottom-left on desktop, unobtrusive) */}
          {phase === "active" && (
            <div className="pointer-events-none fixed bottom-24 left-6 z-20 hidden rounded-lg border border-[#ECF3F7]/10 bg-[#070B11]/72 px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-[#9FB0BE] backdrop-blur-md xl:block">
              DRAG 360° · SCROLL ZOOM · CLICK ANY MODULE
            </div>
          )}
        </motion.main>
      )}
    </AnimatePresence>
  );
}
