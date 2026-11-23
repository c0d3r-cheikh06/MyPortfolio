"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ProjectItem } from "@/data/projects";
import { useUniverseStore, type ActivePanel } from "@/store/useUniverseStore";
import { AboutPanel } from "./panels/AboutPanel";
import { ProjectsPanel } from "./panels/ProjectsPanel";
import { SkillsPanel } from "./panels/SkillsPanel";
import { HobbyPanel } from "./panels/HobbyPanel";
import { ContactPanel } from "./panels/ContactPanel";

interface HoloPanelsProps {
  projects: ProjectItem[];
  syncSource: string;
}

const PANEL_META: Record<Exclude<ActivePanel, null>, { title: string; accent: string }> = {
  about: { title: "DOSSIER // CHEIKH THIAM", accent: "#3BF4B8" },
  projects: { title: "PROJECTS LAB // GITHUB AUDIT", accent: "#3BF4B8" },
  skills: { title: "SKILLS UNIVERSE // TECH MATRIX", accent: "#38BDF8" },
  football: { title: "HOBBY // FOOTBALL ARENA", accent: "#4EF2B8" },
  gaming: { title: "HOBBY // GAMING STATION", accent: "#38BDF8" },
  swimming: { title: "HOBBY // AQUATIC POD", accent: "#22D3EE" },
  contact: { title: "COMMS // CONTACT STATION", accent: "#3BF4B8" },
};

export function HoloPanels({ projects, syncSource }: HoloPanelsProps) {
  const activePanel = useUniverseStore((s) => s.activePanel);
  const openPanel = useUniverseStore((s) => s.openPanel);
  const selectedProjectSlug = useUniverseStore((s) => s.selectedProjectSlug);
  const selectProject = useUniverseStore((s) => s.selectProject);
  const selectedSkillId = useUniverseStore((s) => s.selectedSkillId);
  const selectSkill = useUniverseStore((s) => s.selectSkill);
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const replayHologram = useUniverseStore((s) => s.replayHologram);

  const isExpandedDetail = activePanel === "projects" && Boolean(selectedProjectSlug);
  const meta = activePanel ? PANEL_META[activePanel] : null;

  return (
    <AnimatePresence mode="wait">
      {activePanel && meta && (
        <motion.aside
          key={activePanel}
          initial={{ opacity: 0, x: 44, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 34, scale: 0.985 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className={`hud-frame fixed inset-x-2.5 bottom-18 top-16 z-30 flex flex-col overflow-hidden rounded-2xl transition-[max-width] duration-300 sm:left-auto sm:bottom-20 sm:right-6 sm:top-20 sm:w-[calc(100vw-3rem)] ${
            isExpandedDetail ? "sm:max-w-[680px]" : "sm:max-w-[500px]"
          }`}
        >
          {/* Accent Top Signature Hairline */}
          <div
            className="h-[2px] w-full shrink-0"
            style={{
              background: `linear-gradient(90deg, ${meta.accent}, transparent 78%)`,
            }}
          />

          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-[#ECF3F7]/10 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: meta.accent,
                  boxShadow: `0 0 10px ${meta.accent}`,
                }}
              />
              <span
                className="font-mono text-[10px] tracking-[0.22em] uppercase sm:text-[11px]"
                style={{ color: meta.accent }}
              >
                {meta.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openPanel(null)}
              aria-label="Fermer le panneau"
              className="rounded-full p-1.5 text-[#9FB0BE] transition hover:bg-[#ECF3F7]/10 hover:text-[#ECF3F7] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Panel Scrollable Body */}
          <div className="holo-scroll flex-1 overflow-y-auto p-4 sm:p-6">
            {activePanel === "about" && (
              <AboutPanel
                projects={projects}
                onOpenProject={selectProject}
                onReplay={replayHologram}
              />
            )}
            {activePanel === "projects" && (
              <ProjectsPanel
                projects={projects}
                selectedSlug={selectedProjectSlug}
                onSelect={selectProject}
                syncSource={syncSource}
              />
            )}
            {activePanel === "skills" && (
              <SkillsPanel
                projects={projects}
                selectedSkillId={selectedSkillId}
                onSelectSkill={selectSkill}
                onOpenProject={selectProject}
              />
            )}
            {(activePanel === "football" ||
              activePanel === "gaming" ||
              activePanel === "swimming") && (
              <HobbyPanel hobbyId={activePanel} onSwitchHobby={selectHobby} />
            )}
            {activePanel === "contact" && <ContactPanel />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
