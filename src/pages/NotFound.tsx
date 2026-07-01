export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="max-w-prose text-sm text-slate-600">
          The route you requested does not exist. Return to the task board to continue working.
        </p>
        <a
          href="/"
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          Back to board
        </a>
      </div>
    </main>
  );
}
