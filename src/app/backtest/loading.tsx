export default function Loading() {
  return (
    <div className="min-h-screen lg:pl-72">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8 md:py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-white/5" />
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
          ))}
        </div>
        <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
      </div>
    </div>
  );
}
