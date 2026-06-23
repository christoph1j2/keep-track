/**
 * Store for managing application-wide settings such as language and currency.
 * Settings are persisted to localStorage using Zustand's persist middleware.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../utils/api";

/**
 * Available language codes for the application interface.
 */
type Language = "cs" | "en";

/**
 * Available currency codes for displaying and managing financial amounts.
 */
type Currency = "CZK" | "EUR" | "ISK" | "PLN" | "USD" | "GBP";

/**
 * State interface for the settings store.
 * Manages language and currency preferences with persistence support.
 */
interface SettingsState {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;

  setCurrency: (currency: Currency) => Promise<void>;
  initCurrency: (currency: Currency) => void;
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
      language: "en",
      /**
       * Initial currency setting (Czech Koruna)
       */
      currency: "EUR",
      /**
       * Updates the language preference and persists to localStorage.
       * @param language - The new language code
       */
      setLanguage: (language) => set({ language }),
      /**
       * Updates the currency preference and persists to localStorage.
       * @param currency - The new currency code
       */
      setCurrency: async (currency) => {
        await api.patch("users/me", { baseCurrency: currency });
        set({ currency });
      },

      initCurrency: (currency) => set({ currency }),
    }),
    {
      /**
       * Key used in localStorage to persist the settings.
       */
      name: "keep-track-settings", // název pro localStorage
    },
  ),
);
