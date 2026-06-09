import { Skel } from '@/components/ui/Skeleton'

export default function PricingLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Skel className="h-7 w-24 mb-2" />
        <Skel className="h-4 w-56" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <section
            key={i}
            className="rounded-xl border border-fg/5 p-6"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <Skel className="h-4 w-16 mb-3" />
            <Skel className="h-8 w-24 mb-6" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skel key={j} className="h-4 w-full" />
              ))}
            </div>
            <Skel className="h-10 w-full rounded-lg mt-6" />
          </section>
        ))}
      </div>
    </div>
  )
}
