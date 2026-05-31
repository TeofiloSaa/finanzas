-- Tabla de categorías personalizadas por usuario.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('ingreso', 'gasto')),
  color text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Evita duplicados del mismo nombre + tipo para un mismo usuario.
create unique index if not exists categories_user_name_type_uidx
  on public.categories (user_id, lower(name), type);

create index if not exists categories_user_id_idx
  on public.categories (user_id);

-- Row Level Security
alter table public.categories enable row level security;

create policy "Categorías: select propias"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Categorías: insert propias"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Categorías: update propias"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Categorías: delete propias"
  on public.categories for delete
  using (auth.uid() = user_id);
