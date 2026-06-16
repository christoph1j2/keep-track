import { useSettingsStore } from '../store/settingsStore';

export const formatCurrency = (amount: number) => {
    const { currency, language } = useSettingsStore.getState();
    
    // Zkusíme mapovat jazyk na lokaci ('cs' -> 'cs-CZ', 'en' -> 'en-US')
    const locale = language === 'cs' ? 'cs-CZ' : 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(amount);
};