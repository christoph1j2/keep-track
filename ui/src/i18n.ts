import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { useSettingsStore } from "./store/settingsStore";

import csTranslations from "./locales/cs/translation.json";
import enTranslations from "./locales/en/translation.json";

const resources = {
    cs: { translation: csTranslations },
    en: { translation: enTranslations },
}

const savedLanguage = useSettingsStore.getState().language;

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false, // React již má vlastní ochranu proti XSS
        }
    });

export default i18n;