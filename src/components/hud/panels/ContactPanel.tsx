"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Mail, MessageCircle } from "lucide-react";
import { GitHubIcon, InstagramIcon } from "@/components/icons/BrandIcons";
import { PROFILE } from "@/data/profile";

export function ContactPanel() {
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  const copyPhone = () => {
    navigator.clipboard?.writeText(PROFILE.links.phoneDisplay).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Live Carrier-Wave Telemetry Banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#ECF3F7]/10 bg-[#050A11] px-4 py-3.5">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em]">
          <span className="inline-flex items-center gap-2 text-[#3BF4B8]">
            <span className="h-2 w-2 rounded-full bg-[#3BF4B8] animate-pulse" />
            SIGNAL LOCKED // DAKAR UTC+0
          </span>
          <span className="text-[#9FB0BE]">READY</span>
        </div>

        <svg viewBox="0 0 320 40" className="mt-2 h-8 w-full" aria-hidden="true">
          <motion.path
            d="M0 20 Q 20 6, 40 20 T 80 20 T 120 20 T 160 20 T 200 20 T 240 20 T 280 20 T 320 20"
            fill="none"
            stroke="#3BF4B8"
            strokeWidth="1.4"
            strokeOpacity="0.65"
            animate={reduced ? undefined : { pathOffset: [0, 1] }}
            transition={{ repeat: Infinity, duration: 3.2, ease: "linear" }}
          />
          <motion.path
            d="M0 20 Q 25 34, 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeOpacity="0.35"
            animate={reduced ? undefined : { pathOffset: [1, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
          />
        </svg>

        <h2 className="mt-1 font-display text-2xl font-extrabold text-[#ECF3F7]">
          Station de Communication
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-[#9FB0BE]">
          Échangeons autour d&apos;un projet, d&apos;une collaboration technique ou d&apos;une
          opportunité en développement logiciel.
        </p>
      </div>

      {/* Hero WhatsApp Direct Uplink with Integrated One-Tap Copy */}
      <div className="relative overflow-hidden rounded-2xl border border-[#3BF4B8]/35 bg-gradient-to-br from-[#3BF4B8]/12 via-[#07111A] to-[#050910] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3BF4B8]/20 text-[#3BF4B8]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] text-[#3BF4B8]">
                CANAL PRIORITAIRE // WHATSAPP
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-[#ECF3F7]">
                {PROFILE.links.phoneDisplay}
              </div>
            </div>
          </div>

          <a
            href={PROFILE.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#3BF4B8] px-3.5 py-2 font-mono text-[10px] font-bold tracking-wider text-[#04060A] transition hover:brightness-110"
          >
            OUVRIR
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={copyPhone}
          className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#ECF3F7]/12 bg-[#04060A]/55 py-2 font-mono text-[10px] tracking-[0.16em] text-[#ECF3F7] transition hover:border-[#3BF4B8]/45 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#3BF4B8]" />
              NUMÉRO COPIÉ ({PROFILE.links.phoneDisplay})
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#9FB0BE]" />
              COPIER {PROFILE.links.phoneDisplay}
            </>
          )}
        </button>
      </div>

      {/* Asymmetric Precision Uplink Rails (No Repeated Cards) */}
      <div className="divide-y divide-[#ECF3F7]/10 border-y border-[#ECF3F7]/10">
        <a
          href={PROFILE.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between py-4 transition hover:pl-1.5"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECF3F7]/12 bg-[#080F18] text-[#ECF3F7] group-hover:border-[#3BF4B8]/45 group-hover:text-[#3BF4B8]">
              <GitHubIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[#ECF3F7]">GitHub</div>
              <div className="font-mono text-[11px] text-[#9FB0BE]">
                github.com/c0d3r-cheikh06 · 16 dépôts publics
              </div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#9FB0BE] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#3BF4B8]" />
        </a>

        <a
          href={PROFILE.links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between py-4 transition hover:pl-1.5"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ECF3F7]/12 bg-[#080F18] text-[#ECF3F7] group-hover:border-[#38BDF8]/45 group-hover:text-[#38BDF8]">
              <InstagramIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[#ECF3F7]">Instagram</div>
              <div className="font-mono text-[11px] text-[#9FB0BE]">@_xtypx01_</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#9FB0BE] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#38BDF8]" />
        </a>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-[#ECF3F7]/18 bg-[#070C14] text-[#9FB0BE]">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="font-display text-sm font-bold text-[#ECF3F7]">Adresse E-mail</div>
              <div className="font-mono text-[10px] text-[#9FB0BE]/85">
                {PROFILE.links.email ?? "Emplacement dédié — à configurer dans src/data/profile.ts"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
