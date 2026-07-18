"use client";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-8 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-50/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Calendar error</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Failed to load economic calendar data.{error.digest ? ` (ref: ${error.digest})` : ""}</p>
        <button
          onClick={() => unstable_retry()}
          className="mt-6 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
