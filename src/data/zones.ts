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
 * Clean, spatially separated architectural layout (zero deck clipping or overlap!):
 *  - Main Observatory Deck: centered at (0, 0, -0.4), radius 6.35m
 *      * Center (0, 0, 0): Hologram Pedestal + Cheikh 3D Realistic Hologram (eye level ~y=1.78)
 *      * Rear Arc (z = -2.95 to -5.45): Executive Workstation, Transparent PC Tower & 6 Project Terminals
 *      * Left Wing (-5.0, 0, -0.7): Skills Universe Gyroscopic Tech Constellation
 *      * Front-Left (-3.6, 0, 3.2): Holographic Contact Comms Monolith
 *  - Satellite Hobby Pods (cleanly separated + linked by architectural skybridges):
 *      * Football Mini-Stadium: (9.9, 0, 2.3)
 *      * Gaming Alcove Pod:     (8.9, 0, -5.3)
 *      * Swimming Infinity Pod: (-9.3, 0, -5.4)
 */
export const ZONES: Record<ZoneId, ZoneCameraPreset> = {
  main: {
    id: "main",
    label: "Vue Globale",
    shortLabel: "Lab",
    position: [0.3, 3.35, 9.2],
    target: [0, 1.45, -0.6],
    fov: 44,
    accent: "#4EF2B8",
  },
  avatar: {
    id: "avatar",
    label: "Hologramme · À Propos",
    shortLabel: "Cheikh",
    // Eye-level frontal ID-photo portrait framing (shifted slightly right in target so bust sits cleanly left of right-hand HUD!)
    position: [0.36, 1.76, 2.35],
    target: [0.34, 1.62, 0],
    fov: 34,
    accent: "#4EF2B8",
  },
  projects: {
    id: "projects",
    label: "Projects Lab",
    shortLabel: "Projets",
    position: [1.4, 2.45, 0.85],
    target: [0.55, 1.38, -3.55],
    fov: 44,
    accent: "#38BDF8",
  },
  skills: {
    id: "skills",
    label: "Skills Universe",
    shortLabel: "Skills",
    position: [-1.7, 2.55, 2.65],
    target: [-4.45, 1.6, -0.75],
    fov: 42,
    accent: "#2DD4BF",
  },
  football: {
    id: "football",
    label: "Univers Football",
    shortLabel: "Football",
    position: [6.4, 3.4, 6.7],
    target: [10.4, 0.65, 2.1],
    fov: 42,
    accent: "#4EF2B8",
  },
  gaming: {
    id: "gaming",
    label: "Univers Gaming",
    shortLabel: "Gaming",
    position: [5.4, 2.55, -2.0],
    target: [9.4, 1.25, -5.4],
    fov: 42,
    accent: "#38BDF8",
  },
  swimming: {
    id: "swimming",
    label: "Univers Natation",
    shortLabel: "Natation",
    position: [-5.1, 3.45, -1.5],
    target: [-8.7, 0.5, -5.4],
    fov: 42,
    accent: "#22D3EE",
  },
  contact: {
    id: "contact",
    label: "Contact Station",
    shortLabel: "Contact",
    position: [-1.1, 2.05, 5.75],
    target: [-3.15, 1.35, 3.1],
    fov: 38,
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
