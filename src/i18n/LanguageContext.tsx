import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Language, type TranslationKey } from "./translations";

export const LANGUAGES: { id: Language; label: string; short: string }[] = [
  { id: "uz", label: "O'zbekcha", short: "UZ" },
  { id: "uz_new", label: "O'zbekcha (yangi lotin)", short: "UZ+" },
  { id: "ru", label: "Русский", short: "RU" },
  { id: "en", label: "English", short: "EN" },
];

type Vars = Record<string, string | number>;
type LanguageValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
};

const LanguageContext = createContext<LanguageValue | null>(null);
const STORAGE_KEY = "aveluna:lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("uz");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "uz" || saved === "uz_new" || saved === "ru" || saved === "en") setLangState(saved);
    else if (saved === "uzn") setLangState("uz_new");
  }, []);

  const setLang = useCallback((next: Language) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "uz_new" ? "uz" : lang;
  }, [lang]);

  const t = useCallback((key: TranslationKey, vars?: Vars) => translate(key, lang, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
