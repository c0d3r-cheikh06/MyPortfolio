export interface ProfileConfig {
  name: string;
  fullNameObserved: string;
  handle: string;
  experienceName: string;
  signature: string;
  roleTitle: string;
  roleNote: string;
  location: string;
  links: {
    github: string;
    instagram: string;
    whatsapp: string;
    phoneDisplay: string;
    /** Editable slot — replace null with your email when ready */
    email: string | null;
  };
  about: {
    intro: string;
    academicContext: string;
    academicNote: string;
    interests: string[];
    objectives: string[];
    photoSlotNote: string;
  };
}

export const PROFILE: ProfileConfig = {
  name: "Cheikh Thiam",
  fullNameObserved: "Cheikh Ahmed Tidiane Thiam",
  handle: "C0D3R-CHEIKH06",
  experienceName: "CHEIKH.EXE",
  signature: "BEYOND THE CODE.",
  roleTitle: "Computer Science Student & Developer",
  roleNote:
    "Positionnement éditable dans src/data/profile.ts — aucun diplôme ni expérience professionnelle n'a été inventé.",
  location: "Sénégal",
  links: {
    github: "https://github.com/c0d3r-cheikh06",
    instagram: "https://instagram.com/_xtypx01_/",
    whatsapp: "https://wa.me/221775354423",
    phoneDisplay: "+221 77 535 44 23",
    email: null,
  },
  about: {
    intro:
      "Étudiant en informatique et développeur orienté systèmes web full-stack, applications mobiles, temps réel, expériences 3D interactives et intégration de l'intelligence artificielle dans les systèmes d'information.",
    academicContext:
      "Formation en Génie Logiciel & Systèmes d'Information (GLSI — ESP / UCAD, tel qu'observé dans les dépôts académiques publics).",
    academicNote:
      "Section académique volontairement sobre et modifiable : ajoutez ici vos années, mentions ou parcours détaillés.",
    interests: [
      "Architecture Web Full-Stack (Next.js, TypeScript, Prisma, PostgreSQL)",
      "IA appliquée & Systèmes d'Information (FastAPI, scikit-learn, LLM / Text-to-SQL)",
      "Temps réel & WebSockets (Socket.IO, transactions SQL synchronisées)",
      "Expériences 3D & WebGL (Three.js, React Three Fiber, shaders GLSL)",
      "Développement Mobile Android (Java, Room, MVVM)",
    ],
    objectives: [
      "Concevoir des logiciels robustes, sécurisés et immédiatement utiles dans le contexte sénégalais et international.",
      "Allier rigueur d'ingénierie logicielle (modélisation, tests, sécurité) et direction artistique exigeante.",
      "Contribuer à des produits ambitieux en développement full-stack, mobile ou IA appliquée.",
    ],
    photoSlotNote:
      "Emplacement réservé pour votre portrait photographique personnel (à déposer dans /public/images/portrait.jpg puis activer dans src/data/profile.ts).",
  },
};
