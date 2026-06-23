import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store/settingsStore";
import { useConfirmStore } from "../store/confirmStore";
import { useTransactionStore } from "../store/transactionStore";
import toast from "react-hot-toast";

export function Settings() {
  const { t, i18n } = useTranslation();
  const { language, currency, setLanguage, setCurrency } = useSettingsStore();
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  const transactions = useTransactionStore((state) => state.transactions);
  const hasTransactions = transactions.length > 0;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as "cs" | "en";
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleCurrencyChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newCurr = e.target.value as "CZK" | "EUR" | "USD" | "PLN" | "ISK";

    try {
      await setCurrency(newCurr);
      toast.success(t("settings.currencyChanged"));
    } catch (error) {
      toast.error(t("common.error"));
      console.error("Error changing currency:", error);
    }
  };

  const handleFactoryReset = () => {
    //TODO: tady taky API v budoucnu
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-6 p-0 max-w-4xl mx-auto w-full">
      {/* Hlavička */}
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {t("settings.title", "Nastavení")}
        </h2>
      </div>

      {/* KARTA 1: Předvolby (Jazyk a Měna) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
          {t("settings.preferences", "Předvolby aplikace")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Výběr Jazyka */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="language"
              className="text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              {t("settings.language", "Jazyk aplikace")}
            </label>
            <select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="cs">Čeština (CZ)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>

          {/* Výběr Měny */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="currency"
              className="text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              {t("settings.currency", "Hlavní měna")}
            </label>
            <select
              id="currency"
              value={currency}
              onChange={handleCurrencyChange}
              disabled={hasTransactions} // Disable if there are transactions
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="PLN">PLN</option>
              <option value="ISK">ISK</option>
            </select>

            {hasTransactions && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {t(
                  "settings.currencyLocked",
                  "Základní měnu nelze změnit, protože již máte uložené transakce. Pro změnu měny byste museli smazat všechna data.",
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* KARTA 2: Nebezpečná zóna */}
      <section className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 transition-colors mt-4">
        <h3 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">
          {t("settings.dangerZone", "Nebezpečná zóna")}
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
          {t(
            "settings.dangerWarning",
            "Akce v této sekci jsou nevratné. Prosím, postupujte opatrně.",
          )}
        </p>

        <button
          onClick={() =>
            showConfirm(
              t("settings.factoryReset", "Smazat všechna data"),
              t(
                "settings.factoryResetConfirm",
                "Opravdu chcete vymazat veškerá data aplikace? Tato akce je nevratná a smaže všechny vaše transakce, rozpočty i nastavení.",
              ),
              handleFactoryReset,
            )
          }
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors"
        >
          {t("settings.factoryReset", "Smazat všechna data (Factory Reset)")}
        </button>
      </section>
    </div>
  );
}
