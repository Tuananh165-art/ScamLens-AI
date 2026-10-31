import { getAuthenticatedUser } from "@/lib/supabase/server";
import { HomeApp } from "@/components/home-app";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const params = await searchParams;
  const auth = await getAuthenticatedUser().catch(() => ({ configured: false as const, client: null, user: null }));
  const avatarValue = auth.user?.user_metadata?.avatar_url ?? auth.user?.user_metadata?.picture;
  const avatarUrl = typeof avatarValue === "string" && /^https:\/\//i.test(avatarValue) ? avatarValue : null;
  return <HomeApp key={auth.user?.id ?? "guest"} signedIn={Boolean(auth.user)} email={auth.user?.email ?? null} avatarUrl={avatarUrl} authConfigured={auth.configured} authError={params.auth === "error"} />;
}
