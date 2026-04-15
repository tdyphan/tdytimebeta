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

/**
 * Lazy load a resource bundle (full translations)
 */
export const loadLanguage = async (lng: string) => {
    if (!i18n.hasResourceBundle(lng, 'translation')) {
        try {
            const resources = await import(`./locales/${lng}.json`);

            // 🎯 Deep merge: critical translations take priority
            const critical = criticalTranslations?.[lng];
            const fullTranslations = resources.default;
            
            if (critical) {
                // Deep merge: preserve critical keys over full translations
                const deepMerge = (target: Record<string, any>, source: Record<string, any>): Record<string, any> => {
                    const result = { ...target };
                    for (const key of Object.keys(source)) {
                        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                            result[key] = deepMerge(result[key] || {}, source[key]);
                        } else if (critical[key] !== undefined) {
                            // Critical key exists: keep it
                            result[key] = critical[key];
                        } else {
                            result[key] = source[key];
                        }
                    }
                    return result;
                };
                i18n.addResourceBundle(lng, 'translation', deepMerge(fullTranslations, critical), true, true);
            } else {
                i18n.addResourceBundle(lng, 'translation', fullTranslations, true, true);
            }
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
