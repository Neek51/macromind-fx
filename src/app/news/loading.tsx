export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--background)]/80 px-5 py-4 backdrop-blur-xl md:px-8 md:py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-14 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-6 w-40 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>
        </header>
        <div className="mx-auto max-w-6xl space-y-6 px-5 py-6 md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="mb-5 h-52 rounded-xl bg-slate-200 dark:bg-white/10" />
              <div className="h-12 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="mb-5 h-8 w-40 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-24 rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-12 rounded bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
