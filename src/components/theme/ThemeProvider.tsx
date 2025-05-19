
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type CompactMode = boolean;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultCompactMode?: CompactMode;
};

type ThemeProviderState = {
  theme: Theme;
  compactMode: CompactMode;
  setTheme: (theme: Theme) => void;
  setCompactMode: (compact: CompactMode) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  compactMode: false,
  setTheme: () => null,
  setCompactMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  defaultCompactMode = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage?.getItem("theme") as Theme) || defaultTheme
  );
  const [compactMode, setCompactMode] = useState<CompactMode>(
    localStorage?.getItem("compactMode") === "true" || defaultCompactMode
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (compactMode) {
      root.classList.add("compact");
    } else {
      root.classList.remove("compact");
    }
  }, [compactMode]);

  const value = {
    theme,
    compactMode,
    setTheme: (theme: Theme) => {
      localStorage?.setItem("theme", theme);
      setTheme(theme);
    },
    setCompactMode: (compact: CompactMode) => {
      localStorage?.setItem("compactMode", String(compact));
      setCompactMode(compact);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
