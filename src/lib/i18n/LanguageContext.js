'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from './ar.json';
import en from './en.json';
import tr from './tr.json';

const translations = { ar, en, tr };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('ar');

    useEffect(() => {
        const stored = localStorage.getItem('ghiras_lang');
        if (stored && translations[stored]) {
            setLang(stored);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ghiras_lang', lang);
        document.documentElement.dir = translations[lang].dir;
        document.documentElement.lang = lang;
    }, [lang]);

    const t = useCallback((key) => {
        const keys = key.split('.');
        let value = translations[lang];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    }, [lang]);

    const switchLang = (newLang) => {
        if (translations[newLang]) {
            setLang(newLang);
        }
    };

    const isRtl = translations[lang]?.dir === 'rtl';

    return (
        <LanguageContext.Provider value={{ lang, t, switchLang, isRtl }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
}
