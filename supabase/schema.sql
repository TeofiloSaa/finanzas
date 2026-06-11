-- Esquema + Row Level Security de las tablas principales de la app.
-- Patrón idéntico a categories.sql: cada usuario solo puede ver/insertar/editar/borrar
-- sus propias filas (auth.uid() = user_id; en profiles, auth.uid() = id).
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente y reejecutable:
--   - las tablas usan "create table if not exists" (no se recrean si ya existen;
--     OJO: por eso las columnas/checks nuevos NO se aplican a una tabla preexistente),
--   - las policies se reaplican siempre vía "drop policy if exists" + "create policy",
--     así que correrlo sobre una base existente repara/actualiza la RLS sin tocar datos.

-- ============================================================================
-- profiles
-- ============================================================================
-- Nota: el email NO se guarda acá; vive en auth.users. La fila se identifica
-- por id (= auth.users.id). currency es la moneda preferida del usuario.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  currency text not null default 'ARS',
  created_at timestamptz not null default now()
);

-- Columnas agregadas después de la creación inicial. Idempotentes: se aplican
-- también sobre tablas profiles preexistentes (el "create table if not exists"
-- de arriba NO agrega columnas nuevas a una tabla ya creada).
alter table public.profiles
  add column if not exists currency text not null default 'ARS';
-- Suscripción (Lemon Squeezy).
alter table public.profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro'));
alter table public.profiles
  add column if not exists lemon_subscription_id text;
-- Fecha hasta la que el plan Pro sigue vigente tras una cancelación (= ends_at de
-- Lemon Squeezy). null = sin vencimiento. Ver add_plan_expires_at.sql.
alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

alter table public.profiles enable row level security;

drop policy if exists "Perfil: select propio" on public.profiles;
create policy "Perfil: select propio"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Perfil: insert propio" on public.profiles;
create policy "Perfil: insert propio"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Perfil: update propio" on public.profiles;
create policy "Perfil: update propio"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Perfil: delete propio" on public.profiles;
create policy "Perfil: delete propio"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================================================
-- transactions
-- ============================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('ingreso', 'gasto')),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null,
  description text,
  date date not null,
  -- Marca de origen automático. NULL = transacción manual.
  -- 'aporte_ahorro' | 'pago_deuda' las generan las RPC (ver auto_transactions.sql).
  -- A futuro: 'retiro_ahorro'.
  auto_origin text check (auto_origin in ('aporte_ahorro', 'pago_deuda')),
  created_at timestamptz not null default now()
);

-- Para tablas transactions preexistentes (el create table de arriba no agrega columnas).
alter table public.transactions
  add column if not exists auto_origin text
  check (auto_origin in ('aporte_ahorro', 'pago_deuda'));

create index if not exists transactions_user_id_idx
  on public.transactions (user_id);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

drop policy if exists "Transacciones: select propias" on public.transactions;
create policy "Transacciones: select propias"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Transacciones: insert propias" on public.transactions;
create policy "Transacciones: insert propias"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Transacciones: update propias" on public.transactions;
create policy "Transacciones: update propias"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Transacciones: delete propias" on public.transactions;
create policy "Transacciones: delete propias"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- savings_goals
-- ============================================================================
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists savings_goals_user_id_idx
  on public.savings_goals (user_id);

alter table public.savings_goals enable row level security;

drop policy if exists "Metas: select propias" on public.savings_goals;
create policy "Metas: select propias"
  on public.savings_goals for select
  using (auth.uid() = user_id);

drop policy if exists "Metas: insert propias" on public.savings_goals;
create policy "Metas: insert propias"
  on public.savings_goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Metas: update propias" on public.savings_goals;
create policy "Metas: update propias"
  on public.savings_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Metas: delete propias" on public.savings_goals;
create policy "Metas: delete propias"
  on public.savings_goals for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- savings_contributions
-- ============================================================================
create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.savings_goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  date date not null,
  -- Transacción de gasto generada por este aporte (1:1). NULL en aportes viejos
  -- (no migrados) y en aportes desligados al borrar la meta. ON DELETE CASCADE:
  -- si se borra la transacción, el aporte se limpia (red de seguridad; la
  -- reversión real del current_amount la hacen las RPC).
  transaction_id uuid references public.transactions (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Para tablas savings_contributions preexistentes.
alter table public.savings_contributions
  add column if not exists transaction_id uuid
  references public.transactions (id) on delete cascade;

create index if not exists savings_contributions_goal_id_idx
  on public.savings_contributions (goal_id);
create index if not exists savings_contributions_user_id_idx
  on public.savings_contributions (user_id);
-- UNIQUE parcial: 1:1 con la transacción, tolerando aportes en NULL.
create unique index if not exists savings_contributions_transaction_uidx
  on public.savings_contributions (transaction_id)
  where transaction_id is not null;

alter table public.savings_contributions enable row level security;

drop policy if exists "Aportes: select propios" on public.savings_contributions;
create policy "Aportes: select propios"
  on public.savings_contributions for select
  using (auth.uid() = user_id);

drop policy if exists "Aportes: insert propios" on public.savings_contributions;
create policy "Aportes: insert propios"
  on public.savings_contributions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Aportes: update propios" on public.savings_contributions;
create policy "Aportes: update propios"
  on public.savings_contributions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Aportes: delete propios" on public.savings_contributions;
create policy "Aportes: delete propios"
  on public.savings_contributions for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- debts
-- ============================================================================
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('prestamo', 'tarjeta', 'otro')),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  installments integer not null check (installments >= 1),
  paid_installments integer not null default 0
    check (paid_installments >= 0 and paid_installments <= installments),
  -- Columna generada: monto por cuota. installments >= 1 evita la división por cero.
  installment_amount numeric(14, 2)
    generated always as (total_amount / installments) stored,
  due_day integer not null check (due_day between 1 and 31),
  start_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists debts_user_id_idx
  on public.debts (user_id);

alter table public.debts enable row level security;

drop policy if exists "Deudas: select propias" on public.debts;
create policy "Deudas: select propias"
  on public.debts for select
  using (auth.uid() = user_id);

drop policy if exists "Deudas: insert propias" on public.debts;
create policy "Deudas: insert propias"
  on public.debts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Deudas: update propias" on public.debts;
create policy "Deudas: update propias"
  on public.debts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Deudas: delete propias" on public.debts;
create policy "Deudas: delete propias"
  on public.debts for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- debt_payments
-- ============================================================================
-- Cada pago de una cuota es una fila (antes era solo un +1 en paid_installments).
-- Lo usa la RPC pago_crear para ligar el pago a su transacción automática.
-- transaction_id: gasto generado por el pago (1:1). NULL en pagos viejos o
-- desligados al borrar la deuda. Las funciones viven en auto_transactions.sql.
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  date date not null,
  transaction_id uuid references public.transactions (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists debt_payments_debt_id_idx
  on public.debt_payments (debt_id);
create index if not exists debt_payments_user_id_idx
  on public.debt_payments (user_id);
create unique index if not exists debt_payments_transaction_uidx
  on public.debt_payments (transaction_id)
  where transaction_id is not null;

alter table public.debt_payments enable row level security;

drop policy if exists "Pagos: select propios" on public.debt_payments;
create policy "Pagos: select propios"
  on public.debt_payments for select
  using (auth.uid() = user_id);

drop policy if exists "Pagos: insert propios" on public.debt_payments;
create policy "Pagos: insert propios"
  on public.debt_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Pagos: update propios" on public.debt_payments;
create policy "Pagos: update propios"
  on public.debt_payments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Pagos: delete propios" on public.debt_payments;
create policy "Pagos: delete propios"
  on public.debt_payments for delete
  using (auth.uid() = user_id);
