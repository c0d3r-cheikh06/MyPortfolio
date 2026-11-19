"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { GitHubIcon, InstagramIcon } from "@/components/icons/BrandIcons";
import { PROFILE } from "@/data/profile";
import type { ProjectCategory, ProjectItem } from "@/data/projects";
import { SKILL_CATEGORIES, SKILLS_INVENTORY, type SkillCategoryId } from "@/data/skills";
import { HOBBIES_LIST } from "@/data/hobbies";
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

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "featured" | ProjectCategory>("all");
  const [showSecondary, setShowSecondary] = useState(false);
  const [skillCat, setSkillCat] = useState<"all" | SkillCategoryId>("all");
  const [selectedSkillId, setSelectedSkillId] = useState<string>(SKILLS_INVENTORY[0].id);

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

  const activeSkill =
    SKILLS_INVENTORY.find((s) => s.id === selectedSkillId) ?? SKILLS_INVENTORY[0];

  const visibleSkills =
    skillCat === "all"
      ? SKILLS_INVENTORY
      : SKILLS_INVENTORY.filter((s) => s.category === skillCat);

  const hobbyIcons = {
    football: Trophy,
    gaming: Gamepad2,
    swimming: Waves,
  };

  return (
    <div className="min-h-screen bg-[#04070B] text-[#ECF3F7]">
      {/* Sticky Minimalist Header */}
      <header className="sticky top-0 z-40 border-b border-[#ECF3F7]/8 bg-[#04070B]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#home" className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#4EF2B8]" />
            <span className="font-display text-sm font-bold tracking-[0.2em]">
              {PROFILE.experienceName}
            </span>
          </a>

          <nav className="hidden items-center gap-6 font-mono text-[11px] tracking-[0.16em] text-[#9FB0BE] md:flex">
            <a href="#home" className="transition hover:text-[#ECF3F7]">
              HOME
            </a>
            <a href="#about" className="transition hover:text-[#ECF3F7]">
              ABOUT
            </a>
            <a href="#projects" className="transition hover:text-[#ECF3F7]">
              PROJECTS
            </a>
            <a href="#skills" className="transition hover:text-[#ECF3F7]">
              SKILLS
            </a>
            <a href="#hobbies" className="transition hover:text-[#ECF3F7]">
              HOBBIES
            </a>
            <a href="#contact" className="transition hover:text-[#ECF3F7]">
              CONTACT
            </a>
          </nav>

          {webglSupported && (
            <button
              type="button"
              onClick={() => {
                setPhase("active");
                setViewMode("3d");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[#4EF2B8]/50 bg-[#4EF2B8]/12 px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#4EF2B8] transition hover:bg-[#4EF2B8] hover:text-[#04070B] cursor-pointer"
            >
              <Box className="h-3.5 w-3.5" />
              EXPLORER EN 3D
            </button>
          )}
        </div>
      </header>

      {/* HOME */}
      <section id="home" className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#4EF2B8]/25 bg-[#4EF2B8]/8 px-3.5 py-1 font-mono text-[11px] tracking-[0.22em] text-[#4EF2B8]">
          {PROFILE.handle} · {syncSource === "live-merged" ? "GITHUB LIVE SYNC" : "AUDIT VÉRIFIÉ"}
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          {PROFILE.experienceName}
          <span className="mt-2 block text-2xl font-normal tracking-[0.22em] text-[#9FB0BE] sm:text-3xl">
            {PROFILE.signature}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#C4D2DD]">
          {PROFILE.name} — {PROFILE.roleTitle}. {PROFILE.about.intro}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {webglSupported && (
            <button
              type="button"
              onClick={() => {
                setPhase("active");
                setViewMode("3d");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#4EF2B8] px-6 py-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#04070B] transition hover:brightness-110 cursor-pointer"
            >
              <Box className="h-4 w-4" />
              LANCER L&apos;UNIVERS 3D
            </button>
          )}
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full border border-[#ECF3F7]/15 px-6 py-3 font-mono text-xs tracking-[0.2em] text-[#ECF3F7] transition hover:border-[#4EF2B8]/45"
          >
            VOIR LES PROJETS
          </a>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="border-t border-[#ECF3F7]/8 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-mono text-xs tracking-[0.22em] text-[#4EF2B8]">01 // ABOUT ME</p>
            <h2 className="mt-2 font-display text-3xl font-bold">{PROFILE.name}</h2>
            <p className="mt-1 font-mono text-xs text-[#9FB0BE]">{PROFILE.roleTitle}</p>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-[#4EF2B8]/30 bg-[#0B1119] p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#121C29] text-[#4EF2B8]">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-xs leading-relaxed text-[#9FB0BE]">
                {PROFILE.about.photoSlotNote}
              </p>
            </div>
          </div>

          <div className="space-y-6 md:col-span-7">
            <div className="rounded-2xl border border-[#ECF3F7]/10 bg-[#0A1018] p-6">
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-[#4EF2B8]">
                PARCOURS ACADÉMIQUE
              </h3>
              <p className="mt-2 text-sm text-[#ECF3F7]">{PROFILE.about.academicContext}</p>
              <p className="mt-1.5 text-xs text-[#9FB0BE]">{PROFILE.about.academicNote}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#ECF3F7]/10 bg-[#0A1018] p-5">
                <h3 className="font-mono text-[11px] tracking-[0.2em] text-[#4EF2B8]">
                  DOMAINES D&apos;INTÉRÊT
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-[#C8D6E2]">
                  {PROFILE.about.interests.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#ECF3F7]/10 bg-[#0A1018] p-5">
                <h3 className="font-mono text-[11px] tracking-[0.2em] text-[#4EF2B8]">
                  OBJECTIFS
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-[#C8D6E2]">
                  {PROFILE.about.objectives.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects" className="border-t border-[#ECF3F7]/8 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs tracking-[0.22em] text-[#4EF2B8]">
            02 // PROJECTS LAB ({projects.length} DÉPÔTS AUDITÉS)
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold">Projets GitHub Vérifiés</h2>

          {/* Featured Highlight Strip */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredProjects.slice(0, 3).map((p) => (
              <div
                key={p.slug}
                className="flex flex-col justify-between rounded-2xl border border-[#4EF2B8]/25 bg-[#0A111A] p-5"
              >
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#4EF2B8]">
                    FEATURED · {p.categoryLabel.toUpperCase()}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#C4D2DD]">{p.description}</p>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <a
                    href={p.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-[#4EF2B8] hover:underline"
                  >
                    <GitHubIcon className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                  {p.demoUrl && (
                    <a
                      href={p.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-[#ECF3F7] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Démo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9FB0BE]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer par nom, technologie, langage..."
                className="w-full rounded-xl border border-[#ECF3F7]/12 bg-[#0A1018] py-2.5 pl-9 pr-3 text-xs text-[#ECF3F7] placeholder:text-[#9FB0BE]/60 focus:border-[#4EF2B8]/50 focus:outline-none"
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
                  className={`rounded-full px-3 py-1.5 font-mono text-[10px] tracking-wider transition cursor-pointer ${
                    filter === id
                      ? "bg-[#4EF2B8] font-semibold text-[#04070B]"
                      : "border border-[#ECF3F7]/12 text-[#9FB0BE] hover:text-[#ECF3F7]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* All Projects Grid */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredProjects.map((p) => (
              <article
                key={p.slug}
                className="flex flex-col justify-between rounded-2xl border border-[#ECF3F7]/10 bg-[#0A1018] p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-[#4EF2B8]">{p.categoryLabel}</span>
                    <span className="font-mono text-[10px] text-[#9FB0BE]">{p.statusLabel}</span>
                  </div>
                  <h3 className="mt-1.5 font-display text-lg font-bold">{p.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#C4D2DD]">{p.description}</p>
                  <p className="mt-2 font-mono text-[11px] text-[#9FB0BE]">{p.architecture}</p>

                  {p.features.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-[#C4D2DD]">
                      {p.features.slice(0, 3).map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.technologies.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-[#ECF3F7]/10 bg-[#ECF3F7]/5 px-2 py-0.5 font-mono text-[10px] text-[#C8D6E2]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#ECF3F7]/8 pt-3">
                  <span className="font-mono text-[10px] text-[#9FB0BE]">
                    {p.owner}/{p.slug}
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-[#4EF2B8] hover:underline"
                    >
                      GitHub <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-[#ECF3F7] hover:underline"
                      >
                        Démo <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSecondary((s) => !s)}
            className="mt-5 rounded-xl border border-dashed border-[#ECF3F7]/15 px-4 py-2 font-mono text-[10px] tracking-wider text-[#9FB0BE] hover:border-[#4EF2B8]/40 hover:text-[#ECF3F7] cursor-pointer"
          >
            {showSecondary
              ? "Masquer les dépôts v1 / exercices / vide"
              : "Afficher l'audit complet des 16 dépôts (incluant v1, exercice et dépôt vide)"}
          </button>
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" className="border-t border-[#ECF3F7]/8 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs tracking-[0.22em] text-[#4EF2B8]">03 // SKILLS UNIVERSE</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Technologies Observées</h2>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSkillCat("all")}
              className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] cursor-pointer ${
                skillCat === "all"
                  ? "bg-[#4EF2B8] font-semibold text-[#04070B]"
                  : "border border-[#ECF3F7]/12 text-[#9FB0BE]"
              }`}
            >
              Toutes
            </button>
            {SKILL_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSkillCat(c.id)}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] cursor-pointer ${
                  skillCat === c.id
                    ? "bg-[#4EF2B8] font-semibold text-[#04070B]"
                    : "border border-[#ECF3F7]/12 text-[#9FB0BE]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:col-span-7">
              {visibleSkills.map((sk) => (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => setSelectedSkillId(sk.id)}
                  className={`rounded-xl border p-3.5 text-left transition cursor-pointer ${
                    sk.id === activeSkill.id
                      ? "border-[#4EF2B8] bg-[#4EF2B8]/10"
                      : "border-[#ECF3F7]/10 bg-[#0A1018] hover:border-[#ECF3F7]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold">{sk.name}</span>
                    <span className="font-mono text-[9px] text-[#9FB0BE]">
                      {sk.repos.length} repo{sk.repos.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-[#4EF2B8]/25 bg-[#0A121B] p-6 lg:col-span-5">
              <div className="font-mono text-[10px] tracking-widest text-[#4EF2B8]">
                {activeSkill.source === "observed-in-repos"
                  ? "OBSERVÉ DANS LES DÉPÔTS GITHUB"
                  : "COMPÉTENCE À CONFIRMER"}
              </div>
              <h3 className="mt-2 font-display text-2xl font-bold">{activeSkill.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C8D6E2]">
                {activeSkill.description}
              </p>
              <div className="mt-4">
                <div className="font-mono text-[10px] text-[#9FB0BE]">DÉPÔTS CONCERNÉS</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeSkill.repos.map((r) => (
                    <span
                      key={r}
                      className="rounded-md border border-[#4EF2B8]/30 bg-[#4EF2B8]/10 px-2.5 py-1 font-mono text-[11px]"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <div className="font-mono text-[10px] text-[#9FB0BE]">ASSOCIÉES</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeSkill.related.map((r) => (
                    <span
                      key={r}
                      className="rounded-md border border-[#ECF3F7]/12 px-2.5 py-1 font-mono text-[11px] text-[#9FB0BE]"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOBBIES */}
      <section id="hobbies" className="border-t border-[#ECF3F7]/8 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs tracking-[0.22em] text-[#4EF2B8]">04 // HOBBIES</p>
          <h2 className="mt-2 font-display text-3xl font-bold">Football, Gaming &amp; Natation</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {HOBBIES_LIST.map((h) => {
              const Icon = hobbyIcons[h.id];
              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-[#ECF3F7]/10 bg-[#0A1018] p-6"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${h.accent}20`, color: h.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold">{h.title}</h3>
                  <p className="font-mono text-[11px] text-[#9FB0BE]">{h.subtitle}</p>
                  <p className="mt-3 text-xs leading-relaxed text-[#C8D6E2]">{h.summary}</p>
                  <p className="mt-3 border-t border-[#ECF3F7]/8 pt-3 text-xs text-[#9FB0BE]">
                    {h.connectionToCode}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-[#ECF3F7]/8 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="font-mono text-xs tracking-[0.22em] text-[#4EF2B8]">
            05 // CONTACT STATION
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold">Entrer en contact</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={PROFILE.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-[#4EF2B8]/30 bg-[#4EF2B8]/8 p-5 transition hover:bg-[#4EF2B8]/16"
            >
              <MessageCircle className="h-5 w-5 text-[#4EF2B8]" />
              <div className="mt-3 font-display font-semibold">WhatsApp</div>
              <div className="font-mono text-xs text-[#4EF2B8]">{PROFILE.links.phoneDisplay}</div>
            </a>
            <a
              href={PROFILE.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-[#ECF3F7]/12 bg-[#0A1018] p-5 transition hover:border-[#4EF2B8]/40"
            >
              <GitHubIcon className="h-5 w-5" />
              <div className="mt-3 font-display font-semibold">GitHub</div>
              <div className="font-mono text-xs text-[#9FB0BE]">c0d3r-cheikh06</div>
            </a>
            <a
              href={PROFILE.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-[#ECF3F7]/12 bg-[#0A1018] p-5 transition hover:border-[#4EF2B8]/40"
            >
              <InstagramIcon className="h-5 w-5" />
              <div className="mt-3 font-display font-semibold">Instagram</div>
              <div className="font-mono text-xs text-[#9FB0BE]">@_xtypx01_</div>
            </a>
            <div className="rounded-2xl border border-dashed border-[#ECF3F7]/18 bg-[#0A1018] p-5">
              <Mail className="h-5 w-5 text-[#9FB0BE]" />
              <div className="mt-3 font-display font-semibold">E-mail</div>
              <div className="font-mono text-[11px] text-[#9FB0BE]">
                {PROFILE.links.email ?? "Emplacement configurable"}
              </div>
            </div>
          </div>

          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECF3F7]/8 pt-6 font-mono text-[11px] text-[#9FB0BE]">
            <span>
              {PROFILE.experienceName} — {PROFILE.signature}
            </span>
            <span>
              {PROFILE.name} ({PROFILE.handle})
            </span>
          </footer>
        </div>
      </section>
    </div>
  );
}
