import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@mui/material";
import { useSettingsStore } from "../store/settingsStore";
import { api } from "../utils/api";
import ReactCountryFlag from "react-country-flag";

export function ExchangeRates() {
  const { t } = useTranslation();
  const { currency } = useSettingsStore();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [inverseRates, setInverseRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/exchange-rate?base=${currency}`, { signal: controller.signal });
        setRates(response.data);

        // Fetch inverse rates
        const supportedCurrencies = ["CZK", "EUR", "ISK", "PLN", "USD", "GBP"].filter(c => c !== currency);
        const invRates: Record<string, number> = {};
        
        await Promise.all(
          supportedCurrencies.map(async (c) => {
             try {
               const res = await api.get(`/exchange-rate?base=${c}`, { signal: controller.signal });
               invRates[c] = res.data[currency];
             } catch (e: any) {
               if (e.name !== "CanceledError") {
                 console.error(`Failed to fetch inverse rate for ${c}`, e);
               }
             }
          })
        );
        
        setInverseRates(invRates);
      } catch (err: any) {
        if (err.name !== "CanceledError") {
          console.error("Failed to fetch exchange rates", err);
          setError(t("exchangeRates.fetchError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    fetchRates();
    return () => controller.abort();
  }, [currency, t]);

  const getCountryCode = (currencyCode: string) => {
    if (currencyCode === "EUR") return "EU";
    if (currencyCode === "USD") return "US";
    if (currencyCode === "GBP") return "GB";
    if (currencyCode === "CZK") return "CZ";
    if (currencyCode === "PLN") return "PL";
    if (currencyCode === "ISK") return "IS";
    return currencyCode.substring(0, 2);
  };

  return (
    <div className="p-2 h-full flex flex-col">
      <div className="mb-6 flex flex-col items-center text-center md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
          {t("exchangeRates.title")}
        </h2>
        <div className="text-slate-500 dark:text-slate-400 font-medium">
          {t("exchangeRates.baseCurrency")} <strong className="text-slate-800 dark:text-slate-200">{currency}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rectangular"
              height={100}
              className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700!"
            />
          ))
        ) : error ? (
          <div className="col-span-full p-8 text-center text-red-500 bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            {error}
          </div>
        ) : (
          ["CZK", "EUR", "ISK", "PLN", "USD", "GBP"]
            .filter((c) => c !== currency)
            .map((curr) => (
              <div
                key={curr}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 dark:bg-slate-800 dark:border-slate-700 transition-colors hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 overflow-hidden border border-slate-100 dark:border-slate-600">
                    <ReactCountryFlag
                      countryCode={getCountryCode(curr)}
                      svg
                      style={{
                        width: "1.8em",
                        height: "1.8em",
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      {curr}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {t("exchangeRates.exchangeRateLabel")}
                    </span>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-auto border-b border-slate-100 dark:border-slate-700/50 pb-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    1 {currency} =
                  </div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {rates[curr] ? rates[curr].toFixed(4) : "—"} <span className="text-sm text-slate-500 dark:text-slate-400">{curr}</span>
                  </div>
                </div>
                <div className="flex items-end justify-between pt-1">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    1 {curr} =
                  </div>
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {inverseRates[curr] ? inverseRates[curr].toFixed(4) : "—"} <span className="text-sm text-slate-500 dark:text-slate-400">{currency}</span>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
