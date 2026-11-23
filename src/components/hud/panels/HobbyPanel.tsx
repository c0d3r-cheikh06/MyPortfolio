"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Gamepad2, Trophy, Waves } from "lucide-react";
import { HOBBIES, HOBBIES_LIST, type HobbyId } from "@/data/hobbies";

interface HobbyPanelProps {
  hobbyId: HobbyId;
  onSwitchHobby: (id: HobbyId) => void;
}

const ICONS = {
  football: Trophy,
  gaming: Gamepad2,
  swimming: Waves,
};

function HobbyVisualStage({ hobbyId, accent }: { hobbyId: HobbyId; accent: string }) {
  const reduced = useReducedMotion();

  if (hobbyId === "football") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#3BF4B8]/25 bg-[#05120D] p-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 10%, rgba(59,244,184,0.22), transparent 65%)",
          }}
        />
        <svg viewBox="0 0 320 150" className="relative z-10 h-32 w-full" aria-hidden="true">
          {/* Pitch outline */}
          <rect x="16" y="14" width="288" height="122" rx="4" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.4" />
          <line x1="160" y1="14" x2="160" y2="136" stroke={accent} strokeOpacity="0.35" strokeWidth="1.2" />
          <circle cx="160" cy="75" r="24" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.2" />
          <rect x="16" y="45" width="38" height="60" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="1.2" />
          <rect x="266" y="45" width="38" height="60" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="1.2" />
          {/* Animated tactical passing triangle */}
          <polygon
            points="92,48 192,38 158,108"
            fill={`${accent}16`}
            stroke={accent}
            strokeDasharray="4 4"
            strokeWidth="1.4"
          />
          {[
            { x: 92, y: 48 },
            { x: 192, y: 38 },
            { x: 158, y: 108 },
          ].map((pt, i) => (
            <motion.circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#ECF3F7"
              stroke={accent}
              strokeWidth="2"
              animate={reduced ? undefined : { scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.45 }}
            />
          ))}
        </svg>
        <div className="mt-1 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] text-[#3BF4B8]">
          <span>TACTICAL ARENA // VISION &amp; COLLECTIF</span>
          <span>11V11 SYSTEM</span>
        </div>
      </div>
    );
  }

  if (hobbyId === "gaming") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#38BDF8]/30 bg-[#050C16] p-4">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 15%, rgba(56,189,248,0.22), transparent 60%)",
          }}
        />
        <svg viewBox="0 0 320 150" className="relative z-10 h-32 w-full" aria-hidden="true">
          {/* Corner targeting brackets */}
          <polyline points="20,38 20,18 42,18" fill="none" stroke={accent} strokeWidth="2" />
          <polyline points="300,38 300,18 278,18" fill="none" stroke={accent} strokeWidth="2" />
          <polyline points="20,112 20,132 42,132" fill="none" stroke={accent} strokeWidth="2" />
          <polyline points="300,112 300,132 278,132" fill="none" stroke={accent} strokeWidth="2" />
          {/* Telemetry frame-graph waveform */}
          <motion.polyline
            points="28,96 64,96 86,62 114,104 146,44 176,88 210,56 242,92 292,68"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
            animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
          />
          <polyline
            points="28,112 80,108 134,90 190,104 246,82 292,98"
            fill="none"
            stroke="#3BF4B8"
            strokeWidth="1.2"
            strokeOpacity="0.55"
          />
          <circle cx="160" cy="75" r="24" fill="none" stroke={accent} strokeOpacity="0.28" strokeDasharray="3 3" />
          <circle cx="146" cy="44" r="4" fill={accent} />
        </svg>
        <div className="mt-1 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] text-[#38BDF8]">
          <span>ESPORTS TELEMETRY // GAME FEEL</span>
          <span>REAL-TIME 3D</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#22D3EE]/30 bg-[#041118] p-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 20% 80%, rgba(34,211,238,0.22), transparent 62%)",
        }}
      />
      <svg viewBox="0 0 320 150" className="relative z-10 h-32 w-full" aria-hidden="true">
        {[0, 1, 2].map((waveIdx) => (
          <motion.path
            key={waveIdx}
            d={`M -20 ${54 + waveIdx * 22} Q 40 ${38 + waveIdx * 22}, 100 ${54 + waveIdx * 22} T 220 ${
              54 + waveIdx * 22
            } T 340 ${54 + waveIdx * 22}`}
            fill="none"
            stroke={accent}
            strokeOpacity={0.75 - waveIdx * 0.2}
            strokeWidth={2.2 - waveIdx * 0.4}
            animate={
              reduced
                ? undefined
                : {
                    x: waveIdx % 2 === 0 ? [0, 18, 0] : [0, -18, 0],
                  }
            }
            transition={{ repeat: Infinity, duration: 4.2 + waveIdx, ease: "easeInOut" }}
          />
        ))}
        {/* Cadence / Hydrodynamic pulse rings */}
        <motion.circle
          cx="252"
          cy="52"
          r="18"
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          animate={reduced ? undefined : { scale: [0.85, 1.35, 0.85], opacity: [0.7, 0.15, 0.7] }}
          transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
        />
        <circle cx="252" cy="52" r="4" fill="#ECF3F7" />
      </svg>
      <div className="mt-1 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] text-[#22D3EE]">
        <span>AQUATIC FLOW // CADENCE &amp; MAÎTRISE</span>
        <span>ENDURANCE</span>
      </div>
    </div>
  );
}

export function HobbyPanel({ hobbyId, onSwitchHobby }: HobbyPanelProps) {
  const hobby = HOBBIES[hobbyId];
  const ActiveIcon = ICONS[hobbyId];

  return (
    <div className="space-y-6">
      {/* Spring-Animated Micro-Universe Switcher */}
      <div className="grid grid-cols-3 gap-1.5 rounded-full border border-[#ECF3F7]/10 bg-[#050910] p-1">
        {HOBBIES_LIST.map((h) => {
          const Icon = ICONS[h.id];
          const active = h.id === hobbyId;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onSwitchHobby(h.id)}
              className={`relative flex items-center justify-center gap-1.5 rounded-full py-2 font-mono text-[10px] tracking-wider transition-colors cursor-pointer ${
                active ? "font-bold text-[#04060A]" : "text-[#9FB0BE] hover:text-[#ECF3F7]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="hobby-tab-glow"
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

      <AnimatePresence mode="wait">
        <motion.div
          key={hobby.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          {/* Bespoke Visual Universe Stage */}
          <HobbyVisualStage hobbyId={hobby.id} accent={hobby.accent} />

          {/* Header & Narrative */}
          <div className="flex items-start gap-3.5 border-b border-[#ECF3F7]/10 pb-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
              style={{
                backgroundColor: `${hobby.accent}16`,
                borderColor: `${hobby.accent}40`,
                color: hobby.accent,
              }}
            >
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[#ECF3F7]">
                {hobby.title}
              </h2>
              <p className="font-mono text-[11px] text-[#9FB0BE]">{hobby.subtitle}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#DCE6EE]">{hobby.summary}</p>

          {/* Tactical Readout Rails */}
          <div>
            <div
              className="font-mono text-[10px] tracking-[0.22em]"
              style={{ color: hobby.accent }}
            >
              APPORTS &amp; DISCIPLINE
            </div>
            <ul className="mt-2.5 divide-y divide-[#ECF3F7]/8 border-y border-[#ECF3F7]/8">
              {hobby.highlights.map((item, idx) => (
                <li key={item} className="flex items-center gap-3 py-2.5 text-xs text-[#DCE6EE]">
                  <span className="font-mono text-[10px] opacity-60">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="border-l-2 pl-3.5 py-0.5"
            style={{ borderColor: hobby.accent }}
          >
            <div
              className="font-mono text-[10px] tracking-[0.2em]"
              style={{ color: hobby.accent }}
            >
              SYNERGIE AVEC L&apos;INGÉNIERIE
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#DCE6EE]">
              {hobby.connectionToCode}
            </p>
          </div>

          <p className="text-[11px] text-[#9FB0BE]/75">{hobby.personalNote}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
