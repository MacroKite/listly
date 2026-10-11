import type { Currency, PriceType } from "./types";

const SYMBOL: Record<Currency, string> = { BDT: "৳", USD: "$" };

export function formatPrice(type: PriceType, amount: number | null, currency: Currency): string {
  if (type === "free" || amount == null || amount <= 0) {
    return type === "pwyw" ? "Pay what you want" : "Free";
  }
  const n = amount.toLocaleString("en-US", { maximumFractionDigits: currency === "USD" ? 2 : 0 });
  return type === "pwyw" ? `From ${SYMBOL[currency]}${n}` : `${SYMBOL[currency]}${n}`;
}

export function currencySymbol(c: Currency) {
  return SYMBOL[c];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * The store's registrable domain for the "Get it on {domain}" button:
 * tanvir.gumroad.com → gumroad.com, but rumana.com stays as-is.
 */
export function storeDomain(url: string): string {
  const host = domainOf(url);
  const parts = host.split(".");
  const known = ["gumroad.com", "payhip.com", "notion.site", "lemonsqueezy.com", "itch.io", "ko-fi.com"];
  const tail = parts.slice(-2).join(".");
  return known.includes(tail) ? tail : host;
}

/** Normalises user input to an https URL, or null if it can't be one. */
export function normaliseUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[—–]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 6)
    .join("-");
}

/** Public origin for share links. Falls back to the browser origin, then listly.co. */
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://listly.co";
}

/** siteUrl() without the scheme, for display: "listly.co/p/…". */
export function displayUrl(path: string): string {
  return `${siteUrl().replace(/^https?:\/\//, "")}${path}`;
}
