export const CATEGORIES = [
  "Templates",
  "Ebooks",
  "Courses",
  "Design assets",
  "Fonts",
  "Presets",
  "Audio",
  "Plugins",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Chips shown on Discover (design shows these seven; Plugins lives under search). */
export const DISCOVER_CATEGORIES = CATEGORIES.slice(0, 7);

/** Singular label for the product-page back link, e.g. "Photo presets". */
export const CATEGORY_BACK_LABEL: Record<string, string> = {
  Templates: "Templates",
  Ebooks: "Ebooks",
  Courses: "Courses",
  "Design assets": "Design assets",
  Fonts: "Fonts",
  Presets: "Photo presets",
  Audio: "Audio",
  Plugins: "Plugins",
};

const KEYWORDS: [Category, RegExp][] = [
  ["Presets", /\b(preset|lightroom|lut|xmp|dng|filter)s?\b/i],
  ["Fonts", /\b(font|typeface|otf|ttf|display type)s?\b/i],
  ["Templates", /\b(template|notion|kit|planner|tracker|calendar|deck|invoice|system)s?\b/i],
  ["Ebooks", /\b(ebook|e-book|guide|book|pdf|handbook)s?\b/i],
  ["Courses", /\b(course|class|lesson|masterclass|bootcamp|in \d+ days)\b/i],
  ["Audio", /\b(beat|sample|loop|sound|audio|wav|music|sfx)s?\b/i],
  ["Design assets", /\b(ui|figma|icon|mockup|illustration|texture|overlay|asset)s?\b/i],
  ["Plugins", /\b(plugin|extension|add-on|addon|script)s?\b/i],
];

/** Best keyword match for the text, or null if nothing matches. */
export function guessCategory(text: string): Category | null {
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? null;
}

/** Ranks categories by keyword hits in the text; unmatched categories keep their order. */
export function suggestCategories(text: string): Category[] {
  const hits = KEYWORDS.filter(([, re]) => re.test(text)).map(([c]) => c);
  return [...hits, ...CATEGORIES.filter((c) => !hits.includes(c))];
}

const FORMAT_HINTS: [string, RegExp][] = [
  ["NOTION", /notion/i],
  ["FIGMA", /figma/i],
  ["XMP", /\b(preset|lightroom|xmp)s?\b/i],
  ["OTF", /\b(font|typeface|otf)s?\b/i],
  ["PDF", /\b(ebook|guide|pdf|book)s?\b/i],
  ["WAV", /\b(beat|wav|sample|loop)s?\b/i],
  ["KEYNOTE", /keynote/i],
  ["VIDEO", /\b(course|video|class)\b/i],
];

export function suggestFormats(text: string): string[] {
  const match = FORMAT_HINTS.find(([, re]) => re.test(text));
  return match ? [match[0]] : [];
}
