export type SkillCategoryId =
  | "languages"
  | "frontend"
  | "backend"
  | "mobile"
  | "databases"
  | "frameworks"
  | "devops"
  | "tools";

export type SkillSource = "observed-in-repos" | "to-confirm";

export interface SkillItem {
  id: string;
  name: string;
  category: SkillCategoryId;
  source: SkillSource;
  description: string;
  repos: string[];
  related: string[];
  accent: string;
}

export interface SkillCategoryMeta {
  id: SkillCategoryId;
  label: string;
  shortLabel: string;
  color: string;
}

export const SKILL_CATEGORIES: SkillCategoryMeta[] = [
  { id: "languages", label: "Programming Languages", shortLabel: "Languages", color: "#4EF2B8" },
  { id: "frontend", label: "Frontend Development", shortLabel: "Frontend", color: "#38BDF8" },
  { id: "backend", label: "Backend Development", shortLabel: "Backend", color: "#A78BFA" },
  { id: "mobile", label: "Mobile Development", shortLabel: "Mobile", color: "#34D399" },
  { id: "databases", label: "Databases", shortLabel: "Databases", color: "#F59E0B" },
  { id: "frameworks", label: "Frameworks & AI/3D", shortLabel: "Frameworks", color: "#2DD4BF" },
  { id: "devops", label: "DevOps & Deployment", shortLabel: "DevOps", color: "#FB7185" },
  { id: "tools", label: "Development Tools", shortLabel: "Tools", color: "#94A3B8" },
];

/**
 * Strictly factual skills inventory derived from the audited GitHub repositories.
 * No fabricated proficiency percentages or unverified claims.
 */
export const SKILLS_INVENTORY: SkillItem[] = [
  // Programming Languages
  {
    id: "typescript",
    name: "TypeScript",
    category: "languages",
    source: "observed-in-repos",
    description:
      "Langage principal sur les applications Next.js full-stack, l'algorithme de matching SynKro, les expériences 3D et le temps réel.",
    repos: ["SynKro", "quiz-live", "3D-website", "samaChauffeur"],
    related: ["Next.js", "React", "Prisma", "Three.js"],
    accent: "#38BDF8",
  },
  {
    id: "python",
    name: "Python",
    category: "languages",
    source: "observed-in-repos",
    description:
      "Utilisé pour le Machine Learning (scikit-learn), les APIs FastAPI/Flask et l'intégration LLM (Groq / Text-to-SQL).",
    repos: ["Transpobot", "sensante", "sentransport", "samaChauffeur"],
    related: ["FastAPI", "scikit-learn", "Flask", "Docker"],
    accent: "#4EF2B8",
  },
  {
    id: "php",
    name: "PHP 8",
    category: "languages",
    source: "observed-in-repos",
    description:
      "Développement de systèmes web métier sécurisés (PDO, CSRF, PHPMailer, moteurs d'analyse et gestion scolaire).",
    repos: ["schedulix", "emplois_du_temps", "sunu_logis", "agro-meteo-senegal"],
    related: ["MySQL", "Apache", "JavaScript"],
    accent: "#818CF8",
  },
  {
    id: "java",
    name: "Java",
    category: "languages",
    source: "observed-in-repos",
    description:
      "Développement d'applications Android natives structurées avec Room, SQLite, RecyclerView et MVVM.",
    repos: ["GestionnaireDeNotes", "GestionnaireNotes", "androidStudio"],
    related: ["Android SDK", "Room", "SQLite", "Gradle"],
    accent: "#FB923C",
  },
  {
    id: "javascript",
    name: "JavaScript (ES6+)",
    category: "languages",
    source: "observed-in-repos",
    description:
      "Frontends React/Vite, scripts clients interactifs, cartographie Leaflet et serveurs Express.",
    repos: ["Transpobot", "sentransport", "schedulix", "agro-meteo-senegal", "sunu_logis", "test"],
    related: ["React", "Node.js", "Leaflet", "Tailwind CSS"],
    accent: "#FACC15",
  },
  {
    id: "sql",
    name: "SQL",
    category: "languages",
    source: "observed-in-repos",
    description:
      "Modélisation relationnelle complète (MCD/MLD, index, contraintes, migrations) sur PostgreSQL et MySQL.",
    repos: ["SynKro", "Transpobot", "quiz-live", "schedulix", "sunu_logis", "samaChauffeur"],
    related: ["PostgreSQL", "MySQL", "Prisma", "SQLAlchemy"],
    accent: "#F59E0B",
  },

  // Frontend
  {
    id: "react",
    name: "React 18 / 19",
    category: "frontend",
    source: "observed-in-repos",
    description:
      "Conception d'interfaces interactives modulaires, tableaux de bord temps réel et scènes WebGL déclaratives.",
    repos: ["SynKro", "quiz-live", "3D-website", "Transpobot", "sentransport", "samaChauffeur"],
    related: ["Next.js", "TypeScript", "Tailwind CSS", "React Three Fiber"],
    accent: "#38BDF8",
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    category: "frontend",
    source: "observed-in-repos",
    description:
      "Systèmes de design responsive modernes utilisés sur les projets Next.js, Vite et FastAPI.",
    repos: ["SynKro", "quiz-live", "3D-website", "Transpobot", "sensante", "samaChauffeur"],
    related: ["React", "Next.js", "Framer Motion"],
    accent: "#2DD4BF",
  },
  {
    id: "threejs",
    name: "Three.js / R3F / Drei",
    category: "frontend",
    source: "observed-in-repos",
    description:
      "Création d'expériences 3D WebGL dans React, chargement de modèles GLB optimisés, éclairages HDR et animations GSAP.",
    repos: ["3D-website"],
    related: ["GSAP", "Framer Motion", "TypeScript", "React"],
    accent: "#4EF2B8",
  },
  {
    id: "gsap-framer",
    name: "GSAP & Framer Motion",
    category: "frontend",
    source: "observed-in-repos",
    description:
      "Orchestration de transitions UI fluides, animations Hero et micro-interactions soignées.",
    repos: ["3D-website", "Transpobot"],
    related: ["React", "Three.js / R3F / Drei", "Tailwind CSS"],
    accent: "#A3E635",
  },
  {
    id: "leaflet",
    name: "Leaflet & Recharts",
    category: "frontend",
    source: "observed-in-repos",
    description:
      "Cartographie interactive des transports urbains (Dakar) et visualisation de données / KPIs temps réel.",
    repos: ["sentransport", "samaChauffeur", "Transpobot", "quiz-live"],
    related: ["React", "TypeScript", "JavaScript"],
    accent: "#60A5FA",
  },

  // Backend
  {
    id: "fastapi",
    name: "FastAPI",
    category: "backend",
    source: "observed-in-repos",
    description:
      "Conception d'APIs Python typées (Pydantic, Uvicorn) pour le Machine Learning et les assistants LLM Text-to-SQL.",
    repos: ["Transpobot", "sensante"],
    related: ["Python", "SQLAlchemy", "Groq / Llama 3", "Docker"],
    accent: "#10B981",
  },
  {
    id: "socketio",
    name: "Socket.IO / WebSockets",
    category: "backend",
    source: "observed-in-repos",
    description:
      "Synchronisation temps réel multi-clients (quiz live 3 écrans et suivi de courses GPS).",
    repos: ["quiz-live", "samaChauffeur"],
    related: ["Node.js / Express", "Next.js", "PostgreSQL"],
    accent: "#A78BFA",
  },
  {
    id: "nodejs",
    name: "Node.js & Express",
    category: "backend",
    source: "observed-in-repos",
    description:
      "Serveurs HTTP/WebSocket personnalisés, APIs REST TypeScript et services de notifications.",
    repos: ["quiz-live", "samaChauffeur", "test"],
    related: ["TypeScript", "Socket.IO / WebSockets", "Prisma"],
    accent: "#4ADE80",
  },
  {
    id: "flask",
    name: "Flask",
    category: "backend",
    source: "observed-in-repos",
    description:
      "Microservice REST léger avec Flask-CORS pour servir les données de transport urbain.",
    repos: ["sentransport"],
    related: ["Python", "React"],
    accent: "#94A3B8",
  },

  // Mobile
  {
    id: "android-sdk",
    name: "Android Native (Java)",
    category: "mobile",
    source: "observed-in-repos",
    description:
      "Applications Android natives avec Activities, ViewBinding, RecyclerView, Material Design, MVVM et Room.",
    repos: ["GestionnaireDeNotes", "GestionnaireNotes", "androidStudio"],
    related: ["Java", "Room / SQLite", "Gradle"],
    accent: "#34D399",
  },
  {
    id: "expo-rn",
    name: "React Native / Expo (Collab)",
    category: "mobile",
    source: "observed-in-repos",
    description:
      "Observé dans le dépôt collaboratif samaChauffeur (Expo Router, Maps, localisation, Socket.IO client).",
    repos: ["samaChauffeur"],
    related: ["TypeScript", "React", "Socket.IO / WebSockets"],
    accent: "#38BDF8",
  },

  // Databases
  {
    id: "postgresql",
    name: "PostgreSQL & Supabase",
    category: "databases",
    source: "observed-in-repos",
    description:
      "Base relationnelle utilisée avec Prisma sur les projets Next.js temps réel et le backend collaboratif.",
    repos: ["SynKro", "quiz-live", "samaChauffeur"],
    related: ["Prisma", "SQL", "Docker"],
    accent: "#60A5FA",
  },
  {
    id: "mysql",
    name: "MySQL / MariaDB",
    category: "databases",
    source: "observed-in-repos",
    description:
      "Conception de schémas InnoDB normalisés, comptes lecture seule sécurisés et requêtes préparées PDO/SQLAlchemy.",
    repos: ["Transpobot", "schedulix", "emplois_du_temps", "sunu_logis"],
    related: ["SQL", "PHP 8", "FastAPI"],
    accent: "#F59E0B",
  },
  {
    id: "room-sqlite",
    name: "Android Room & SQLite",
    category: "databases",
    source: "observed-in-repos",
    description:
      "Persistance mobile locale via entités Room, interfaces DAO et requêtes SQLite hors thread principal.",
    repos: ["GestionnaireDeNotes", "GestionnaireNotes", "androidStudio"],
    related: ["Android Native (Java)", "Java"],
    accent: "#FBBF24",
  },

  // Frameworks & AI
  {
    id: "nextjs",
    name: "Next.js 16 (App Router)",
    category: "frameworks",
    source: "observed-in-repos",
    description:
      "Framework principal des projets récents : App Router, Turbopack, Cache Components, API Routes et déploiement Vercel.",
    repos: ["SynKro", "quiz-live", "3D-website"],
    related: ["React 18 / 19", "TypeScript", "Prisma", "Tailwind CSS"],
    accent: "#ECF3F7",
  },
  {
    id: "prisma",
    name: "Prisma ORM",
    category: "frameworks",
    source: "observed-in-repos",
    description:
      "Modélisation de schémas typés, migrations SQL, seeding et transactions verrouillées sur PostgreSQL.",
    repos: ["SynKro", "quiz-live", "samaChauffeur"],
    related: ["PostgreSQL & Supabase", "TypeScript", "Next.js 16 (App Router)"],
    accent: "#2DD4BF",
  },
  {
    id: "ml-llm",
    name: "scikit-learn & Groq LLM",
    category: "frameworks",
    source: "observed-in-repos",
    description:
      "Entraînement de classifieurs supervisés (Pandas, NumPy, joblib) et orchestration sécurisée de modèles Llama/Groq.",
    repos: ["sensante", "Transpobot"],
    related: ["Python", "FastAPI", "Docker"],
    accent: "#4EF2B8",
  },

  // DevOps
  {
    id: "docker",
    name: "Docker & Compose",
    category: "devops",
    source: "observed-in-repos",
    description:
      "Conteneurisation d'APIs Python/ML (HF Spaces), de serveurs Node.js et d'environnements PostgreSQL locaux.",
    repos: ["SynKro", "sensante", "test"],
    related: ["FastAPI", "PostgreSQL & Supabase", "Vercel & HF Spaces"],
    accent: "#38BDF8",
  },
  {
    id: "cloud-deploy",
    name: "Vercel & Hugging Face Spaces",
    category: "devops",
    source: "observed-in-repos",
    description:
      "Déploiements publics vérifiés (synkro-mu.vercel.app, schedulix-sigma.vercel.app, c0d3r-cheikh06-sensante.hf.space).",
    repos: ["SynKro", "schedulix", "sensante"],
    related: ["Next.js 16 (App Router)", "Docker & Compose"],
    accent: "#FB7185",
  },

  // Tools
  {
    id: "git-github",
    name: "Git & GitHub",
    category: "tools",
    source: "observed-in-repos",
    description:
      "Gestion de versions, travail collaboratif multi-contributeurs et suivi d'itérations sur 16 dépôts publics.",
    repos: ["SynKro", "Transpobot", "quiz-live", "samaChauffeur", "androidStudio"],
    related: ["Docker & Compose", "Zod & Validation"],
    accent: "#9FB0BE",
  },
  {
    id: "zod-auth",
    name: "Zod, NextAuth & Testing",
    category: "tools",
    source: "observed-in-repos",
    description:
      "Validation stricte des schémas, authentification sécurisée (NextAuth, jose, bcrypt) et suites de tests automatisés.",
    repos: ["SynKro", "quiz-live", "3D-website", "samaChauffeur"],
    related: ["TypeScript", "Next.js 16 (App Router)", "Prisma ORM"],
    accent: "#A78BFA",
  },

  // Explicitly distinguished personal / confirmable track (per Part 8)
  {
    id: "glsl-creative",
    name: "GLSL & Creative WebGL",
    category: "frameworks",
    source: "to-confirm",
    description:
      "Axe créatif exploré à travers CHEIKH.EXE et 3D-website — à confirmer ou enrichir librement dans votre profil personnel.",
    repos: ["3D-website"],
    related: ["Three.js / R3F / Drei", "GSAP & Framer Motion"],
    accent: "#4EF2B8",
  },
];
