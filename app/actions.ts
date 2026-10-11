"use server";

import { hasSupabase } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Logs a page view. The client dedupes to once per session per product. */
export async function logView(productId: string, referrer: string | null) {
  if (!hasSupabase || !UUID.test(productId)) return;
  await createPublicClient()
    .from("events")
    .insert({ product_id: productId, type: "view", referrer: referrer?.slice(0, 500) || null });
}
