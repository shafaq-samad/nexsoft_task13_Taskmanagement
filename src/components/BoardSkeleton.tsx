export default function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex flex-col min-h-[500px]">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
            <div className="h-5 w-8 rounded-full bg-slate-200 animate-pulse" />
          </div>

          <div className="space-y-4 min-h-[400px] max-h-[68vh] overflow-hidden pr-1">
            {Array.from({ length: 3 }).map((__, cardIndex) => (
              <div key={cardIndex} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="mb-3 h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
                <div className="mb-2 h-3 w-full rounded bg-slate-100 animate-pulse" />
                <div className="mb-3 h-3 w-5/6 rounded bg-slate-100 animate-pulse" />
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
                  <div className="h-4 w-12 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
