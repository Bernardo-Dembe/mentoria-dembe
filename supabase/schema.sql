
-- MENTORIA DEMBE — executar no Supabase > SQL Editor.
-- Primeiro crie o utilizador administrador em Authentication > Users.
-- Depois substitua o e-mail no bloco final e execute-o para atribuir role=admin.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'visitor' check (role in ('visitor','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  summary text,
  description text not null,
  objectives text,
  content text,
  how_it_works text,
  modality text,
  location text,
  image_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  description text not null,
  location text,
  image_url text,
  status text not null default 'draft' check (status in ('draft','published','sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  trainer_name text not null default 'Bernardo Baveca Dembe',
  contact_email text not null default 'bernardodembe@gmail.com',
  whatsapp text not null default '244947466217',
  facebook text,
  instagram text,
  tiktok text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

drop policy if exists "public read published courses" on public.courses;
create policy "public read published courses" on public.courses for select to anon, authenticated
using (status = 'published' or public.is_admin());

drop policy if exists "admin insert courses" on public.courses;
create policy "admin insert courses" on public.courses for insert to authenticated
with check (public.is_admin());
drop policy if exists "admin update courses" on public.courses;
create policy "admin update courses" on public.courses for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete courses" on public.courses;
create policy "admin delete courses" on public.courses for delete to authenticated
using (public.is_admin());

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products for select to anon, authenticated
using (status = 'published' or public.is_admin());
drop policy if exists "admin insert products" on public.products;
create policy "admin insert products" on public.products for insert to authenticated
with check (public.is_admin());
drop policy if exists "admin update products" on public.products;
create policy "admin update products" on public.products for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete products" on public.products;
create policy "admin delete products" on public.products for delete to authenticated
using (public.is_admin());

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select to anon, authenticated
using (true);
drop policy if exists "admin update settings" on public.site_settings;
create policy "admin update settings" on public.site_settings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mentoria-media', 'mentoria-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public view mentoria images" on storage.objects;
create policy "public view mentoria images" on storage.objects for select to anon, authenticated
using (bucket_id = 'mentoria-media');
drop policy if exists "admin upload mentoria images" on storage.objects;
create policy "admin upload mentoria images" on storage.objects for insert to authenticated
with check (bucket_id = 'mentoria-media' and public.is_admin());
drop policy if exists "admin update mentoria images" on storage.objects;
create policy "admin update mentoria images" on storage.objects for update to authenticated
using (bucket_id = 'mentoria-media' and public.is_admin())
with check (bucket_id = 'mentoria-media' and public.is_admin());
drop policy if exists "admin delete mentoria images" on storage.objects;
create policy "admin delete mentoria images" on storage.objects for delete to authenticated
using (bucket_id = 'mentoria-media' and public.is_admin());

insert into public.profiles (id, role)
select id, 'admin' from auth.users where email = 'bernardodembe@gmail.com'
on conflict (id) do update set role = 'admin';
