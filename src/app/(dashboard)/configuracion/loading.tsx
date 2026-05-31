import { Skel } from '@/components/ui/Skeleton'

export default function ConfiguracionLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Skel className="h-7 w-40 mb-2" />
        <Skel className="h-4 w-36" />
      </div>

      {/* 3 section cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <section
          key={i}
          className="rounded-xl border border-white/5 p-5 mb-4"
          style={{ backgroundColor: '#1a1d27' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Skel className="h-3.5 w-3.5 rounded-sm" />
            <Skel className="h-4 w-24" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <Skel className="h-3 w-20 mb-1.5" />
              <Skel className="h-10 w-full rounded-lg" />
            </div>
            {i === 0 && (
              <>
                <div>
                  <Skel className="h-3 w-28 mb-1.5" />
                  <Skel className="h-10 w-full rounded-lg" />
                </div>
                <div className="flex justify-end">
                  <Skel className="h-9 w-32 rounded-lg" />
                </div>
              </>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
