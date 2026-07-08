'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import es from '../../lib/i18n/es';
import en from '../../lib/i18n/en';
import type { TranslationType } from '../../lib/i18n/es';

type Lang = 'es' | 'en';

interface LanguageContextType {
  lang: Lang;
  t: (path: string) => string;
  setLang: (lang: Lang) => void;
}

function resolvePath(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

const translations: Record<Lang, TranslationType> = { es, en };

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  t: (p: string) => p,
  setLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children, storedLang }: { children: React.ReactNode; storedLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (storedLang) return storedLang;
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('optimizer_lang') as Lang) || 'es';
    }
    return 'es';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('optimizer_lang', l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((path: string): string => {
    return resolvePath(translations[lang] as unknown as Record<string, unknown>, path);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
