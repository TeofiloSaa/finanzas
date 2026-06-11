-- Tabla de categorías personalizadas por usuario.
-- Ejecutar en el SQL Editor de Supabase (una sola vez).

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('ingreso', 'gasto')),
  color text not null,
  is_default boolean not null default false,
  -- Categorías de sistema ('Ahorros', 'Pago de deudas'): se crean solas y no
  -- se pueden editar ni borrar (ver policies abajo). Las usan las transacciones
  -- automáticas de aportes/pagos.
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Si la tabla ya existía sin la columna, agregarla:
alter table public.categories
  add column if not exists sort_order integer default 0;
alter table public.categories
  add column if not exists is_system boolean not null default false;

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

-- update/delete excluyen is_system: las categorías de sistema no se pueden
-- editar ni borrar, ni siquiera por su dueño (ni vía llamada directa a la API).
drop policy if exists "Categorías: update propias" on public.categories;
create policy "Categorías: update propias"
  on public.categories for update
  using (auth.uid() = user_id and is_system = false)
  with check (auth.uid() = user_id and is_system = false);

drop policy if exists "Categorías: delete propias" on public.categories;
create policy "Categorías: delete propias"
  on public.categories for delete
  using (auth.uid() = user_id and is_system = false);
