"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ProjectItem } from "@/data/projects";
import { SKILL_CATEGORIES, SKILLS_INVENTORY, type SkillCategoryId } from "@/data/skills";

interface SkillsPanelProps {
  projects: ProjectItem[];
  selectedSkillId: string | null;
  onSelectSkill: (id: string | null) => void;
  onOpenProject: (slug: string) => void;
}

export function SkillsPanel({
  projects,
  selectedSkillId,
  onSelectSkill,
  onOpenProject,
}: SkillsPanelProps) {
  const [catFilter, setCatFilter] = useState<"all" | SkillCategoryId>("all");
  const reduced = useReducedMotion();

  const activeSkill = useMemo(
    () =>
      SKILLS_INVENTORY.find((s) => s.id === selectedSkillId) ??
      SKILLS_INVENTORY[0],
    [selectedSkillId]
  );

  const visibleSkills = useMemo(
    () =>
      catFilter === "all"
        ? SKILLS_INVENTORY
        : SKILLS_INVENTORY.filter((s) => s.category === catFilter),
    [catFilter]
  );

  const linkedProjects = useMemo(
    () => projects.filter((p) => activeSkill.repos.includes(p.slug)),
    [projects, activeSkill]
  );

  const activeCategory = catFilter === "all" ? activeSkill.category : catFilter;

  const selectCategoryFromConstellation = (catId: SkillCategoryId) => {
    setCatFilter((prev) => (prev === catId ? "all" : catId));
    const lead = SKILLS_INVENTORY.find((s) => s.category === catId);
    if (lead) onSelectSkill(lead.id);
  };

  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-[#9FB0BE]">
        Inventaire issu de l&apos;analyse réelle des dépôts GitHub — aucun pourcentage ni niveau de
        maîtrise artificiel n&apos;est fabriqué.
      </p>

      {/* Interactive SVG Holographic Constellation Map */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ECF3F7]/10 bg-[#050A11] p-3">
        <div className="flex items-center justify-between px-1 pb-1 font-mono text-[9px] tracking-[0.2em] text-[#9FB0BE]">
          <span>RADAR CONSTELLATION // 8 DOMAINES</span>
          <button
            type="button"
            onClick={() => setCatFilter("all")}
            className="text-[#3BF4B8] hover:underline cursor-pointer"
          >
            {catFilter === "all" ? "VUE GLOBALE" : "RÉINITIALISER"}
          </button>
        </div>

        <svg viewBox="0 0 320 210" className="h-44 w-full" aria-label="Constellation des compétences">
          {/* Concentric telemetry rings */}
          <circle cx="160" cy="105" r="42" fill="none" stroke="rgba(59,244,184,0.16)" strokeDasharray="3 4" />
          <circle cx="160" cy="105" r="76" fill="none" stroke="rgba(56,189,248,0.16)" />

          {SKILL_CATEGORIES.map((cat, idx) => {
            const ang = (idx / SKILL_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
            const radius = idx % 2 === 0 ? 78 : 66;
            const nx = Math.round((160 + Math.cos(ang) * radius) * 10) / 10;
            const ny = Math.round((105 + Math.sin(ang) * radius) * 10) / 10;
            const isActiveCat = activeCategory === cat.id;

            return (
              <g
                key={cat.id}
                onClick={() => selectCategoryFromConstellation(cat.id)}
                className="cursor-pointer"
              >
                <line
                  x1="160"
                  y1="105"
                  x2={nx}
                  y2={ny}
                  stroke={isActiveCat ? cat.color : "rgba(236,243,247,0.14)"}
                  strokeWidth={isActiveCat ? 1.8 : 1}
                />
                {isActiveCat && !reduced && (
                  <motion.circle
                    cx={nx}
                    cy={ny}
                    r="13"
                    fill="none"
                    stroke={cat.color}
                    strokeOpacity="0.55"
                    animate={{ scale: [0.9, 1.3, 0.9], opacity: [0.8, 0.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                  />
                )}
                <circle
                  cx={nx}
                  cy={ny}
                  r={isActiveCat ? 9 : 6.5}
                  fill={isActiveCat ? cat.color : "#09131E"}
                  stroke={cat.color}
                  strokeWidth="1.6"
                />
                <text
                  x={nx}
                  y={ny < 105 ? ny - 13 : ny + 18}
                  textAnchor="middle"
                  fill={isActiveCat ? "#ECF3F7" : "#9FB0BE"}
                  fontSize="7.6"
                  fontFamily="monospace"
                >
                  {cat.shortLabel.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Center Core Node */}
          <circle cx="160" cy="105" r="20" fill="#061318" stroke="#3BF4B8" strokeWidth="1.6" />
          <text x="160" y="103" textAnchor="middle" fill="#3BF4B8" fontSize="6.5" fontFamily="monospace">
            CHEIKH
          </text>
          <text x="160" y="112" textAnchor="middle" fill="#ECF3F7" fontSize="6.5" fontFamily="monospace">
            CORE
          </text>
        </svg>
      </div>

      {/* Focused Technology Dossier */}
      <div className="relative overflow-hidden rounded-2xl border border-[#3BF4B8]/25 bg-[#070E17]/92 p-4">
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: activeSkill.accent }}
        />
        <div className="flex items-center justify-between gap-2 pl-2">
          <h3 className="font-display text-lg font-extrabold text-[#ECF3F7]">
            {activeSkill.name}
          </h3>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] tracking-wider ${
              activeSkill.source === "observed-in-repos"
                ? "bg-[#3BF4B8]/15 text-[#3BF4B8]"
                : "bg-amber-400/15 text-amber-300"
            }`}
          >
            {activeSkill.source === "observed-in-repos" ? "OBSERVÉ DANS GITHUB" : "À CONFIRMER"}
          </span>
        </div>

        <p className="mt-2 pl-2 text-xs leading-relaxed text-[#DCE6EE]">
          {activeSkill.description}
        </p>

        {/* Honest Repository Coverage Matrix (exact repo count across 16 audited repos, zero fake %) */}
        <div className="mt-3.5 pl-2">
          <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.18em] text-[#9FB0BE]">
            <span>PRÉSENCE RÉELLE EN DÉPÔTS</span>
            <span className="text-[#3BF4B8]">
              {activeSkill.repos.length} / {projects.length} DÉPÔTS
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-16 gap-1">
            {Array.from({ length: projects.length }).map((_, i) => {
              const lit = i < activeSkill.repos.length;
              return (
                <span
                  key={i}
                  className="h-1.5 rounded-[2px] transition-colors"
                  style={{
                    backgroundColor: lit ? activeSkill.accent : "rgba(236,243,247,0.08)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Related Technologies */}
        <div className="mt-3.5 pl-2">
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#9FB0BE]">
            ÉCOSYSTÈME ASSOCIÉ
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeSkill.related.map((rel) => (
              <span
                key={rel}
                className="rounded border border-[#ECF3F7]/12 bg-[#ECF3F7]/5 px-2 py-0.5 font-mono text-[10px] text-[#C8D6E2]"
              >
                {rel}
              </span>
            ))}
          </div>
        </div>

        {/* Projects Using This Skill */}
        {linkedProjects.length > 0 && (
          <div className="mt-3.5 pl-2">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#3BF4B8]">
              DÉPÔTS AUDITÉS ({linkedProjects.length})
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {linkedProjects.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => onOpenProject(p.slug)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#3BF4B8]/30 bg-[#3BF4B8]/10 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] transition hover:bg-[#3BF4B8]/25 cursor-pointer"
                >
                  {p.title}
                  <ArrowUpRight className="h-3 w-3 text-[#3BF4B8]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCatFilter("all")}
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition cursor-pointer ${
            catFilter === "all"
              ? "bg-[#3BF4B8] font-bold text-[#04060A]"
              : "border border-[#ECF3F7]/12 text-[#9FB0BE] hover:text-[#ECF3F7]"
          }`}
        >
          Toutes (8)
        </button>
        {SKILL_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatFilter(c.id)}
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition cursor-pointer ${
              catFilter === c.id
                ? "bg-[#3BF4B8] font-bold text-[#04060A]"
                : "border border-[#ECF3F7]/12 text-[#9FB0BE] hover:text-[#ECF3F7]"
            }`}
          >
            {c.shortLabel}
          </button>
        ))}
      </div>

      {/* Sleek Architectural Tech Index Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {visibleSkills.map((sk) => {
          const isSel = sk.id === activeSkill.id;
          return (
            <motion.button
              key={sk.id}
              layout
              type="button"
              onClick={() => onSelectSkill(sk.id)}
              className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition cursor-pointer ${
                isSel
                  ? "border-[#3BF4B8]/60 bg-[#3BF4B8]/12"
                  : "border-[#ECF3F7]/8 bg-[#060B12]/70 hover:border-[#ECF3F7]/24"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: sk.accent }}
                />
                <span className="truncate font-display text-xs font-semibold text-[#ECF3F7]">
                  {sk.name}
                </span>
              </div>
              <span className="ml-2 shrink-0 font-mono text-[9px] text-[#9FB0BE]">
                {sk.repos.length}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
