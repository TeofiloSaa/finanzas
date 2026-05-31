'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from './nav-items'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 border-t border-fg/5 z-50"
      style={{ backgroundColor: 'var(--surface)' }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            prefetch
            className="flex flex-col items-center justify-center gap-1 flex-1 py-3 text-xs font-medium transition-colors"
            style={{ color: active ? '#3b7ff5' : 'var(--muted)' }}
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
