/**
 * Store for managing application-wide settings such as language and currency.
 * Settings are persisted to localStorage using Zustand's persist middleware.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Available language codes for the application interface.
 */
type Language = 'cs' | 'en';

/**
 * Available currency codes for displaying and managing financial amounts.
 */
type Currency = 'CZK' | 'EUR' | 'ISK' | 'PLN' | 'USD' | 'GBP';

/**
 * State interface for the settings store.
 * Manages language and currency preferences with persistence support.
 */
interface SettingsState {
    /**
     * Current language preference for the application interface.
     * @default 'cs'
     */
    language: Language;

    /**
     * Current currency preference for displaying financial amounts.
     * @default 'CZK'
     */
    currency: Currency;

    /**
     * Sets the application's language preference.
     * @param language - The language code to set ('cs' or 'en')
     */
    setLanguage: (language: Language) => void;

    /**
     * Sets the application's currency preference.
     * @param currency - The currency code to set ('CZK', 'EUR', 'ISK', 'PLN', 'USD', or 'GBP')
     */
    setCurrency: (currency: Currency) => void;
}

/**
 * Creates a Zustand store for application settings with localStorage persistence.
 *
 * The store provides:
 * - Language selection (Czech or English)
 * - Currency selection (CZK, EUR, ISK, PLN, USD, GBP)
 * - Automatic persistence to localStorage under key 'keep-track-settings'
 *
 * @template T - The type of the store state (extends SettingsState)
 * @returns A Zustand store with SettingsState interface and persist middleware
 */
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            /**
             * Initial language setting (Czech)
             */
            language: 'cs',
            /**
             * Initial currency setting (Czech Koruna)
             */
            currency: 'CZK',
            /**
             * Updates the language preference and persists to localStorage.
             * @param language - The new language code
             */
            setLanguage: (language) => set({ language }),
            /**
             * Updates the currency preference and persists to localStorage.
             * @param currency - The new currency code
             */
            setCurrency: (currency) => set({ currency }),
        }),
        {
            /**
             * Key used in localStorage to persist the settings.
             */
            name: 'keep-track-settings' // název pro localStorage
        }
    )
);