"use client";

export default function Error() {
  return (
    <div className="min-h-screen lg:pl-72">
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Backtest Failed to Load</h2>
          <p className="mt-2 text-sm text-slate-500">Something went wrong. Try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
