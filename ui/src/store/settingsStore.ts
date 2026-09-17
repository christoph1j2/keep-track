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

  /**
   * Updates the user's interface language preference and persists it to localStorage.
   *
   * @param language - The selected language code ("cs" | "en").
   */
  setLanguage: (language: Language) => void;

  /**
   * Updates the base currency on the backend user profile and synchronizes local state and storage.
   *
   * @param currency - The selected currency code.
   */
  setCurrency: (currency: Currency) => Promise<void>;

  /**
   * Initializes or restores the currency in local state without triggering a backend API update
   * (e.g. during user profile load or state hydration).
   *
   * @param currency - The currency code to set in local state.
   */
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
 * @returns A Zustand store with SettingsState interface and persist middleware
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      /**
       * Initial language setting (English)
       */
      language: "en",
      /**
       * Initial currency setting (Euro)
       */
      currency: "EUR",

      /**
       * Updates the language preference and persists to localStorage.
       *
       * @param language - The new language code.
       */
      setLanguage: (language) => set({ language }),

      /**
       * Updates the currency preference on the backend and persists to localStorage.
       *
       * @param currency - The new currency code.
       */
      setCurrency: async (currency) => {
        await api.patch("users/me", { baseCurrency: currency });
        set({ currency });
      },

      /**
       * Initializes the currency in local state without making a network request.
       *
       * @param currency - The currency code to set.
       */
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
