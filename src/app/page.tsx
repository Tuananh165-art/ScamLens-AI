import { getAuthenticatedUser } from "@/lib/supabase/server";
import { HomeApp } from "@/components/home-app";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auth = await getAuthenticatedUser().catch(() => ({ configured: false as const, client: null, user: null }));
  return <HomeApp signedIn={Boolean(auth.user)} email={auth.user?.email ?? null} authConfigured={auth.configured} />;
}
