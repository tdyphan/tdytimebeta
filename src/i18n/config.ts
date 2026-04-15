/**
 * i18n Configuration — TdyTime v2
 * Merges critical inline translations for instant availability,
 * then lazy-loads full translation bundles.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_VERSION } from '@/core/constants';

// 🎯 Merge critical translations immediately (from index.html inline script)
const criticalTranslations = (window as any).CRITICAL_I18N;

// Detect saved language preference
let defaultLanguage = 'vi';
try {
    defaultLanguage = localStorage.getItem('language') || 'vi';
} catch {
    console.warn('LocalStorage not accessible, falling back to "vi"');
}

// 🎯 Build initial resources with critical translations merged
const buildInitialResources = (lng: string): { translation: Record<string, any> } | undefined => {
    const critical = criticalTranslations?.[lng];
    if (!critical) return undefined;
    
    // Critical keys are immediately available
    return {
        translation: critical,
    };
};

const resources: Record<string, { translation: Record<string, any> }> = {};
const viResources = buildInitialResources('vi');
const enResources = buildInitialResources('en');

if (viResources) resources.vi = viResources;
if (enResources) resources.en = enResources;

i18n.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'vi',
    interpolation: {
        escapeValue: false,
        defaultVariables: { version: APP_VERSION },
    },
    react: {
        useSuspense: false, // Disable suspense to avoid loading states
    },
    partialBundledLanguages: true,
});

// 🎯 Inject critical translations directly into i18n store (guaranteed available)
if (criticalTranslations) {
    if (criticalTranslations.vi) {
        i18n.addResourceBundle('vi', 'translation', criticalTranslations.vi, true, true);
    }
    if (criticalTranslations.en) {
        i18n.addResourceBundle('en', 'translation', criticalTranslations.en, true, true);
    }
}

/**
 * Lazy load a resource bundle (full translations)
 */
export const loadLanguage = async (lng: string) => {
    if (!i18n.hasResourceBundle(lng, 'translation')) {
        try {
            const resources = await import(`./locales/${lng}.json`);
            // Critical translations already injected, just add missing keys
            i18n.addResourceBundle(lng, 'translation', resources.default, false, true);
        } catch (error) {
            console.error(`Failed to load language: ${lng}`, error);
        }
    }
};

// Initial load for fallback language and current language
if (defaultLanguage !== 'vi') {
    loadLanguage('vi'); // Always preload vi as fallback
}
loadLanguage(defaultLanguage);

/**
 * Custom change language function that ensures resource is loaded
 */
export const changeLanguage = async (lng: string) => {
    await loadLanguage(lng);
    await i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
};

// Sync document lang attribute
i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language || defaultLanguage;

// 🎯 Export promise for main.tsx to wait on (usually resolves <50ms)
export const i18nReady = new Promise<void>((resolve) => {
    if (i18n.isInitialized) {
        resolve();
    } else {
        i18n.on('initialized', resolve);
    }
});

export default i18n;
