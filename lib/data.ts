import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DEMO_CREATORS, DEMO_PRODUCTS } from "./demo";
import { hasSupabase } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
import type { Creator, Product, ProductWithCreator, Profile } from "./types";

export type ListItem = Product & { creator: Creator };
export type Filters = { q?: string; cat?: string; free?: boolean };

const CREATOR_COLS = "id,name,handle,avatar_url,bio";
const LIST_SELECT = `*, creator:users(${CREATOR_COLS})`;

/** PostgREST `or()` filters are comma/paren-delimited; keep the query to plain words. */
function cleanQuery(q: string) {
  return q.replace(/[,()"\\%_*:]/g, " ").replace(/\s+/g, " ").trim();
}

export async function listProducts(filters: Filters, limit = 24): Promise<{ items: ListItem[]; total: number }> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const q = cleanQuery(filters.q ?? "");

  if (!hasSupabase) {
    const needle = q.toLowerCase();
    const items = DEMO_PRODUCTS.filter(
      (p) =>
        (!filters.cat || p.category === filters.cat) &&
        (!filters.free || p.price_type === "free") &&
        (!needle || `${p.title} ${p.tagline ?? ""} ${p.category}`.toLowerCase().includes(needle)),
    ).map((p) => ({ ...p, creator: DEMO_CREATORS.find((c) => c.id === p.user_id)! }));
    return { items: items.slice(0, limit), total: items.length };
  }

  let query = createPublicClient()
    .from("products")
    .select(LIST_SELECT, { count: "exact" })
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (filters.cat) query = query.eq("category", filters.cat);
  if (filters.free) query = query.eq("price_type", "free");
  if (q) query = query.or(`title.ilike.%${q}%,tagline.ilike.%${q}%,category.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) throw new Error(`listProducts: ${error.message}`);
  return { items: (data ?? []) as ListItem[], total: count ?? 0 };
}

export async function getProduct(
  slug: string,
): Promise<{ product: ProductWithCreator; more: Product[] } | null> {
  "use cache";
  cacheTag("products", `product:${slug}`);
  cacheLife("minutes");

  if (!hasSupabase) {
    const p = DEMO_PRODUCTS.find((x) => x.slug === slug);
    if (!p) return null;
    const theirs = DEMO_PRODUCTS.filter((x) => x.user_id === p.user_id);
    const creator = DEMO_CREATORS.find((c) => c.id === p.user_id)!;
    return {
      product: { ...p, creator: { ...creator, product_count: theirs.length } },
      more: theirs.filter((x) => x.id !== p.id).slice(0, 4),
    };
  }

  const db = createPublicClient();
  const { data: p, error } = await db
    .from("products")
    .select(LIST_SELECT)
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (error) throw new Error(`getProduct: ${error.message}`);
  if (!p) return null;

  const { data: more, count } = await db
    .from("products")
    .select("*", { count: "exact" })
    .eq("user_id", p.user_id)
    .eq("status", "live")
    .neq("id", p.id)
    .order("created_at", { ascending: false })
    .limit(4);

  return {
    product: { ...(p as ListItem), creator: { ...(p as ListItem).creator, product_count: (count ?? 0) + 1 } },
    more: (more ?? []) as Product[],
  };
}

/** A creator and their live products, newest first, for /@handle. */
export async function getCreator(handle: string): Promise<{ creator: Profile; products: Product[] } | null> {
  "use cache";
  cacheTag("products", `creator:${handle.toLowerCase()}`);
  cacheLife("minutes");

  if (!hasSupabase) {
    const c = DEMO_CREATORS.find((x) => x.handle === handle.toLowerCase());
    if (!c) return null;
    return {
      creator: { ...c, website: null, created_at: "2026-01-01T00:00:00Z" },
      products: DEMO_PRODUCTS.filter((p) => p.user_id === c.id),
    };
  }

  const db = createPublicClient();
  // handle is citext, so /@Tanvir finds @tanvir.
  const { data: creator, error } = await db
    .from("users")
    .select(`${CREATOR_COLS},website,created_at`)
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw new Error(`getCreator: ${error.message}`);
  if (!creator) return null;

  const { data: products, error: productsError } = await db
    .from("products")
    .select("*")
    .eq("user_id", creator.id)
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (productsError) throw new Error(`getCreator: ${productsError.message}`);

  return { creator: creator as Profile, products: (products ?? []) as Product[] };
}
