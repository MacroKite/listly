import { NextResponse, type NextRequest } from "next/server";
import { DEMO_PRODUCTS } from "@/lib/demo";
import { hasSupabase } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Logs an outbound click, then 302s to the creator's store. */
export async function GET(request: NextRequest, ctx: RouteContext<"/go/[productId]">) {
  const { productId } = await ctx.params;
  const home = new URL("/", request.url);

  if (!hasSupabase) {
    const demo = DEMO_PRODUCTS.find((p) => p.id === productId);
    return NextResponse.redirect(demo?.external_url ?? home, 302);
  }
  if (!UUID.test(productId)) return NextResponse.redirect(home, 302);

  const db = createPublicClient();
  const { data: product } = await db
    .from("products")
    .select("external_url")
    .eq("id", productId)
    .eq("status", "live")
    .maybeSingle();
  if (!product) return NextResponse.redirect(home, 302);

  // PostgREST errors come back as { error } rather than throwing, so a failed
  // insert never blocks the buyer's redirect.
  await db
    .from("events")
    .insert({ product_id: productId, type: "click", referrer: request.headers.get("referer")?.slice(0, 500) ?? null });

  return NextResponse.redirect(product.external_url, 302);
}
