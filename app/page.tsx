import { Suspense } from "react";
import { BottomTabs } from "@/components/bottom-tabs";
import { FilterBar, HeroSearch, ResultsGrid } from "@/components/browse";
import { GridSkeleton } from "@/components/product-card";
import { HeaderUser, TopBar } from "@/components/top-bar";
import { Logo } from "@/components/ui";

export default function DiscoverPage() {
  return (
    <main className="mx-auto max-w-[1440px]">
      <TopBar />

      <section className="flex flex-col bg-wash px-5 pb-6 max-md:rounded-b-[28px] md:mx-6 md:items-center md:gap-5 md:rounded-[28px] md:border md:border-white md:px-10 md:pt-[88px] md:pb-24 md:text-center">
        <div className="flex h-14 items-center justify-between pt-2 md:hidden">
          <Logo />
          <Suspense fallback={null}>
            <HeaderUser />
          </Suspense>
        </div>
        <h1 className="mt-4 mb-5 text-[32px] leading-[1.1] font-medium tracking-[-0.03em] md:m-0 md:text-[56px] md:leading-[1.05]">
          <span className="md:hidden">Things people make.</span>
          <span className="hidden md:inline">
            Things people make,
            <br />
            ready to download.
          </span>
        </h1>
        <p className="hidden text-[17px] text-ink-2 md:block">
          Templates, ebooks, presets, fonts and courses from independent creators.
        </p>
        <div className="flex w-full justify-center md:mt-4">
          <HeroSearch />
        </div>
      </section>

      <FilterBar filters={{}} />

      <Suspense
        fallback={
          <div className="px-5 pt-[72px] pb-14 md:px-10 md:pt-24">
            <GridSkeleton />
          </div>
        }
      >
        <ResultsGrid filters={{}} heading="New this week" />
      </Suspense>

      <BottomTabs />
    </main>
  );
}
