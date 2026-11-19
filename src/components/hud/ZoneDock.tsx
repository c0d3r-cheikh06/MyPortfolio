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

  if (phase !== "active") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2.5 p-3 sm:p-5">
      {/* Return to Main View pill whenever focused on a specific object or zone */}
      {(activeZone !== "main" || activePanel !== null) && (
        <button
          type="button"
          onClick={returnToMain}
          className="pointer-events-auto holo-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8] transition hover:bg-[#4EF2B8]/15 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETOUR VUE PRINCIPALE
        </button>
      )}

      {/* Sleek Zone Navigation Dock */}
      <nav
        aria-label="Navigation dans l'univers 3D"
        className="pointer-events-auto holo-glass holo-scroll flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5"
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
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.15em] transition-all cursor-pointer ${
                active
                  ? "bg-[#4EF2B8] font-semibold text-[#04070B] shadow-[0_0_20px_rgba(78,242,184,0.35)]"
                  : "text-[#9FB0BE] hover:bg-[#ECF3F7]/8 hover:text-[#ECF3F7]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{z.shortLabel.toUpperCase()}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
