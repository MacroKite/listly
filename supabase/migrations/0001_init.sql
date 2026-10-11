-- Listly: users, products, events. See README "Data model".
-- Run with `supabase db push`, or paste into the Supabase SQL editor.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- users: public profile, one row per auth.users row
-- ---------------------------------------------------------------------------
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  handle      citext unique not null check (handle ~ '^[a-z0-9_]{2,30}$'),
  avatar_url  text,
  bio         text,
  website     text,
  created_at  timestamptz not null default now()
);

-- Create the profile when someone signs up (email OTP, phone OTP or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'creator'),
    '[^a-zA-Z0-9_]', '', 'g'));
  if length(base) < 2 then base := 'creator'; end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.users where handle = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.users (id, name, handle, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    candidate,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  slug             text unique not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  title            text not null check (length(title) between 1 and 140),
  tagline          text check (length(tagline) <= 200),
  description      text check (length(description) <= 5000),
  price_type       text not null default 'free' check (price_type in ('free', 'paid', 'pwyw')),
  price_amount     numeric(12, 2) check (price_amount is null or price_amount >= 0),
  currency         text not null default 'BDT' check (currency in ('BDT', 'USD')),
  category         text,
  works_with       text[] not null default '{}',
  formats          text[] not null default '{}',
  -- Not in the original data model: rows for "What's included" ({label, format}).
  included         jsonb not null default '[]'::jsonb,
  file_size        text,
  updated_label    text,
  external_url     text not null check (external_url ~ '^https?://'),
  external_domain  text not null,
  cover_url        text,
  screenshots      text[] not null default '{}',
  status           text not null default 'draft' check (status in ('draft', 'live', 'hidden')),
  link_ok          boolean not null default true,
  link_checked_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index products_live_recent on public.products (created_at desc) where status = 'live';
create index products_user on public.products (user_id);
create index products_category on public.products (category) where status = 'live';

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- events: views and outbound clicks
-- ---------------------------------------------------------------------------
create table public.events (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  type        text not null check (type in ('view', 'click')),
  referrer    text check (length(referrer) <= 500),
  created_at  timestamptz not null default now()
);

create index events_product_time on public.events (product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.events enable row level security;

-- Profiles are public (creator pages); only the owner edits theirs.
create policy "profiles are public" on public.users for select using (true);
create policy "edit own profile" on public.users for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Anyone sees live products; owners also see their drafts and hidden ones.
create policy "live products are public" on public.products for select
  using (status = 'live' or (select auth.uid()) = user_id);
create policy "create own products" on public.products for insert
  with check ((select auth.uid()) = user_id);
create policy "edit own products" on public.products for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own products" on public.products for delete
  using ((select auth.uid()) = user_id);

-- Anyone (signed in or not) can log an event against a live product.
create policy "log events on live products" on public.events for insert
  with check (exists (select 1 from public.products p where p.id = product_id and p.status = 'live'));
-- Creators read events for their own products (dashboard).
create policy "read own events" on public.events for select
  using (exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Data API grants. New tables aren't always exposed automatically; RLS above
-- still decides which rows each role sees.
-- ---------------------------------------------------------------------------
grant select on public.users to anon, authenticated;
grant update (name, avatar_url, bio, website) on public.users to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert on public.events to anon, authenticated;
grant select on public.events to authenticated;

-- Trigger-only functions: nobody should call these through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: covers and screenshots, public read, owner-only write under {uid}/
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "media is public" on storage.objects for select using (bucket_id = 'media');
create policy "upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
