import { Skel } from '@/components/ui/Skeleton'

export default function TransaccionesLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Skel className="h-7 w-40 mb-2" />
          <Skel className="h-4 w-32" />
        </div>
        <Skel className="h-9 w-36 rounded-lg" />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 px-4 py-3"
            style={{ backgroundColor: '#1a1d27' }}
          >
            <Skel className="h-3 w-16 mb-1.5" />
            <Skel className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4">
        <Skel className="h-8 w-48 rounded-lg" />
        <Skel className="h-8 w-32 rounded-lg" />
      </div>

      {/* Lista */}
      <div
        className="rounded-xl border border-white/5 overflow-hidden"
        style={{ backgroundColor: '#1a1d27' }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 ${
              i !== 5 ? 'border-b border-white/5' : ''
            }`}
          >
            <Skel className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skel className="h-4 w-32" />
              <Skel className="h-3 w-20" />
            </div>
            <Skel className="h-4 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
