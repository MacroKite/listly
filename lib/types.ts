export type PriceType = "free" | "paid" | "pwyw";
export type Currency = "BDT" | "USD";
export type ProductStatus = "draft" | "live" | "hidden";

export type IncludedItem = { label: string; format: string };

export type Creator = {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  bio: string | null;
};

export type Product = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  price_type: PriceType;
  price_amount: number | null;
  currency: Currency;
  category: string | null;
  works_with: string[];
  formats: string[];
  included: IncludedItem[];
  file_size: string | null;
  updated_label: string | null;
  external_url: string;
  external_domain: string;
  cover_url: string | null;
  screenshots: string[];
  status: ProductStatus;
  created_at: string;
};

/** The public creator page: the card fields plus what only /@handle shows. */
export type Profile = Creator & { website: string | null; created_at: string };

export type ProductWithCreator = Product & {
  creator: Creator & { product_count: number };
};

/** What /api/unfurl returns. Every field is best-effort. */
export type Unfurl = {
  title: string | null;
  tagline: string | null;
  cover: string | null;
  price: number | null;
  currency: Currency | null;
  domain: string;
  url: string;
};

/** The listing-flow draft, autosaved to localStorage until publish. */
export type Draft = {
  url: string;
  domain: string;
  title: string;
  tagline: string;
  description: string;
  priceType: "free" | "paid";
  amount: string;
  currency: Currency;
  category: string;
  worksWith: string[];
  formats: string[];
  included: IncludedItem[];
  cover: string | null;
  screenshots: string[];
};
