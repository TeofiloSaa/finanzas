import { Skel } from '@/components/ui/Skeleton'

export default function AhorrosLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Skel className="h-7 w-28 mb-2" />
          <Skel className="h-4 w-40" />
        </div>
        <Skel className="h-9 w-32 rounded-lg" />
      </div>

      {/* Section title */}
      <Skel className="h-3 w-16 mb-3" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 p-5"
            style={{ backgroundColor: '#1a1d27' }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <Skel className="h-5 w-40 mb-2" />
                <Skel className="h-3 w-32" />
              </div>
              <Skel className="h-6 w-6 rounded-md shrink-0" />
            </div>
            <Skel className="h-2 w-full rounded-full mb-2" />
            <div className="flex items-center justify-between mb-3">
              <Skel className="h-3 w-12" />
              <Skel className="h-3 w-32" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <Skel className="h-3 w-28" />
              <Skel className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
