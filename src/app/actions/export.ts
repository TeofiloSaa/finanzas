'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toCSV } from '@/lib/csv'
import { isPro } from '@/lib/plans'
import type { Plan, Transaction, SavingsGoal, Debt } from '@/types'

export type ExportDataset = 'transacciones' | 'ahorros' | 'deudas'

// upgradeRequired distingue el bloqueo por plan de un error real: el cliente
// muestra una invitación a pasar a Pro en lugar de un mensaje de error.
type ExportResult =
  | { csv: string; filename: string }
  | { error: string; upgradeRequired?: boolean }

function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10) // yyyy-mm-dd
}

export async function exportarCSV(dataset: ExportDataset): Promise<ExportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Exportar CSV es función del plan Pro: mismo chequeo de plan que usan
  // los límites de transacciones/metas/deudas.
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', user.id)
    .maybeSingle()
  const plan = (profile?.plan as Plan) ?? 'free'
  const planExpiresAt = profile?.plan_expires_at ?? null

  if (!isPro(plan, planExpiresAt)) {
    return {
      error: 'La exportación a CSV está disponible en el plan Pro.',
      upgradeRequired: true,
    }
  }

  const stamp = fechaArchivo()

  if (dataset === 'transacciones') {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('[exportarCSV] select transactions falló:', error)
      return { error: 'No se pudo exportar. Intentá de nuevo.' }
    }

    const rows = (data as Transaction[]).map((t) => [
      t.date,
      t.type,
      t.amount,
      t.category,
      t.description ?? '',
      t.created_at,
    ])
    const csv = toCSV(
      ['Fecha', 'Tipo', 'Monto', 'Categoría', 'Descripción', 'Creado'],
      rows,
    )
    return { csv, filename: `transacciones-${stamp}.csv` }
  }

  if (dataset === 'ahorros') {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[exportarCSV] select savings_goals falló:', error)
      return { error: 'No se pudo exportar. Intentá de nuevo.' }
    }

    const rows = (data as SavingsGoal[]).map((g) => [
      g.name,
      g.target_amount,
      g.current_amount,
      g.deadline ?? '',
      g.completed ? 'Sí' : 'No',
      g.created_at,
    ])
    const csv = toCSV(
      ['Meta', 'Objetivo', 'Acumulado', 'Fecha límite', 'Completada', 'Creada'],
      rows,
    )
    return { csv, filename: `ahorros-${stamp}.csv` }
  }

  if (dataset === 'deudas') {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[exportarCSV] select debts falló:', error)
      return { error: 'No se pudo exportar. Intentá de nuevo.' }
    }

    const rows = (data as Debt[]).map((d) => [
      d.name,
      d.type,
      d.total_amount,
      d.installments,
      d.paid_installments,
      d.installment_amount,
      d.due_day,
      d.start_date,
      d.created_at,
    ])
    const csv = toCSV(
      [
        'Nombre',
        'Tipo',
        'Monto total',
        'Cuotas',
        'Cuotas pagas',
        'Monto cuota',
        'Día de vencimiento',
        'Inicio',
        'Creada',
      ],
      rows,
    )
    return { csv, filename: `deudas-${stamp}.csv` }
  }

  return { error: 'Conjunto de datos no válido.' }
}
