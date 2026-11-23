"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ProjectItem } from "@/data/projects";

interface ProjectVisualBlueprintProps {
  project: ProjectItem;
  compact?: boolean;
}

/**
 * Honest procedural SVG architectural telemetry blueprint tailored to each repository's
 * verified architecture (graph theory, Text-to-SQL AST security, ML pipeline, Socket.IO, etc.).
 */
export function ProjectVisualBlueprint({
  project,
  compact = false,
}: ProjectVisualBlueprintProps) {
  const reduced = useReducedMotion();
  const accent = project.accentColor || "#3BF4B8";
  const slug = project.slug.toLowerCase();

  const isSynkro = slug === "synkro";
  const isTranspobot = slug === "transpobot";
  const isSensante = slug === "sensante";
  const isQuiz = slug === "quiz-live";
  const isSchedulix = slug === "schedulix" || slug === "emplois_du_temps";
  const is3D = slug === "3d-website";
  const isAndroid = project.languages.includes("Java") || slug.includes("android") || slug.includes("gestionnaire");

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#ECF3F7]/10 bg-[#050910] ${
        compact ? "h-24 w-32 shrink-0 sm:w-36" : "h-44 w-full sm:h-52"
      }`}
    >
      {/* Subtle architectural coordinate grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(236,243,247,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,243,247,0.06) 1px, transparent 1px)",
          backgroundSize: compact ? "16px 16px" : "24px 24px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 75% 22%, ${accent}1F 0%, transparent 62%)`,
        }}
      />

      {/* Bespoke Repository Architectural Vector Diagram */}
      <svg
        viewBox="0 0 320 160"
        className="relative z-10 h-full w-full"
        aria-hidden="true"
      >
        {isSynkro && (
          <g>
            {/* k=3 inter-group cycle graph (5 filieres) */}
            {[
              [70, 52],
              [140, 30],
              [220, 48],
              [205, 118],
              [95, 114],
            ].map(([x1, y1], i, arr) => {
              const [x2, y2] = arr[(i + 1) % arr.length];
              const [x3, y3] = arr[(i + 2) % arr.length];
              return (
                <g key={`edge-${i}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeOpacity="0.45" strokeWidth="1.4" />
                  <line x1={x1} y1={y1} x2={x3} y2={y3} stroke="#38BDF8" strokeOpacity="0.32" strokeWidth="1" strokeDasharray="3 3" />
                </g>
              );
            })}
            {[
              { x: 70, y: 52, l: "INFO" },
              { x: 140, y: 30, l: "TR" },
              { x: 220, y: 48, l: "GLSI" },
              { x: 205, y: 118, l: "SRT" },
              { x: 95, y: 114, l: "EXT" },
            ].map((n, idx) => (
              <g key={n.l}>
                <motion.circle
                  cx={n.x}
                  cy={n.y}
                  r={compact ? 9 : 11}
                  fill="#07111A"
                  stroke={accent}
                  strokeWidth="1.5"
                  animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.6, delay: idx * 0.35 }}
                />
                {!compact && (
                  <text
                    x={n.x}
                    y={n.y + 3}
                    textAnchor="middle"
                    fill="#ECF3F7"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    {n.l}
                  </text>
                )}
              </g>
            ))}
            {!compact && (
              <text x="16" y="148" fill={accent} fontSize="8.5" fontFamily="monospace">
                GRAPH K-FACTOR (K=3) · 612 BINÔMES UNIQUES
              </text>
            )}
          </g>
        )}

        {isTranspobot && (
          <g>
            {/* Dakar transit spline routes + Text-to-SQL 3-layer AST shield */}
            <path
              d="M 22 118 C 68 95, 96 48, 152 62 S 240 110, 294 42"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeOpacity="0.65"
            />
            <path
              d="M 28 54 C 95 66, 128 118, 198 92 S 258 46, 296 96"
              fill="none"
              stroke="#3BF4B8"
              strokeWidth="1.3"
              strokeDasharray="4 4"
              strokeOpacity="0.45"
            />
            {[
              { x: 48, label: "NL QUERY" },
              { x: 122, label: "GROQ LLM" },
              { x: 198, label: "AST GUARD" },
              { x: 272, label: "MYSQL RO" },
            ].map((step, i) => (
              <g key={step.label}>
                <rect
                  x={step.x - 28}
                  y="112"
                  width="56"
                  height="22"
                  rx="4"
                  fill="#09131F"
                  stroke={i === 2 ? "#3BF4B8" : accent}
                  strokeWidth="1.1"
                />
                <text
                  x={step.x}
                  y="126"
                  textAnchor="middle"
                  fill="#DCE6EE"
                  fontSize="6.8"
                  fontFamily="monospace"
                >
                  {step.label}
                </text>
              </g>
            ))}
            <motion.circle
              cx="152"
              cy="62"
              r="5"
              fill={accent}
              animate={reduced ? undefined : { opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            />
          </g>
        )}

        {isSensante && (
          <g>
            {/* Neural Pre-diagnostic pipeline: Symptoms -> scikit-learn -> Llama 3 */}
            {[36, 76, 116].map((y, idx) => (
              <g key={y}>
                <line x1="56" y1={y} x2="148" y2="76" stroke={accent} strokeOpacity="0.4" strokeWidth="1.2" />
                <line x1="148" y1="76" x2="248" y2={idx === 1 ? 76 : y} stroke="#38BDF8" strokeOpacity="0.38" strokeWidth="1.2" />
                <circle cx="56" cy={y} r="7" fill="#08131A" stroke={accent} strokeWidth="1.4" />
                <circle cx="248" cy={y} r="7" fill="#08131A" stroke="#38BDF8" strokeWidth="1.4" />
              </g>
            ))}
            <motion.polygon
              points="148,54 170,76 148,98 126,76"
              fill="#0B1B22"
              stroke={accent}
              strokeWidth="1.8"
              animate={reduced ? undefined : { rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
              style={{ transformOrigin: "148px 76px" }}
            />
            {!compact && (
              <text x="16" y="148" fill={accent} fontSize="8.5" fontFamily="monospace">
                SYMPTOMS → SCIKIT-LEARN (.PKL) → GROQ / LLAMA 3
              </text>
            )}
          </g>
        )}

        {isQuiz && (
          <g>
            {/* 3-Screen Socket.IO Real-Time Hub (Host / Server / Players / Projection) */}
            {[
              { x: 42, label: "HOST" },
              { x: 160, label: "WS + SQL TX" },
              { x: 274, label: "3 SCREENS" },
            ].map((b, i) => (
              <g key={b.label}>
                <rect
                  x={b.x - 32}
                  y="44"
                  width="64"
                  height="38"
                  rx="6"
                  fill="#0A101D"
                  stroke={i === 1 ? accent : "#38BDF8"}
                  strokeWidth="1.3"
                />
                <text
                  x={b.x}
                  y="66"
                  textAnchor="middle"
                  fill="#ECF3F7"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {b.label}
                </text>
              </g>
            ))}
            <line x1="74" y1="63" x2="128" y2="63" stroke={accent} strokeDasharray="3 3" strokeWidth="1.5" />
            <line x1="192" y1="63" x2="242" y2="63" stroke={accent} strokeDasharray="3 3" strokeWidth="1.5" />
            <text x="160" y="122" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace">
              IDLE → OPEN → CLOSED → RESULTS → REVEALED
            </text>
          </g>
        )}

        {isSchedulix && (
          <g>
            {/* Conflict-Free Weekly Timetable Slot Matrix */}
            {[0, 1, 2, 3, 4].map((c) =>
              [0, 1, 2].map((r) => {
                const active = (c + r) % 3 !== 0;
                return (
                  <rect
                    key={`${c}-${r}`}
                    x={36 + c * 52}
                    y={26 + r * 30}
                    width="44"
                    height="22"
                    rx="4"
                    fill={active ? `${accent}26` : "rgba(255,255,255,0.03)"}
                    stroke={active ? accent : "rgba(255,255,255,0.12)"}
                    strokeWidth="1"
                  />
                );
              })
            )}
            <motion.line
              x1="30"
              y1="20"
              x2="30"
              y2="116"
              stroke="#3BF4B8"
              strokeWidth="1.6"
              animate={reduced ? undefined : { x1: [30, 290, 30], x2: [30, 290, 30] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            />
            {!compact && (
              <text x="36" y="142" fill={accent} fontSize="8.5" fontFamily="monospace">
                SCHEDULER ENGINE · DÉTECTION CONFLITS · PDO/SMTP
              </text>
            )}
          </g>
        )}

        {is3D && (
          <g>
            {/* Isometric R3F Wireframe Cube & Shader Axis */}
            <motion.g
              animate={reduced ? undefined : { rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              style={{ transformOrigin: "160px 72px" }}
            >
              <polygon
                points="160,30 202,52 202,94 160,116 118,94 118,52"
                fill={`${accent}16`}
                stroke={accent}
                strokeWidth="1.6"
              />
              <polyline points="118,52 160,74 202,52" fill="none" stroke="#38BDF8" strokeWidth="1.2" />
              <line x1="160" y1="74" x2="160" y2="116" stroke="#38BDF8" strokeWidth="1.2" />
            </motion.g>
            <circle cx="160" cy="72" r="46" fill="none" stroke={accent} strokeOpacity="0.24" strokeDasharray="4 4" />
            {!compact && (
              <text x="160" y="146" textAnchor="middle" fill={accent} fontSize="8.5" fontFamily="monospace">
                REACT THREE FIBER · GLTF/HDR · GSAP + ZUSTAND
              </text>
            )}
          </g>
        )}

        {!isSynkro && !isTranspobot && !isSensante && !isQuiz && !isSchedulix && !is3D && (
          <g>
            {isAndroid ? (
              /* Android MVVM / Room Layered Architecture Stack */
              <g>
                {["UI / RECYCLERVIEW", "VIEWMODEL / MVVM", "ROOM DAO + EXECUTOR"].map((layer, idx) => (
                  <g key={layer}>
                    <rect
                      x={58 + idx * 8}
                      y={28 + idx * 32}
                      width={204 - idx * 16}
                      height="24"
                      rx="5"
                      fill="#09131E"
                      stroke={idx === 1 ? accent : "rgba(236,243,247,0.22)"}
                      strokeWidth="1.2"
                    />
                    <text
                      x="160"
                      y={43 + idx * 32}
                      textAnchor="middle"
                      fill="#DCE6EE"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {layer}
                    </text>
                  </g>
                ))}
              </g>
            ) : (
              /* Clean Data-Flow & Telemetry Architecture Diagram */
              <g>
                {[64, 160, 256].map((cx, i) => (
                  <g key={cx}>
                    {i < 2 && (
                      <line
                        x1={cx + 22}
                        y1="72"
                        x2={cx + 74}
                        y2="72"
                        stroke={accent}
                        strokeWidth="1.4"
                        strokeDasharray="3 3"
                      />
                    )}
                    <rect
                      x={cx - 28}
                      y="50"
                      width="56"
                      height="44"
                      rx="6"
                      fill="#09121C"
                      stroke={i === 1 ? accent : "rgba(236,243,247,0.25)"}
                      strokeWidth="1.3"
                    />
                    <text
                      x={cx}
                      y="75"
                      textAnchor="middle"
                      fill="#ECF3F7"
                      fontSize="7.5"
                      fontFamily="monospace"
                    >
                      {i === 0 ? "CLIENT" : i === 1 ? project.languages[0]?.toUpperCase() || "CORE" : "DATA / SQL"}
                    </text>
                  </g>
                ))}
                {!compact && (
                  <text x="160" y="138" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace">
                    {project.categoryLabel.toUpperCase()} · {project.owner}/{project.slug}
                  </text>
                )}
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Bottom accent laser border */}
      <div
        className="absolute inset-x-0 bottom-0 h-[1.5px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
    </div>
  );
}
