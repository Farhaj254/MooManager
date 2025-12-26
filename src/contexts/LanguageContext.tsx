"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (texts: { en: string; ur: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedLanguage = localStorage.getItem('mooManagerLanguage') as Language | null;
    if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'ur')) {
      setLanguageState(storedLanguage);
    } else {
      // Default to 'en' if nothing valid in localStorage
      setLanguageState('en');
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('mooManagerLanguage', language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
      
      if (language === 'ur') {
        document.body.classList.add('font-urdu');
        document.body.classList.remove('font-body');
      } else {
        document.body.classList.add('font-body');
        document.body.classList.remove('font-urdu');
      }
    }
  }, [language, isMounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const translate = useCallback((texts: { en: string; ur: string }): string => {
    return language === 'ur' ? texts.ur : texts.en;
  }, [language]);
  
  // Render children directly. Hydration mismatches for lang/dir are handled by useEffect.
  // Initial server render will use defaults, client will correct.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
