"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { logView } from "@/app/actions";
import { siteUrl } from "@/lib/format";

/** Counts a view once per browser session per product. */
export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const key = `listly:viewed:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count, at worst once per page load.
    }
    void logView(productId, document.referrer || null);
  }, [productId]);
  return null;
}

/** Desktop gallery: 16:10 stage, counter, and a row of thumbnails. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  const slots = images.length ? images : [null];
  const current = slots[i] ?? null;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-stripes">
        {current && <img src={current} alt={title} className="absolute inset-0 size-full object-cover" />}
        {slots.length > 1 && (
          <span className="absolute right-5 bottom-5 rounded-full bg-white/90 px-3 py-1.5 text-[13px]">
            {i + 1} / {slots.length}
          </span>
        )}
      </div>
      {slots.length > 1 && (
        <div className="grid grid-cols-6 gap-2.5">
          {slots.slice(0, 6).map((src, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show image ${n + 1}`}
              aria-pressed={n === i}
              className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-stripes transition-[border-color] duration-150 ${
                n === i ? "border-2 border-ink" : "border-2 border-transparent hover:border-input"
              }`}
            >
              {src && <img src={src} alt="" className="absolute inset-0 size-full object-cover" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Native share sheet where there is one, else copy the link. `copied` flips for a moment after copying. */
function useShare(title: string, path: string) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${siteUrl()}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled; fall through to copy.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return { share, copied };
}

export function ShareButton({ title, path, label = "Share", className = "" }: { title: string; path: string; label?: string; className?: string }) {
  const { share, copied } = useShare(title, path);
  return (
    <button type="button" onClick={share} className={className}>
      {copied ? "Link copied" : label}
    </button>
  );
}

/** Mobile hero: full-bleed swipeable cover with back + share and position dots. */
export function MobileGallery({ images, title, path }: { images: string[]; title: string; path: string }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const { share, copied } = useShare(title, path);
  const slots = images.length ? images : [null];

  return (
    <div className="relative h-[300px] md:hidden">
      <div
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {slots.map((src, n) => (
          <div key={n} className="relative h-full w-full flex-none snap-center bg-stripes">
            {src && <img src={src} alt={n === 0 ? title : ""} className="absolute inset-0 size-full object-cover" />}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
        aria-label="Back"
        className="absolute top-4 left-4 flex size-11 items-center justify-center rounded-full bg-white/92"
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={share}
        className="absolute top-4 right-4 flex h-11 items-center rounded-full bg-white/92 px-4 text-sm font-medium"
      >
        {copied ? "Link copied" : "Share"}
      </button>
      {slots.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
          {slots.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-[width] duration-200 ease-out ${n === i ? "w-[18px] bg-ink" : "w-1.5 bg-ink/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
