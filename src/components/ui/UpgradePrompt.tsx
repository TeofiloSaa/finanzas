import Link from 'next/link'

// Aviso reutilizable de "esto es Pro" en los puntos donde se topa un límite del
// plan Free (export CSV, alta/edición de transacciones, etc.). El botón lleva a
// /pricing, donde el usuario ve la comparación Free/Pro y hace el upgrade con el
// flujo que ya existe ahí. /pricing es ruta protegida, pero quien ve este aviso
// siempre está logueado (vive dentro del dashboard), así que no hay redirect.
export default function UpgradePrompt({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg px-3 py-3 border"
      style={{
        borderColor: 'rgba(59,127,245,0.3)',
        backgroundColor: 'rgba(59,127,245,0.08)',
      }}
    >
      <p className="text-sm text-fg/70 flex-1">{message}</p>
      <Link
        href="/pricing"
        className="px-4 py-2 rounded-lg text-sm font-medium text-white text-center transition-opacity hover:opacity-90 cursor-pointer shrink-0"
        style={{ backgroundColor: '#3b7ff5' }}
      >
        Ver plan Pro
      </Link>
    </div>
  )
}
