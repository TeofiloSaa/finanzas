import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  Crown,
  FileDown,
  PiggyBank,
  Smartphone,
} from 'lucide-react'
import { FREE_FEATURES, PRO_FEATURES } from '@/lib/plan-features'

export const metadata: Metadata = {
  title: 'Finanzas — Controlá tus gastos, ahorros y deudas',
  description:
    'Registrá tus gastos e ingresos, seguí tus metas de ahorro y no te atrases con ninguna cuota. Gratis para empezar, sin vueltas.',
}

const FEATURES: {
  icon: typeof ArrowLeftRight
  title: string
  description: string
  pro?: boolean
}[] = [
  {
    icon: ArrowLeftRight,
    title: 'Transacciones',
    description:
      'Anotá gastos e ingresos en segundos, con categorías para saber en qué se te va la plata.',
  },
  {
    icon: PiggyBank,
    title: 'Metas de ahorro',
    description:
      'Definí un objetivo, sumá aportes y mirá la barra llenarse hasta llegar.',
  },
  {
    icon: Bell,
    title: 'Deudas con alertas',
    description:
      'Cargá tus cuotas y préstamos: la app te avisa antes de cada vencimiento.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard con gráficos',
    description:
      'Tu mes de un vistazo: balance, gastos por categoría y la evolución de tu patrimonio.',
  },
  {
    icon: FileDown,
    title: 'Exportá a CSV',
    description:
      'Tus datos son tuyos: descargá transacciones, ahorros y deudas cuando quieras.',
    pro: true,
  },
  {
    icon: Smartphone,
    title: 'Instalala como app',
    description:
      'Llevala en el celu o en la compu, sin pasar por ninguna tienda de aplicaciones.',
  },
]

function Logo() {
  return (
    <Link href="/landing" className="flex items-center gap-2.5">
      <span className="w-5 h-[3px] rounded-full bg-accent" aria-hidden />
      <span className="text-sm font-semibold tracking-[0.15em] uppercase text-fg">
        Finanzas
      </span>
    </Link>
  )
}

export default function LandingPage() {
  return (
    // La landing es pública y no pasa por el ThemeProvider del dashboard:
    // fijamos el tema oscuro acá, igual que las pantallas de auth.
    <div className="dark scroll-smooth">
      <div className="min-h-screen bg-background text-fg">
        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <nav className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
            <Logo />
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-fg/70 hover:bg-fg/5 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:opacity-90 transition-opacity"
              >
                Registrarse
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-accent">
              Finanzas personales sin vueltas
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-balance">
              Sabé en qué se va tu plata,
              <br className="hidden sm:block" /> sin planillas ni dolores de
              cabeza
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted leading-relaxed">
              Registrá tus gastos e ingresos, seguí tus metas de ahorro y no te
              atrases con ninguna cuota. Todo en un solo lugar, desde el celu o
              la compu.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium text-white bg-accent hover:opacity-90 transition-opacity"
              >
                Crear cuenta gratis
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <a
                href="#precios"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium text-fg/70 border border-fg/10 hover:bg-fg/5 transition-colors"
              >
                Ver planes
              </a>
            </div>
            <p className="mt-4 text-xs text-muted">
              Gratis para empezar · No hace falta tarjeta
            </p>
          </section>

          {/* Features */}
          <section id="funciones" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Todo lo que necesitás para ordenarte
              </h2>
              <p className="mt-2 text-muted text-sm sm:text-base">
                Sin funciones de más: lo justo para que tus cuentas cierren.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description, pro }) => (
                <article
                  key={title}
                  className="rounded-xl border border-fg/5 bg-surface p-6"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10">
                    <Icon size={20} strokeWidth={1.75} className="text-accent" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-fg flex items-center gap-2">
                    {title}
                    {pro && (
                      <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                        Pro
                      </span>
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm text-fg/60 leading-relaxed">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="precios" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Un precio simple, como tus cuentas
              </h2>
              <p className="mt-2 text-muted text-sm sm:text-base">
                Empezá gratis y pasate a Pro cuando se te quede chico.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 items-stretch">
              {/* Free */}
              <section className="rounded-xl border border-fg/5 bg-surface p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-fg">Free</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-fg">$0</span>
                    <span className="text-sm text-fg/40">/mes</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-fg/70"
                    >
                      <Check
                        size={16}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-fg/40"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-6 text-center text-sm font-medium py-2.5 rounded-lg border border-fg/10 text-fg/70 hover:bg-fg/5 transition-colors"
                >
                  Empezar gratis
                </Link>
              </section>

              {/* Pro */}
              <section className="rounded-xl border border-accent bg-surface p-6 flex flex-col relative">
                <span className="absolute -top-3 right-5 text-xs font-medium px-2.5 py-0.5 rounded-full text-white bg-accent">
                  Recomendado
                </span>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Crown size={18} strokeWidth={1.75} className="text-accent" />
                    <h3 className="text-base font-semibold text-fg">Pro</h3>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-fg">USD 3,99</span>
                    <span className="text-sm text-fg/40">/mes</span>
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {PRO_FEATURES.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-fg/70"
                    >
                      <Check
                        size={16}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?plan=pro"
                  className="mt-6 text-center text-sm font-medium py-2.5 rounded-lg text-white bg-accent hover:opacity-90 transition-opacity"
                >
                  Quiero el plan Pro
                </Link>
              </section>
            </div>
          </section>

          {/* CTA final */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
            <div className="rounded-xl border border-fg/5 bg-surface px-6 py-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Tu plata, bajo control desde hoy
              </h2>
              <p className="mt-2 text-muted text-sm sm:text-base">
                Crear la cuenta lleva menos de un minuto. En serio.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white bg-accent hover:opacity-90 transition-opacity"
              >
                Crear cuenta gratis
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo />
            <div className="flex items-center gap-5 text-sm text-fg/60">
              <a href="#funciones" className="hover:text-fg transition-colors">
                Funciones
              </a>
              <a href="#precios" className="hover:text-fg transition-colors">
                Precios
              </a>
              <Link href="/login" className="hover:text-fg transition-colors">
                Iniciar sesión
              </Link>
            </div>
            <p className="text-xs text-fg/40">
              © {new Date().getFullYear()} Finanzas
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
