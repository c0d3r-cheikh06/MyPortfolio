"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Camera, ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import { PROFILE } from "@/data/profile";
import type { ProjectItem } from "@/data/projects";

interface AboutPanelProps {
  projects: ProjectItem[];
  onOpenProject: (slug: string) => void;
  onReplay: () => void;
}

export function AboutPanel({ projects, onOpenProject, onReplay }: AboutPanelProps) {
  const reduced = useReducedMotion();
  const [expandedInterest, setExpandedInterest] = useState<number | null>(0);
  const featured = projects.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="space-y-7">
      {/* Digital Biometric Identity Dossier */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col gap-4 border-b border-[#ECF3F7]/10 pb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Custom Orbital Scan Biometric Monogram */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg viewBox="0 0 64 64" className="h-full w-full">
                <circle
                  cx="32"
                  cy="32"
                  r="29"
                  fill="rgba(59,244,184,0.06)"
                  stroke="rgba(59,244,184,0.35)"
                  strokeWidth="1"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="23"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.2"
                  strokeDasharray="10 6"
                  animate={reduced ? undefined : { rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                  style={{ transformOrigin: "32px 32px" }}
                />
                <text
                  x="32"
                  y="36"
                  textAnchor="middle"
                  fill="#ECF3F7"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  CT
                </text>
              </svg>
            </div>

            <div>
              <p className="font-mono text-[10px] tracking-[0.24em] text-[#3BF4B8]">
                {PROFILE.handle} · DAKAR · SÉNÉGAL
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#ECF3F7]">
                {PROFILE.name}
              </h2>
              <p className="mt-0.5 text-xs text-[#9FB0BE]">{PROFILE.roleTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReplay}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#3BF4B8]/40 bg-[#3BF4B8]/10 px-3 py-1.5 font-mono text-[10px] tracking-wider text-[#3BF4B8] transition hover:bg-[#3BF4B8]/20 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            REPLAY LASER
          </button>
        </div>

        <p className="text-sm leading-relaxed text-[#DCE6EE]">{PROFILE.about.intro}</p>

        {/* Understated Photographic Portrait Integration Note */}
        <div className="flex items-center gap-2.5 border-l-2 border-[#3BF4B8]/45 pl-3 text-[11px] text-[#9FB0BE]">
          <Camera className="h-3.5 w-3.5 shrink-0 text-[#3BF4B8]" />
          <span>{PROFILE.about.photoSlotNote}</span>
        </div>
      </motion.div>

      {/* Interactive Vertical Luminous Timeline */}
      <div className="relative space-y-6 pl-5">
        {/* Continuous vertical gradient spine */}
        <div className="pointer-events-none absolute bottom-2 left-[6px] top-1.5 w-[1.5px] bg-gradient-to-b from-[#3BF4B8] via-[#38BDF8]/65 to-transparent" />

        {/* Milestone 01: Formation */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="relative"
        >
          <span className="absolute -left-[19px] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-[#3BF4B8] bg-[#04060A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3BF4B8]" />
          </span>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#3BF4B8]">
            01 // FORMATION
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug text-[#ECF3F7]">
            {PROFILE.about.academicContext}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#9FB0BE]">
            {PROFILE.about.academicNote}
          </p>
        </motion.div>

        {/* Milestone 02: Interactive Expertises & Axes */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          className="relative"
        >
          <span className="absolute -left-[19px] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-[#38BDF8] bg-[#04060A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
          </span>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#38BDF8]">
            02 // EXPERTISES &amp; AXES
          </div>
          <div className="mt-2.5 divide-y divide-[#ECF3F7]/8 border-y border-[#ECF3F7]/8">
            {PROFILE.about.interests.map((item, idx) => {
              const [label, detail] = item.split(" (");
              const cleanDetail = detail ? detail.replace(/\)$/, "") : null;
              const isOpen = expandedInterest === idx;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setExpandedInterest(isOpen ? null : idx)}
                  className="w-full py-2.5 text-left transition hover:text-[#3BF4B8] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#ECF3F7]">{label}</span>
                    {cleanDetail && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-[#9FB0BE] transition-transform ${
                          isOpen ? "rotate-180 text-[#3BF4B8]" : ""
                        }`}
                      />
                    )}
                  </div>
                  {cleanDetail && isOpen && (
                    <p className="mt-1 font-mono text-[10px] tracking-wide text-[#3BF4B8]/90">
                      {cleanDetail}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Milestone 03: Vision & Objectifs */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          className="relative"
        >
          <span className="absolute -left-[19px] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-[#F5B971] bg-[#04060A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5B971]" />
          </span>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#F5B971]">
            03 // VISION &amp; OBJECTIFS
          </div>
          <ul className="mt-2 space-y-2.5">
            {PROFILE.about.objectives.map((obj) => (
              <li key={obj} className="flex items-start gap-2.5 text-xs leading-relaxed text-[#C9D6E0]">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3BF4B8]" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Signature Works Full-Bleed Hairline Index */}
      <div className="pt-2">
        <div className="flex items-center justify-between pb-2">
          <span className="font-mono text-[10px] tracking-[0.22em] text-[#3BF4B8]">
            SIGNATURE WORKS // ACCÈS DIRECT
          </span>
        </div>
        <div className="divide-y divide-[#ECF3F7]/10 border-t border-[#ECF3F7]/10">
          {featured.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onOpenProject(p.slug)}
              className="group flex w-full items-center justify-between gap-3 py-3 text-left transition hover:pl-1.5 cursor-pointer"
            >
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="font-mono text-[10px] text-[#3BF4B8]/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold text-[#ECF3F7] group-hover:text-[#3BF4B8]">
                    {p.title}
                  </div>
                  <p className="truncate text-[11px] text-[#9FB0BE]">{p.tagline}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9FB0BE] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#3BF4B8]" />
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
