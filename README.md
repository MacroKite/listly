# Handoff: Listly Digital — directory for digital products

## Overview
Listly is a calm directory for digital products: templates, ebooks, presets, fonts, courses, audio and plugins. Creators paste a link to where they already sell (Gumroad, Payhip, Notion, Google Drive, their own site). Listly pulls the title, cover and price from that link and gives the product its own page (`/p/:slug`). Buyers discover products, open the product page, and click out to the creator's store. **Listly has no checkout and takes no commission.**

Core loops:
- **Creator:** paste link → confirm details → review → publish → share page link → watch views/clicks.
- **Buyer:** browse/search → product page → "Get it on {domain} ↗" (outbound, new tab).

## About the design files
`Listly Digital.dc.html` is a **design reference built in HTML**. It's a canvas of static screens that shows the intended look and behavior. It is not production code. Open it in a browser with `support.js` in the same folder. Recreate it in a real app stack (recommended below). Don't ship the HTML itself.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii and copy are final. Recreate them faithfully.

## Recommended stack (no existing codebase)
- **Next.js (App Router) + TypeScript + Tailwind CSS.** Put the tokens below into `tailwind.config`.
- **Supabase:** Postgres, plus Auth with phone/email OTP and Google OAuth, plus Storage for covers and screenshots.
- **Vercel** for hosting, with Vercel Cron for the daily link health check.
- Fonts: DM Sans (400/500), DM Mono (400/500) and Noto Sans Bengali via `next/font/google`.

## Data model
```
users      id, name, handle (unique, for /@handle), avatar_url, bio, website, created_at
products   id, user_id, slug (unique), title, tagline, description,
           price_type ('free'|'paid'|'pwyw'), price_amount, currency ('BDT'|'USD'),
           category, works_with text[], formats text[], file_size, updated_label,
           external_url, external_domain, cover_url, screenshots text[],
           status ('draft'|'live'|'hidden'), link_ok bool, link_checked_at, created_at, updated_at
events     id, product_id, type ('view'|'click'), created_at, referrer
```

## Routes
- `/`: Discover (D1 / M1)
- `/search?q=&cat=&free=1`: same grid, filtered
- `/p/[slug]`: Product page (D2 / M2). Public and SEO-friendly. Needs Open Graph tags so shared links look good on WhatsApp and Facebook.
- `/@[handle]`: Creator page (D3)
- `/go/[productId]`: logs a `click` event, then does a 302 redirect to `external_url`. The "Get it" button must link here.
- `/sell`: listing flow (D4.1–D4.4 / M4.1–M4.4)
- `/dashboard`: My products (D5 / M3)
- `/api/unfurl?url=`: fetches the page server-side and reads `og:title`, `og:image`, `og:description` and the price (`product:price:amount`, JSON-LD `offers.price`, or Gumroad-specific parsing). Returns `{title, tagline, cover, price, currency, domain}`.

## Screens
Every screen exists at desktop (1280) and mobile (390) sizes. On mobile the top bar is replaced by a bottom tab bar (Home, Search, Sell, Profile), and the main action sits in a sticky bottom bar.

1. **Discover (D1/M1):** top bar with logo, blue "List a product" pill and avatar. A hero panel with the gradient wash (radius 28) holds a 56px H1, "Things people make, ready to download.", and a 64px pill search with a dark "Search" button. Below: category chips (All selected = ink fill), an "Any price / Free" segmented control, and a grid of 4 columns on desktop or 2 on mobile with a 40px row gap and 24px column gap. Each card has a 4:3 cover (radius 16) with a mono format tag bottom-right, a one-line title (16px), the creator name (13px #6B7280) and the price (15px/500).
2. **Product page (D2/M2):** a 16:10 gallery with thumbnails, then "About" and "What's included" (rows with a mono format tag). Right column, a 400px card: title (30px), tagline, price (28px), a 56px primary "Get it on {domain} ↗", the note "You'll pay the creator directly on their store.", a 2×2 facts grid (Works with / Format / Size / Updated), and a creator row with a "View page" link. Below: "More from {creator}". On mobile there's a sticky bar with the price + "on {domain}" and a "Get it ↗" button.
3. **Creator page (D3):** a wash hero with a 112px avatar, name (44px), bio and links, then a 3-column product grid. A "Share page" secondary button sits top-right.
4. **List a product, 3 steps + Live:** a progress bar of three 4px segments (Link · Details · Review). "Draft saved" shows on the right and autosaves on every change. The one primary action is bottom-right on desktop and full-width in a sticky bar on mobile.
   - **Link:** a 60px URL input with a "Paste" button. When a valid URL is entered, call `/api/unfurl`, show "✓ Found it. We filled in what we could." and a preview card. If the unfurl fails, still allow Continue and leave the fields empty.
   - **Details:** Name, one-line description, Price (segmented Free/Paid; Paid shows an amount field and a ৳ BDT / $ USD select), Category chips suggested from the unfurl or title, "Works with" tag input, and a collapsed "Add screenshots, what's included, longer description (optional)".
   - **Review:** preview of the product page plus its future URL `listly.co/p/{slug}`. "Publish" sits beside the note "Free to list · no commission". If the user isn't signed in, Publish opens the sign-in modal or sheet (see v1 `Listly.dc.html` D5/M5) and publishes after the code is verified.
   - **Live:** a check circle, "Your product page is live", a copyable URL pill with a dark "Copy" button, share buttons (WhatsApp `https://wa.me/?text=`, Facebook sharer, X intent), primary "View your page", and a ghost "List another".
5. **My products (D5/M3):** a 30-day summary (views and clicks). An amber notice appears when a link is broken, with an "Update link" button. Then a table on desktop or cards on mobile: thumbnail, title, price · domain, status pill (Live / Draft / Link not working), views and clicks. The "…" menu holds Edit · Copy page link · Hide · Delete; Delete asks for confirmation, and the others show a toast with Undo or Share.

## Interactions & behavior
- Transitions are 150–250ms ease-out. No decorative motion.
- Focus ring: 1px #1D5BF0 border plus `0 0 0 4px rgba(29,91,240,.14)`.
- Validation is inline and in plain language, shown in amber #8A4B00 text with a #E7C99A border. Never use red error walls. Example: "That link didn't open — check it starts with https://".
- Loading uses skeleton cards (#EEF0F4 blocks).
- Browsing never requires an account. Sign-in is only asked for on Publish or the dashboard.
- Daily cron: send a HEAD/GET request to each live `external_url`. Set `link_ok=false` on a 4xx/5xx response or a timeout, and email the creator.
- Count views once per session per product.

## Design tokens
Colors:
- Canvas #FAFAFB · Surface #FFFFFF · Line #E6E8EC / input border #E3E6EB · Soft fill #F1F3F6 / segmented track #EEF0F4
- Ink #0E1726 · Ink 2 #4A5363 · Ink 3 (meta) #6B7280
- Accent #1D5BF0 (hover #1650DA, text-on-tint #1447C4, tint #EAF0FE). Use it **only for the one primary action per screen** plus links.
- Warning: text #8A4B00, bg #FDF1DF, notice bg #FDF6EC, border #F3E2C6 / #E7C99A
- Wash: `radial-gradient(120% 90% at 0% 100%, #C9D6FB 0%, transparent 55%), radial-gradient(100% 90% at 100% 100%, #C6F1FC 0%, transparent 60%), #F3F6FD`

Type (DM Sans, weights 400/500 only; letter-spacing on headings −0.02 to −0.035em):
- Display 56/1.05 · Title 36–40 · Section 22 · Heading 20 · Body 16/1.6 · Small 15 · Meta 13 · Mono tags 11–12 DM Mono

Spacing: 8pt grid. Page side padding is 40px on desktop and 20px on mobile.
Radius: chips and buttons 999px · inputs 14–16px · cards 16–20px · panels 24–28px · mobile frame 44px.
Buttons: height 44/48/52/56. Primary shadow is `inset 0 1px 0 rgba(255,255,255,.3), 0 10px 22px -10px rgba(29,91,240,.75)`. Secondary is white with a 1px #E3E6EB border and `0 2px 8px rgba(15,23,42,.05)`. "Strong" is #0E1726 and is used for in-field confirm actions (Search, Copy).
Shadows: very light. Large surfaces use `0 40px 100px -40px rgba(20,35,80,.2)`.
Tap targets: minimum 44px.

## Assets
There are no real images. Covers and screenshots are striped placeholders and should be replaced with uploaded or unfurled images. Icons are simple 1.5px-stroke line icons; Lucide is a good match (search, plus, chevron-left, x, check, arrow-up-right, more-horizontal, home, user, upload). The logo is an ink rounded square with a white dot next to the "Listly" wordmark, used as a placeholder.

## Files
- `Listly Digital.dc.html`: all screens (open in a browser, keeping `support.js` beside it)
- `support.js`: runtime needed to view the HTML file only (not for production)

---

## Running the app

Built so far: Discover (`/`, `/search`), Product page (`/p/[slug]`), the listing flow (`/sell`), `/go/[productId]` and `/api/unfurl`. The creator page (`/@handle`) is served from `/u/[handle]` via a rewrite in `next.config.ts`. Not built yet: My products (`/dashboard` is a placeholder) and the daily link check.

```bash
npm install
cp .env.example .env.local   # optional: without keys the site runs on demo data, read-only
npm run dev
```

### Connect Supabase
1. Create a project, then copy the URL and publishable key into `.env.local`.
2. Apply the schema: `supabase db push` (or paste `supabase/migrations/0001_init.sql` into the SQL editor). For sample data, run `supabase/seed.sql`.
3. Auth → Providers: turn on **Email**. Edit the **Magic Link** email template so it includes `{{ .Token }}`. The sign-in dialog asks for a 6-digit code, not a link.
4. Optional: turn on **Google** (set the redirect URL to `{SITE_URL}/auth/callback`) and **Phone** (needs an SMS provider).

### Notes
- Next.js 16 with Cache Components. Public reads in `lib/data.ts` use `"use cache"` and are tagged `products`. Publishing calls `updateTag("products")` so the new listing shows up right away.
- `products.included` (jsonb) was added to the data model. It holds the "What's included" rows.
- Tailwind v4 reads design tokens from `@theme` in `app/globals.css` instead of `tailwind.config`.
- Drafts autosave to `localStorage`, so creators don't need an account until they publish. Screenshots stay in memory and upload when the product is published.
