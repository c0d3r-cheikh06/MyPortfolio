"use client";

import { Sun, Moon, RotateCcw, Layers, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PROFILE } from "@/data/profile";
import { useUniverseStore, type QualityTier } from "@/store/useUniverseStore";

const NEXT_QUALITY: Record<QualityTier, QualityTier> = {
  high: "medium",
  medium: "low",
  low: "high",
};

export function TopBar() {
  const phase = useUniverseStore((s) => s.phase);
  const theme = useUniverseStore((s) => s.theme);
  const toggleTheme = useUniverseStore((s) => s.toggleTheme);
  const setViewMode = useUniverseStore((s) => s.setViewMode);
  const quality = useUniverseStore((s) => s.quality);
  const setQuality = useUniverseStore((s) => s.setQuality);
  const hologramStage = useUniverseStore((s) => s.hologramStage);
  const hologramProgress = useUniverseStore((s) => s.hologramProgress);
  const replayHologram = useUniverseStore((s) => s.replayHologram);
  const returnToMain = useUniverseStore((s) => s.returnToMain);

  if (phase === "intro") return null;

  const isLocked = hologramProgress >= 0.96;

  return (
    <motion.header
      data-hologram-stage={hologramStage}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-5"
    >
      {/* Left Brand Mark & Hologram Status */}
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={returnToMain}
          className="holo-glass flex items-center gap-3 rounded-full border border-[#ECF3F7]/12 px-4 py-2 text-left transition hover:border-[#3BF4B8]/45 cursor-pointer"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isLocked
                ? "bg-[#3BF4B8] shadow-[0_0_12px_#3BF4B8]"
                : "bg-[#38BDF8] shadow-[0_0_12px_#38BDF8] animate-pulse"
            }`}
          />
          <div>
            <div className="font-display text-xs font-extrabold tracking-[0.18em] text-[#ECF3F7]">
              {PROFILE.experienceName}
            </div>
            <div className="hidden font-mono text-[9px] tracking-[0.22em] text-[#9FB0BE] sm:block">
              {PROFILE.signature}
            </div>
          </div>
        </button>

        {/* Live Laser Reconstruction Telemetry Pill */}
        <div className="holo-glass hidden items-center gap-2.5 rounded-full border border-[#ECF3F7]/10 px-3.5 py-2 md:flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isLocked ? "bg-[#3BF4B8]" : "bg-[#38BDF8] animate-ping"
            }`}
          />
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#ECF3F7]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3BF4B8] to-[#38BDF8] transition-all duration-150"
              style={{ width: `${Math.round(hologramProgress * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.18em] text-[#ECF3F7]/85">
            {hologramStage}
          </span>
        </div>
      </div>

      {/* Right Control Cluster: Replay Laser, Quality, DAY/NIGHT, Classic Mode */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={replayHologram}
          title="Rejouer la reconstruction laser de l'hologramme"
          className="holo-glass inline-flex items-center gap-1.5 rounded-full border border-[#ECF3F7]/10 px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-[#9FB0BE] transition hover:border-[#3BF4B8]/40 hover:text-[#3BF4B8] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">LASER SCAN</span>
        </button>

        <button
          type="button"
          onClick={() => setQuality(NEXT_QUALITY[quality])}
          title="Ajuster la qualité graphique WebGL"
          className="holo-glass hidden items-center gap-1.5 rounded-full border border-[#ECF3F7]/10 px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-[#9FB0BE] transition hover:border-[#ECF3F7]/25 hover:text-[#ECF3F7] sm:inline-flex cursor-pointer"
        >
          <Cpu className="h-3.5 w-3.5 text-[#3BF4B8]" />
          <span>{quality.toUpperCase()}</span>
        </button>

        {/* Persisted DAY / NIGHT Dynamic Atmosphere Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Basculer entre le mode Nuit et le mode Jour"
          className="holo-glass inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#ECF3F7]/12 px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#ECF3F7] transition hover:border-[#3BF4B8]/45 cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "night" ? (
              <motion.span
                key="night-pill"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-1.5"
              >
                <Moon className="h-3.5 w-3.5 text-[#38BDF8]" />
                <span>NIGHT</span>
              </motion.span>
            ) : (
              <motion.span
                key="day-pill"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-1.5"
              >
                <Sun className="h-3.5 w-3.5 text-[#F5B971]" />
                <span>DAY</span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Accessible Classic Portfolio Mode Switch */}
        <button
          type="button"
          onClick={() => setViewMode("classic")}
          className="holo-glass inline-flex items-center gap-1.5 rounded-full border border-[#ECF3F7]/12 px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-[#ECF3F7] transition hover:border-[#3BF4B8]/50 hover:bg-[#3BF4B8]/12 cursor-pointer"
        >
          <Layers className="h-3.5 w-3.5 text-[#3BF4B8]" />
          <span className="hidden sm:inline">CLASSIQUE</span>
        </button>
      </div>
    </motion.header>
  );
}
