import { Skel } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Skel className="h-7 w-32 mb-2" />
        <Skel className="h-4 w-44" />
      </div>

      {/* 3 summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 px-5 py-4"
            style={{ backgroundColor: '#1a1d27' }}
          >
            <div className="flex items-center justify-between mb-3">
              <Skel className="h-3 w-24" />
              <Skel className="h-7 w-7 rounded-lg" />
            </div>
            <Skel className="h-6 w-32" />
          </div>
        ))}
      </div>

      {/* Donut section */}
      <section
        className="rounded-xl border border-white/5 p-5 mb-4"
        style={{ backgroundColor: '#1a1d27' }}
      >
        <Skel className="h-4 w-40 mb-1" />
        <Skel className="h-3 w-28 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 sm:gap-4 items-center">
          <div className="h-[160px] w-full max-w-[160px] mx-auto sm:mx-0 flex items-center justify-center">
            <div className="relative w-[144px] h-[144px]">
              <Skel className="absolute inset-0 rounded-full" />
              <div
                className="absolute inset-[20px] rounded-full"
                style={{ backgroundColor: '#1a1d27' }}
              />
            </div>
          </div>
          <ul className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Skel className="h-2.5 w-2.5 rounded-sm shrink-0" />
                <Skel className="h-4 flex-1" />
                <Skel className="h-3 w-8 shrink-0" />
                <Skel className="h-4 w-20 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bar chart section */}
      <section
        className="rounded-xl border border-white/5 p-5 mb-4"
        style={{ backgroundColor: '#1a1d27' }}
      >
        <Skel className="h-4 w-40 mb-1" />
        <Skel className="h-3 w-28 mb-4" />
        <div className="h-[260px] flex items-end gap-3 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-end gap-1">
              <Skel
                className="flex-1 rounded-t-md"
                style={{ height: `${30 + ((i * 37) % 60)}%` }}
              />
              <Skel
                className="flex-1 rounded-t-md"
                style={{ height: `${20 + ((i * 53) % 70)}%` }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 2 widget cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 p-5"
            style={{ backgroundColor: '#1a1d27' }}
          >
            <div className="flex items-center justify-between mb-4">
              <Skel className="h-4 w-32" />
              <Skel className="h-3 w-16" />
            </div>
            <ul className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <li key={j} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Skel className="h-4 w-32" />
                    <Skel className="h-3 w-20" />
                  </div>
                  <Skel className="h-1.5 w-full rounded-full" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
