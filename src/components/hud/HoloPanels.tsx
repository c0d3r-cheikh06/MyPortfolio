"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Search,
  Check,
  Copy,
  MessageCircle,
  Mail,
  Camera,
  Sparkles,
  Trophy,
  Gamepad2,
  Waves,
  ArrowUpRight,
  GitBranch,
  RotateCcw,
} from "lucide-react";
import { GitHubIcon, InstagramIcon } from "@/components/icons/BrandIcons";
import { PROFILE } from "@/data/profile";
import type { ProjectItem, ProjectCategory } from "@/data/projects";
import { SKILL_CATEGORIES, SKILLS_INVENTORY, type SkillCategoryId } from "@/data/skills";
import { HOBBIES, HOBBIES_LIST, type HobbyId } from "@/data/hobbies";
import { useUniverseStore } from "@/store/useUniverseStore";

interface HoloPanelsProps {
  projects: ProjectItem[];
  syncSource: string;
}

export function HoloPanels({ projects, syncSource }: HoloPanelsProps) {
  const activePanel = useUniverseStore((s) => s.activePanel);
  const openPanel = useUniverseStore((s) => s.openPanel);
  const selectedProjectSlug = useUniverseStore((s) => s.selectedProjectSlug);
  const selectProject = useUniverseStore((s) => s.selectProject);
  const selectedSkillId = useUniverseStore((s) => s.selectedSkillId);
  const selectSkill = useUniverseStore((s) => s.selectSkill);
  const selectHobby = useUniverseStore((s) => s.selectHobby);
  const replayHologram = useUniverseStore((s) => s.replayHologram);

  return (
    <AnimatePresence>
      {activePanel && (
        <motion.aside
          key={activePanel}
          initial={{ opacity: 0, x: 40, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 32, scale: 0.98 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-20 right-3 top-20 z-30 flex w-[calc(100vw-1.5rem)] max-w-[500px] flex-col overflow-hidden rounded-2xl holo-glass sm:right-6"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-[#ECF3F7]/10 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#4EF2B8]" />
              <span className="font-mono text-[11px] tracking-[0.24em] text-[#4EF2B8] uppercase">
                {activePanel === "about" && "DOSSIER // CHEIKH THIAM"}
                {activePanel === "projects" && "PROJECTS LAB // GITHUB AUDIT"}
                {activePanel === "skills" && "SKILLS UNIVERSE // TECH MATRIX"}
                {activePanel === "football" && "HOBBY // FOOTBALL ARENA"}
                {activePanel === "gaming" && "HOBBY // GAMING STATION"}
                {activePanel === "swimming" && "HOBBY // AQUATIC POD"}
                {activePanel === "contact" && "COMMS // CONTACT STATION"}
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
          <div className="holo-scroll flex-1 overflow-y-auto p-5">
            {activePanel === "about" && (
              <AboutPanelContent
                projects={projects}
                onOpenProject={selectProject}
                onReplay={replayHologram}
              />
            )}
            {activePanel === "projects" && (
              <ProjectsPanelContent
                projects={projects}
                selectedSlug={selectedProjectSlug}
                onSelect={selectProject}
                syncSource={syncSource}
              />
            )}
            {activePanel === "skills" && (
              <SkillsPanelContent
                projects={projects}
                selectedSkillId={selectedSkillId}
                onSelectSkill={selectSkill}
                onOpenProject={selectProject}
              />
            )}
            {(activePanel === "football" ||
              activePanel === "gaming" ||
              activePanel === "swimming") && (
              <HobbyPanelContent hobbyId={activePanel} onSwitchHobby={selectHobby} />
            )}
            {activePanel === "contact" && <ContactPanelContent />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── ABOUT ME PANEL ───────────────────────── */
function AboutPanelContent({
  projects,
  onOpenProject,
  onReplay,
}: {
  projects: ProjectItem[];
  onOpenProject: (slug: string) => void;
  onReplay: () => void;
}) {
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-[#4EF2B8]">
            {PROFILE.handle}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#ECF3F7]">
            {PROFILE.name}
          </h2>
          <p className="mt-0.5 text-sm text-[#9FB0BE]">{PROFILE.roleTitle}</p>
        </div>
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#4EF2B8]/35 bg-[#4EF2B8]/10 px-3 py-1.5 font-mono text-[10px] tracking-wider text-[#4EF2B8] transition hover:bg-[#4EF2B8]/20 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          REPLAY LASER
        </button>
      </div>

      {/* Personal Portrait Photo Slot (Part 10) */}
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-[#4EF2B8]/30 bg-[#0B121B]/75 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#ECF3F7]/12 bg-[#111A26] text-[#4EF2B8]">
          <Camera className="h-6 w-6" />
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
            PORTRAIT PHOTOGRAPHIQUE (À INTÉGRER)
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
            {PROFILE.about.photoSlotNote}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[#DCE6EE]">{PROFILE.about.intro}</p>

      {/* Academic Context */}
      <div className="rounded-xl border border-[#ECF3F7]/10 bg-[#0C131D]/70 p-4">
        <h3 className="font-mono text-[10px] tracking-[0.22em] text-[#4EF2B8]">
          PARCOURS ACADÉMIQUE
        </h3>
        <p className="mt-2 text-sm text-[#ECF3F7]">{PROFILE.about.academicContext}</p>
        <p className="mt-1.5 text-[11px] text-[#9FB0BE]/80">{PROFILE.about.academicNote}</p>
      </div>

      {/* Computing Interests */}
      <div>
        <h3 className="font-mono text-[10px] tracking-[0.22em] text-[#4EF2B8]">
          INTÉRÊTS INFORMATIQUES
        </h3>
        <ul className="mt-2.5 space-y-2">
          {PROFILE.about.interests.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-[#DCE6EE]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4EF2B8]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Professional Objectives */}
      <div>
        <h3 className="font-mono text-[10px] tracking-[0.22em] text-[#4EF2B8]">
          OBJECTIFS PROFESSIONNELS
        </h3>
        <ul className="mt-2.5 space-y-2">
          {PROFILE.about.objectives.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-[#9FB0BE]">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4EF2B8]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Notable Projects Quick Links */}
      <div>
        <h3 className="font-mono text-[10px] tracking-[0.22em] text-[#4EF2B8]">
          PROJETS MARQUANTS
        </h3>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {featured.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onOpenProject(p.slug)}
              className="group rounded-xl border border-[#ECF3F7]/10 bg-[#0D1520]/80 p-3 text-left transition hover:border-[#4EF2B8]/45 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xs font-semibold text-[#ECF3F7]">
                  {p.title}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#9FB0BE] transition group-hover:text-[#4EF2B8]" />
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-[#9FB0BE]">{p.tagline}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="border-t border-[#ECF3F7]/10 pt-3 font-mono text-[10px] text-[#9FB0BE]/70">
        {PROFILE.roleNote}
      </p>
    </div>
  );
}

/* ───────────────────────── PROJECTS LAB PANEL ───────────────────────── */
function ProjectsPanelContent({
  projects,
  selectedSlug,
  onSelect,
  syncSource,
}: {
  projects: ProjectItem[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  syncSource: string;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "featured" | ProjectCategory>("all");
  const [showSecondary, setShowSecondary] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((p) => p.slug === selectedSlug) ?? null,
    [projects, selectedSlug]
  );

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
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8] hover:underline cursor-pointer"
        >
          ← RETOUR À LA GALERIE ({projects.length} DÉPÔTS AUDITÉS)
        </button>

        {/* Synthesized Visual Blueprint Header (honest representation, no fake screenshot) */}
        <div
          className="relative overflow-hidden rounded-xl border border-[#ECF3F7]/12 p-4"
          style={{
            background: `linear-gradient(135deg, rgba(10,16,24,0.95), ${selectedProject.accentColor}1c)`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium"
              style={{
                backgroundColor: `${selectedProject.accentColor}22`,
                color: selectedProject.accentColor,
              }}
            >
              {selectedProject.categoryLabel}
            </span>
            <span className="font-mono text-[10px] text-[#9FB0BE]">
              {selectedProject.statusLabel}
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-[#ECF3F7]">
            {selectedProject.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-[#9FB0BE]">
            {selectedProject.owner}/{selectedProject.slug} · MAJ {selectedProject.pushedAt}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#DCE6EE]">{selectedProject.description}</p>

        <div className="rounded-xl border border-[#ECF3F7]/10 bg-[#0B121B]/80 p-3.5">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">OBJECTIF</div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#C9D6E0]">
            {selectedProject.objective}
          </p>
        </div>

        <div className="rounded-xl border border-[#ECF3F7]/10 bg-[#0B121B]/80 p-3.5">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
            ARCHITECTURE VÉRIFIÉE
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#C9D6E0]">
            {selectedProject.architecture}
          </p>
        </div>

        {selectedProject.features.length > 0 && (
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
              FONCTIONNALITÉS VÉRIFIÉES DANS LE CODE
            </div>
            <ul className="mt-2 space-y-2">
              {selectedProject.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs leading-relaxed text-[#DCE6EE]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4EF2B8]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technologies & Languages */}
        <div className="space-y-2">
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
            TECHNOLOGIES &amp; LANGAGES
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedProject.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-[#4EF2B8]/25 bg-[#4EF2B8]/8 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Action Links */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <a
            href={selectedProject.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4EF2B8] px-4 py-2.5 font-mono text-xs font-semibold text-[#04070B] transition hover:brightness-110"
          >
            <GitHubIcon className="h-4 w-4" />
            VOIR SUR GITHUB
          </a>
          {selectedProject.demoUrl && (
            <a
              href={selectedProject.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#4EF2B8]/45 bg-[#4EF2B8]/10 px-4 py-2.5 font-mono text-xs font-semibold text-[#ECF3F7] transition hover:bg-[#4EF2B8]/20"
            >
              <ExternalLink className="h-4 w-4 text-[#4EF2B8]" />
              DÉMO EN LIGNE
            </a>
          )}
        </div>

        <p className="text-[11px] text-[#9FB0BE]/75">
          Audit factuel : {selectedProject.categoryEvidence} {selectedProject.mediaNote}
        </p>
      </div>
    );
  }

  const filterChips: { id: "all" | "featured" | ProjectCategory; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "featured", label: "Featured" },
    { id: "personal", label: "Personnel" },
    { id: "academic", label: "Académique" },
    { id: "demo", label: "3D / Démo" },
    { id: "collaboration", label: "Collab" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] text-[#9FB0BE]">
        <span>Cliquez un terminal 3D ou un projet ci-dessous</span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#4EF2B8]">
          <GitBranch className="h-3 w-3" />
          {syncSource === "live-merged" ? "SYNC LIVE" : "AUDIT VERIFIÉ"}
        </span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9FB0BE]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher projet, Next.js, FastAPI, PHP, Android..."
          className="w-full rounded-xl border border-[#ECF3F7]/12 bg-[#0A1018] py-2.5 pl-9 pr-3 text-xs text-[#ECF3F7] placeholder:text-[#9FB0BE]/60 focus:border-[#4EF2B8]/50 focus:outline-none"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setCategoryFilter(chip.id)}
            className={`rounded-full px-3 py-1 font-mono text-[10px] tracking-wider transition cursor-pointer ${
              categoryFilter === chip.id
                ? "bg-[#4EF2B8] font-semibold text-[#04070B]"
                : "border border-[#ECF3F7]/12 bg-[#0C131D] text-[#9FB0BE] hover:text-[#ECF3F7]"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Project Cards List */}
      <div className="space-y-2.5">
        {filtered.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => onSelect(p.slug)}
            className="group w-full rounded-xl border border-[#ECF3F7]/10 bg-[#0B121B]/85 p-3.5 text-left transition hover:border-[#4EF2B8]/45 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.accentColor }}
                  />
                  <h3 className="font-display text-sm font-semibold text-[#ECF3F7] group-hover:text-[#4EF2B8]">
                    {p.title}
                  </h3>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-[#9FB0BE]">
                  {p.categoryLabel} · {p.statusLabel}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9FB0BE] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#4EF2B8]" />
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#C4D2DD]">{p.tagline}</p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {p.technologies.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded bg-[#ECF3F7]/6 px-2 py-0.5 font-mono text-[9px] text-[#9FB0BE]"
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Exhaustive audit toggle (v1 iterations, exercises, empty repo) */}
      <button
        type="button"
        onClick={() => setShowSecondary((s) => !s)}
        className="w-full rounded-xl border border-dashed border-[#ECF3F7]/15 py-2 font-mono text-[10px] tracking-wider text-[#9FB0BE] transition hover:border-[#4EF2B8]/40 hover:text-[#ECF3F7] cursor-pointer"
      >
        {showSecondary
          ? "MASQUER LES ITÉRATIONS V1 / EXERCICES / DÉPÔT VIDE"
          : "AFFICHER AUSSI LES ITÉRATIONS V1, EXERCICES & DÉPÔT VIDE (AUDIT COMPLET 16 DÉPÔTS)"}
      </button>
    </div>
  );
}

/* ───────────────────────── SKILLS UNIVERSE PANEL ───────────────────────── */
function SkillsPanelContent({
  projects,
  selectedSkillId,
  onSelectSkill,
  onOpenProject,
}: {
  projects: ProjectItem[];
  selectedSkillId: string | null;
  onSelectSkill: (id: string | null) => void;
  onOpenProject: (slug: string) => void;
}) {
  const [catFilter, setCatFilter] = useState<"all" | SkillCategoryId>("all");

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

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-[#9FB0BE]">
        Inventaire issu de l&apos;analyse réelle des dépôts GitHub — aucun pourcentage ou niveau de
        maîtrise artificiel n&apos;est fabriqué.
      </p>

      {/* Active Skill Detail Card */}
      <div className="rounded-xl border border-[#4EF2B8]/25 bg-[#0A131C]/90 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-[#ECF3F7]">{activeSkill.name}</h3>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] tracking-wider ${
              activeSkill.source === "observed-in-repos"
                ? "bg-[#4EF2B8]/15 text-[#4EF2B8]"
                : "bg-amber-400/15 text-amber-300"
            }`}
          >
            {activeSkill.source === "observed-in-repos"
              ? "OBSERVÉ DANS GITHUB"
              : "À CONFIRMER"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#DCE6EE]">{activeSkill.description}</p>

        {/* Related Technologies */}
        <div className="mt-3">
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#9FB0BE]">
            TECHNOLOGIES ASSOCIÉES
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
          <div className="mt-3.5">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#4EF2B8]">
              PROJETS UTILISANT CETTE TECHNOLOGIE ({linkedProjects.length})
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {linkedProjects.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => onOpenProject(p.slug)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#4EF2B8]/30 bg-[#4EF2B8]/10 px-2.5 py-1 font-mono text-[10px] text-[#ECF3F7] transition hover:bg-[#4EF2B8]/25 cursor-pointer"
                >
                  {p.title}
                  <ArrowUpRight className="h-3 w-3 text-[#4EF2B8]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCatFilter("all")}
          className={`rounded-full px-2.5 py-1 font-mono text-[10px] transition cursor-pointer ${
            catFilter === "all"
              ? "bg-[#4EF2B8] font-semibold text-[#04070B]"
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
                ? "bg-[#4EF2B8] font-semibold text-[#04070B]"
                : "border border-[#ECF3F7]/12 text-[#9FB0BE] hover:text-[#ECF3F7]"
            }`}
          >
            {c.shortLabel}
          </button>
        ))}
      </div>

      {/* Selectable Tech Grid */}
      <div className="grid grid-cols-2 gap-2">
        {visibleSkills.map((sk) => {
          const isSel = sk.id === activeSkill.id;
          return (
            <button
              key={sk.id}
              type="button"
              onClick={() => onSelectSkill(sk.id)}
              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                isSel
                  ? "border-[#4EF2B8] bg-[#4EF2B8]/12"
                  : "border-[#ECF3F7]/10 bg-[#0C131D]/75 hover:border-[#ECF3F7]/30"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: sk.accent }}
                />
                <span className="truncate font-display text-xs font-semibold text-[#ECF3F7]">
                  {sk.name}
                </span>
              </div>
              <div className="mt-1 font-mono text-[9px] text-[#9FB0BE]">
                {sk.repos.length} dépôt{sk.repos.length > 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── HOBBIES PANEL ───────────────────────── */
function HobbyPanelContent({
  hobbyId,
  onSwitchHobby,
}: {
  hobbyId: HobbyId;
  onSwitchHobby: (id: HobbyId) => void;
}) {
  const hobby = HOBBIES[hobbyId];
  const icons = {
    football: Trophy,
    gaming: Gamepad2,
    swimming: Waves,
  };
  const ActiveIcon = icons[hobbyId];

  return (
    <div className="space-y-5">
      {/* Quick switch between the 3 Hobby Spaces */}
      <div className="grid grid-cols-3 gap-2">
        {HOBBIES_LIST.map((h) => {
          const Icon = icons[h.id];
          const active = h.id === hobbyId;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSwitchHobby(h.id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 font-mono text-[10px] tracking-wider transition cursor-pointer ${
                active
                  ? "border-[#4EF2B8] bg-[#4EF2B8]/15 text-[#ECF3F7]"
                  : "border-[#ECF3F7]/10 bg-[#0B121B] text-[#9FB0BE] hover:text-[#ECF3F7]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {h.title.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#ECF3F7]/10 bg-[#0B121B]/85 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${hobby.accent}20`, color: hobby.accent }}
          >
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#ECF3F7]">{hobby.title}</h2>
            <p className="font-mono text-[11px] text-[#9FB0BE]">{hobby.subtitle}</p>
          </div>
        </div>
        <p className="mt-3.5 text-sm leading-relaxed text-[#DCE6EE]">{hobby.summary}</p>
      </div>

      <div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
          CE QUE CETTE PASSION APPORTE
        </div>
        <ul className="mt-2.5 space-y-2">
          {hobby.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-[#DCE6EE]">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: hobby.accent }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#4EF2B8]/20 bg-[#4EF2B8]/6 p-4">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#4EF2B8]">
          LIEN AVEC LE DÉVELOPPEMENT
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[#DCE6EE]">{hobby.connectionToCode}</p>
      </div>

      <p className="text-[11px] text-[#9FB0BE]/75">{hobby.personalNote}</p>
    </div>
  );
}

/* ───────────────────────── CONTACT STATION PANEL ───────────────────────── */
function ContactPanelContent() {
  const [copied, setCopied] = useState(false);

  const copyPhone = () => {
    navigator.clipboard?.writeText(PROFILE.links.phoneDisplay).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-[#ECF3F7]">
          Station de Communication
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
          Échangeons autour d&apos;un projet, d&apos;une collaboration technique ou d&apos;une
          opportunité en développement logiciel.
        </p>
      </div>

      <div className="space-y-2.5">
        {/* WhatsApp */}
        <a
          href={PROFILE.links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-[#4EF2B8]/30 bg-[#4EF2B8]/8 p-4 transition hover:bg-[#4EF2B8]/16"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4EF2B8]/20 text-[#4EF2B8]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-[#ECF3F7]">WhatsApp Direct</div>
              <div className="font-mono text-xs text-[#4EF2B8]">{PROFILE.links.phoneDisplay}</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#4EF2B8] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        {/* GitHub */}
        <a
          href={PROFILE.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-[#ECF3F7]/12 bg-[#0B121B]/85 p-4 transition hover:border-[#4EF2B8]/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECF3F7]/10 text-[#ECF3F7]">
              <GitHubIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-[#ECF3F7]">GitHub</div>
              <div className="font-mono text-xs text-[#9FB0BE]">github.com/c0d3r-cheikh06</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#9FB0BE] transition group-hover:text-[#4EF2B8]" />
        </a>

        {/* Instagram */}
        <a
          href={PROFILE.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-[#ECF3F7]/12 bg-[#0B121B]/85 p-4 transition hover:border-[#4EF2B8]/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECF3F7]/10 text-[#ECF3F7]">
              <InstagramIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-[#ECF3F7]">Instagram</div>
              <div className="font-mono text-xs text-[#9FB0BE]">@_xtypx01_</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#9FB0BE] transition group-hover:text-[#4EF2B8]" />
        </a>

        {/* Dedicated Configurable Email Slot (Part 11) */}
        <div className="flex items-center justify-between rounded-xl border border-dashed border-[#ECF3F7]/18 bg-[#0A1018]/75 p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECF3F7]/8 text-[#9FB0BE]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-[#ECF3F7]">
                Adresse E-mail
              </div>
              <div className="font-mono text-[11px] text-[#9FB0BE]">
                {PROFILE.links.email ?? "Emplacement dédié — à configurer dans src/data/profile.ts"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={copyPhone}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#ECF3F7]/14 bg-[#0D1520] py-2.5 font-mono text-xs text-[#ECF3F7] transition hover:border-[#4EF2B8]/40 cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-[#4EF2B8]" />
            NUMÉRO COPIÉ ({PROFILE.links.phoneDisplay})
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-[#9FB0BE]" />
            COPIER {PROFILE.links.phoneDisplay}
          </>
        )}
      </button>
    </div>
  );
}
