"use client";

import { Sun, Moon, RotateCcw, Layers, Cpu } from "lucide-react";
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

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-4 sm:p-6">
      {/* Left Brand Mark & Hologram Status */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          type="button"
          onClick={returnToMain}
          className="holo-glass flex items-center gap-3 rounded-full px-4 py-2 text-left transition hover:border-[#4EF2B8]/40 cursor-pointer"
        >
          <span className="h-2 w-2 rounded-full bg-[#4EF2B8] shadow-[0_0_10px_#4EF2B8]" />
          <div>
            <div className="font-display text-xs font-bold tracking-[0.2em] text-[#ECF3F7]">
              {PROFILE.experienceName}
            </div>
            <div className="hidden font-mono text-[9px] tracking-[0.22em] text-[#9FB0BE] sm:block">
              {PROFILE.signature}
            </div>
          </div>
        </button>

        {/* Live Laser Reconstruction Telemetry Pill */}
        <div className="holo-glass hidden items-center gap-2.5 rounded-full px-3.5 py-2 md:flex">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#ECF3F7]/10">
            <div
              className="h-full rounded-full bg-[#4EF2B8] transition-all duration-150"
              style={{ width: `${Math.round(hologramProgress * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.18em] text-[#9FB0BE]">
            {hologramStage}
          </span>
        </div>
      </div>

      {/* Right Control Cluster: Replay Laser, Quality, DAY/NIGHT, Classic Mode */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={replayHologram}
          title="Rejouer la reconstruction laser de l'hologramme"
          className="holo-glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-[#9FB0BE] transition hover:text-[#4EF2B8] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">LASER SCAN</span>
        </button>

        <button
          type="button"
          onClick={() => setQuality(NEXT_QUALITY[quality])}
          title="Ajuster la qualité graphique WebGL"
          className="holo-glass hidden items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-[#9FB0BE] transition hover:text-[#ECF3F7] sm:inline-flex cursor-pointer"
        >
          <Cpu className="h-3.5 w-3.5 text-[#4EF2B8]" />
          <span>{quality.toUpperCase()}</span>
        </button>

        {/* Persisted DAY / NIGHT Dynamic Atmosphere Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Basculer entre le mode Nuit et le mode Jour"
          className="holo-glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.18em] text-[#ECF3F7] transition hover:border-[#4EF2B8]/40 cursor-pointer"
        >
          {theme === "night" ? (
            <>
              <Moon className="h-3.5 w-3.5 text-[#4EF2B8]" />
              <span>NIGHT</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-300" />
              <span>DAY</span>
            </>
          )}
        </button>

        {/* Accessible Classic Portfolio Mode Switch */}
        <button
          type="button"
          onClick={() => setViewMode("classic")}
          className="holo-glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-[#ECF3F7] transition hover:bg-[#4EF2B8]/15 cursor-pointer"
        >
          <Layers className="h-3.5 w-3.5 text-[#4EF2B8]" />
          <span className="hidden sm:inline">CLASSIQUE</span>
        </button>
      </div>
    </header>
  );
}
