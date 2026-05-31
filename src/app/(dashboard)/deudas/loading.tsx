import { Skel } from '@/components/ui/Skeleton'

export default function DeudasLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Skel className="h-7 w-24 mb-2" />
          <Skel className="h-4 w-36" />
        </div>
        <Skel className="h-9 w-32 rounded-lg" />
      </div>

      {/* Section title */}
      <Skel className="h-3 w-16 mb-3" />

      {/* Debt cards */}
      <div className="grid grid-cols-1 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 p-5"
            style={{ backgroundColor: '#1a1d27' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 flex-1">
                <Skel className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skel className="h-5 w-48 mb-2" />
                  <Skel className="h-3 w-56" />
                </div>
              </div>
              <Skel className="h-6 w-6 rounded-md shrink-0" />
            </div>

            {/* 3 numbers */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j}>
                  <Skel className="h-3 w-16 mb-1.5" />
                  <Skel className="h-4 w-20" />
                </div>
              ))}
            </div>

            {/* Vencimiento */}
            <Skel className="h-8 w-full rounded-lg mb-4" />

            {/* Progress */}
            <Skel className="h-2 w-full rounded-full mb-2" />
            <div className="flex items-center justify-between mb-3">
              <Skel className="h-3 w-32" />
              <Skel className="h-3 w-8" />
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 py-3 border-t border-white/5">
              {Array.from({ length: 12 }).map((_, j) => (
                <Skel key={j} className="h-7 w-7 rounded-md" />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <Skel className="h-3 w-32" />
              <Skel className="h-7 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
