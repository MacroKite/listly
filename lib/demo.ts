import type { Creator, Product } from "./types";

/**
 * Sample catalogue from the design file. Used only when Supabase env vars are
 * missing, so the site can be browsed before a project is connected.
 * supabase/seed.sql inserts the same rows.
 */
export const DEMO_CREATORS: Creator[] = [
  { id: "c1", name: "Rumana Akter", handle: "rumana", avatar_url: null, bio: "Notion systems for freelancers" },
  { id: "c2", name: "Tanvir Hasan", handle: "tanvir", avatar_url: null, bio: "Photographer" },
  { id: "c3", name: "Nabila Studio", handle: "nabila", avatar_url: null, bio: "Bangla type foundry" },
  { id: "c4", name: "Arif Design", handle: "arif", avatar_url: null, bio: "UI kits and decks" },
  { id: "c5", name: "Mitu Rahman", handle: "mitu", avatar_url: null, bio: "English teacher" },
  { id: "c6", name: "Sabbir Beats", handle: "sabbir", avatar_url: null, bio: "Producer" },
  { id: "c7", name: "Farhan Kabir", handle: "farhan", avatar_url: null, bio: "Chartered accountant" },
];

type Seed = Partial<Product> & Pick<Product, "slug" | "title" | "user_id" | "external_url" | "category">;

const seeds: Seed[] = [
  { slug: "freelance-invoice-kit", title: "Freelance invoice kit", user_id: "c1", category: "Templates", price_type: "free", formats: ["NOTION"], external_url: "https://rumana.gumroad.com/l/invoice-kit", tagline: "Send clean invoices from Notion in two minutes.", works_with: ["Notion"] },
  {
    slug: "dhaka-streets",
    title: "Dhaka Streets — 40 Lightroom presets",
    user_id: "c2",
    category: "Presets",
    price_type: "paid",
    price_amount: 850,
    formats: ["XMP", "DNG"],
    external_url: "https://tanvir.gumroad.com/l/dhaka-streets",
    tagline: "Warm, cinematic edits for city photos.",
    description:
      "Forty presets built from three years of shooting Old Dhaka at dusk. Warm rickshaw neon, soft monsoon greys, clean skin tones. Tuned for phone photos as much as camera RAW files.",
    works_with: ["Lightroom"],
    file_size: "24 MB",
    updated_label: "Sep 2026",
    included: [
      { label: "40 presets for Lightroom Classic & CC", format: "XMP" },
      { label: "Mobile versions for Lightroom app", format: "DNG" },
      { label: "Install guide, English and Bangla", format: "PDF" },
    ],
  },
  { slug: "shapla-bangla-display-font", title: "শাপলা — Bangla display font", user_id: "c3", category: "Fonts", price_type: "paid", price_amount: 1500, formats: ["OTF"], external_url: "https://nabila.studio/shapla" },
  { slug: "fintech-ui-kit", title: "Fintech UI kit, 120 screens", user_id: "c4", category: "Design assets", price_type: "paid", price_amount: 24, currency: "USD", formats: ["FIGMA"], external_url: "https://arif.gumroad.com/l/fintech-kit", works_with: ["Figma"] },
  { slug: "spoken-english-30-days", title: "Spoken English in 30 days", user_id: "c5", category: "Ebooks", price_type: "paid", price_amount: 350, formats: ["PDF"], external_url: "https://payhip.com/b/spoken-english" },
  { slug: "lofi-beats-vol-2", title: "Lo-fi beats pack, vol. 2", user_id: "c6", category: "Audio", price_type: "paid", price_amount: 9, currency: "USD", formats: ["WAV"], external_url: "https://sabbir.gumroad.com/l/lofi-2" },
  { slug: "freelancer-tax-guide-bd-2026", title: "Freelancer tax guide, BD 2026", user_id: "c7", category: "Ebooks", price_type: "free", formats: ["PDF"], external_url: "https://farhankabir.com/tax-guide" },
  { slug: "minimal-pitch-deck", title: "Minimal pitch deck", user_id: "c4", category: "Templates", price_type: "paid", price_amount: 12, currency: "USD", formats: ["KEYNOTE"], external_url: "https://arif.gumroad.com/l/pitch-deck" },
  { slug: "monsoon-moods", title: "Monsoon Moods — 20 presets", user_id: "c2", category: "Presets", price_type: "paid", price_amount: 600, formats: ["XMP"], external_url: "https://tanvir.gumroad.com/l/monsoon" },
  { slug: "shooting-at-night", title: "Shooting at night: a field guide", user_id: "c2", category: "Ebooks", price_type: "paid", price_amount: 400, formats: ["PDF"], external_url: "https://tanvir.gumroad.com/l/night" },
  { slug: "phone-photography-crash-course", title: "Phone photography crash course", user_id: "c2", category: "Courses", price_type: "paid", price_amount: 1200, formats: ["VIDEO"], external_url: "https://tanvir.gumroad.com/l/phone-course" },
  { slug: "film-grain-overlays", title: "Film grain overlays", user_id: "c2", category: "Design assets", price_type: "free", formats: ["PNG"], external_url: "https://tanvir.gumroad.com/l/grain" },
];

export const DEMO_PRODUCTS: Product[] = seeds.map((s, i) => ({
  id: `demo-${i + 1}`,
  tagline: null,
  description: null,
  price_type: "free",
  price_amount: null,
  currency: "BDT",
  works_with: [],
  formats: [],
  included: [],
  file_size: null,
  updated_label: null,
  external_domain: new URL(s.external_url).hostname.split(".").slice(-2).join("."),
  cover_url: null,
  screenshots: [],
  status: "live",
  created_at: new Date(Date.UTC(2026, 9, 10) - i * 3_600_000).toISOString(),
  ...s,
}));
