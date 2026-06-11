-- ============================================================================
-- auto_transactions.sql
-- Vínculo aporte/pago -> transacción automática (gasto) + categorías de sistema
-- + funciones atómicas (RPC). Idempotente y reejecutable.
-- Correr en el SQL Editor de Supabase ANTES de tocar la app.
--
-- Caveat: los CHECK agregados con "add column if not exists" NO se aplican si la
-- columna ya existía de antes; en una base limpia se aplican sin problema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Categorías de sistema
-- ----------------------------------------------------------------------------
alter table public.categories
  add column if not exists is_system boolean not null default false;

-- Proteger las categorías de sistema: no se pueden actualizar ni borrar, ni
-- siquiera por su dueño (ni vía llamada directa a la API). El insert sigue
-- permitido para poder sembrarlas desde el server.
drop policy if exists "Categorías: update propias" on public.categories;
create policy "Categorías: update propias"
  on public.categories for update
  using (auth.uid() = user_id and is_system = false)
  with check (auth.uid() = user_id and is_system = false);

drop policy if exists "Categorías: delete propias" on public.categories;
create policy "Categorías: delete propias"
  on public.categories for delete
  using (auth.uid() = user_id and is_system = false);

-- Sembrar las 2 categorías de sistema para todos los usuarios existentes.
-- Si el usuario ya tenía una categoría con ese nombre+tipo, se promueve a
-- sistema (no se duplica).
insert into public.categories (user_id, name, type, color, is_default, is_system, sort_order)
select p.id, c.name, 'gasto', c.color, false, true, c.sort_order
from public.profiles p
cross join (values
  ('Ahorros',        '#14b8a6', 100),
  ('Pago de deudas', '#a855f7', 101)
) as c(name, color, sort_order)
on conflict (user_id, lower(name), type)
  do update set is_system = true;

-- ----------------------------------------------------------------------------
-- 2) Marcador de origen en transactions
-- ----------------------------------------------------------------------------
-- NULL = transacción manual. A futuro: agregar 'retiro_ahorro' al check.
alter table public.transactions
  add column if not exists auto_origin text
  check (auto_origin in ('aporte_ahorro', 'pago_deuda'));

-- ----------------------------------------------------------------------------
-- 3) Link aporte -> transacción
-- ----------------------------------------------------------------------------
alter table public.savings_contributions
  add column if not exists transaction_id uuid
  references public.transactions (id) on delete cascade;

-- UNIQUE parcial: 1:1 con la transacción, tolerando aportes en NULL.
create unique index if not exists savings_contributions_transaction_uidx
  on public.savings_contributions (transaction_id)
  where transaction_id is not null;

-- ----------------------------------------------------------------------------
-- 4) Tabla debt_payments (los pagos de deuda ahora son filas)
-- ----------------------------------------------------------------------------
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  date date not null,
  transaction_id uuid references public.transactions (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists debt_payments_debt_id_idx on public.debt_payments (debt_id);
create index if not exists debt_payments_user_id_idx on public.debt_payments (user_id);
create unique index if not exists debt_payments_transaction_uidx
  on public.debt_payments (transaction_id) where transaction_id is not null;

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
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Pagos: delete propios" on public.debt_payments;
create policy "Pagos: delete propios"
  on public.debt_payments for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5) Funciones atómicas (SECURITY INVOKER => respetan RLS)
-- ----------------------------------------------------------------------------

-- Crear aporte: transacción + contribution + actualizar meta, en una sola tx.
create or replace function public.aporte_crear(
  p_goal_id uuid, p_amount numeric, p_date date
) returns uuid language plpgsql security invoker as $$
declare
  v_user   uuid := auth.uid();
  v_txn    uuid;
  v_target numeric;
begin
  if v_user is null then raise exception 'no auth'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'monto invalido'; end if;

  select target_amount into v_target
  from public.savings_goals
  where id = p_goal_id and user_id = v_user
  for update;
  if not found then raise exception 'meta no encontrada'; end if;

  insert into public.transactions (user_id, type, amount, category, date, auto_origin)
  values (v_user, 'gasto', p_amount, 'Ahorros', p_date, 'aporte_ahorro')
  returning id into v_txn;

  insert into public.savings_contributions (goal_id, user_id, amount, date, transaction_id)
  values (p_goal_id, v_user, p_amount, p_date, v_txn);

  update public.savings_goals
  set current_amount = current_amount + p_amount,
      completed      = (current_amount + p_amount) >= target_amount
  where id = p_goal_id and user_id = v_user;

  return v_txn;
end; $$;

-- Crear pago de deuda: transacción + debt_payment + paid_installments += 1.
create or replace function public.pago_crear(
  p_debt_id uuid, p_amount numeric, p_date date
) returns uuid language plpgsql security invoker as $$
declare
  v_user uuid := auth.uid();
  v_txn  uuid;
  v_inst int;
  v_paid int;
begin
  if v_user is null then raise exception 'no auth'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'monto invalido'; end if;

  select installments, paid_installments into v_inst, v_paid
  from public.debts where id = p_debt_id and user_id = v_user for update;
  if not found then raise exception 'deuda no encontrada'; end if;
  if v_paid >= v_inst then raise exception 'deuda saldada'; end if;

  insert into public.transactions (user_id, type, amount, category, date, auto_origin)
  values (v_user, 'gasto', p_amount, 'Pago de deudas', p_date, 'pago_deuda')
  returning id into v_txn;

  insert into public.debt_payments (debt_id, user_id, amount, date, transaction_id)
  values (p_debt_id, v_user, p_amount, p_date, v_txn);

  update public.debts
  set paid_installments = paid_installments + 1
  where id = p_debt_id and user_id = v_user;

  return v_txn;
end; $$;

-- Despachador único de borrado/reversión. Sirve para "borrar desde el listado"
-- y, vía lookup del transaction_id, para "borrar el aporte/pago". Idempotente.
create or replace function public.transaccion_eliminar(p_txn uuid)
returns void language plpgsql security invoker as $$
declare
  v_user   uuid := auth.uid();
  v_origin text;
begin
  select auto_origin into v_origin
  from public.transactions where id = p_txn and user_id = v_user;
  if not found then raise exception 'transaccion no encontrada'; end if;

  if v_origin = 'aporte_ahorro' then
    update public.savings_goals g
    set current_amount = greatest(g.current_amount - sc.amount, 0),
        completed      = (g.current_amount - sc.amount) >= g.target_amount
    from public.savings_contributions sc
    where sc.transaction_id = p_txn and sc.goal_id = g.id and g.user_id = v_user;
    delete from public.savings_contributions where transaction_id = p_txn;

  elsif v_origin = 'pago_deuda' then
    update public.debts d
    set paid_installments = greatest(d.paid_installments - 1, 0)
    from public.debt_payments dp
    where dp.transaction_id = p_txn and dp.debt_id = d.id and d.user_id = v_user;
    delete from public.debt_payments where transaction_id = p_txn;
  end if;

  delete from public.transactions where id = p_txn and user_id = v_user;
end; $$;

-- Borrar deuda: las transacciones de pago QUEDAN como gastos normales (se
-- desligan), no se borran (D1). Primero se quita el vínculo en ambos lados y
-- luego se borra la deuda (su cascade limpia los debt_payments ya desligados).
create or replace function public.deuda_eliminar(p_debt_id uuid)
returns void language plpgsql security invoker as $$
declare v_user uuid := auth.uid();
begin
  -- 1) Las transacciones ligadas dejan de ser automáticas.
  update public.transactions t
  set auto_origin = null
  from public.debt_payments dp
  where dp.transaction_id = t.id
    and dp.debt_id = p_debt_id and dp.user_id = v_user
    and t.user_id = v_user;

  -- 2) Romper el vínculo del lado del pago (evita el cascade a transactions).
  update public.debt_payments
  set transaction_id = null
  where debt_id = p_debt_id and user_id = v_user;

  -- 3) Borrar la deuda (cascade limpia los debt_payments).
  delete from public.debts where id = p_debt_id and user_id = v_user;
end; $$;

-- Borrar meta: análogo. Los aportes generaron gastos que quedan como gastos
-- normales; solo se desligan (D1).
create or replace function public.meta_eliminar(p_goal_id uuid)
returns void language plpgsql security invoker as $$
declare v_user uuid := auth.uid();
begin
  -- 1) Las transacciones ligadas dejan de ser automáticas.
  update public.transactions t
  set auto_origin = null
  from public.savings_contributions sc
  where sc.transaction_id = t.id
    and sc.goal_id = p_goal_id and sc.user_id = v_user
    and t.user_id = v_user;

  -- 2) Romper el vínculo del lado del aporte.
  update public.savings_contributions
  set transaction_id = null
  where goal_id = p_goal_id and user_id = v_user;

  -- 3) Borrar la meta (cascade limpia los savings_contributions).
  delete from public.savings_goals where id = p_goal_id and user_id = v_user;
end; $$;

grant execute on function public.aporte_crear(uuid, numeric, date)  to authenticated;
grant execute on function public.pago_crear(uuid, numeric, date)    to authenticated;
grant execute on function public.transaccion_eliminar(uuid)         to authenticated;
grant execute on function public.deuda_eliminar(uuid)               to authenticated;
grant execute on function public.meta_eliminar(uuid)                to authenticated;
