"use client";

import { useMemo, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import {
  Box,
  ExternalLink,
  Search,
  MessageCircle,
  Mail,
  Camera,
  Trophy,
  Gamepad2,
  Waves,
  ArrowUpRight,
  Check,
  Copy,
  X,
  Sparkles,
} from "lucide-react";
import { GitHubIcon, InstagramIcon } from "@/components/icons/BrandIcons";
import { ProjectVisualBlueprint } from "@/components/hud/panels/ProjectVisualBlueprint";
import { PROFILE } from "@/data/profile";
import type { ProjectCategory, ProjectItem } from "@/data/projects";
import { SKILL_CATEGORIES, SKILLS_INVENTORY, type SkillCategoryId } from "@/data/skills";
import { HOBBIES, HOBBIES_LIST, type HobbyId } from "@/data/hobbies";
import { useUniverseStore } from "@/store/useUniverseStore";

interface ClassicPortfolioProps {
  projects: ProjectItem[];
  syncSource: string;
  webglSupported: boolean;
}

export function ClassicPortfolio({
  projects,
  syncSource,
  webglSupported,
}: ClassicPortfolioProps) {
  const setViewMode = useUniverseStore((s) => s.setViewMode);
  const setPhase = useUniverseStore((s) => s.setPhase);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 32, restDelta: 0.001 });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "featured" | ProjectCategory>("all");
  const [showSecondary, setShowSecondary] = useState(false);
  const [modalProjectSlug, setModalProjectSlug] = useState<string | null>(null);

  const [skillCat, setSkillCat] = useState<"all" | SkillCategoryId>("all");
  const [selectedSkillId, setSelectedSkillId] = useState<string>(SKILLS_INVENTORY[0].id);

  const [activeHobby, setActiveHobby] = useState<HobbyId>("football");
  const [copiedPhone, setCopiedPhone] = useState(false);

  const featuredProjects = useMemo(
    () => projects.filter((p) => p.featured),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (!showSecondary && p.secondary && filter === "all" && !q) return false;
      if (filter === "featured" && !p.featured) return false;
      if (filter !== "all" && filter !== "featured" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.technologies.some((t) => t.toLowerCase().includes(q)) ||
        p.languages.some((l) => l.toLowerCase().includes(q))
      );
    });
  }, [projects, query, filter, showSecondary]);

  const modalProject = useMemo(
    () => projects.find((p) => p.slug === modalProjectSlug) ?? null,
    [projects, modalProjectSlug]
  );

  const activeSkill =
    SKILLS_INVENTORY.find((s) => s.id === selectedSkillId) ?? SKILLS_INVENTORY[0];

  const visibleSkills =
    skillCat === "all"
      ? SKILLS_INVENTORY
      : SKILLS_INVENTORY.filter((s) => s.category === skillCat);

  const linkedSkillProjects = useMemo(
    () => projects.filter((p) => activeSkill.repos.includes(p.slug)),
    [projects, activeSkill]
  );

  const activeCategory = skillCat === "all" ? activeSkill.category : skillCat;

  const hobbyIcons = {
    football: Trophy,
    gaming: Gamepad2,
    swimming: Waves,
  };
  const currentHobby = HOBBIES[activeHobby];
  const CurrentHobbyIcon = hobbyIcons[activeHobby];

  const copyPhone = () => {
    navigator.clipboard?.writeText(PROFILE.links.phoneDisplay).catch(() => {});
    setCopiedPhone(true);
    window.setTimeout(() => setCopiedPhone(false), 1800);
  };

  const selectCategoryOrbit = (catId: SkillCategoryId) => {
    setSkillCat((prev) => (prev === catId ? "all" : catId));
    const lead = SKILLS_INVENTORY.find((s) => s.category === catId);
    if (lead) setSelectedSkillId(lead.id);
  };

  return (
    <div className="relative min-h-screen bg-[#04060A] text-[#ECF3F7] selection:bg-[#3BF4B8]/25">
      {/* Sticky Minimalist Architectural Navbar + Live Scroll Progress Line */}
      <header className="sticky top-0 z-40 border-b border-[#ECF3F7]/8 bg-[#04060A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <a href="#home" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#3BF4B8] shadow-[0_0_10px_#3BF4B8]" />
            <span className="font-display text-sm font-extrabold tracking-[0.2em]">
              {PROFILE.experienceName}
            </span>
          </a>

          <nav className="hidden items-center gap-6 font-mono text-[11px] tracking-[0.16em] text-[#9FB0BE] md:flex">
            {[
              ["#home", "HOME"],
              ["#about", "ABOUT"],
              ["#projects", "PROJECTS"],
              ["#skills", "SKILLS"],
              ["#hobbies", "HOBBIES"],
              ["#contact", "CONTACT"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="transition hover:text-[#3BF4B8]">
                {label}
              </a>
            ))}
          </nav>

          {webglSupported && (
            <button
              type="button"
              onClick={() => {
                setPhase("active");
                setViewMode("3d");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#3BF4B8]/50 bg-[#3BF4B8]/12 px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#3BF4B8] transition hover:bg-[#3BF4B8] hover:text-[#04060A] cursor-pointer"
            >
              <Box className="h-3.5 w-3.5" />
              EXPLORER EN 3D
            </button>
          )}
        </div>

        {/* Continuous Spring Scroll Progress Hairline */}
        <motion.div
          style={{ scaleX }}
          className="h-[2px] origin-left bg-gradient-to-r from-[#3BF4B8] via-[#38BDF8] to-[#F5B971]"
        />
      </header>

      {/* ═══════════════ HOME — FULL-BLEED EDITORIAL STAGE ═══════════════ */}
      <section
        id="home"
        className="relative overflow-hidden border-b border-[#ECF3F7]/8 py-20 sm:py-28 lg:py-32"
      >
        <div
          className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full opacity-45 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(59,244,184,0.18) 0%, rgba(56,189,248,0.06) 50%, transparent 72%)",
          }}
        />
        <div className="noise-overlay pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex flex-wrap items-center gap-2.5 rounded-full border border-[#3BF4B8]/30 bg-[#3BF4B8]/10 px-4 py-1.5 font-mono text-[10px] tracking-[0.22em] text-[#3BF4B8] sm:text-[11px]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3BF4B8] animate-pulse" />
            <span>
              {PROFILE.handle} · {syncSource === "live-merged" ? "GITHUB LIVE SYNC" : "AUDIT VÉRIFIÉ"} · {projects.length} DÉPÔTS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0.9, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 font-display text-[1.75rem] font-extrabold leading-[1.08] tracking-[0.02em] sm:text-6xl sm:tracking-tight md:text-8xl"
          >
            <span className="text-gradient-hero">{PROFILE.experienceName}</span>
            <span className="mt-3 block font-mono text-base font-normal tracking-[0.22em] text-[#9FB0BE] sm:text-2xl sm:tracking-[0.28em] md:text-3xl">
              {PROFILE.signature}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0.9, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="mt-6 max-w-2xl text-sm leading-relaxed text-[#C9D6E0] sm:mt-7 sm:text-lg"
          >
            <strong className="font-semibold text-[#ECF3F7]">{PROFILE.name}</strong> —{" "}
            {PROFILE.roleTitle}. {PROFILE.about.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0.9, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-9 flex flex-wrap items-center gap-3.5 sm:mt-10"
          >
            {webglSupported && (
              <button
                type="button"
                onClick={() => {
                  setPhase("active");
                  setViewMode("3d");
                }}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#3BF4B8] px-7 py-3.5 font-mono text-xs font-bold tracking-[0.2em] text-[#04060A] transition hover:brightness-110 hover:shadow-[0_0_32px_rgba(59,244,184,0.4)] cursor-pointer"
              >
                <Box className="h-4 w-4" />
                LANCER L&apos;UNIVERS 3D
              </button>
            )}
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full border border-[#ECF3F7]/18 bg-[#080E16]/80 px-7 py-3.5 font-mono text-xs tracking-[0.2em] text-[#ECF3F7] transition hover:border-[#3BF4B8]/55"
            >
              VOIR LES PROJETS
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ ABOUT — STICKY BIOMETRIC DOSSIER + TIMELINE ═══════════════ */}
      <section id="about" className="border-b border-[#ECF3F7]/8 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
          {/* Left Sticky Biometric Identity Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs tracking-[0.24em] text-[#3BF4B8]">01 // ABOUT ME</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              {PROFILE.name}
            </h2>
            <p className="mt-1 font-mono text-xs text-[#9FB0BE]">
              {PROFILE.roleTitle} · DAKAR, {PROFILE.location.toUpperCase()}
            </p>

            <div className="mt-6 flex items-center gap-4 border-y border-[#ECF3F7]/10 py-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#3BF4B8]/40 bg-[#3BF4B8]/8 font-display text-xl font-extrabold text-[#3BF4B8]">
                CT
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] text-[#3BF4B8]">
                  IDENTITÉ NUMÉRIQUE // {PROFILE.handle}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
                  {PROFILE.fullNameObserved}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 border-l-2 border-[#3BF4B8]/40 pl-3 text-xs text-[#9FB0BE]">
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-[#3BF4B8]" />
              <span>{PROFILE.about.photoSlotNote}</span>
            </div>
          </div>

          {/* Right Vertical Scroll-Animated Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="relative space-y-10 pl-7 lg:col-span-7"
          >
            <div className="pointer-events-none absolute bottom-4 left-[9px] top-2 w-[1.5px] bg-gradient-to-b from-[#3BF4B8] via-[#38BDF8]/65 to-transparent" />

            <div className="relative">
              <span className="absolute -left-[25px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#3BF4B8] bg-[#04060A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3BF4B8]" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#3BF4B8]">
                PHASE 01 // PARCOURS ACADÉMIQUE
              </span>
              <h3 className="mt-1.5 font-display text-xl font-bold text-[#ECF3F7]">
                {PROFILE.about.academicContext}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#9FB0BE]">
                {PROFILE.about.academicNote}
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[25px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#38BDF8] bg-[#04060A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#38BDF8]">
                PHASE 02 // EXPERTISES &amp; AXES D&apos;INGÉNIERIE
              </span>
              <ul className="mt-3 divide-y divide-[#ECF3F7]/8 border-y border-[#ECF3F7]/8">
                {PROFILE.about.interests.map((item) => (
                  <li key={item} className="py-3 text-sm text-[#DCE6EE]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <span className="absolute -left-[25px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#F5B971] bg-[#04060A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B971]" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] text-[#F5B971]">
                PHASE 03 // OBJECTIFS
              </span>
              <ul className="mt-3 space-y-3">
                {PROFILE.about.objectives.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#C9D6E0]">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#3BF4B8]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ PROJECTS — DYNAMIC BLUEPRINT GALLERY + MODAL ═══════════════ */}
      <section id="projects" className="border-b border-[#ECF3F7]/8 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-mono text-xs tracking-[0.24em] text-[#3BF4B8]">
            02 // PROJECTS LAB ({projects.length} DÉPÔTS AUDITÉS)
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            Architecture &amp; Projets GitHub
          </h2>

          {/* Featured Asymmetric Editorial Showcase */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featuredProjects.slice(0, 3).map((p, idx) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                onClick={() => setModalProjectSlug(p.slug)}
                className="group hud-frame flex cursor-pointer flex-col justify-between rounded-2xl p-4 transition hover:border-[#3BF4B8]/45"
              >
                <div>
                  <ProjectVisualBlueprint project={p} />
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="font-mono text-[10px] font-semibold tracking-widest uppercase"
                      style={{ color: p.accentColor }}
                    >
                      FEATURED · {p.categoryLabel}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#9FB0BE] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#3BF4B8]" />
                  </div>
                  <h3 className="mt-2 font-display text-xl font-extrabold group-hover:text-[#3BF4B8]">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#C4D2DD]">
                    {p.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#ECF3F7]/10 pt-3 font-mono text-[10px] text-[#9FB0BE]">
                  <span>{p.technologies.slice(0, 3).join(" · ")}</span>
                  <span className="text-[#3BF4B8]">INSPECTER →</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-14 flex flex-col gap-4 border-b border-[#ECF3F7]/12 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9FB0BE]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer par nom, technologie, langage..."
                className="w-full bg-transparent py-2 pl-8 pr-3 text-xs text-[#ECF3F7] placeholder:text-[#9FB0BE]/60 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "Tous"],
                  ["featured", "Featured"],
                  ["personal", "Personnel"],
                  ["academic", "Académique"],
                  ["demo", "3D / Démo"],
                  ["collaboration", "Collaboration"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] tracking-wider transition cursor-pointer ${
                    filter === id
                      ? "bg-[#3BF4B8] font-bold text-[#04060A]"
                      : "border border-[#ECF3F7]/14 text-[#9FB0BE] hover:text-[#ECF3F7]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Hairline Architectural Index */}
          <div className="divide-y divide-[#ECF3F7]/10 border-b border-[#ECF3F7]/10">
            {filteredProjects.map((p) => (
              <div
                key={p.slug}
                onClick={() => setModalProjectSlug(p.slug)}
                className="group flex cursor-pointer flex-col gap-4 py-6 transition hover:bg-[#ECF3F7]/[0.02] md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <ProjectVisualBlueprint project={p} compact />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className="font-mono text-[10px] font-semibold uppercase"
                        style={{ color: p.accentColor }}
                      >
                        {p.categoryLabel}
                      </span>
                      <span className="font-mono text-[10px] text-[#9FB0BE]">· {p.statusLabel}</span>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-bold text-[#ECF3F7] group-hover:text-[#3BF4B8]">
                      {p.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-[#9FB0BE]">
                      {p.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="hidden flex-wrap justify-end gap-1.5 sm:flex max-w-[260px]">
                    {p.technologies.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded border border-[#ECF3F7]/10 bg-[#070C14] px-2 py-0.5 font-mono text-[10px] text-[#C8D6E2]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#9FB0BE] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#3BF4B8]" />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSecondary((s) => !s)}
            className="mt-6 rounded-full border border-dashed border-[#ECF3F7]/18 px-5 py-2.5 font-mono text-[10px] tracking-wider text-[#9FB0BE] transition hover:border-[#3BF4B8]/45 hover:text-[#ECF3F7] cursor-pointer"
          >
            {showSecondary
              ? "Masquer les dépôts v1 / exercices / vide"
              : "Afficher l'audit complet des 16 dépôts (incluant v1, exercice et dépôt vide)"}
          </button>
        </div>
      </section>

      {/* ═══════════════ SKILLS — INTERACTIVE CONSTELLATION + MATRIX ═══════════════ */}
      <section id="skills" className="border-b border-[#ECF3F7]/8 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-mono text-xs tracking-[0.24em] text-[#38BDF8]">
            03 // SKILLS UNIVERSE
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            Système de Compétences Observées
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* Interactive SVG Orbital Constellation */}
            <div className="hud-frame rounded-2xl p-5 lg:col-span-5">
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-[#9FB0BE]">
                <span>CONSTELLATION // CLIQUER UN PÔLE</span>
                <button
                  type="button"
                  onClick={() => setSkillCat("all")}
                  className="text-[#3BF4B8] hover:underline cursor-pointer"
                >
                  {skillCat === "all" ? "TOUTES" : "RÉINITIALISER"}
                </button>
              </div>
              <svg viewBox="0 0 320 240" className="mt-2 h-64 w-full">
                <circle cx="160" cy="120" r="46" fill="none" stroke="rgba(59,244,184,0.18)" strokeDasharray="3 4" />
                <circle cx="160" cy="120" r="88" fill="none" stroke="rgba(56,189,248,0.18)" />
                {SKILL_CATEGORIES.map((cat, idx) => {
                  const ang = (idx / SKILL_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
                  const rad = idx % 2 === 0 ? 88 : 74;
                  const nx = Math.round((160 + Math.cos(ang) * rad) * 10) / 10;
                  const ny = Math.round((120 + Math.sin(ang) * rad) * 10) / 10;
                  const activeC = activeCategory === cat.id;
                  return (
                    <g
                      key={cat.id}
                      onClick={() => selectCategoryOrbit(cat.id)}
                      className="cursor-pointer"
                    >
                      <line
                        x1="160"
                        y1="120"
                        x2={nx}
                        y2={ny}
                        stroke={activeC ? cat.color : "rgba(236,243,247,0.16)"}
                        strokeWidth={activeC ? 1.8 : 1}
                      />
                      <circle
                        cx={nx}
                        cy={ny}
                        r={activeC ? 9.5 : 7}
                        fill={activeC ? cat.color : "#09121C"}
                        stroke={cat.color}
                        strokeWidth="1.6"
                      />
                      <text
                        x={nx}
                        y={ny < 120 ? ny - 14 : ny + 20}
                        textAnchor="middle"
                        fill={activeC ? "#ECF3F7" : "#9FB0BE"}
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {cat.shortLabel.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
                <circle cx="160" cy="120" r="22" fill="#061218" stroke="#3BF4B8" strokeWidth="1.6" />
                <text x="160" y="123" textAnchor="middle" fill="#3BF4B8" fontSize="8" fontFamily="monospace">
                  CORE
                </text>
              </svg>
            </div>

            {/* Right Synchronized Dossier & Selectors */}
            <div className="space-y-6 lg:col-span-7">
              <div className="rounded-2xl border border-[#3BF4B8]/25 bg-[#070E17] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-2xl font-extrabold">{activeSkill.name}</h3>
                  <span className="rounded-full bg-[#3BF4B8]/15 px-3 py-1 font-mono text-[10px] tracking-widest text-[#3BF4B8]">
                    {activeSkill.source === "observed-in-repos"
                      ? "OBSERVÉ DANS LES DÉPÔTS GITHUB"
                      : "COMPÉTENCE À CONFIRMER"}
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[#C9D6E0]">
                  {activeSkill.description}
                </p>

                {/* Honest 16-Repo Presence Telemetry */}
                <div className="mt-4">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#9FB0BE]">
                    <span>COUVERTURE RÉELLE ({activeSkill.repos.length} / {projects.length} DÉPÔTS)</span>
                    <span className="text-[#3BF4B8]">{activeSkill.repos.length} REPOS</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-16 gap-1">
                    {Array.from({ length: projects.length }).map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 rounded-[2px]"
                        style={{
                          backgroundColor:
                            i < activeSkill.repos.length
                              ? activeSkill.accent
                              : "rgba(236,243,247,0.08)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {linkedSkillProjects.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {linkedSkillProjects.map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setModalProjectSlug(p.slug)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#3BF4B8]/35 bg-[#3BF4B8]/10 px-3 py-1 font-mono text-[11px] text-[#ECF3F7] transition hover:bg-[#3BF4B8]/25 cursor-pointer"
                      >
                        {p.title}
                        <ArrowUpRight className="h-3 w-3 text-[#3BF4B8]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {visibleSkills.map((sk) => (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => setSelectedSkillId(sk.id)}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition cursor-pointer ${
                      sk.id === activeSkill.id
                        ? "border-[#3BF4B8] bg-[#3BF4B8]/12"
                        : "border-[#ECF3F7]/10 bg-[#070B12] hover:border-[#ECF3F7]/30"
                    }`}
                  >
                    <span className="truncate font-display text-xs font-semibold">{sk.name}</span>
                    <span className="ml-2 font-mono text-[9px] text-[#9FB0BE]">
                      {sk.repos.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOBBIES — 3-UNIVERSE INTERACTIVE STAGE SWITCHER ═══════════════ */}
      <section id="hobbies" className="border-b border-[#ECF3F7]/8 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs tracking-[0.24em] text-[#3BF4B8]">04 // HOBBIES</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
                Trois Univers Complémentaires
              </h2>
            </div>

            <div className="inline-flex rounded-full border border-[#ECF3F7]/12 bg-[#070C14] p-1">
              {HOBBIES_LIST.map((h) => {
                const Icon = hobbyIcons[h.id];
                const isAct = h.id === activeHobby;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setActiveHobby(h.id)}
                    className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[10px] tracking-wider transition cursor-pointer ${
                      isAct ? "font-bold text-[#04060A]" : "text-[#9FB0BE] hover:text-[#ECF3F7]"
                    }`}
                  >
                    {isAct && (
                      <motion.span
                        layoutId="classic-hobby-pill"
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: h.accent }}
                      />
                    )}
                    <Icon className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{h.title.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentHobby.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 grid gap-8 rounded-2xl border border-[#ECF3F7]/10 bg-[#060B12] p-6 sm:p-8 lg:grid-cols-12"
            >
              <div className="flex flex-col justify-center lg:col-span-5">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: `${currentHobby.accent}18`,
                    borderColor: `${currentHobby.accent}40`,
                    color: currentHobby.accent,
                  }}
                >
                  <CurrentHobbyIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-3xl font-extrabold">{currentHobby.title}</h3>
                <p className="mt-1 font-mono text-xs text-[#9FB0BE]">{currentHobby.subtitle}</p>
                <p className="mt-4 text-sm leading-relaxed text-[#DCE6EE]">
                  {currentHobby.summary}
                </p>
              </div>

              <div className="space-y-4 lg:col-span-7">
                <ul className="divide-y divide-[#ECF3F7]/10 border-y border-[#ECF3F7]/10">
                  {currentHobby.highlights.map((item, i) => (
                    <li key={item} className="flex items-center gap-3 py-3 text-sm text-[#DCE6EE]">
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: currentHobby.accent }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className="border-l-2 pl-4 py-1 text-sm text-[#C9D6E0]"
                  style={{ borderColor: currentHobby.accent }}
                >
                  {currentHobby.connectionToCode}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════ CONTACT — MONUMENTAL EDITORIAL UPLINK ═══════════════ */}
      <section id="contact" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-mono text-xs tracking-[0.24em] text-[#3BF4B8]">
            05 // CONTACT STATION
          </p>
          <div className="mt-3 flex flex-col justify-between gap-6 border-b border-[#ECF3F7]/10 pb-8 md:flex-row md:items-end">
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Échangeons sur un projet.
            </h2>
            <button
              type="button"
              onClick={copyPhone}
              className="inline-flex items-center gap-2 self-start rounded-full border border-[#3BF4B8]/40 bg-[#3BF4B8]/10 px-5 py-2.5 font-mono text-xs text-[#3BF4B8] transition hover:bg-[#3BF4B8]/20 cursor-pointer"
            >
              {copiedPhone ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedPhone ? `COPIÉ (${PROFILE.links.phoneDisplay})` : PROFILE.links.phoneDisplay}
            </button>
          </div>

          <div className="divide-y divide-[#ECF3F7]/10 border-b border-[#ECF3F7]/10">
            <a
              href={PROFILE.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-5 transition hover:pl-2"
            >
              <div className="flex items-center gap-4">
                <MessageCircle className="h-5 w-5 text-[#3BF4B8]" />
                <div>
                  <div className="font-display text-lg font-bold">WhatsApp Direct</div>
                  <div className="font-mono text-xs text-[#3BF4B8]">
                    {PROFILE.links.phoneDisplay}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-[#9FB0BE] transition group-hover:text-[#3BF4B8]" />
            </a>

            <a
              href={PROFILE.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-5 transition hover:pl-2"
            >
              <div className="flex items-center gap-4">
                <GitHubIcon className="h-5 w-5" />
                <div>
                  <div className="font-display text-lg font-bold">GitHub</div>
                  <div className="font-mono text-xs text-[#9FB0BE]">
                    github.com/c0d3r-cheikh06
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-[#9FB0BE] transition group-hover:text-[#3BF4B8]" />
            </a>

            <a
              href={PROFILE.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-5 transition hover:pl-2"
            >
              <div className="flex items-center gap-4">
                <InstagramIcon className="h-5 w-5" />
                <div>
                  <div className="font-display text-lg font-bold">Instagram</div>
                  <div className="font-mono text-xs text-[#9FB0BE]">@_xtypx01_</div>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-[#9FB0BE] transition group-hover:text-[#38BDF8]" />
            </a>

            <div className="flex items-center justify-between py-5">
              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-[#9FB0BE]" />
                <div>
                  <div className="font-display text-lg font-bold">E-mail</div>
                  <div className="font-mono text-xs text-[#9FB0BE]">
                    {PROFILE.links.email ?? "Emplacement configurable dans src/data/profile.ts"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[#9FB0BE]">
            <span>
              {PROFILE.experienceName} — {PROFILE.signature}
            </span>
            <span>
              {PROFILE.name} ({PROFILE.handle})
            </span>
          </footer>
        </div>
      </section>

      {/* Immersive Animated Project Detail Modal */}
      <AnimatePresence>
        {modalProject && (
          <motion.div
            key="classic-project-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.05 : 0.22 }}
            onClick={() => setModalProjectSlug(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="hud-frame holo-scroll max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 sm:p-7"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#ECF3F7]/10 pb-3.5">
                <span
                  className="font-mono text-[10px] font-semibold tracking-widest uppercase"
                  style={{ color: modalProject.accentColor }}
                >
                  {modalProject.categoryLabel} · {modalProject.statusLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setModalProjectSlug(null)}
                  aria-label="Fermer les détails du projet"
                  className="rounded-full p-1.5 text-[#9FB0BE] transition hover:bg-[#ECF3F7]/10 hover:text-[#ECF3F7] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <ProjectVisualBlueprint project={modalProject} />
                <div>
                  <h3 className="font-display text-2xl font-extrabold sm:text-3xl">
                    {modalProject.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#DCE6EE]">
                    {modalProject.description}
                  </p>
                </div>

                <div className="rounded-xl border border-[#ECF3F7]/10 bg-[#070C14] p-4">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#3BF4B8]">
                    ARCHITECTURE VÉRIFIÉE
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#C9D6E0]">
                    {modalProject.architecture}
                  </p>
                </div>

                <ul className="space-y-2">
                  {modalProject.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#DCE6EE]">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: modalProject.accentColor }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={modalProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#3BF4B8] px-5 py-3 font-mono text-xs font-bold text-[#04060A] transition hover:brightness-110"
                  >
                    <GitHubIcon className="h-4 w-4" />
                    VOIR SUR GITHUB
                  </a>
                  {modalProject.demoUrl && (
                    <a
                      href={modalProject.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#3BF4B8]/50 bg-[#3BF4B8]/10 px-5 py-3 font-mono text-xs font-semibold text-[#ECF3F7] transition hover:bg-[#3BF4B8]/22"
                    >
                      <ExternalLink className="h-4 w-4 text-[#3BF4B8]" />
                      DÉMO EN LIGNE
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
