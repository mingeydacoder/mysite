-- Supabase schema for this Next.js app.
-- Run this in Supabase Dashboard > SQL Editor for a new project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists favorites_user_id_created_at_idx on public.favorites (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Profiles are readable by signed-in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Posts are readable by signed-in users" on public.posts;
create policy "Posts are readable by signed-in users"
on public.posts for select
to authenticated
using (true);

drop policy if exists "Users can create their own posts" on public.posts;
create policy "Users can create their own posts"
on public.posts for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
on public.posts for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own favorites" on public.favorites;
create policy "Users can read their own favorites"
on public.favorites for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own favorites" on public.favorites;
create policy "Users can create their own favorites"
on public.favorites for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own favorites" on public.favorites;
create policy "Users can update their own favorites"
on public.favorites for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
on public.favorites for delete
to authenticated
using (auth.uid() = user_id);

-- Public avatar files. Each signed-in user can only manage files in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
