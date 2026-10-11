import Link from "next/link";
import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

/** Cover image, or the striped placeholder when there isn't one. */
export function Cover({
  src,
  alt,
  className = "",
  children,
}: {
  src: string | null;
  alt: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden bg-stripes ${className}`}>
      {src && <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" loading="lazy" />}
      {children}
    </div>
  );
}

export function FormatBadge({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <span
      className={`rounded-md bg-white/90 font-mono uppercase text-ink ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-[7px] py-[3px] text-[11px]"
      }`}
    >
      {children}
    </span>
  );
}

export function ProductCard({
  product,
  creatorName,
}: {
  product: Pick<Product, "slug" | "title" | "cover_url" | "formats" | "price_type" | "price_amount" | "currency">;
  creatorName?: string;
}) {
  const price = formatPrice(product.price_type, product.price_amount, product.currency);
  const format = product.formats[0];
  return (
    <Link href={`/p/${product.slug}`} className="group flex min-w-0 flex-col gap-[3px] text-ink hover:no-underline md:gap-1.5">
      <Cover
        src={product.cover_url}
        alt=""
        className="mb-2 aspect-[4/3] rounded-[14px] transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-float md:rounded-2xl"
      >
        {format && (
          <span className="absolute right-1.5 bottom-1.5 md:right-2.5 md:bottom-2.5">
            <FormatBadge>{format}</FormatBadge>
          </span>
        )}
      </Cover>
      <span className="truncate text-[15px] md:text-base">{product.title}</span>
      {creatorName ? (
        <span className="flex flex-col gap-[3px] md:flex-row md:items-baseline md:justify-between md:gap-3">
          <span className="truncate text-[13px] text-ink-3">{creatorName}</span>
          <span className="text-[15px] font-medium text-ink">{price}</span>
        </span>
      ) : (
        <span className="text-[15px] font-medium">{price}</span>
      )}
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <div className="aspect-[4/3] rounded-[14px] bg-skeleton md:rounded-2xl" />
      <div className="h-4 w-4/5 rounded bg-skeleton" />
      <div className="h-3.5 w-1/2 rounded bg-skeleton" />
    </div>
  );
}

export const GRID = "grid grid-cols-2 gap-x-3.5 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-10";

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
