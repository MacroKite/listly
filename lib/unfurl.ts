import { storeDomain } from "./format";
import type { Currency, Unfurl } from "./types";

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, key: string): string | null {
  const k = key.replace(/[:.]/g, "\\$&");
  const re = [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i"),
  ];
  for (const r of re) {
    const m = html.match(r);
    if (m?.[1]) return decode(m[1]);
  }
  return null;
}

function toCurrency(c: string | null | undefined): Currency | null {
  const v = (c ?? "").toUpperCase();
  return v === "BDT" || v === "USD" ? v : null;
}

/** Looks through JSON-LD blocks for offers.price / priceCurrency. */
function jsonLdPrice(html: string): { price: number; currency: Currency | null } | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, raw] of blocks) {
    try {
      const stack: unknown[] = [JSON.parse(raw)];
      while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== "object") continue;
        if (Array.isArray(node)) {
          stack.push(...node);
          continue;
        }
        const o = node as Record<string, unknown>;
        const offers = o.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
        for (const offer of Array.isArray(offers) ? offers : offers ? [offers] : []) {
          const price = Number(offer.price ?? offer.lowPrice);
          if (Number.isFinite(price)) return { price, currency: toCurrency(offer.priceCurrency as string) };
        }
        stack.push(...Object.values(o));
      }
    } catch {
      // Malformed JSON-LD is common; ignore the block.
    }
  }
  return null;
}

/** Gumroad embeds product props as JSON with price_cents + currency_code. */
function gumroadPrice(html: string): { price: number; currency: Currency | null } | null {
  const cents = html.match(/&quot;price_cents&quot;:(\d+)|"price_cents":(\d+)/);
  if (!cents) return null;
  const cur = html.match(/&quot;currency_code&quot;:&quot;(\w+)&quot;|"currency_code":"(\w+)"/);
  return { price: Number(cents[1] ?? cents[2]) / 100, currency: toCurrency(cur?.[1] ?? cur?.[2]) };
}

export function parse(html: string, finalUrl: string): Unfurl {
  const docTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const title = meta(html, "og:title") ?? meta(html, "twitter:title") ?? (docTitle ? decode(docTitle) : null);
  const tagline = meta(html, "og:description") ?? meta(html, "description") ?? meta(html, "twitter:description");
  let cover = meta(html, "og:image") ?? meta(html, "og:image:url") ?? meta(html, "twitter:image");
  if (cover) {
    try {
      cover = new URL(cover, finalUrl).toString();
      if (!cover.startsWith("https://")) cover = null;
    } catch {
      cover = null;
    }
  }

  let price: number | null = null;
  let currency: Currency | null = null;
  const ogAmount = meta(html, "product:price:amount") ?? meta(html, "og:price:amount");
  if (ogAmount && Number.isFinite(Number(ogAmount))) {
    price = Number(ogAmount);
    currency = toCurrency(meta(html, "product:price:currency") ?? meta(html, "og:price:currency"));
  } else {
    const found = jsonLdPrice(html) ?? (finalUrl.includes("gumroad.com") ? gumroadPrice(html) : null);
    if (found) ({ price, currency } = found);
  }

  return {
    title: title?.slice(0, 140) || null,
    tagline: tagline?.slice(0, 200) || null,
    cover,
    price,
    currency,
    domain: storeDomain(finalUrl),
    url: finalUrl,
  };
}

