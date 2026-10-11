import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { Gallery, MobileGallery, ViewTracker } from "@/components/product-client";
import { CardSkeleton, ProductCard } from "@/components/product-card";
import { TopBar } from "@/components/top-bar";
import { Avatar, buttonClass } from "@/components/ui";
import { CATEGORY_BACK_LABEL } from "@/lib/categories";
import { getProduct } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Not found" };
  const { product: p } = data;
  const price = formatPrice(p.price_type, p.price_amount, p.currency);
  const description = p.tagline || `${price} on ${p.external_domain}, by ${p.creator.name}.`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      type: "website",
      title: p.title,
      description: `${price} · ${description}`,
      url: `/p/${p.slug}`,
      images: p.cover_url ? [{ url: p.cover_url }] : undefined,
    },
    twitter: { card: p.cover_url ? "summary_large_image" : "summary", title: p.title, description },
  };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 md:gap-[3px]">
      <span className="text-xs text-ink-3 md:text-[13px]">{label}</span>
      <span className="text-sm md:text-[15px]">{value}</span>
    </div>
  );
}

async function ProductView({ params }: { params: PageProps<"/p/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product: p, more } = data;

  const price = formatPrice(p.price_type, p.price_amount, p.currency);
  const images = [p.cover_url, ...p.screenshots].filter((x): x is string => !!x);
  const go = `/go/${p.id}`;
  const firstName = p.creator.name.split(" ")[0];
  const facts = [
    { label: "Works with", value: p.works_with.join(", ") },
    { label: "Format", value: p.formats.join(", ") },
    { label: "Size", value: p.file_size ?? "" },
    { label: "Updated", value: p.updated_label ?? "" },
  ].filter((f) => f.value);
  const creatorMeta = `${p.creator.bio ? `${p.creator.bio} · ` : ""}${p.creator.product_count} ${
    p.creator.product_count === 1 ? "product" : "products"
  }`;

  return (
    <>
      <ViewTracker productId={p.id} />
      <MobileGallery images={images} title={p.title} path={`/p/${p.slug}`} />

      <Link
        href={p.category ? `/search?cat=${encodeURIComponent(p.category)}` : "/"}
        className="hidden items-center gap-1.5 px-10 pt-8 text-sm text-ink-3 hover:text-ink hover:no-underline md:flex"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
        {(p.category && CATEGORY_BACK_LABEL[p.category]) || "Discover"}
      </Link>

      <div className="grid items-start gap-4 px-5 pt-5 md:grid-cols-[minmax(0,1fr)_400px] md:gap-14 md:px-10 md:pt-6 md:pb-16">
        {/* Right column on desktop; first on mobile. */}
        <aside className="flex flex-col gap-4 md:order-2 md:gap-5 md:rounded-3xl md:border md:border-line md:bg-surface md:p-7">
          <div className="flex flex-col gap-1.5 md:gap-2.5">
            <h1 className="text-2xl leading-[1.2] font-medium tracking-[-0.02em] md:text-[30px] md:leading-[1.15] md:tracking-[-0.025em]">
              {p.title}
            </h1>
            {p.tagline && <p className="text-base leading-[1.55] text-ink-2 md:text-[15px]">{p.tagline}</p>}
          </div>
          <div className="hidden text-[28px] font-medium tracking-[-0.01em] md:block">{price}</div>
          <div className="hidden flex-col gap-2.5 md:flex">
            <a href={go} target="_blank" rel="noopener" className={buttonClass("primary", 56, "w-full hover:text-white hover:no-underline")}>
              Get it on {p.external_domain}
              <ArrowUpRight size={16} strokeWidth={1.75} />
            </a>
            <p className="text-center text-[13px] text-ink-3">You’ll pay the creator directly on their store.</p>
          </div>

          {facts.length > 0 && (
            <div className="grid grid-cols-3 gap-x-4 border-y border-line-soft py-3 md:grid-cols-2 md:gap-y-3.5 md:py-[18px]">
              {facts.map((f) => (
                <div key={f.label} className={f.label === "Size" ? "hidden md:block" : ""}>
                  <Fact {...f} />
                </div>
              ))}
            </div>
          )}

          {p.description && (
            <p className="text-base leading-[1.6] text-ink-2 md:hidden">{p.description}</p>
          )}

          <div className="flex items-center gap-3">
            <Avatar name={p.creator.name} size={44} tone="teal" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-medium">{p.creator.name}</span>
              <span className="truncate text-[13px] text-ink-3">{creatorMeta}</span>
            </div>
            <Link href={`/@${p.creator.handle}`} className="link flex min-h-11 items-center text-sm">
              <span className="md:hidden">View</span>
              <span className="hidden md:inline">View page</span>
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-10 md:order-1">
          <div className="hidden md:block">
            <Gallery images={images} title={p.title} />
          </div>
          {p.description && (
            <section className="hidden max-w-[640px] flex-col gap-3.5 md:flex">
              <h2 className="text-xl font-medium">About</h2>
              <p className="text-base leading-[1.7] text-pretty whitespace-pre-line text-ink-2">{p.description}</p>
            </section>
          )}
          {p.included.length > 0 && (
            <section className="flex max-w-[640px] flex-col gap-3.5">
              <h2 className="text-xl font-medium">What’s included</h2>
              <ul className="flex flex-col border-t border-line-soft">
                {p.included.map((row, n) => (
                  <li key={n} className="flex items-center justify-between gap-4 border-b border-line-soft py-3.5 text-[15px]">
                    <span>{row.label}</span>
                    {row.format && <span className="font-mono text-xs text-ink-3 uppercase">{row.format}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {more.length > 0 && (
        <section className="flex flex-col gap-5 px-5 pt-10 pb-14 md:px-10 md:pt-0">
          <h2 className="text-lg font-medium tracking-[-0.01em] md:text-[22px]">More from {firstName}</h2>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 md:grid-cols-4 md:gap-6">
            {more.map((m) => (
              <ProductCard key={m.id} product={m} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky buy bar. */}
      <div className="h-24 md:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line-soft bg-white/94 px-5 pt-3 pb-8 backdrop-blur md:hidden">
        <div className="flex flex-col">
          <span className="text-xl font-medium">{price}</span>
          <span className="text-xs text-ink-3">on {p.external_domain}</span>
        </div>
        <a href={go} target="_blank" rel="noopener" className={buttonClass("primary", 52, "flex-1 hover:text-white hover:no-underline")}>
          Get it
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </a>
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-6 px-5 pt-5 md:grid-cols-[minmax(0,1fr)_400px] md:gap-14 md:px-10 md:pt-14" aria-hidden>
      <div className="aspect-[16/10] rounded-3xl bg-skeleton" />
      <div className="flex flex-col gap-4 rounded-3xl md:border md:border-line md:bg-surface md:p-7">
        <div className="h-8 w-4/5 rounded bg-skeleton" />
        <div className="h-4 w-3/5 rounded bg-skeleton" />
        <div className="h-14 rounded-full bg-skeleton" />
        <CardSkeleton />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/p/[slug]">) {
  return (
    <main className="mx-auto max-w-[1440px]">
      <TopBar variant="page" />
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView params={params} />
      </Suspense>
    </main>
  );
}
