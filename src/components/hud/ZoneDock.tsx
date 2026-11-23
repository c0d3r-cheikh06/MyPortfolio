"use client";

import {
  Compass,
  User,
  FolderGit2,
  Cpu,
  Trophy,
  Gamepad2,
  Waves,
  Radio,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ZONES, ZONE_ORDER, type ZoneId } from "@/data/zones";
import { useUniverseStore } from "@/store/useUniverseStore";

const ZONE_ICONS: Record<ZoneId, React.ComponentType<{ className?: string }>> = {
  main: Compass,
  avatar: User,
  projects: FolderGit2,
  skills: Cpu,
  football: Trophy,
  gaming: Gamepad2,
  swimming: Waves,
  contact: Radio,
};

export function ZoneDock() {
  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const activePanel = useUniverseStore((s) => s.activePanel);
  const focusZone = useUniverseStore((s) => s.focusZone);
  const returnToMain = useUniverseStore((s) => s.returnToMain);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  if (phase !== "active") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 p-2.5 sm:p-4"
    >
      {/* Return to Main View pill whenever focused on a specific object or zone */}
      <AnimatePresence>
        {(activeZone !== "main" || activePanel !== null) && (
          <motion.button
            key="return-main-pill"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={returnToMain}
            className="pointer-events-auto holo-glass inline-flex items-center gap-2 rounded-full border border-[#3BF4B8]/30 px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#3BF4B8] transition hover:bg-[#3BF4B8]/15 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            RETOUR VUE PRINCIPALE
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sleek Zone Navigation Dock with Spring-Animated Active Indicator */}
      <nav
        aria-label="Navigation dans l'univers 3D"
        className="pointer-events-auto holo-glass holo-scroll flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#ECF3F7]/10 p-1.5 touch-pan-x"
      >
        {ZONE_ORDER.map((id) => {
          const z = ZONES[id];
          const Icon = ZONE_ICONS[id];
          const active = activeZone === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => (id === "main" ? returnToMain() : focusZone(id, true))}
              className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.14em] transition-colors cursor-pointer sm:px-3.5 ${
                active
                  ? "font-semibold text-[#04060A]"
                  : "text-[#9FB0BE] hover:bg-[#ECF3F7]/8 hover:text-[#ECF3F7]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="zone-dock-active"
                  transition={
                    reducedMotion
                      ? { duration: 0.01 }
                      : { type: "spring", stiffness: 420, damping: 32 }
                  }
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3BF4B8] to-[#5CF7D0] shadow-[0_0_24px_rgba(59,244,184,0.42)]"
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{z.shortLabel.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    </motion.div>
  );
}
