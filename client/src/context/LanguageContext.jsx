import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { it } from "../lang/translations_it";
import { en } from "../lang/translations_en";

// Available translations by language code
export const translations = { it, en };

// Language context
const LanguageContext = createContext();

// Language provider
export const LanguageProvider = ({ children }) => {
  // Current language (persisted in localStorage)
  const [lang, setLang] = useState(localStorage.getItem("lang") || "it");

  // Toggle between supported languages
  const toggleLang = useCallback((targetLang) => {
    setLang((current) => {
      const newLang =
        targetLang && translations[targetLang]
          ? targetLang
          : current === "it"
            ? "en"
            : "it";
      localStorage.setItem("lang", newLang);
      return newLang;
    });
  }, []);

  // Translation helper with dot-notation support — stable reference per language
  const t = useCallback((key) => {
    const parts = key.split(".");
    let value = translations[lang];

    for (const part of parts) {
      if (!value || value[part] === undefined) return key;
      value = value[part];
    }

    return value;
  }, [lang]);

  // Sync HTML lang attribute with selected language
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({ lang, toggleLang, t }),
    [lang, toggleLang, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to consume language context
export const useLanguage = () => useContext(LanguageContext);
