export type ZoneId =
  | "main"
  | "avatar"
  | "projects"
  | "skills"
  | "football"
  | "gaming"
  | "swimming"
  | "contact";

export interface ZoneCameraPreset {
  id: ZoneId;
  label: string;
  shortLabel: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  accent: string;
}

/**
 * Architectural spatial layout:
 *  - Main Observatory Deck: centered at (0, 0, -0.4), radius 6.35m
 *      * Center (0, 0, 0): Hologram Pedestal + Cheikh 3D Realistic Hologram (eye level ~y=1.78)
 *      * Rear Workstation (z = -2.80): Executive Desk, Triple Curved Monitors, PC Tower & Studio Chair
 *      * Elevated Rear Terrace (y = +0.26, r = 5.15m): 6 Unobstructed Project Terminals
 *      * Left Wing (-5.0, 0, -0.7): Skills Quantum Orrery Constellation
 *      * Front-Left (-3.6, 0, 3.2): Cantilevered Glass & Titanium Contact Console
 *  - Satellite Hobby Pods linked by architectural skybridges:
 *      * Football Mini-Stadium: (9.9, 0, 2.3)
 *      * Gaming Alcove Pod:     (8.9, 0, -5.3)
 *      * Swimming Infinity Pod: (-9.3, 0, -5.4)
 */
export const ZONES: Record<ZoneId, ZoneCameraPreset> = {
  main: {
    id: "main",
    label: "Vue Globale",
    shortLabel: "Lab",
    position: [0.25, 3.25, 9.5],
    target: [0, 1.55, -0.7],
    fov: 44,
    accent: "#4EF2B8",
  },
  avatar: {
    id: "avatar",
    label: "Hologramme · À Propos",
    shortLabel: "Cheikh",
    position: [0.32, 1.76, 2.28],
    target: [0.30, 1.66, 0],
    fov: 33,
    accent: "#4EF2B8",
  },
  projects: {
    id: "projects",
    label: "Projects Lab",
    shortLabel: "Projets",
    position: [0.0, 2.75, 0.35],
    target: [0.0, 1.78, -4.6],
    fov: 46,
    accent: "#38BDF8",
  },
  skills: {
    id: "skills",
    label: "Skills Universe",
    shortLabel: "Skills",
    position: [-1.55, 2.45, 2.55],
    target: [-4.75, 1.55, -0.75],
    fov: 40,
    accent: "#2DD4BF",
  },
  football: {
    id: "football",
    label: "Univers Football",
    shortLabel: "Football",
    position: [6.2, 3.3, 6.4],
    target: [9.9, 0.6, 2.2],
    fov: 42,
    accent: "#4EF2B8",
  },
  gaming: {
    id: "gaming",
    label: "Univers Gaming",
    shortLabel: "Gaming",
    position: [6.5, 2.25, -2.7],
    target: [8.85, 1.15, -5.25],
    fov: 40,
    accent: "#38BDF8",
  },
  swimming: {
    id: "swimming",
    label: "Univers Natation",
    shortLabel: "Natation",
    position: [-5.2, 3.15, -1.7],
    target: [-9.1, 0.35, -5.4],
    fov: 42,
    accent: "#22D3EE",
  },
  contact: {
    id: "contact",
    label: "Contact Station",
    shortLabel: "Contact",
    position: [-1.35, 1.95, 5.55],
    target: [-3.35, 1.28, 3.15],
    fov: 36,
    accent: "#4EF2B8",
  },
};

export const ZONE_ORDER: ZoneId[] = [
  "main",
  "avatar",
  "projects",
  "skills",
  "football",
  "gaming",
  "swimming",
  "contact",
];
