-- ============================================================================
-- patrimonio_baseline.sql
-- RPC de fallback para el gráfico de patrimonio del dashboard.
-- Calcula el balance neto acumulado (ingresos - gastos) ANTERIOR a una fecha,
-- para el usuario autenticado. Se usa cuando la agregación de PostgREST
-- (amount.sum()) no está disponible en el proyecto.
-- SECURITY INVOKER => respeta RLS. Idempotente y reejecutable.
-- Correr en el SQL Editor de Supabase.
-- ============================================================================

create or replace function public.patrimonio_baseline(p_date date)
returns numeric
language sql
security invoker
stable
as $$
  -- amount se guarda siempre positivo; el signo lo da el type.
  -- coalesce: sin filas previas, el baseline es 0.
  select coalesce(sum(
    case when type = 'ingreso' then amount else -amount end
  ), 0)
  from public.transactions
  where user_id = auth.uid()
    and date < p_date;
$$;

grant execute on function public.patrimonio_baseline(date) to authenticated;
