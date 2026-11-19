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
  /** Camera world position */
  position: [number, number, number];
  /** OrbitControls target world position */
  target: [number, number, number];
  fov?: number;
  accent: string;
}

/**
 * Spatial blueprint of the CHEIKH.EXE orbital laboratory:
 *  - Center (0, 0, 0): Hologram Pedestal + Cheikh 3D Hologram (facing +Z, eye level ~y=1.78)
 *  - Rear / Inner Arc (z = -3.8.. -2.4): High-tech curved Project Lab Workstations & PC Tower
 *  - Left Wing (x = -5.4, z = -0.8): Skills Universe Floating Orbital Array
 *  - Front-Left Deck (x = -3.6, z = 3.2): Holographic Contact Station
 *  - Satellite Pods linked by glowing architectural walkways:
 *      * Right-Front (x = 7.4, z = 2.4): Football Mini-Stadium Pod
 *      * Right-Rear  (x = 6.6, z = -4.2): Gaming Setup Pod
 *      * Left-Rear   (x = -7.2, z = -5.0): Swimming Aquatic Infinity Pool Pod
 */
export const ZONES: Record<ZoneId, ZoneCameraPreset> = {
  main: {
    id: "main",
    label: "Vue Globale",
    shortLabel: "Lab",
    position: [0.4, 3.3, 8.6],
    target: [0, 1.35, -0.4],
    fov: 44,
    accent: "#4EF2B8",
  },
  avatar: {
    id: "avatar",
    label: "Hologramme · À Propos",
    shortLabel: "Cheikh",
    // Eye-level frontal ID-photo framing of the holographic bust
    position: [0, 1.88, 2.35],
    target: [0, 1.72, 0],
    fov: 35,
    accent: "#4EF2B8",
  },
  projects: {
    id: "projects",
    label: "Projects Lab",
    shortLabel: "Projets",
    position: [0.3, 2.65, 1.6],
    target: [0, 1.45, -3.45],
    fov: 44,
    accent: "#38BDF8",
  },
  skills: {
    id: "skills",
    label: "Skills Universe",
    shortLabel: "Skills",
    position: [-2.1, 2.75, 2.9],
    target: [-5.3, 1.75, -0.8],
    fov: 42,
    accent: "#2DD4BF",
  },
  football: {
    id: "football",
    label: "Univers Football",
    shortLabel: "Football",
    position: [3.6, 3.2, 6.2],
    target: [7.5, 0.85, 2.3],
    fov: 42,
    accent: "#4EF2B8",
  },
  gaming: {
    id: "gaming",
    label: "Univers Gaming",
    shortLabel: "Gaming",
    position: [3.4, 2.4, -1.2],
    target: [6.8, 1.25, -4.2],
    fov: 40,
    accent: "#38BDF8",
  },
  swimming: {
    id: "swimming",
    label: "Univers Natation",
    shortLabel: "Natation",
    position: [-3.5, 3.3, -1.3],
    target: [-7.3, 0.75, -5.0],
    fov: 42,
    accent: "#22D3EE",
  },
  contact: {
    id: "contact",
    label: "Contact Station",
    shortLabel: "Contact",
    position: [-1.4, 2.1, 5.6],
    target: [-3.6, 1.35, 3.2],
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
