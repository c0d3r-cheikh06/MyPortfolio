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
    // Transition camera smoothly into laboratory, then unlock full free exploration
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
          className="fixed inset-0 z-40 flex flex-col justify-between bg-gradient-to-b from-[#04070B]/70 via-[#04070B]/30 to-[#04070B]/88 p-6 sm:p-10"
        >
          {/* Top Telemetry Strip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#4EF2B8] shadow-[0_0_12px_#4EF2B8]" />
              <span className="font-mono text-[11px] tracking-[0.26em] text-[#9FB0BE]">
                {PROFILE.handle} {"//"} SYSTEM READY
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("active");
                  setViewMode("classic");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ECF3F7]/15 bg-[#0B1016]/65 px-3.5 py-1.5 font-mono text-[11px] tracking-wider text-[#9FB0BE] backdrop-blur-md transition hover:border-[#4EF2B8]/50 hover:text-[#ECF3F7]"
              >
                <Layers className="h-3.5 w-3.5 text-[#4EF2B8]" />
                VERSION CLASSIQUE
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ECF3F7]/15 bg-[#0B1016]/65 px-3.5 py-1.5 font-mono text-[11px] tracking-wider text-[#9FB0BE] backdrop-blur-md transition hover:border-[#ECF3F7]/40 hover:text-[#ECF3F7]"
              >
                <SkipForward className="h-3.5 w-3.5" />
                SKIP INTRO
              </button>
            </div>
          </div>

          {/* Center Hero Title Overlay (lets the 3D hologram laser preview shine cleanly behind it) */}
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4EF2B8]/25 bg-[#070D14]/70 px-4 py-1.5 backdrop-blur-md"
            >
              <span className="font-mono text-[11px] tracking-[0.28em] text-[#4EF2B8]">
                INTERACTIVE 3D DEVELOPER UNIVERSE
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18, letterSpacing: "0.28em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.14em" }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-5xl font-bold tracking-[0.14em] text-[#ECF3F7] sm:text-7xl md:text-8xl drop-shadow-[0_6px_32px_rgba(4,7,11,0.9)]"
            >
              {PROFILE.experienceName}
            </motion.h1>

            {/* Subtle horizontal laser hairline */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5 }}
              className="my-5 h-[1px] w-48 bg-gradient-to-r from-transparent via-[#4EF2B8] to-transparent sm:w-72"
            />

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.6 }}
              className="font-mono text-sm tracking-[0.38em] text-[#ECF3F7]/90 sm:text-base"
            >
              {PROFILE.signature}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.85 }}
              className="mt-4 max-w-lg text-sm leading-relaxed text-[#9FB0BE]"
            >
              {PROFILE.name} — {PROFILE.roleTitle}. Explorez le laboratoire 3D, la reconstruction
              holographique par lasers, les projets GitHub vérifiés et l&apos;univers personnel.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.95 }}
              className="mt-9"
            >
              <button
                type="button"
                onClick={handleEnter}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#4EF2B8]/60 bg-[#4EF2B8]/12 px-8 py-4 font-mono text-xs font-semibold tracking-[0.26em] text-[#ECF3F7] backdrop-blur-md transition-all duration-300 hover:bg-[#4EF2B8] hover:text-[#04070B] hover:shadow-[0_0_40px_rgba(78,242,184,0.45)] cursor-pointer"
              >
                <span>ENTER EXPERIENCE</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          {/* Bottom Technical Signature */}
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-[0.22em] text-[#9FB0BE]/70">
            <span>ORBITAL LAB // WEBGL + GLSL + R3F</span>
            <span>DRAG 360° · SCROLL ZOOM · CLICK TO INSPECT</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
