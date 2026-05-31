import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  CreditCard,
  Settings,
} from 'lucide-react'

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/deudas', label: 'Deudas', icon: CreditCard },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]
