"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZONES } from "@/data/zones";
import { useUniverseStore, type SkyTheme } from "@/store/useUniverseStore";

/**
 * Spatial optical transition veil for zone jumps & day/night atmospheric shifts.
 * Strictly `pointer-events-none` so orbit/drag and 3D flight remain instant and responsive.
 */
export function SpatialTransition() {
  const phase = useUniverseStore((s) => s.phase);
  const activeZone = useUniverseStore((s) => s.activeZone);
  const cameraVersion = useUniverseStore((s) => s.cameraVersion);
  const theme = useUniverseStore((s) => s.theme);
  const reducedMotion = useUniverseStore((s) => s.reducedMotion);

  const [sectorPulseKey, setSectorPulseKey] = useState(0);
  const [themeRipple, setThemeRipple] = useState<{ key: number; to: SkyTheme } | null>(null);
  const prevThemeRef = useRef<SkyTheme | null>(null);
  const prevCamVerRef = useRef(cameraVersion);

  useEffect(() => {
    if (phase !== "active" || reducedMotion) {
      prevCamVerRef.current = cameraVersion;
      return;
    }
    if (cameraVersion === prevCamVerRef.current) return;
    prevCamVerRef.current = cameraVersion;
    const t0 = window.setTimeout(() => setSectorPulseKey((k) => k + 1), 0);
    const t1 = window.setTimeout(() => setSectorPulseKey(0), 540);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [cameraVersion, phase, reducedMotion]);

  useEffect(() => {
    if (prevThemeRef.current === null) {
      prevThemeRef.current = theme;
      return;
    }
    if (prevThemeRef.current === theme || reducedMotion) {
      prevThemeRef.current = theme;
      return;
    }
    prevThemeRef.current = theme;
    const k = Date.now();
    const t0 = window.setTimeout(() => setThemeRipple({ key: k, to: theme }), 0);
    const t1 = window.setTimeout(() => setThemeRipple(null), 780);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [theme, reducedMotion]);

  const zoneMeta = ZONES[activeZone] ?? ZONES.main;

  return (
    <div className="pointer-events-none fixed inset-0 z-25 overflow-hidden">
      {/* Horizontal Optical Sweep + Sector Reticle Lock on Zone Navigation */}
      <AnimatePresence>
        {sectorPulseKey > 0 && (
          <motion.div
            key={`sector-${sectorPulseKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="absolute inset-0"
          >
            <motion.div
              initial={{ y: "0vh", opacity: 0.85 }}
              animate={{ y: "100vh", opacity: 0 }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#3BF4B8] to-transparent shadow-[0_0_24px_rgba(59,244,184,0.85)]"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
              className="absolute left-1/2 top-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-[#3BF4B8]/35 bg-[#04060A]/75 px-3.5 py-1 font-mono text-[10px] tracking-[0.24em] text-[#3BF4B8] backdrop-blur-md sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#3BF4B8] animate-pulse" />
              <span>SECTOR LOCK // {zoneMeta.label.toUpperCase()}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanding Radial Atmospheric Wave on NIGHT <-> DAY Toggle */}
      <AnimatePresence>
        {themeRipple && (
          <motion.div
            key={`ripple-${themeRipple.key}`}
            initial={{ scale: 0.15, opacity: 0.72 }}
            animate={{ scale: 2.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 h-[75vmax] w-[75vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              borderColor:
                themeRipple.to === "day"
                  ? "rgba(245, 185, 113, 0.55)"
                  : "rgba(56, 189, 248, 0.55)",
              background:
                themeRipple.to === "day"
                  ? "radial-gradient(circle, rgba(245,185,113,0.16) 0%, rgba(245,185,113,0) 68%)"
                  : "radial-gradient(circle, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 68%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
