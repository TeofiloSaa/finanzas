-- Migración: columna plan_expires_at en profiles.
-- Ejecutar en el SQL Editor de Supabase (una sola vez sobre la base existente).
-- Idempotente: si la columna ya existe, no hace nada.
--
-- Para qué: cuando un usuario cancela su suscripción Pro, Lemon Squeezy la deja
-- activa hasta el fin del período ya pagado (ends_at). Guardamos ese ends_at acá
-- para que el usuario siga siendo Pro hasta esa fecha. isPro() compara contra
-- now() en cada chequeo, así la expiración se aplica sola sin necesitar un cron.
--
-- Semántica:
--   - plan = 'pro'  + plan_expires_at = null         -> Pro activo (sin vencimiento)
--   - plan = 'pro'  + plan_expires_at = <fecha futura> -> cancelado, Pro hasta esa fecha
--   - plan = 'free' + plan_expires_at = null         -> Free
--
-- RLS: profiles ya tiene políticas por columna (auth.uid() = id) que cubren la
-- nueva columna; no hace falta política adicional. El webhook escribe con la
-- service_role key (bypassea RLS), igual que para plan/lemon_subscription_id.

alter table public.profiles
  add column if not exists plan_expires_at timestamptz;
