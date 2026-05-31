@AGENTS.md
# Finanzas — Contexto del proyecto

App web de finanzas personales SaaS. Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase.

## Reglas estrictas
- Usar App Router de Next.js (nunca Pages Router)
- Server Components usan `/lib/supabase/server.ts`, Client Components usan `/lib/supabase/client.ts`
- Row Level Security activo en todas las tablas — nunca usar service_role en el cliente
- Tipos siempre desde `/types/index.ts`
- Moneda: `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
- Fechas: formato dd/mm/yyyy
- Diseño oscuro por defecto, sin elementos de IA visibles

## Diseño
- Fondo: `#0f1117`, superficie: `#1a1d27`, acento azul: `#3b7ff5`
- Fuente: Geist (default de Next.js 14)
- Sidebar fija en desktop, bottom nav en mobile
- Inspirado en la imagen de referencia (app de escritorio dark mode)

## Estructura de carpetas
app/
(auth)/login/page.tsx
(auth)/register/page.tsx
(dashboard)/layout.tsx       ← sidebar + nav
(dashboard)/dashboard/page.tsx
(dashboard)/transacciones/page.tsx
(dashboard)/ahorros/page.tsx
(dashboard)/deudas/page.tsx
(dashboard)/configuracion/page.tsx
components/ui/                 ← componentes reutilizables
components/dashboard/
components/transacciones/
components/ahorros/
components/deudas/
lib/supabase/client.ts
lib/supabase/server.ts
lib/utils.ts
types/index.ts

## Base de datos (Supabase)
Tablas: `profiles`, `transactions`, `savings_goals`, `savings_contributions`, `debts`

### transactions
- id, user_id, type (ingreso|gasto), amount, category, description, date, created_at

### savings_goals
- id, user_id, name, target_amount, current_amount, deadline (opcional), completed, created_at

### savings_contributions
- id, goal_id, user_id, amount, date, created_at

### debts
- id, user_id, name, type (prestamo|tarjeta|otro), total_amount, installments, paid_installments, installment_amount (generada), due_day, start_date, created_at

## Categorías preset
Gastos: Comida y super, Transporte, Ropa, Salud, Entretenimiento, Servicios, Educación, Otros
Ingresos: Sueldo, Freelance, Inversiones, Regalo, Otros

## Variables de entorno necesarias
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=