import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BottomTabs } from "@/components/bottom-tabs";
import { CardSkeleton, ProductCard } from "@/components/product-card";
import { ShareButton } from "@/components/product-client";
import { buttonClass, Logo } from "@/components/ui";
import { getCreator } from "@/lib/data";

// Reached as /@handle through the rewrite in next.config.ts.

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const data = await getCreator(handle);
  if (!data) return { title: "Not found" };
  const { creator: c, products } = data;
  const description = c.bio || `${products.length} ${products.length === 1 ? "product" : "products"} by ${c.name} on Listly.`;
  return {
    title: `${c.name} (@${c.handle})`,
    description,
    alternates: { canonical: `/@${c.handle}` },
    openGraph: { type: "profile", title: c.name, description, url: `/@${c.handle}`, images: c.avatar_url ? [{ url: c.avatar_url }] : undefined },
  };
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "·"
  );
}

async function CreatorView({ params }: { params: PageProps<"/u/[handle]">["params"] }) {
  const { handle } = await params;
  const data = await getCreator(handle);
  if (!data) notFound();
  const { creator: c, products } = data;

  const path = `/@${c.handle}`;
  const site = c.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const since = new Date(c.created_at).getUTCFullYear();

  return (
    <>
      <header className="flex h-14 items-center justify-between px-5 pt-2 md:h-[72px] md:px-10 md:pt-0">
        <Logo />
        <ShareButton title={c.name} path={path} label="Share page" className={buttonClass("secondary", 44)} />
      </header>

      <section className="mx-0 flex flex-col items-start gap-5 bg-wash px-5 pt-6 pb-8 max-md:rounded-b-[28px] md:mx-6 md:flex-row md:items-center md:gap-8 md:rounded-[28px] md:border md:border-white md:p-14">
        <div className="flex size-20 flex-none items-center justify-center overflow-hidden rounded-full bg-white text-[26px] font-medium text-[#0B5A6E] shadow-[0_12px_30px_-14px_rgba(20,35,80,0.3)] md:size-28 md:text-4xl">
          {c.avatar_url ? <img src={c.avatar_url} alt="" className="size-full object-cover" /> : initials(c.name)}
        </div>
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[32px] leading-[1.05] font-medium tracking-[-0.03em] md:text-[44px]">{c.name}</h1>
          {c.bio && <p className="max-w-[560px] text-base leading-[1.55] text-pretty text-ink-2 md:text-[17px]">{c.bio}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
            <span>@{c.handle}</span>
            {site && (
              <a href={c.website!} target="_blank" rel="noopener nofollow" className="link">
                {site}
              </a>
            )}
            <span>Member since {since}</span>
          </div>
        </div>
      </section>

      <h2 className="px-5 pt-8 pb-4 text-lg font-medium tracking-[-0.01em] md:px-10 md:pt-10 md:text-[22px]">
        {products.length} {products.length === 1 ? "product" : "products"}
      </h2>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 px-5 pb-14 md:grid-cols-3 md:gap-x-6 md:gap-y-10 md:px-10">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="px-5 pb-14 text-base text-ink-2 md:px-10">Nothing listed yet.</p>
      )}
    </>
  );
}

function CreatorSkeleton() {
  return (
    <div aria-hidden>
      <div className="h-14 md:h-[72px]" />
      <div className="mx-0 h-[220px] bg-skeleton max-md:rounded-b-[28px] md:mx-6 md:h-[224px] md:rounded-[28px]" />
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 px-5 pt-[72px] md:grid-cols-3 md:gap-x-6 md:px-10 md:pt-24">
        {Array.from({ length: 3 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function CreatorPage({ params }: PageProps<"/u/[handle]">) {
  return (
    <main className="mx-auto max-w-[1440px]">
      <Suspense fallback={<CreatorSkeleton />}>
        <CreatorView params={params} />
      </Suspense>
      {/* Reads the pathname, which on a dynamic route needs its own boundary. */}
      <Suspense fallback={null}>
        <BottomTabs />
      </Suspense>
    </main>
  );
}
