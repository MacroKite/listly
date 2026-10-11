import Link from "next/link";
import Form from "next/form";
import { Search } from "lucide-react";
import { DISCOVER_CATEGORIES } from "@/lib/categories";
import { listProducts, type Filters } from "@/lib/data";
import { chipClass } from "./ui";
import { GRID, ProductCard } from "./product-card";

function searchHref(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.cat) p.set("cat", f.cat);
  if (f.free) p.set("free", "1");
  const s = p.toString();
  return s ? `/search?${s}` : "/";
}

/**
 * Big pill search: 64px with a dark Search button on desktop, 56px on mobile.
 * Two forms because the placeholder copy differs and can't be swapped in CSS.
 */
export function HeroSearch({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <>
      <Form
        action="/search"
        className="focus-ring flex h-14 w-full items-center gap-2.5 rounded-full border border-input bg-surface px-5 shadow-search md:hidden"
      >
        <Search size={20} strokeWidth={1.5} className="flex-none text-ink-3" aria-hidden />
        <input
          name="q"
          type="search"
          defaultValue={defaultValue}
          aria-label="Search products"
          placeholder="Templates, ebooks, presets…"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-3"
        />
      </Form>
      <Form
        action="/search"
        className="focus-ring hidden h-16 w-full max-w-[680px] items-center gap-3 rounded-full border border-input bg-surface pr-2 pl-6 shadow-search md:flex"
      >
        <Search size={22} strokeWidth={1.5} className="flex-none text-ink-3" aria-hidden />
        <input
          name="q"
          type="search"
          defaultValue={defaultValue}
          aria-label="Search products"
          placeholder="Try “notion budget” or “lightroom presets”"
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink placeholder:text-ink-3"
        />
        <button
          type="submit"
          className="h-12 flex-none rounded-full bg-ink px-6 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-ink/90"
        >
          Search
        </button>
      </Form>
    </>
  );
}

export function FilterBar({ filters }: { filters: Filters }) {
  return (
    <div className="flex flex-col gap-4 px-5 pt-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-10 md:pt-10">
      <nav aria-label="Categories" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
        <Link href={searchHref({ ...filters, cat: undefined })} className={chipClass(!filters.cat)} aria-current={!filters.cat ? "true" : undefined}>
          All
        </Link>
        {DISCOVER_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={searchHref({ ...filters, cat: c })}
            className={chipClass(filters.cat === c)}
            aria-current={filters.cat === c ? "true" : undefined}
          >
            {c}
          </Link>
        ))}
      </nav>
      <div className="flex flex-none self-start rounded-full bg-track p-1 md:self-auto" role="group" aria-label="Price">
        {[
          { label: "Any price", on: !filters.free, href: searchHref({ ...filters, free: false }) },
          { label: "Free", on: !!filters.free, href: searchHref({ ...filters, free: true }) },
        ].map((o) => (
          <Link
            key={o.label}
            href={o.href}
            aria-current={o.on ? "true" : undefined}
            className={`flex h-8 items-center rounded-full px-3.5 text-[13px] hover:no-underline ${
              o.on ? "bg-surface font-medium text-ink shadow-seg" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function ResultsGrid({ filters, heading }: { filters: Filters; heading: string }) {
  const { items, total } = await listProducts(filters);
  return (
    <>
      <div className="flex items-baseline justify-between px-5 pt-6 pb-3 md:px-10 md:pt-10 md:pb-4">
        <h2 className="text-lg font-medium tracking-[-0.01em] md:text-[22px]">{heading}</h2>
        <span className="text-sm text-ink-3">
          {total.toLocaleString("en-US")} {total === 1 ? "product" : "products"}
        </span>
      </div>
      <div className="px-5 pb-14 md:px-10">
        {items.length ? (
          <div className={GRID}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} creatorName={p.creator?.name} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
            <p className="text-lg font-medium">Nothing here yet</p>
            <p className="text-[15px] text-ink-2">Try a different word, or browse all categories.</p>
            <Link href="/" className="link mt-2 text-[15px]">
              Browse everything
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
