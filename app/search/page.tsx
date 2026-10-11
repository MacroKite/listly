import type { Metadata } from "next";
import { Suspense } from "react";
import { BottomTabs } from "@/components/bottom-tabs";
import { FilterBar, HeroSearch, ResultsGrid } from "@/components/browse";
import { GridSkeleton } from "@/components/product-card";
import { TopBar } from "@/components/top-bar";
import { CATEGORIES } from "@/lib/categories";
import type { Filters } from "@/lib/data";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function SearchResults({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = (first(sp.q) ?? "").trim().slice(0, 80);
  const catParam = first(sp.cat);
  const cat = CATEGORIES.find((c) => c === catParam);
  const filters: Filters = { q: q || undefined, cat, free: first(sp.free) === "1" };

  const heading = q ? `Results for “${q}”` : cat ? cat : filters.free ? "Free products" : "Everything";

  return (
    <>
      <TopBar variant="page" query={q} />
      <div className="px-5 pt-4 md:hidden">
        <HeroSearch defaultValue={q} />
      </div>
      <FilterBar filters={filters} />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={
          <div className="px-5 pt-[72px] pb-14 md:px-10 md:pt-24">
            <GridSkeleton />
          </div>
        }
      >
        <ResultsGrid filters={filters} heading={heading} />
      </Suspense>
    </>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="mx-auto max-w-[1440px]">
      <Suspense
        fallback={
          <div className="px-5 pt-24 md:px-10 md:pt-40">
            <GridSkeleton />
          </div>
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
      <BottomTabs />
    </main>
  );
}
