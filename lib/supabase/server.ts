import "server-only";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Request-scoped client that carries the signed-in user's session cookies. */
export async function createClient() {
  const cookieStore = await cookies();
  // auth-js reads Date.now() to check session expiry; keep that out of the prerender.
  await io();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't write cookies; proxy.ts keeps the session fresh instead.
        }
      },
    },
  });
}
