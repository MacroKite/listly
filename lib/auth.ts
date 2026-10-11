import "server-only";
import { hasSupabase } from "./supabase/env";
import { createClient } from "./supabase/server";

export type SessionUser = { id: string; name: string; handle: string | null };

/** The signed-in user, or null. Reads cookies, so callers must sit inside <Suspense>. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return null;

  const { data: profile } = await supabase.from("users").select("name, handle").eq("id", sub).maybeSingle();
  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  return { id: sub, name: profile?.name || email.split("@")[0] || "You", handle: profile?.handle ?? null };
}
