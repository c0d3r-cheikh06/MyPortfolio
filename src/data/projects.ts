export type ProjectCategory =
  | "personal"
  | "academic"
  | "collaboration"
  | "demo"
  | "exercise"
  | "empty";

export type ProjectStatus =
  | "complete"
  | "functional-prototype"
  | "in-progress"
  | "empty";

export interface ProjectItem {
  slug: string;
  owner: string;
  ownership: "own" | "collaboration";
  title: string;
  category: ProjectCategory;
  categoryLabel: string;
  categoryEvidence: string;
  tagline: string;
  description: string;
  objective: string;
  features: string[];
  technologies: string[];
  languages: string[];
  architecture: string;
  githubUrl: string;
  demoUrl: string | null;
  status: ProjectStatus;
  statusLabel: string;
  createdAt: string;
  pushedAt: string;
  stars: number;
  featured: boolean;
  /** True for early iterations superseded by a newer repo, or empty/exercise repos */
  secondary?: boolean;
  supersededBy?: string;
  accentColor: string;
  /** Terminal / lab monitor slot index (0-5) for featured 3D workstations */
  terminalSlot?: number;
  /** Note on real screenshots in repo — never fabricated */
  mediaNote: string;
}

/**
 * Exhaustive factual audit of all 16 public GitHub repositories associated with c0d3r-cheikh06
 * (15 owned repositories + 1 collaborative repository owned by daiki91).
 * Every feature, language, architecture detail and status is verified directly from repository source files.
 */
export const AUDITED_PROJECTS: ProjectItem[] = [
  {
    slug: "SynKro",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "SynKro",
    category: "personal",
    categoryLabel: "Projet Personnel",
    categoryEvidence:
      "Application full-stack complète déployée sur Vercel avec schéma Prisma, migrations, tests unitaires et documentation dédiée.",
    tagline: "Plateforme full-stack de jumelage inter-groupes entre étudiants par théorie des graphes.",
    description:
      "Application web full-stack conçue pour renforcer la cohésion d'une promotion répartie en 5 filières (DUT INFO, DUT TR, GLSI, SRT, Autres) via des cycles de jumelages hebdomadaires de 6 semaines. L'algorithme génère un graphe non orienté k-facteur (k=3) garantissant zéro doublon intra-groupe et 612 binômes uniques sur un cycle complet.",
    objective:
      "Automatiser et fiabiliser les rencontres inter-filières avec une transparence mathématique, une modération complète et un workflow de validation administrateur.",
    features: [
      "Algorithme de matching k-facteur (k=3) avec interdiction stricte des jumelages intra-groupe et gestion des exclusions de paires",
      "Validation indépendante des graphes générés et détection automatique des cas limites mathématiques",
      "Authentification NextAuth v5 + Prisma Adapter (vérification email, approbation des comptes, rôles STUDENT/MODERATOR/ADMIN)",
      "Modération de photos, gestion des consentements, signalements et journal d'emails automatisés",
      "Tâche cron hebdomadaire Vercel (/api/cron/weekly-reminder) et suite de tests unitaires (tsx --test)",
    ],
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Prisma",
      "PostgreSQL",
      "NextAuth v5",
      "Zod",
      "Docker",
      "Vercel",
    ],
    languages: ["TypeScript", "SQL", "CSS"],
    architecture:
      "Next.js 16 App Router (Turbopack, Cache Components) avec Prisma ORM sur PostgreSQL 16 (Docker Compose) et authentification NextAuth v5.",
    githubUrl: "https://github.com/c0d3r-cheikh06/SynKro",
    demoUrl: "https://synkro-mu.vercel.app",
    status: "complete",
    statusLabel: "Déployé en production",
    createdAt: "2026-10-24",
    pushedAt: "2026-10-24",
    stars: 0,
    featured: true,
    accentColor: "#4EF2B8",
    terminalSlot: 0,
    mediaNote:
      "Aucune capture d'écran d'interface dans le dépôt — fiche générée à partir de l'architecture et des spécifications vérifiées.",
  },
  {
    slug: "Transpobot",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "TranspoBot — Dakar Dem Dikk",
    category: "academic",
    categoryLabel: "Projet Académique (ESP / UCAD)",
    categoryEvidence:
      "README et schema.sql indiquent explicitement : Projet ESP/UCAD — Licence 3 GLSI — Intégration de l'IA dans les systèmes d'information.",
    tagline: "Gestion de flotte de transport urbain augmentée par un assistant IA Text-to-SQL sécurisé.",
    description:
      "Plateforme complète de suivi de flotte (chauffeurs, véhicules, lignes interurbaines Dakar–régions, trajets, incidents) inspirée du réseau Dakar Dem Dikk. Intègre un assistant LLM (Groq) capable de traduire des questions en français en requêtes SQL validées sur 3 couches de sécurité.",
    objective:
      "Démontrer l'intégration sécurisée d'un LLM Text-to-SQL dans un système d'information relationnel MySQL avec interface d'exploitation moderne.",
    features: [
      "Assistant Text-to-SQL via Groq avec classification d'intention en 3 modes (sql, conversationnel, hors_sql)",
      "Sécurité multi-couches : compte MySQL en lecture seule, validation sqlparse, blocage des injections temporelles (SLEEP, BENCHMARK) et timeout 3s",
      "Transparence totale : affichage de la requête SQL générée sous chaque réponse de l'assistant",
      "Tableau de bord KPI avec graphiques Recharts et modules CRUD complets (véhicules, chauffeurs, trajets, incidents)",
      "Dossier de modélisation complet (MCD, MLD, règles de gestion) et jeu de données MySQL fictif réaliste",
    ],
    technologies: [
      "FastAPI",
      "Python",
      "SQLAlchemy",
      "MySQL",
      "Groq LLM",
      "React",
      "Vite",
      "Tailwind CSS",
      "Recharts",
      "Framer Motion",
    ],
    languages: ["Python", "JavaScript", "SQL", "CSS"],
    architecture:
      "Architecture découplée : API REST FastAPI + SQLAlchemy/PyMySQL + validateur SQL côté backend, SPA React/Vite/Tailwind côté frontend.",
    githubUrl: "https://github.com/c0d3r-cheikh06/Transpobot",
    demoUrl: null,
    status: "complete",
    statusLabel: "Complet (local / prêt déploiement)",
    createdAt: "2026-09-22",
    pushedAt: "2026-09-22",
    stars: 0,
    featured: true,
    accentColor: "#38BDF8",
    terminalSlot: 1,
    mediaNote:
      "Pas de capture UI dans le dépôt — visualisation reconstruite à partir des routes et du schéma SQL.",
  },
  {
    slug: "sensante",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "SénSanté — Assistant Pré-Diagnostic",
    category: "academic",
    categoryLabel: "Projet Académique (ESP / UCAD)",
    categoryEvidence:
      "README indique : Cheikh Ahmed Tidiane THIAM — L2 GLSI — ESP/UCAD — 2026.",
    tagline: "Assistant de pré-diagnostic médical adapté au Sénégal combinant Machine Learning et Llama 3.",
    description:
      "Application IA combinant un modèle de classification entraîné avec scikit-learn (données patients Dakar, encodeurs région et sexe sérialisés via joblib) et une couche d'explication en langage naturel propulsée par Groq / Llama 3, le tout conteneurisé avec Docker et déployé sur Hugging Face Spaces.",
    objective:
      "Fournir une pré-orientation médicale pédagogique enrichie d'explications accessibles tout en maîtrisant la chaîne complète ML + API + Docker.",
    features: [
      "Pipeline d'exploration et d'entraînement scikit-learn avec évaluation par matrice de confusion (figures/confusion_matrix.png)",
      "API REST FastAPI servant les prédictions du modèle entraîné (joblib) et les explications LLM (/explain)",
      "Intégration Groq / Llama 3 pour vulgariser les résultats du classifieur",
      "Interface web responsive en Tailwind CSS servie par le backend FastAPI",
      "Conteneurisation Docker prête pour le déploiement sur Hugging Face Spaces (port 7860)",
    ],
    technologies: [
      "Python",
      "scikit-learn",
      "Pandas",
      "NumPy",
      "FastAPI",
      "Uvicorn",
      "Groq / Llama 3",
      "Tailwind CSS",
      "Docker",
    ],
    languages: ["Python", "HTML"],
    architecture:
      "Service Docker Python 3.11 hébergeant une API FastAPI qui charge les artefacts ML (.pkl) et orchestre les appels Groq/Llama 3.",
    githubUrl: "https://github.com/c0d3r-cheikh06/sensante",
    demoUrl: "https://c0d3r-cheikh06-sensante.hf.space",
    status: "complete",
    statusLabel: "Déployé (HF Spaces)",
    createdAt: "2026-04-03",
    pushedAt: "2026-06-10",
    stars: 0,
    featured: true,
    accentColor: "#34D399",
    terminalSlot: 2,
    mediaNote:
      "Contient une matrice de confusion ML (figures/confusion_matrix.png), aucune capture UI web.",
  },
  {
    slug: "quiz-live",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Parole Live — Quiz Temps Réel",
    category: "academic",
    categoryLabel: "Projet Académique",
    categoryEvidence:
      "Développé pour un exposé universitaire (« La communication orale en entreprise ») avec console animateur et mode projection.",
    tagline: "Plateforme de quiz interactif en direct synchronisée sur 3 écrans via Socket.IO et PostgreSQL.",
    description:
      "Système de quiz live multi-écrans comprenant une interface Participant (/), une console Animateur authentifiée (/admin) et un mode Projection plein écran (/projection). Toutes les transitions de phase et validations de réponses s'exécutent dans des transactions SQL verrouillées côté serveur.",
    objective:
      "Animer une session interactive en direct avec garantie d'intégrité des votes, zéro triche avant révélation et projection temps réel par QR code.",
    features: [
      "3 interfaces synchronisées en temps réel par WebSockets (Socket.IO sur serveur Node personnalisé)",
      "Machine à états stricte (IDLE → OPEN → CLOSED → RESULTS → REVEALED) sécurisée en transactions SQL verrouillées",
      "Génération automatique de QR codes pour rejoindre la session sur réseau local ou public",
      "Authentification animateur sécurisée par cookie HttpOnly signé (jose) et contrainte d'unicité des réponses en base",
      "Visualisation instantanée des résultats avec Recharts et suite de 29 scénarios de tests automatisés",
    ],
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Prisma",
      "PostgreSQL",
      "Socket.IO",
      "Recharts",
      "Zod",
    ],
    languages: ["TypeScript", "SQL", "CSS"],
    architecture:
      "Serveur Node/tsx unifié hébergeant Next.js 16 App Router et Socket.IO sur le même port, adossé à Prisma 7 + PostgreSQL.",
    githubUrl: "https://github.com/c0d3r-cheikh06/quiz-live",
    demoUrl: null,
    status: "complete",
    statusLabel: "Complet & testé (29 tests)",
    createdAt: "2026-11-04",
    pushedAt: "2026-11-04",
    stars: 0,
    featured: true,
    accentColor: "#A78BFA",
    terminalSlot: 3,
    mediaNote:
      "Aucune capture d'écran dans le dépôt — aperçu technique généré depuis les routes et le schéma Prisma.",
  },
  {
    slug: "schedulix",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Schedulix (EduSchedule v2)",
    category: "personal",
    categoryLabel: "Projet Personnel / Académique",
    categoryEvidence:
      "Version v2 aboutie et refactorisée du projet emplois_du_temps, avec lien de déploiement configuré sur GitHub.",
    tagline: "Système complet de gestion et génération d'emplois du temps scolaires avec détection de conflits.",
    description:
      "Plateforme web de planification scolaire en PHP 8 / MySQL offrant la gestion des niveaux, classes, salles, matières et enseignants, un moteur de génération automatique avec détection de conflits, un circuit de validation professeur → admin et des notifications in-app & SMTP.",
    objective:
      "Fiabiliser l'organisation hebdomadaire d'un établissement scolaire grâce à un workflow multi-rôles sécurisé.",
    features: [
      "Gestion complète des classes, niveaux, salles (normales, informatique, labo), matières et volumes horaires",
      "Génération automatique d'emplois du temps avec détection des chevauchements",
      "Espaces dédiés Admin, Professeur et Élève avec workflow de validation des créneaux",
      "Notifications temps réel in-app et envoi d'emails HTML via PHPMailer (SMTP)",
      "Sécurité native : protection CSRF, hachage password_hash et requêtes préparées PDO",
    ],
    technologies: ["PHP", "MySQL", "MariaDB", "PDO", "PHPMailer", "JavaScript", "CSS3"],
    languages: ["PHP", "SQL", "JavaScript", "CSS"],
    architecture:
      "Application web PHP 8 orientée rôles (admin/, eleve/, professeur/) avec base relationnelle MySQL/InnoDB et couche PDO sécurisée.",
    githubUrl: "https://github.com/c0d3r-cheikh06/schedulix",
    demoUrl: "https://schedulix-sigma.vercel.app",
    status: "complete",
    statusLabel: "Complet (v2)",
    createdAt: "2026-05-22",
    pushedAt: "2026-06-01",
    stars: 0,
    featured: true,
    accentColor: "#F59E0B",
    terminalSlot: 4,
    mediaNote:
      "Aucune capture d'écran dans le dépôt — schéma de données et modules vérifiés dans database.sql et admin/.",
  },
  {
    slug: "3D-website",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Pulse Store — Expérience 3D",
    category: "demo",
    categoryLabel: "Démonstration 3D Interactive",
    categoryEvidence:
      "Vitrine 3D Next.js + React Three Fiber chargeant un modèle GLB de sneaker (package.json nommé pulse-store) ; configurateur e-commerce encore en ébauche.",
    tagline: "Prototype de vitrine produit 3D interactive propulsée par React Three Fiber, Drei et GSAP.",
    description:
      "Expérience web 3D dédiée à la présentation d'une sneaker (« Pulse ») utilisant un modèle GLB optimisé, un éclairage HDR, des animations GSAP sur le Hero et une architecture modulaire Next.js 16 + TypeScript. Le configurateur e-commerce est structuré pour une extension future.",
    objective:
      "Explorer le rendu produit WebGL haute qualité, l'optimisation de modèles GLTF/GLB et l'orchestration d'animations GSAP dans Next.js.",
    features: [
      "Scène 3D interactive React Three Fiber + Drei avec modèle sneaker GLB optimisé et environnement HDR",
      "Animations d'entrée cinématiques orchestrées avec GSAP et Framer Motion",
      "Architecture de composants modulaire (Hero, Technology, Navbar, Configurator)",
      "Typage strict TypeScript avec Tailwind CSS v4 et état global Zustand",
    ],
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Three.js",
      "React Three Fiber",
      "Drei",
      "GSAP",
      "Framer Motion",
      "Tailwind CSS",
      "Zustand",
    ],
    languages: ["TypeScript", "CSS"],
    architecture:
      "Next.js 16 App Router modulaire intégrant une scène R3F/GLTF, un store Zustand et des styles découplés par section.",
    githubUrl: "https://github.com/c0d3r-cheikh06/3D-website",
    demoUrl: null,
    status: "in-progress",
    statusLabel: "Prototype en cours",
    createdAt: "2026-08-06",
    pushedAt: "2026-08-06",
    stars: 1,
    featured: true,
    accentColor: "#2DD4BF",
    terminalSlot: 5,
    mediaNote:
      "Contient des assets 3D (.glb, .hdr), aucune capture PNG statique dans le dépôt.",
  },
  {
    slug: "agro-meteo-senegal",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "AgroMétéo Sénégal",
    category: "personal",
    categoryLabel: "Projet Personnel",
    categoryEvidence:
      "Plateforme web PHP autonome d'aide à la décision agronomique ciblant 6 régions du Sénégal avec cache API local.",
    tagline: "Plateforme d'aide à la décision agricole croisant météo temps réel et analyse agronomique.",
    description:
      "Application web combinant les données OpenWeatherMap en temps réel et les prévisions à 5 jours avec un moteur d'analyse agronomique personnalisé (AgroAnalyzer) pour 6 régions du Sénégal (Dakar, Thiès, Saint-Louis, Kaolack, Ziguinchor, Tambacounda).",
    objective:
      "Transformer des prévisions météorologiques brutes en recommandations concrètes d'irrigation, de semis, de pulvérisation et de récolte.",
    features: [
      "Météo temps réel et prévisions sur 5 jours (tranches de 3h) pour 6 régions sénégalaises",
      "Calcul d'un score agro-climatique sur 100 et recommandations structurées (irrigation, semis, traitements)",
      "Tableau comparatif inter-régional et graphiques dynamiques (températures, pluies, humidité)",
      "Système de cache JSON côté serveur limitant les appels OpenWeatherMap + mode sombre/clair",
    ],
    technologies: ["PHP", "JavaScript", "CSS3", "OpenWeatherMap API", "Apache"],
    languages: ["PHP", "JavaScript", "CSS"],
    architecture:
      "Backend PHP 8 structuré en services (WeatherService + AgroAnalyzer + cache JSON) consommé par une interface dynamique AJAX.",
    githubUrl: "https://github.com/c0d3r-cheikh06/agro-meteo-senegal",
    demoUrl: null,
    status: "complete",
    statusLabel: "Complet",
    createdAt: "2026-04-03",
    pushedAt: "2026-04-03",
    stars: 0,
    featured: false,
    accentColor: "#84CC16",
    mediaNote: "Pas de capture d'écran UI dans le dépôt.",
  },
  {
    slug: "sunu_logis",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Sunu-Logis",
    category: "personal",
    categoryLabel: "Projet Personnel",
    categoryEvidence:
      "Plateforme immobilière PHP/MySQL dédiée au marché locatif sénégalais avec base de données complète et gestion locataires/propriétaires.",
    tagline: "Plateforme sénégalaise de recherche et réservation de logements entre particuliers.",
    description:
      "Application web de location courte, moyenne et longue durée (studios, appartements, villas à Mermoz, Almadies, Saly...) offrant des comptes locataires et propriétaires, un système de vérification d'identité, la recherche filtrée et des parcours de réservation et paiement locaux.",
    objective:
      "Fluidifier la mise en relation locative au Sénégal avec des filtres par quartier, durée de séjour et moyens de paiement locaux.",
    features: [
      "Gestion double profil Locataire / Propriétaire avec statut de vérification d'identité",
      "Catalogue de biens multi-types (studio, appartement, maison, villa) avec tarification journalière et mensuelle",
      "Moteur de recherche par ville, quartier, capacité et équipements",
      "Parcours de réservation et maquettes d'intégration Wave, Orange Money et virement bancaire",
    ],
    technologies: ["PHP", "MySQL", "JavaScript", "CSS3", "HTML5"],
    languages: ["PHP", "SQL", "JavaScript", "CSS"],
    architecture:
      "Site PHP procédural/modulaire connecté à MySQL InnoDB (tables users, logements, photos_logements, réservations).",
    githubUrl: "https://github.com/c0d3r-cheikh06/sunu_logis",
    demoUrl: null,
    status: "functional-prototype",
    statusLabel: "Prototype fonctionnel",
    createdAt: "2026-02-04",
    pushedAt: "2026-02-20",
    stars: 0,
    featured: false,
    accentColor: "#FB923C",
    mediaNote:
      "Contient des photos de logements de démonstration dans images/logements/, pas de capture UI globale.",
  },
  {
    slug: "sentransport",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "SenTransport",
    category: "academic",
    categoryLabel: "Projet Académique (Labs React)",
    categoryEvidence:
      "Historique Git mentionne explicitement « Lab 7 : meteo OpenWeatherMap + signalement incidents ».",
    tagline: "Explorateur cartographique des lignes de bus Dakar Dem Dikk avec météo et signalements.",
    description:
      "Application combinant une interface React + Leaflet et une API Python Flask exposant les lignes et arrêts du réseau Dakar Dem Dikk, enrichie d'une recherche instantanée, d'un module météo et d'un formulaire de signalement d'incidents.",
    objective:
      "Pratiquer l'architecture React + REST API Flask + cartographie interactive Leaflet autour d'un cas d'usage local.",
    features: [
      "Carte interactive Leaflet / React-Leaflet des itinéraires et arrêts Dakar Dem Dikk",
      "API REST Python Flask (/lignes, /lignes/<id>, /arrets) avec Flask-CORS",
      "Recherche et consultation détaillée des lignes de bus",
      "Intégration météo OpenWeatherMap et signalement d'incidents en direct",
    ],
    technologies: ["React", "JavaScript", "Leaflet", "Python", "Flask", "OpenWeatherMap API"],
    languages: ["JavaScript", "Python", "CSS"],
    architecture:
      "Frontend Create React App (React 19 + React-Leaflet) interrogeant un microservice Flask léger alimenté par des jeux de données JSON.",
    githubUrl: "https://github.com/c0d3r-cheikh06/sentransport",
    demoUrl: null,
    status: "functional-prototype",
    statusLabel: "Prototype fonctionnel",
    createdAt: "2026-04-20",
    pushedAt: "2026-06-10",
    stars: 1,
    featured: false,
    accentColor: "#60A5FA",
    mediaNote: "Aucune capture d'écran dans le dépôt.",
  },
  {
    slug: "GestionnaireDeNotes",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Gestionnaire de Notes (Android Room)",
    category: "academic",
    categoryLabel: "Projet Académique (TP Mobile)",
    categoryEvidence:
      "Package com.tpmobile.gestionnairenotes ; évolution avec persistance Room de l'examen TP Mobile 2025/2026.",
    tagline: "Application Android native en Java de gestion de notes avec persistance locale Room.",
    description:
      "Application mobile Android développée en Java permettant de créer, modifier, rechercher, colorer, partager et mettre en favoris des notes personnelles. Architecture propre séparant l'UI et la base Room via DAO, singleton thread-safe et ExecutorService.",
    objective:
      "Maîtriser la persistance Android moderne (Room + DAO), le multithreading hors UI thread et le pattern ActivityResultLauncher.",
    features: [
      "Persistance locale thread-safe avec Android Room, DAO dédié et ExecutorService",
      "Création, édition, suppression, favoris et recherche instantanée par titre",
      "Palette de couleurs personnalisable, mode sombre natif et partage de notes",
      "Découplage strict : ActiviteFormulaireNote renvoie le résultat via ActivityResultLauncher",
    ],
    technologies: ["Java", "Android SDK", "Room", "RecyclerView", "Material Design", "Gradle"],
    languages: ["Java", "XML"],
    architecture:
      "Application Android native Java (compileSdk 34) structurée par couches (modele, donnees/DAO, adaptateur, utilitaire).",
    githubUrl: "https://github.com/c0d3r-cheikh06/GestionnaireDeNotes",
    demoUrl: null,
    status: "complete",
    statusLabel: "Complet (édition Room)",
    createdAt: "2026-06-20",
    pushedAt: "2026-06-20",
    stars: 0,
    featured: false,
    accentColor: "#38D9A9",
    mediaNote: "Contient uniquement les icônes Android mipmap, pas de capture d'émulateur.",
  },
  {
    slug: "androidStudio",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Bibliothèque App (Android MVVM)",
    category: "academic",
    categoryLabel: "Projet Académique (Groupe ESP GLSI2B)",
    categoryEvidence:
      "README indique : « tp developpement mobile Esp glsi2b » réalisé en équipe de 7 étudiants incluant Cheikh Ahmed Tidiane THIAM.",
    tagline: "Application Android Java de gestion de bibliothèque en architecture MVVM + Room.",
    description:
      "Projet collaboratif de développement mobile Android à l'ESP (GLSI2B) mettant en œuvre ViewBinding, ViewModel, LiveData et Room pour gérer un catalogue de livres avec recherche, fiches détaillées et ajout/édition.",
    objective:
      "Appliquer l'architecture recommandée Android Jetpack (MVVM, LiveData, Room, ViewBinding) en travail d'équipe.",
    features: [
      "Architecture MVVM avec MainViewModel, LiveData et ViewBinding",
      "Stockage local persistant via Android Room",
      "Recherche réactive dans le catalogue de livres avec RecyclerView et CardView",
      "Écrans dédiés liste principale, détail d'ouvrage et formulaire d'ajout/édition",
    ],
    technologies: [
      "Java",
      "Android SDK",
      "Room",
      "ViewModel & LiveData",
      "ViewBinding",
      "Gradle Kotlin DSL",
    ],
    languages: ["Java", "XML", "Kotlin DSL"],
    architecture:
      "Application Android Jetpack Java (MVVM) avec activités dédiées et Gradle Kotlin DSL.",
    githubUrl: "https://github.com/c0d3r-cheikh06/androidStudio",
    demoUrl: null,
    status: "complete",
    statusLabel: "Complet (TP équipe)",
    createdAt: "2026-05-31",
    pushedAt: "2026-05-31",
    stars: 1,
    featured: false,
    accentColor: "#22C55E",
    mediaNote: "Aucune capture d'écran d'émulateur dans le dépôt.",
  },
  {
    slug: "samaChauffeur",
    owner: "daiki91",
    ownership: "collaboration",
    title: "samaChauffeur (Collaboration)",
    category: "collaboration",
    categoryLabel: "Collaboration (dépôt de daiki91)",
    categoryEvidence:
      "Dépôt appartenant à daiki91 auquel c0d3r-cheikh06 collabore — explicitement distingué des créations personnelles solo.",
    tagline: "Plateforme collaborative de VTC / ride-hailing (Web, Mobile Expo et API temps réel).",
    description:
      "Écosystème ride-hailing multi-clients comprenant une API Node.js/Express/TypeScript + Prisma + Socket.IO sur Supabase Postgres (migrée depuis un backend initial Django), un frontend React/Vite/Leaflet et une application mobile React Native / Expo.",
    objective:
      "Construire une application complète de réservation de trajets (privés, partagés, bus) avec suivi GPS temps réel et paiements locaux.",
    features: [
      "Backend Node.js/Express/TypeScript + Socket.IO temps réel + Prisma sur Supabase Postgres",
      "Authentification JWT (access/refresh), vérification OTP téléphone et rôles Client/Chauffeur/Admin",
      "Frontend web React + Vite + Leaflet et application mobile Expo (React Native 0.81 + Maps)",
      "Modélisation des paiements locaux (Wave, Orange Money, Free, Cash, Carte) et support bilingue fr/wo",
    ],
    technologies: [
      "TypeScript",
      "Node.js",
      "Express",
      "Prisma",
      "PostgreSQL",
      "Supabase",
      "Socket.IO",
      "React",
      "Vite",
      "Leaflet",
      "React Native",
      "Expo",
      "Django",
    ],
    languages: ["TypeScript", "Python", "SQL", "JavaScript"],
    architecture:
      "Monorepo collaboratif multi-clients : API Express/Socket.IO + Supabase Postgres, SPA React/Vite, app mobile Expo Router.",
    githubUrl: "https://github.com/daiki91/samaChauffeur",
    demoUrl: null,
    status: "in-progress",
    statusLabel: "En développement (équipe)",
    createdAt: "2026-02-09",
    pushedAt: "2026-08-17",
    stars: 0,
    featured: false,
    accentColor: "#E879F9",
    mediaNote: "Projet collaboratif hébergé sous le compte GitHub daiki91.",
  },
  {
    slug: "emplois_du_temps",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Emplois du Temps (v1)",
    category: "academic",
    categoryLabel: "Version v1 (remplacée par Schedulix)",
    categoryEvidence:
      "Première itération PHP/MySQL de gestion d'emplois du temps, ultérieurement enrichie et restructurée dans le dépôt schedulix.",
    tagline: "Première version du gestionnaire d'emplois du temps scolaires en PHP et MySQL.",
    description:
      "Version initiale mettant en place la structure relationnelle classes/matières/créneaux/salles, les endpoints API internes (generer_edt, valider_creneau, notifications) et le tableau de bord administrateur.",
    objective:
      "Poser les fondations fonctionnelles et SQL du moteur d'emplois du temps avant la refonte v2 (Schedulix).",
    features: [
      "Base relationnelle MariaDB/MySQL (classes, matières, créneaux, notifications)",
      "Endpoints PHP de génération et validation des créneaux horaires",
      "Interface d'administration des classes, professeurs et salles",
    ],
    technologies: ["PHP", "MySQL", "MariaDB", "JavaScript", "CSS3"],
    languages: ["PHP", "SQL", "JavaScript", "CSS"],
    architecture: "Application PHP + MySQL avec dossier api/ dédié aux actions asynchrones.",
    githubUrl: "https://github.com/c0d3r-cheikh06/emplois_du_temps",
    demoUrl: null,
    status: "functional-prototype",
    statusLabel: "Itération v1 (voir Schedulix)",
    createdAt: "2026-04-21",
    pushedAt: "2026-04-28",
    stars: 0,
    featured: false,
    secondary: true,
    supersededBy: "schedulix",
    accentColor: "#94A3B8",
    mediaNote: "Version antérieure à schedulix.",
  },
  {
    slug: "GestionnaireNotes",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "GestionnaireNotes (v1 SQLite)",
    category: "academic",
    categoryLabel: "Version v1 (remplacée par GestionnaireDeNotes)",
    categoryEvidence:
      "README indique examen TP Mobile 2025/2026 avec SQLite ; repris le lendemain dans GestionnaireDeNotes avec Android Room.",
    tagline: "Version initiale SQLite du gestionnaire de notes Android en Java.",
    description:
      "Première version de l'application Android de prise de notes s'appuyant directement sur SQLite avant sa migration vers la librairie Room dans GestionnaireDeNotes.",
    objective:
      "Implémenter la persistance locale Android avec SQLite et RecyclerView pour le TP Mobile.",
    features: [
      "CRUD complet sur des notes stockées localement dans SQLite",
      "Favoris, recherche par titre, palette de couleurs, mode sombre et partage",
    ],
    technologies: ["Java", "Android SDK", "SQLite", "RecyclerView", "Material Design"],
    languages: ["Java", "XML"],
    architecture: "Application Android native Java avec gestionnaire SQLite personnalisé.",
    githubUrl: "https://github.com/c0d3r-cheikh06/GestionnaireNotes",
    demoUrl: null,
    status: "complete",
    statusLabel: "Itération v1 (voir GestionnaireDeNotes)",
    createdAt: "2026-06-19",
    pushedAt: "2026-06-19",
    stars: 0,
    featured: false,
    secondary: true,
    supersededBy: "GestionnaireDeNotes",
    accentColor: "#94A3B8",
    mediaNote: "Itération SQLite précédant la version Room.",
  },
  {
    slug: "test",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "Auth Notification Exercise",
    category: "exercise",
    categoryLabel: "Exercice Technique",
    categoryEvidence:
      "package.json nommé auth-notification-exercise : petit serveur Express de 5 fichiers testant un formulaire avec notification Resend et Dockerfile.",
    tagline: "Exercice Node.js / Express + Docker d'envoi de notifications d'authentification.",
    description:
      "Mini-exercice backend/frontend démontrant la réception d'un formulaire d'inscription/connexion en Express avec déclenchement de notification email via l'API Resend et conteneurisation Docker.",
    objective:
      "Tester la mise en conteneur Docker d'un serveur Express et l'intégration d'un webhook/API d'envoi d'emails.",
    features: [
      "Serveur Express servant un formulaire statique HTML/CSS et un endpoint POST /send-notification",
      "Conteneurisation via Dockerfile (node:20-slim)",
    ],
    technologies: ["Node.js", "Express", "Docker", "HTML5", "CSS3"],
    languages: ["JavaScript", "CSS", "HTML"],
    architecture: "Micro-serveur Express autonome dans un conteneur Node 20.",
    githubUrl: "https://github.com/c0d3r-cheikh06/test",
    demoUrl: null,
    status: "functional-prototype",
    statusLabel: "Exercice",
    createdAt: "2026-09-13",
    pushedAt: "2026-09-15",
    stars: 0,
    featured: false,
    secondary: true,
    accentColor: "#64748B",
    mediaNote: "Exercice léger de 5 fichiers.",
  },
  {
    slug: "pulse-store",
    owner: "c0d3r-cheikh06",
    ownership: "own",
    title: "pulse-store (Dépôt vide)",
    category: "empty",
    categoryLabel: "Dépôt Vide",
    categoryEvidence:
      "0 commit, taille 0 KB sur GitHub — dépôt initialement créé avant le push du code sous 3D-website (dont le package.json se nomme pulse-store).",
    tagline: "Dépôt GitHub vide précurseur du projet 3D-website.",
    description:
      "Dépôt public sans commit recensé par souci d'exhaustivité de l'audit GitHub ; le code réel de Pulse Store se trouve dans le dépôt 3D-website.",
    objective: "Référencement transparent de tous les dépôts publics sans omission.",
    features: ["Aucun fichier poussé (voir le dépôt 3D-website)"],
    technologies: [],
    languages: [],
    architecture: "Dépôt vide (0 commit).",
    githubUrl: "https://github.com/c0d3r-cheikh06/pulse-store",
    demoUrl: null,
    status: "empty",
    statusLabel: "Vide (0 commit)",
    createdAt: "2026-08-03",
    pushedAt: "2026-08-03",
    stars: 0,
    featured: false,
    secondary: true,
    supersededBy: "3D-website",
    accentColor: "#475569",
    mediaNote: "Dépôt vide sur GitHub.",
  },
];

export const FEATURED_PROJECTS = AUDITED_PROJECTS.filter((p) => p.featured);
export const PRIMARY_PROJECTS = AUDITED_PROJECTS.filter((p) => !p.secondary);
