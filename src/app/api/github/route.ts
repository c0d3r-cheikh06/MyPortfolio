import { getSyncedProjects } from "@/lib/github";

export async function GET() {
  const payload = await getSyncedProjects();
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
