"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Search,
} from "lucide-react";
import { GitHubIcon } from "@/components/icons/BrandIcons";
import type { ProjectCategory, ProjectItem } from "@/data/projects";
import { ProjectVisualBlueprint } from "./ProjectVisualBlueprint";

interface ProjectsPanelProps {
  projects: ProjectItem[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  syncSource: string;
}

const FILTER_CHIPS: { id: "all" | "featured" | ProjectCategory; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "featured", label: "Featured" },
  { id: "personal", label: "Personnel" },
  { id: "academic", label: "Académique" },
  { id: "demo", label: "3D / Démo" },
  { id: "collaboration", label: "Collab" },
];

export function ProjectsPanel({
  projects,
  selectedSlug,
  onSelect,
  syncSource,
}: ProjectsPanelProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "featured" | ProjectCategory>("all");
  const [showSecondary, setShowSecondary] = useState(false);

  const selectedIndex = useMemo(
    () => (selectedSlug ? projects.findIndex((p) => p.slug === selectedSlug) : -1),
    [projects, selectedSlug]
  );
  const selectedProject = selectedIndex >= 0 ? projects[selectedIndex] : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (!showSecondary && p.secondary && categoryFilter === "all" && !q) return false;
      if (categoryFilter === "featured" && !p.featured) return false;
      if (
        categoryFilter !== "all" &&
        categoryFilter !== "featured" &&
        p.category !== categoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q)) ||
        p.languages.some((l) => l.toLowerCase().includes(q))
      );
    });
  }, [projects, query, categoryFilter, showSecondary]);

  if (selectedProject) {
    const prevProj = projects[(selectedIndex - 1 + projects.length) % projects.length];
    const nextProj = projects[(selectedIndex + 1) % projects.length];

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedProject.slug}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Top Navigation Bar: Back + Prev/Next */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-[#3BF4B8] transition hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              RETOUR À LA GALERIE ({projects.length} DÉPÔTS)
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(prevProj.slug)}
                title={prevProj.title}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ECF3F7]/14 bg-[#070C14] text-[#9FB0BE] transition hover:border-[#3BF4B8]/45 hover:text-[#ECF3F7] cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[10px] text-[#9FB0BE]">
                {String(selectedIndex + 1).padStart(2, "0")}/{String(projects.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => onSelect(nextProj.slug)}
                title={nextProj.title}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ECF3F7]/14 bg-[#070C14] text-[#9FB0BE] transition hover:border-[#3BF4B8]/45 hover:text-[#ECF3F7] cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Immersive Animated Blueprint Stage Header */}
          <div className="space-y-3">
            <ProjectVisualBlueprint project={selectedProject} />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold"
                style={{
                  backgroundColor: `${selectedProject.accentColor}22`,
                  color: selectedProject.accentColor,
                }}
              >
                {selectedProject.categoryLabel}
              </span>
              <span className="font-mono text-[10px] text-[#9FB0BE]">
                {selectedProject.owner}/{selectedProject.slug} · MAJ {selectedProject.pushedAt}
              </span>
            </div>

            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#ECF3F7] sm:text-3xl">
              {selectedProject.title}
            </h2>
          </div>

          {/* Editorial Split Grid: Narrative & Verified Engineering Spec */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#3BF4B8]">
                  VISION &amp; SYNTHÈSE
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#DCE6EE]">
                  {selectedProject.description}
                </p>
              </div>
              <div className="border-l-2 border-[#3BF4B8]/45 pl-3">
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#9FB0BE]">
                  OBJECTIF
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#C9D6E0]">
                  {selectedProject.objective}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#ECF3F7]/10 bg-[#070C14]/85 p-3.5">
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#38BDF8]">
                  ARCHITECTURE VÉRIFIÉE
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#DCE6EE]">
                  {selectedProject.architecture}
                </p>
              </div>

              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#3BF4B8]">
                  STACK TECHNIQUE
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedProject.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-[#3BF4B8]/25 bg-[#3BF4B8]/8 px-2 py-0.5 font-mono text-[10px] text-[#ECF3F7]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Verified Features Checklist */}
          {selectedProject.features.length > 0 && (
            <div className="border-t border-[#ECF3F7]/10 pt-4">
              <div className="font-mono text-[10px] tracking-[0.22em] text-[#3BF4B8]">
                FONCTIONNALITÉS VÉRIFIÉES DANS LE CODE
              </div>
              <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {selectedProject.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs leading-relaxed text-[#DCE6EE]"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: selectedProject.accentColor }}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Primary Actions */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <a
              href={selectedProject.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#3BF4B8] px-5 py-3 font-mono text-xs font-bold tracking-wider text-[#04060A] transition hover:brightness-110"
            >
              <GitHubIcon className="h-4 w-4" />
              VOIR SUR GITHUB
            </a>
            {selectedProject.demoUrl && (
              <a
                href={selectedProject.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3BF4B8]/50 bg-[#3BF4B8]/10 px-5 py-3 font-mono text-xs font-semibold tracking-wider text-[#ECF3F7] transition hover:bg-[#3BF4B8]/22"
              >
                <ExternalLink className="h-4 w-4 text-[#3BF4B8]" />
                DÉMO EN LIGNE
              </a>
            )}
          </div>

          <p className="border-t border-[#ECF3F7]/10 pt-3 text-[11px] text-[#9FB0BE]/75">
            Audit factuel : {selectedProject.categoryEvidence} {selectedProject.mediaNote}
          </p>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-[11px] text-[#9FB0BE]">
        <span>Sélectionnez un terminal 3D ou un blueprint</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#3BF4B8]">
          <GitBranch className="h-3 w-3" />
          {syncSource === "live-merged" ? "SYNC LIVE" : "AUDIT VERIFIÉ"}
        </span>
      </div>

      {/* Sleek Underline Search Bar */}
      <div className="relative border-b border-[#ECF3F7]/15 focus-within:border-[#3BF4B8]">
        <Search className="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9FB0BE]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par projet, Next.js, FastAPI, PHP, Room..."
          className="w-full bg-transparent py-2.5 pl-8 pr-2 text-xs text-[#ECF3F7] placeholder:text-[#9FB0BE]/55 focus:outline-none"
        />
      </div>

      {/* Kinetic Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_CHIPS.map((chip) => {
          const active = categoryFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategoryFilter(chip.id)}
              className={`rounded-full px-3 py-1 font-mono text-[10px] tracking-wider transition cursor-pointer ${
                active
                  ? "bg-[#3BF4B8] font-bold text-[#04060A]"
                  : "border border-[#ECF3F7]/12 bg-[#070C14]/80 text-[#9FB0BE] hover:text-[#ECF3F7]"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Architectural Blueprint Showcase Index */}
      <div className="divide-y divide-[#ECF3F7]/10 border-y border-[#ECF3F7]/10">
        {filtered.map((p, idx) => (
          <motion.button
            key={p.slug}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.22) }}
            onClick={() => onSelect(p.slug)}
            className="group flex w-full items-center gap-3.5 py-3.5 text-left transition hover:bg-[#ECF3F7]/[0.03] cursor-pointer"
          >
            <ProjectVisualBlueprint project={p} compact />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[9px] font-semibold tracking-wider uppercase"
                  style={{ color: p.accentColor }}
                >
                  {p.categoryLabel}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9FB0BE] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#3BF4B8]" />
              </div>

              <h3 className="mt-0.5 truncate font-display text-base font-bold text-[#ECF3F7] group-hover:text-[#3BF4B8]">
                {p.title}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#9FB0BE]">
                {p.tagline}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                {p.technologies.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded border border-[#ECF3F7]/10 bg-[#060B12] px-1.5 py-0.5 font-mono text-[9px] text-[#C8D6E2]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowSecondary((s) => !s)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[#ECF3F7]/16 py-2.5 font-mono text-[10px] tracking-wider text-[#9FB0BE] transition hover:border-[#3BF4B8]/45 hover:text-[#ECF3F7] cursor-pointer"
      >
        <span>
          {showSecondary
            ? "MASQUER LES ITÉRATIONS V1 / EXERCICES / DÉPÔT VIDE"
            : `EXPLORER L'AUDIT COMPLET (${projects.length} DÉPÔTS)`}
        </span>
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
