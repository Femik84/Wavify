import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) {
      // ignore
    }
    // default to dark on first open
    return "dark";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }

    // If you use Tailwind with class strategy for dark mode, toggle 'dark' class on <html>
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      if (theme === "dark") html.classList.add("dark");
      else html.classList.remove("dark");
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((s) => (s === "dark" ? "light" : "dark"));

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}