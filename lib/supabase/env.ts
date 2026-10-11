export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** False until the project is connected; the app then serves demo data read-only. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
