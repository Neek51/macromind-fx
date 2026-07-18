export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--background)]/80 px-5 py-4 backdrop-blur-xl md:px-8 md:py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-6 w-56 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-6 px-5 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-white/10" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/10" />
                      <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/10" />
                    </div>
                  </div>
                  <div className="h-6 w-14 rounded-md bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="mt-4 h-7 w-24 rounded bg-slate-200 dark:bg-white/10" />
                <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)] pt-3">
                  <div className="h-4 w-12 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-14 rounded bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
