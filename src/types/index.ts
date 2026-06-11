export type TransactionType = 'ingreso' | 'gasto'

export type DebtType = 'prestamo' | 'tarjeta' | 'otro'

export type Plan = 'free' | 'pro'

// Origen de una transacción generada automáticamente. NULL/undefined = manual.
// A futuro: 'retiro_ahorro' para retiros que generan un ingreso.
export type AutoOrigin = 'aporte_ahorro' | 'pago_deuda'

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  is_default: boolean
  is_system: boolean
  sort_order: number
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  plan: Plan
  lemon_subscription_id?: string | null
  plan_expires_at?: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category: string
  description?: string
  date: string
  auto_origin?: AutoOrigin | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string
  completed: boolean
  created_at: string
}

export interface SavingsContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  date: string
  transaction_id?: string | null
  created_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  user_id: string
  amount: number
  date: string
  transaction_id?: string | null
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  type: DebtType
  total_amount: number
  installments: number
  paid_installments: number
  installment_amount: number
  due_day: number
  start_date: string
  created_at: string
}
