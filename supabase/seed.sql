-- Demo creators and products from the design file. Local/dev only.
-- Creators are inserted as auth users (no password, can't sign in); the
-- on_auth_user_created trigger makes their public.users rows.

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rumana@demo.listly.co', '{"name":"Rumana Akter"}', now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tanvir@demo.listly.co', '{"name":"Tanvir Hasan"}', now(), now()),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nabila@demo.listly.co', '{"name":"Nabila Studio"}', now(), now()),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'arif@demo.listly.co', '{"name":"Arif Design"}', now(), now()),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mitu@demo.listly.co', '{"name":"Mitu Rahman"}', now(), now()),
  ('00000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sabbir@demo.listly.co', '{"name":"Sabbir Beats"}', now(), now()),
  ('00000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'farhan@demo.listly.co', '{"name":"Farhan Kabir"}', now(), now())
on conflict (id) do nothing;

update public.users u set handle = v.handle, bio = v.bio
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'rumana', 'Notion systems for freelancers'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'tanvir', 'Photographer'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'nabila', 'Bangla type foundry'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'arif', 'UI kits and decks'),
  ('00000000-0000-4000-8000-000000000005'::uuid, 'mitu', 'English teacher'),
  ('00000000-0000-4000-8000-000000000006'::uuid, 'sabbir', 'Producer'),
  ('00000000-0000-4000-8000-000000000007'::uuid, 'farhan', 'Chartered accountant')
) as v(id, handle, bio)
where u.id = v.id;

insert into public.products
  (user_id, slug, title, tagline, description, price_type, price_amount, currency, category,
   works_with, formats, included, file_size, updated_label, external_url, external_domain, status, created_at)
values
  ('00000000-0000-4000-8000-000000000001', 'freelance-invoice-kit', 'Freelance invoice kit', 'Send clean invoices from Notion in two minutes.', null,
   'free', null, 'BDT', 'Templates', '{Notion}', '{NOTION}', '[]', null, null, 'https://rumana.gumroad.com/l/invoice-kit', 'gumroad.com', 'live', now() - interval '1 hour'),
  ('00000000-0000-4000-8000-000000000002', 'dhaka-streets', 'Dhaka Streets — 40 Lightroom presets', 'Warm, cinematic edits for city photos.',
   'Forty presets built from three years of shooting Old Dhaka at dusk. Warm rickshaw neon, soft monsoon greys, clean skin tones. Tuned for phone photos as much as camera RAW files.',
   'paid', 850, 'BDT', 'Presets', '{Lightroom}', '{XMP,DNG}',
   '[{"label":"40 presets for Lightroom Classic & CC","format":"XMP"},{"label":"Mobile versions for Lightroom app","format":"DNG"},{"label":"Install guide, English and Bangla","format":"PDF"}]',
   '24 MB', 'Sep 2026', 'https://tanvir.gumroad.com/l/dhaka-streets', 'gumroad.com', 'live', now() - interval '2 hours'),
  ('00000000-0000-4000-8000-000000000003', 'shapla-bangla-display-font', 'শাপলা — Bangla display font', null, null,
   'paid', 1500, 'BDT', 'Fonts', '{}', '{OTF}', '[]', null, null, 'https://nabila.studio/shapla', 'nabila.studio', 'live', now() - interval '3 hours'),
  ('00000000-0000-4000-8000-000000000004', 'fintech-ui-kit', 'Fintech UI kit, 120 screens', null, null,
   'paid', 24, 'USD', 'Design assets', '{Figma}', '{FIGMA}', '[]', null, null, 'https://arif.gumroad.com/l/fintech-kit', 'gumroad.com', 'live', now() - interval '4 hours'),
  ('00000000-0000-4000-8000-000000000005', 'spoken-english-30-days', 'Spoken English in 30 days', null, null,
   'paid', 350, 'BDT', 'Ebooks', '{}', '{PDF}', '[]', null, null, 'https://payhip.com/b/spoken-english', 'payhip.com', 'live', now() - interval '5 hours'),
  ('00000000-0000-4000-8000-000000000006', 'lofi-beats-vol-2', 'Lo-fi beats pack, vol. 2', null, null,
   'paid', 9, 'USD', 'Audio', '{}', '{WAV}', '[]', null, null, 'https://sabbir.gumroad.com/l/lofi-2', 'gumroad.com', 'live', now() - interval '6 hours'),
  ('00000000-0000-4000-8000-000000000007', 'freelancer-tax-guide-bd-2026', 'Freelancer tax guide, BD 2026', null, null,
   'free', null, 'BDT', 'Ebooks', '{}', '{PDF}', '[]', null, null, 'https://farhankabir.com/tax-guide', 'farhankabir.com', 'live', now() - interval '7 hours'),
  ('00000000-0000-4000-8000-000000000004', 'minimal-pitch-deck', 'Minimal pitch deck', null, null,
   'paid', 12, 'USD', 'Templates', '{Keynote}', '{KEYNOTE}', '[]', null, null, 'https://arif.gumroad.com/l/pitch-deck', 'gumroad.com', 'live', now() - interval '8 hours'),
  ('00000000-0000-4000-8000-000000000002', 'monsoon-moods', 'Monsoon Moods — 20 presets', null, null,
   'paid', 600, 'BDT', 'Presets', '{Lightroom}', '{XMP}', '[]', null, null, 'https://tanvir.gumroad.com/l/monsoon', 'gumroad.com', 'live', now() - interval '9 hours'),
  ('00000000-0000-4000-8000-000000000002', 'shooting-at-night', 'Shooting at night: a field guide', null, null,
   'paid', 400, 'BDT', 'Ebooks', '{}', '{PDF}', '[]', null, null, 'https://tanvir.gumroad.com/l/night', 'gumroad.com', 'live', now() - interval '10 hours'),
  ('00000000-0000-4000-8000-000000000002', 'phone-photography-crash-course', 'Phone photography crash course', null, null,
   'paid', 1200, 'BDT', 'Courses', '{}', '{VIDEO}', '[]', null, null, 'https://tanvir.gumroad.com/l/phone-course', 'gumroad.com', 'live', now() - interval '11 hours'),
  ('00000000-0000-4000-8000-000000000002', 'film-grain-overlays', 'Film grain overlays', null, null,
   'free', null, 'BDT', 'Design assets', '{}', '{PNG}', '[]', null, null, 'https://tanvir.gumroad.com/l/grain', 'gumroad.com', 'live', now() - interval '12 hours')
on conflict (slug) do nothing;

-- Product page details (About, What's included, gallery) for every demo product.
-- Images are placeholder photos from picsum.photos, stable per slug. Safe to re-run.
update public.products p set
  tagline       = coalesce(p.tagline, v.tagline),
  description   = v.description,
  included      = v.included::jsonb,
  file_size     = v.file_size,
  updated_label = v.updated_label,
  cover_url     = 'https://picsum.photos/seed/' || p.slug || '-1/1600/1000',
  screenshots   = array(select 'https://picsum.photos/seed/' || p.slug || '-' || n || '/1600/1000' from generate_series(2, v.images) n)
from (values
  ('freelance-invoice-kit', null,
   'A Notion workspace for freelancers who are tired of building invoices by hand. Add a client once, log your hours or line items, and the invoice fills itself in — totals, VAT and due dates included. Duplicate it, export to PDF, send.',
   '[{"label":"Invoice database with client and project relations","format":"NOTION"},{"label":"Printable invoice page, BDT and USD","format":"NOTION"},{"label":"Setup walkthrough video, 6 minutes","format":"VIDEO"}]',
   null, 'Aug 2026', 4),
  ('dhaka-streets', null,
   'Forty presets built from three years of shooting Old Dhaka at dusk. Warm rickshaw neon, soft monsoon greys, clean skin tones. Tuned for phone photos as much as camera RAW files.',
   '[{"label":"40 presets for Lightroom Classic & CC","format":"XMP"},{"label":"Mobile versions for Lightroom app","format":"DNG"},{"label":"Install guide, English and Bangla","format":"PDF"}]',
   '24 MB', 'Sep 2026', 6),
  ('shapla-bangla-display-font', 'A bold Bangla display face for posters, covers and headlines.',
   'Shapla is a high-contrast Bangla display typeface drawn for big sizes — book covers, event posters, packaging and social graphics. Full conjunct support, Latin companion included, and licensed for commercial use.',
   '[{"label":"Shapla Regular and Bold","format":"OTF"},{"label":"Web fonts for your site","format":"WOFF2"},{"label":"Specimen and licence","format":"PDF"}]',
   '3.2 MB', 'Jul 2026', 5),
  ('fintech-ui-kit', 'Wallets, transfers and onboarding, ready to customise.',
   'One hundred and twenty screens for mobile banking and wallet apps: onboarding, KYC, send and request money, bill pay, cards and statements. Built with auto layout and variables, with light and dark modes.',
   '[{"label":"120 mobile screens","format":"FIGMA"},{"label":"Component library with variants","format":"FIGMA"},{"label":"Light and dark colour variables","format":"FIGMA"}]',
   null, 'Sep 2026', 6),
  ('spoken-english-30-days', 'Thirty short daily lessons for confident everyday English.',
   'Written for Bangla speakers who understand English but freeze when speaking. Each day is one real situation — interviews, phone calls, ordering, small talk — with phrases, common mistakes and a 10-minute speaking drill.',
   '[{"label":"30 daily lessons","format":"PDF"},{"label":"Pronunciation audio for every lesson","format":"MP3"},{"label":"Progress tracker","format":"PDF"}]',
   '58 MB', 'Jun 2026', 3),
  ('lofi-beats-vol-2', 'Twenty royalty-free lo-fi loops for videos and streams.',
   'Dusty drums, warm keys and tape hiss. Twenty loops recorded in Dhaka, mixed for YouTube, reels and study streams. Royalty-free for personal and commercial videos — credit appreciated, never required.',
   '[{"label":"20 full loops, 24-bit","format":"WAV"},{"label":"Stems for 8 tracks","format":"WAV"},{"label":"Licence","format":"PDF"}]',
   '640 MB', 'Aug 2026', 3),
  ('freelancer-tax-guide-bd-2026', 'Return filing for freelancers in Bangladesh, step by step.',
   'A plain-language guide to filing your income tax return as a freelancer in Bangladesh for the 2026 assessment year: what counts as income, the IT sector exemption, remittance proof, and filing online with e-Return.',
   '[{"label":"Guide, 42 pages","format":"PDF"},{"label":"Income and expense tracker","format":"XLSX"}]',
   '4 MB', 'Sep 2026', 3),
  ('minimal-pitch-deck', 'A quiet, confident deck for early-stage founders.',
   'Twenty-four slides that follow the structure investors expect — problem, solution, market, traction, team, ask — with generous whitespace so your numbers do the talking.',
   '[{"label":"24-slide deck","format":"KEYNOTE"},{"label":"PowerPoint version","format":"PPTX"},{"label":"Chart and icon pack","format":"KEYNOTE"}]',
   '86 MB', 'May 2026', 5),
  ('monsoon-moods', 'Soft, wet-street tones for rainy-season photos.',
   'Twenty presets for the months when Dhaka turns grey and green. Lifted shadows, muted blues, and reflections that glow instead of going muddy.',
   '[{"label":"20 presets for Lightroom Classic & CC","format":"XMP"},{"label":"Install guide","format":"PDF"}]',
   '9 MB', 'Jul 2026', 4),
  ('shooting-at-night', 'Sharp, clean night photos with the camera you already have.',
   'A field guide to night photography in the city: settings, steady hands without a tripod, mixed street light, and editing out noise. Every technique comes with the exact settings used.',
   '[{"label":"Field guide, 68 pages","format":"PDF"},{"label":"Settings cheat sheet for your phone","format":"PDF"}]',
   '31 MB', 'Apr 2026', 4),
  ('phone-photography-crash-course', 'Take better photos with your phone in one weekend.',
   'Twelve short video lessons on light, composition, portraits, food and editing — all shot and edited on a mid-range Android phone. No gear to buy.',
   '[{"label":"12 video lessons, 2.5 hours","format":"VIDEO"},{"label":"Practice assignments","format":"PDF"},{"label":"5 bonus presets","format":"DNG"}]',
   '3.4 GB', 'Sep 2026', 5),
  ('film-grain-overlays', 'Thirty real film grain textures, free to use.',
   'Grain scanned from real 35mm and medium-format film. Drop on top of any photo with Overlay or Soft Light blending for an analogue finish.',
   '[{"label":"30 grain textures, 6000px","format":"PNG"},{"label":"How to use","format":"PDF"}]',
   '210 MB', 'Jun 2026', 3)
) as v(slug, tagline, description, included, file_size, updated_label, images)
where p.slug = v.slug and p.user_id::text like '00000000-0000-4000-8000-%';
