import { cacheLife } from "next/cache";
import { AUDITED_PROJECTS, type ProjectItem } from "@/data/projects";

export interface SyncedGitHubPayload {
  projects: ProjectItem[];
  syncedAt: string;
  source: "live-merged" | "audited-snapshot";
  totalPublicRepos: number;
  rateLimited: boolean;
}

interface GitHubApiRepo {
  name: string;
  full_name: string;
  fork: boolean;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
  html_url: string;
  size: number;
}

/**
 * Fetches live public repository metadata from GitHub for c0d3r-cheikh06,
 * merges fresh stats (stars, pushedAt, homepage, new repos) onto our deep audited dataset,
 * and gracefully falls back to the verified static snapshot if GitHub is rate-limited or offline.
 * Uses Next.js 16 `"use cache"` with hourly revalidation.
 */
export async function getSyncedProjects(): Promise<SyncedGitHubPayload> {
  "use cache";
  cacheLife("hours");

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CHEIKH-EXE-Portfolio",
  };
  // Optional server-only token if deployed with higher API quotas — never exposed to client
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      "https://api.github.com/users/c0d3r-cheikh06/repos?per_page=100&type=owner&sort=updated",
      { headers, signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) {
      return {
        projects: AUDITED_PROJECTS,
        syncedAt: new Date().toISOString(),
        source: "audited-snapshot",
        totalPublicRepos: AUDITED_PROJECTS.filter((p) => p.ownership === "own").length,
        rateLimited: res.status === 403 || res.status === 429,
      };
    }

    const liveRepos: GitHubApiRepo[] = await res.json();
    const bySlug = new Map(liveRepos.map((r) => [r.name.toLowerCase(), r]));

    const merged: ProjectItem[] = AUDITED_PROJECTS.map((item) => {
      if (item.ownership !== "own") return item;
      const live = bySlug.get(item.slug.toLowerCase());
      if (!live) return item;
      return {
        ...item,
        stars: live.stargazers_count ?? item.stars,
        pushedAt: live.pushed_at ? live.pushed_at.slice(0, 10) : item.pushedAt,
        demoUrl: live.homepage && live.homepage.trim().length > 0 ? live.homepage.trim() : item.demoUrl,
      };
    });

    // Append any newly published non-fork repo not yet in the audited catalog without inventing details
    const knownSlugs = new Set(AUDITED_PROJECTS.map((p) => p.slug.toLowerCase()));
    for (const live of liveRepos) {
      if (knownSlugs.has(live.name.toLowerCase())) continue;
      merged.push({
        slug: live.name,
        owner: "c0d3r-cheikh06",
        ownership: "own",
        title: live.name,
        category: live.fork ? "exercise" : live.size === 0 ? "empty" : "personal",
        categoryLabel: live.fork ? "Fork" : live.size === 0 ? "Dépôt vide" : "Nouveau dépôt GitHub",
        categoryEvidence: "Détecté automatiquement via synchronisation GitHub publique.",
        tagline: live.description || "Dépôt public synchronisé depuis GitHub.",
        description:
          live.description ||
          "Dépôt récemment détecté sur le compte GitHub c0d3r-cheikh06. Consultez directement le dépôt pour les détails techniques.",
        objective: "Synchronisation automatique en temps réel avec GitHub.",
        features: live.language ? [`Langage principal détecté : ${live.language}`] : [],
        technologies: live.language ? [live.language] : [],
        languages: live.language ? [live.language] : [],
        architecture: "Consultable directement sur GitHub.",
        githubUrl: live.html_url,
        demoUrl: live.homepage && live.homepage.trim() ? live.homepage.trim() : null,
        status: live.size === 0 ? "empty" : "in-progress",
        statusLabel: live.size === 0 ? "Vide" : "Synchronisé",
        createdAt: live.created_at.slice(0, 10),
        pushedAt: live.pushed_at.slice(0, 10),
        stars: live.stargazers_count,
        featured: false,
        secondary: live.fork || live.size === 0,
        accentColor: "#4EF2B8",
        mediaNote: "Synchronisé automatiquement depuis l'API GitHub.",
      });
    }

    return {
      projects: merged,
      syncedAt: new Date().toISOString(),
      source: "live-merged",
      totalPublicRepos: liveRepos.length,
      rateLimited: false,
    };
  } catch {
    return {
      projects: AUDITED_PROJECTS,
      syncedAt: new Date().toISOString(),
      source: "audited-snapshot",
      totalPublicRepos: AUDITED_PROJECTS.filter((p) => p.ownership === "own").length,
      rateLimited: false,
    };
  }
}
