"use server";

import { updateTag } from "next/cache";
import { normaliseUrl, slugify, storeDomain } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import { SUPABASE_URL, hasSupabase } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Draft } from "@/lib/types";

export type PublishResult = { ok: true; slug: string } | { ok: false; error: string; needsSignIn?: boolean };

const clean = (s: string, max: number) => s.replace(/\s+/g, " ").trim().slice(0, max);
const tags = (xs: string[], max = 12) => [...new Set(xs.map((x) => clean(x, 40)).filter(Boolean))].slice(0, max);

export async function publishProduct(draft: Draft): Promise<PublishResult> {
  if (!hasSupabase) {
    return { ok: false, error: "Publishing needs a Supabase project. Add the keys in .env.local to turn it on." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { ok: false, error: "Sign in to publish.", needsSignIn: true };

  const url = normaliseUrl(draft.url);
  if (!url) return { ok: false, error: "That link didn’t open — check it starts with https://" };
  const title = clean(draft.title, 140);
  if (!title) return { ok: false, error: "Give it a name so people know what it is." };

  const amount = Number(draft.amount);
  const paid = draft.priceType === "paid";
  if (paid && !(amount > 0)) return { ok: false, error: "Add a price, or switch to Free." };

  // Only accept screenshots this user uploaded to our bucket.
  const mediaPrefix = `${SUPABASE_URL}/storage/v1/object/public/media/${userId}/`;
  const screenshots = draft.screenshots.filter((s) => s.startsWith(mediaPrefix)).slice(0, 5);
  const cover = draft.cover?.startsWith("https://") ? draft.cover : (screenshots[0] ?? null);

  const row = {
    user_id: userId,
    title,
    tagline: clean(draft.tagline, 200) || null,
    description: draft.description.trim().slice(0, 5000) || null,
    price_type: paid ? "paid" : "free",
    price_amount: paid ? Math.round(amount * 100) / 100 : null,
    currency: draft.currency === "USD" ? "USD" : "BDT",
    category: CATEGORIES.find((c) => c === draft.category) ?? null,
    works_with: tags(draft.worksWith),
    formats: tags(draft.formats, 6).map((f) => f.toUpperCase()),
    included: draft.included
      .map((r) => ({ label: clean(r.label, 120), format: clean(r.format, 12).toUpperCase() }))
      .filter((r) => r.label)
      .slice(0, 20),
    updated_label: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    external_url: url,
    external_domain: storeDomain(url),
    cover_url: cover,
    screenshots: cover === screenshots[0] ? screenshots.slice(1) : screenshots,
    status: "live",
  };

  const base = slugify(title) || "product";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("products").insert({ ...row, slug });
    if (!error) {
      updateTag("products");
      return { ok: true, slug };
    }
    if (error.code !== "23505" || !error.message.includes("slug")) {
      console.error("publishProduct", error);
      return { ok: false, error: "Something went wrong saving your product. Your draft is safe — try again." };
    }
  }
  return { ok: false, error: "Couldn’t find a free page address. Try a slightly different name." };
}
