import { Suspense } from "react";
import { getSyncedProjects } from "@/lib/github";
import { AUDITED_PROJECTS } from "@/data/projects";
import { ExperienceShell } from "@/components/ExperienceShell";

async function UniverseLoader() {
  const payload = await getSyncedProjects();
  return (
    <ExperienceShell
      initialProjects={payload.projects}
      initialSyncSource={payload.source}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <ExperienceShell
          initialProjects={AUDITED_PROJECTS}
          initialSyncSource="audited-snapshot"
        />
      }
    >
      <UniverseLoader />
    </Suspense>
  );
}
