'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const DISMISSED_KEY = 'install-banner-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // User already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || !deferredPrompt) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-50 md:hidden flex items-center gap-3 px-4 py-3 border-t"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <span className="text-lg select-none">📲</span>
      <p className="flex-1 text-sm text-fg leading-tight">
        Instalá Finanzas en tu celu
      </p>
      <button
        onClick={handleInstall}
        className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-fg"
        style={{ backgroundColor: '#3b7ff5' }}
      >
        Instalar
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md"
        style={{ color: 'var(--muted)' }}
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  )
}
