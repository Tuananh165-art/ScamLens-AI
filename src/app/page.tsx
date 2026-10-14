import { getAuthenticatedUser } from "@/lib/supabase/server";
import { HomeApp } from "@/components/home-app";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const params = await searchParams;
  const auth = await getAuthenticatedUser().catch(() => ({ configured: false as const, client: null, user: null }));
  return <HomeApp key={auth.user?.id ?? "guest"} signedIn={Boolean(auth.user)} email={auth.user?.email ?? null} authConfigured={auth.configured} authError={params.auth === "error"} />;
}
