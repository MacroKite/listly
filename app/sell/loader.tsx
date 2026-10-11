"use client";

import dynamic from "next/dynamic";

/**
 * The flow restores its draft from localStorage on first render, so it only
 * renders in the browser; this avoids a hydration flash of the empty form.
 */
export const SellLoader = dynamic(() => import("./flow"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-dvh flex-col md:bg-wash-flow" aria-busy>
      <div className="mx-auto flex w-full flex-col gap-6 px-5 pt-24 md:max-w-[640px] md:px-0 md:pt-36">
        <div className="h-10 w-3/4 rounded bg-skeleton" />
        <div className="h-4 w-full rounded bg-skeleton" />
        <div className="h-[60px] rounded-2xl bg-skeleton" />
      </div>
    </main>
  ),
});
