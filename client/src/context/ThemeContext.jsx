import { createContext, useContext, useState, useEffect } from "react";

const THEME_KEY = "theme";
const DEFAULT_THEME_KEY = "themeDefault";

const readStoredDefaultTheme = () => {
  const storedDefault = localStorage.getItem(DEFAULT_THEME_KEY);
  if (storedDefault === "light" || storedDefault === "dark") {
    return storedDefault;
  }

  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "light";
};

const applyThemeToDocument = (theme) => {
  const html = document.documentElement;

  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
};

// Theme context
const ThemeContext = createContext();

// Theme provider
export const ThemeProvider = ({ children }) => {
  const [defaultTheme, setDefaultThemeState] = useState(readStoredDefaultTheme);
  const [theme, setThemeState] = useState(readStoredDefaultTheme);

  // Sync theme with HTML root and localStorage
  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(DEFAULT_THEME_KEY, defaultTheme);
  }, [defaultTheme]);

  // Toggle between light and dark theme (session only; default unchanged)
  const toggleTheme = () =>
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  const setTheme = (nextTheme) => {
    if (nextTheme !== "light" && nextTheme !== "dark") return;
    setThemeState(nextTheme);
  };

  const setDefaultTheme = (nextDefault) => {
    if (nextDefault !== "light" && nextDefault !== "dark") return;
    setDefaultThemeState(nextDefault);
    setThemeState(nextDefault);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, defaultTheme, toggleTheme, setTheme, setDefaultTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to consume theme context
export const useTheme = () => useContext(ThemeContext);
