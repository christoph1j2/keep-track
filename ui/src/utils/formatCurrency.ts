import { useSettingsStore } from '../store/settingsStore';

/**
 * Formats a number as a currency string based on the user's settings.
 * 
 * @param amount - The numeric value to format as currency.
 * @returns - A string representing the formatted currency value according to the user's selected currency and language settings.
 */
export const formatCurrency = (amount: number) => {
    const { currency, language } = useSettingsStore.getState();
    
    // Try to map language to locale ('cs' -> 'cs-CZ', 'en' -> 'en-US')
    const locale = language === 'cs' ? 'cs-CZ' : 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(amount);
};