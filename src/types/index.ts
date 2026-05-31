export type TransactionType = 'ingreso' | 'gasto'

export type DebtType = 'prestamo' | 'tarjeta' | 'otro'

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  is_default: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
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
