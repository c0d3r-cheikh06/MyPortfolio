"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, SkipForward, Layers } from "lucide-react";
import { PROFILE } from "@/data/profile";
import { useUniverseStore } from "@/store/useUniverseStore";

export function CinematicIntro() {
  const phase = useUniverseStore((s) => s.phase);
  const setPhase = useUniverseStore((s) => s.setPhase);
  const setViewMode = useUniverseStore((s) => s.setViewMode);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const handleEnter = () => {
    setPhase("entering");
    const delay = reducedMotion ? 80 : 1850;
    window.setTimeout(() => {
      setPhase("active");
    }, delay);
  };

  const handleSkip = () => {
    setPhase("active");
  };

  return (
    <AnimatePresence>
      {phase === "intro" && (
        <motion.div
          key="cinematic-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.75, ease: "easeInOut" } }}
          className="fixed inset-0 z-40 flex flex-col justify-between bg-gradient-to-b from-[#04060A]/75 via-[#04060A]/28 to-[#04060A]/88 p-5 sm:p-10"
        >
          {/* Architectural Corner Calibration Reticles */}
          <div className="pointer-events-none fixed inset-4 hidden sm:block">
            <div className="absolute left-0 top-0 h-5 w-5 border-l border-t border-[#3BF4B8]/40" />
            <div className="absolute right-0 top-0 h-5 w-5 border-r border-t border-[#3BF4B8]/40" />
            <div className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-[#3BF4B8]/40" />
            <div className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-[#3BF4B8]/40" />
          </div>

          {/* Top Telemetry Strip */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#3BF4B8] shadow-[0_0_14px_#3BF4B8] animate-pulse" />
                <span className="font-mono text-[11px] tracking-[0.26em] text-[#ECF3F7]">
                  {PROFILE.handle} {"//"} SYSTEM READY
                </span>
              </div>
              <span className="hidden font-mono text-[10px] tracking-[0.22em] text-[#9FB0BE]/70 lg:inline">
                · 14.7167° N · 17.4677° W
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("active");
                  setViewMode("classic");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ECF3F7]/15 bg-[#070B11]/75 px-3.5 py-1.5 font-mono text-[10px] tracking-wider text-[#9FB0BE] backdrop-blur-md transition hover:border-[#3BF4B8]/50 hover:text-[#ECF3F7] cursor-pointer sm:text-[11px]"
              >
                <Layers className="h-3.5 w-3.5 text-[#3BF4B8]" />
                VERSION CLASSIQUE
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ECF3F7]/15 bg-[#070B11]/75 px-3.5 py-1.5 font-mono text-[10px] tracking-wider text-[#9FB0BE] backdrop-blur-md transition hover:border-[#ECF3F7]/45 hover:text-[#ECF3F7] cursor-pointer sm:text-[11px]"
              >
                <SkipForward className="h-3.5 w-3.5" />
                SKIP INTRO
              </button>
            </div>
          </div>

          {/* Center Sculptural Hero Display */}
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-[#3BF4B8]/30 bg-[#060B12]/80 px-4 py-1.5 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
              <span className="font-mono text-[10px] tracking-[0.28em] text-[#3BF4B8] sm:text-[11px]">
                INTERACTIVE 3D DEVELOPER UNIVERSE
              </span>
            </motion.div>

            {/* Kinetic Masked Reveal Headline in Syne */}
            <div className="overflow-hidden px-1">
              <motion.h1
                initial={{ y: "105%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.95, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[1.85rem] font-extrabold tracking-[0.04em] text-gradient-hero sm:text-7xl sm:tracking-[0.12em] md:text-8xl drop-shadow-[0_10px_38px_rgba(4,6,10,0.92)]"
              >
                {PROFILE.experienceName}
              </motion.h1>
            </div>

            {/* Live Scanning Horizontal Laser Hairline */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative my-5 h-[1px] w-56 overflow-hidden bg-gradient-to-r from-transparent via-[#3BF4B8]/80 to-transparent sm:w-80"
            >
              {!reducedMotion && (
                <motion.div
                  initial={{ x: "-40%" }}
                  animate={{ x: "140%" }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="h-full w-16 bg-gradient-to-r from-transparent via-white to-transparent"
                />
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.56 }}
              className="font-mono text-xs tracking-[0.4em] text-[#ECF3F7] sm:text-sm"
            >
              {PROFILE.signature}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
              className="mt-4 max-w-xl text-sm leading-relaxed text-[#C4D3DF] sm:text-base"
            >
              {PROFILE.name} — {PROFILE.roleTitle}. Explorez le laboratoire 3D, la reconstruction
              holographique par lasers, les projets GitHub vérifiés et l&apos;univers personnel.
            </motion.p>

            {/* Technical Capabilities Strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.86 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-[10px] tracking-[0.2em] text-[#9FB0BE]"
            >
              <span className="text-[#3BF4B8]">16 REPOS GITHUB AUDITÉS</span>
              <span className="hidden opacity-40 sm:inline">·</span>
              <span>HOLOGRAMME 3D</span>
              <span className="hidden opacity-40 sm:inline">·</span>
              <span className="text-[#38BDF8]">JOUR / NUIT</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.95 }}
              className="mt-8"
            >
              <button
                type="button"
                onClick={handleEnter}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#3BF4B8]/65 bg-[#3BF4B8]/14 px-8 py-4 font-mono text-xs font-semibold tracking-[0.26em] text-[#ECF3F7] backdrop-blur-md transition-all duration-300 hover:bg-[#3BF4B8] hover:text-[#04060A] hover:shadow-[0_0_44px_rgba(59,244,184,0.48)] cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">ENTER EXPERIENCE</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          {/* Bottom Technical Signature */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-[0.22em] text-[#9FB0BE]/75">
            <span>ORBITAL LAB // WEBGL + GLSL + R3F</span>
            <span>DRAG 360° · SCROLL ZOOM · CLICK TO INSPECT</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
