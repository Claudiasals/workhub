import React, { createContext, useContext, useState, useEffect } from "react";
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
  const toggleLang = () => {
    const newLang = lang === "it" ? "en" : "it";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  // Translation helper with dot-notation support
  const t = (key) => {
    const parts = key.split(".");
    let value = translations[lang];

    for (const part of parts) {
      if (!value || value[part] === undefined) return key;
      value = value[part];
    }

    return value;
  };

  // Sync HTML lang attribute with selected language
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to consume language context
export const useLanguage = () => useContext(LanguageContext);
