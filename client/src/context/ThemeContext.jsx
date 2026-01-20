import { createContext, useContext, useState, useEffect } from "react";

// Theme context
const ThemeContext = createContext();

// Theme provider
export const ThemeProvider = ({ children }) => {
  // Current theme (persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // Sync theme with HTML root and localStorage
  useEffect(() => {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between light and dark theme
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to consume theme context
export const useTheme = () => useContext(ThemeContext);
