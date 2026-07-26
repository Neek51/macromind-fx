"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";

export const navItems = [
  {
    group: "Market",
    label: "Overview",
    href: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    group: "Market",
    label: "Outlook",
    href: "/outlook",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    group: "Market",
    label: "Patterns",
    href: "/patterns",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 5 5 4-7 5 10" />
        <circle cx="7" cy="9" r="1.5" fill="currentColor" />
        <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        <circle cx="16" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    group: "Intelligence",
    label: "News AI",
    href: "/news",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
        <path d="M19 4L19.7 6.3L22 7L19.7 7.7L19 10L18.3 7.7L16 7L18.3 6.3Z" />
      </svg>
    ),
  },
  {
    group: "Intelligence",
    label: "Calendar",
    href: "/calendar",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-[var(--card-border)] bg-[var(--sidebar)] px-4 py-5 transition-colors duration-300 lg:flex">
      <Link href="/" className="group flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent)] transition-transform duration-300 group-hover:scale-105">
          M
        </div>
        <div>
          <p className="text-[15px] font-bold tracking-tight">MacroMind <span className="text-[var(--accent)]">FX</span></p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Market intelligence</p>
        </div>
      </Link>

      <nav className="mt-6 flex-1 space-y-5" aria-label="Primary navigation">
        {Array.from(new Set(navItems.map((item) => item.group))).map((group) => (
          <div key={group}>
            <p className="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group}</p>
            <div className="space-y-1">
              {navItems.filter((item) => item.group === group).map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                    }`}
                  >
                    {active && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-[var(--accent)]" />}
                    <span className={`transition-colors duration-200 ${active ? "text-[var(--accent)]" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                      {item.icon}
                    </span>
                    {item.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider">Risk reminder</p>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">Educational research only — not financial advice.</p>
      </div>
    </aside>
  );
}

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-[var(--card-border)] bg-[var(--sidebar)] px-5 py-6 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-slate-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3 px-2" onClick={onClose}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent)] transition-transform duration-300 group-hover:scale-105">
            M
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight">MacroMind <span className="text-[var(--accent)]">FX</span></p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Market intelligence</p>
          </div>
        </Link>

        <nav className="mt-8 flex-1 space-y-5 overflow-y-auto" aria-label="Mobile navigation links">
          {Array.from(new Set(navItems.map((item) => item.group))).map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group}</p>
              <div className="space-y-1">
                {navItems.filter((item) => item.group === group).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200"
                      }`}
                    >
                      {active && <span className="absolute left-0 h-5 w-0.5 rounded-full bg-[var(--accent)]" />}
                      <span className={`transition-colors duration-200 ${active ? "text-[var(--accent)]" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider">Risk reminder</p>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">Educational research only — not financial advice.</p>
      </div>
      </aside>
    </>
  );
}

export function PageShell({
  title,
  label,
  action,
  actionHref,
  onActionClick,
  children,
}: {
  title: string;
  label: string;
  action?: string;
  actionHref?: string;
  onActionClick?: () => void;
  children: React.ReactNode;
}) {
  const { darkMode, ready, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <section className={`min-h-screen lg:pl-64 ${ready ? "transition-colors duration-300" : ""}`}>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Header */}
      <header className={`sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--background)]/80 px-5 py-4 backdrop-blur-xl md:px-8 md:py-5 ${ready ? "transition-colors duration-300" : ""}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm transition-colors hover:border-slate-300 dark:hover:border-slate-600 lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-[28px]">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle — click to switch (icon shows the mode you'll switch TO) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 ${ready ? "transition-colors duration-300" : ""}`}
            >
              {/* Sun icon — shown in dark mode (click to go light) */}
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                /* Moon icon — shown in light mode (click to go dark) */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                </svg>
              )}
            </button>
            {action ? (
              actionHref ? (
                <Link
                  href={actionHref}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer block text-center"
                >
                  {action}
                </Link>
              ) : (
                <button
                  onClick={onActionClick}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  {action}
                </button>
              )
            ) : null}
          </div>
        </div>
      </header>
      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8 md:py-8">
        {children}
      </div>
    </section>
  );
}

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
