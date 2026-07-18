"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeContextValue = {
  darkMode: boolean;
  ready: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  // On mount: read theme from DOM, set darkMode immediately (no transition),
  // then enable transitions on the NEXT frame so future toggles animate smoothly
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDarkMode(isDark);
    requestAnimationFrame(() => setReady(true));
  }, []);

  // Update DOM + localStorage when darkMode changes (only after ready)
  useEffect(() => {
    if (!ready) return;

    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.backgroundColor = "#1a1a17";
      document.documentElement.style.color = "#e8e6e0";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#f5f4f0";
      document.documentElement.style.color = "#1a1a17";
    }
    window.localStorage.setItem("macromind-theme", darkMode ? "dark" : "light");
  }, [darkMode, ready]);

  const value = useMemo(
    () => ({
      darkMode,
      ready,
      toggleTheme: () => setDarkMode((current) => !current),
    }),
    [darkMode, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
