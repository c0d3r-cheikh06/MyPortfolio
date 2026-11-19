"use client";

import { create } from "zustand";
import type { ZoneId } from "@/data/zones";
import type { HobbyId } from "@/data/hobbies";

export type ExperiencePhase = "intro" | "entering" | "active";
export type ViewMode = "3d" | "classic";
export type SkyTheme = "night" | "day";
export type QualityTier = "high" | "medium" | "low";
export type ActivePanel =
  | null
  | "about"
  | "projects"
  | "skills"
  | "football"
  | "gaming"
  | "swimming"
  | "contact";

interface UniverseState {
  phase: ExperiencePhase;
  viewMode: ViewMode;
  theme: SkyTheme;
  /** Animated 0 (night) -> 1 (day) factor mutated by SkyUniverse GSAP tween for smooth shader lighting */
  dayFactor: number;
  quality: QualityTier;
  reducedMotion: boolean;
  activeZone: ZoneId;
  activePanel: ActivePanel;
  selectedProjectSlug: string | null;
  selectedSkillId: string | null;
  hologramStage: string;
  hologramProgress: number;
  hologramReplayCount: number;
  /** Increment to force CameraRig transition even to the same zone */
  cameraVersion: number;

  setPhase: (phase: ExperiencePhase) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: SkyTheme) => void;
  toggleTheme: () => void;
  setDayFactor: (v: number) => void;
  setQuality: (q: QualityTier) => void;
  setReducedMotion: (v: boolean) => void;

  focusZone: (zone: ZoneId, openPanel?: boolean) => void;
  returnToMain: () => void;
  openPanel: (panel: ActivePanel) => void;
  selectProject: (slug: string | null) => void;
  selectSkill: (id: string | null) => void;
  selectHobby: (hobby: HobbyId) => void;
  setHologramStatus: (progress: number, stage: string) => void;
  replayHologram: () => void;
}

const THEME_STORAGE_KEY = "cheikh-exe-theme";

export const useUniverseStore = create<UniverseState>((set, get) => ({
  phase: "intro",
  viewMode: "3d",
  theme: "night",
  dayFactor: 0,
  quality: "high",
  reducedMotion: false,
  activeZone: "main",
  activePanel: null,
  selectedProjectSlug: null,
  selectedSkillId: null,
  hologramStage: "STANDBY",
  hologramProgress: 0,
  hologramReplayCount: 0,
  cameraVersion: 0,

  setPhase: (phase) => set({ phase }),
  setViewMode: (viewMode) => set({ viewMode }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // ignore storage errors in private browsing
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next: SkyTheme = get().theme === "night" ? "day" : "night";
    get().setTheme(next);
  },
  setDayFactor: (dayFactor) => set({ dayFactor }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  focusZone: (zone, shouldOpenPanel = true) => {
    const panelMap: Record<ZoneId, ActivePanel> = {
      main: null,
      avatar: "about",
      projects: "projects",
      skills: "skills",
      football: "football",
      gaming: "gaming",
      swimming: "swimming",
      contact: "contact",
    };
    set((s) => ({
      activeZone: zone,
      activePanel: shouldOpenPanel ? panelMap[zone] : s.activePanel,
      cameraVersion: s.cameraVersion + 1,
    }));
  },

  returnToMain: () =>
    set((s) => ({
      activeZone: "main",
      activePanel: null,
      selectedProjectSlug: null,
      cameraVersion: s.cameraVersion + 1,
    })),

  openPanel: (activePanel) => set({ activePanel }),

  selectProject: (slug) =>
    set((s) => ({
      selectedProjectSlug: slug,
      activePanel: "projects",
      activeZone: slug ? "projects" : s.activeZone,
      cameraVersion: slug ? s.cameraVersion + 1 : s.cameraVersion,
    })),

  selectSkill: (id) =>
    set((s) => ({
      selectedSkillId: id,
      activePanel: "skills",
      activeZone: "skills",
      cameraVersion: s.cameraVersion + 1,
    })),

  selectHobby: (hobby) =>
    set((s) => ({
      activeZone: hobby,
      activePanel: hobby,
      cameraVersion: s.cameraVersion + 1,
    })),

  setHologramStatus: (hologramProgress, hologramStage) =>
    set({ hologramProgress, hologramStage }),

  replayHologram: () =>
    set((s) => ({
      hologramReplayCount: s.hologramReplayCount + 1,
      activeZone: "avatar",
      cameraVersion: s.cameraVersion + 1,
    })),
}));

export function hydrateThemeFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "day" || saved === "night") {
      useUniverseStore.setState({ theme: saved, dayFactor: saved === "day" ? 1 : 0 });
    }
  } catch {
    // ignore
  }
}
