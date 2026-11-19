export type HobbyId = "football" | "gaming" | "swimming";

export interface HobbyItem {
  id: HobbyId;
  title: string;
  subtitle: string;
  accent: string;
  summary: string;
  highlights: string[];
  connectionToCode: string;
  personalNote: string;
}

/**
 * Strictly honors Part 9: represents Cheikh's 3 stated interests
 * (Football, Gaming, Swimming) without inventing any favorite club,
 * sports career, or unconfirmed achievements.
 */
export const HOBBIES: Record<HobbyId, HobbyItem> = {
  football: {
    id: "football",
    title: "Football",
    subtitle: "Vision de jeu, collectif & intensité",
    accent: "#4EF2B8",
    summary:
      "Passionné par le football pour son exigence tactique, la lecture rapide des espaces et la force du collectif. Un sport où chaque passe et chaque placement construisent l'action décisive.",
    highlights: [
      "Sens du collectif et coordination en équipe",
      "Lecture tactique, anticipation et prise de décision rapide",
      "Discipline, endurance et esprit compétitif sain",
    ],
    connectionToCode:
      "Comme sur le terrain, un bon projet logiciel repose sur la cohésion d'équipe, une architecture lisible et la justesse d'exécution sous pression.",
    personalNote:
      "Zone personnalisable : ajoutez librement votre poste ou vos équipes préférées si vous le souhaitez.",
  },
  gaming: {
    id: "gaming",
    title: "Gaming",
    subtitle: "Univers interactifs, réactivité & immersion",
    accent: "#38BDF8",
    summary:
      "Attrait fort pour les jeux vidéo, leur direction artistique, la fluidité des mécaniques de gameplay et la manière dont la 3D temps réel crée des mondes vivants et mémorables.",
    highlights: [
      "Sensibilité aux expériences immersives et au game feel",
      "Résolution stratégique de problèmes complexes",
      "Inspiration directe pour l'univers 3D interactif de CHEIKH.EXE",
    ],
    connectionToCode:
      "Le jeu vidéo nourrit directement mon exigence en UX, en fluidité d'animation, en rendu 3D temps réel et en design d'interfaces réactives.",
    personalNote:
      "Zone personnalisable : ajoutez librement vos titres ou genres favoris.",
  },
  swimming: {
    id: "swimming",
    title: "Natation",
    subtitle: "Maîtrise, souffle & régularité",
    accent: "#22D3EE",
    summary:
      "La natation apporte un équilibre précieux entre concentration mentale, maîtrise technique et endurance physique. Chaque longueur demande régularité, précision du geste et calme.",
    highlights: [
      "Concentration profonde et gestion du rythme",
      "Résilience physique et constance dans l'effort",
      "Clarté d'esprit et récupération créative loin des écrans",
    ],
    connectionToCode:
      "La recherche d'efficacité hydrodynamique rejoint celle d'un code propre : éliminer les frictions inutiles pour aller plus loin avec fluidité.",
    personalNote:
      "Zone personnalisable : modifiable à tout moment dans src/data/hobbies.ts.",
  },
};

export const HOBBIES_LIST: HobbyItem[] = [
  HOBBIES.football,
  HOBBIES.gaming,
  HOBBIES.swimming,
];
