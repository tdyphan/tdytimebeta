/**
 * i18n Configuration — TdyTime v2
 * Critical translations embedded directly for instant availability.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_VERSION } from '@/core/constants';

// 🎯 Critical translations embedded directly (no window dependency)
const CRITICAL_TRANSLATIONS: Record<string, Record<string, string>> = {
    vi: {
        'app.title': 'TdyTime {{version}}',
        'app.tagline': 'Your Today, Your Time',
        'app.uploadTitle': 'Tải tệp lịch',
        'app.uploadDesc': 'Hỗ trợ .html hoặc .json',
        'app.pasteTitle': 'Dán mã HTML',
        'app.pasteDesc': 'Dán trực tiếp từ trang web',
        'app.demoMode': 'Chế độ demo',
        'common.copyright': '© 2026 TdyTime | Google AI Studio',
        'common.loading': 'Đang tải...',
        'common.processing': 'Đang xử lý dữ liệu...',
        'common.appName': 'TdyTime',
    },
    en: {
        'app.title': 'TdyTime {{version}}',
        'app.tagline': 'Your Today, Your Time',
        'app.uploadTitle': 'Upload Schedule',
        'app.uploadDesc': 'Supports .html or .json',
        'app.pasteTitle': 'Paste HTML',
        'app.pasteDesc': 'Paste directly from portal',
        'app.demoMode': 'Demo Mode',
        'common.copyright': '© 2026 TdyTime | Google AI Studio',
        'common.loading': 'Loading...',
        'common.processing': 'Processing data...',
        'common.appName': 'TdyTime',
    },
};

// Detect saved language preference
let defaultLanguage = 'vi';
try {
    defaultLanguage = localStorage.getItem('language') || 'vi';
} catch {
    console.warn('LocalStorage not accessible, falling back to "vi"');
}

// 🎯 Build initial resources with critical translations
const resources: Record<string, { translation: Record<string, any> }> = {
    vi: { translation: CRITICAL_TRANSLATIONS.vi },
    en: { translation: CRITICAL_TRANSLATIONS.en },
};

i18n.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'vi',
    interpolation: {
        escapeValue: false,
        defaultVariables: { version: APP_VERSION },
    },
    react: {
        useSuspense: false,
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
            // false = don't deep overwrite, preserves critical translations
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
