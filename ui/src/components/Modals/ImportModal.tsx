import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "./BaseModal";
import { parseBankCSV, type ParsedTransaction } from "../../utils/bankImport";
import { saveUserKeyword } from "../../utils/userKeywords";
import { UNCATEGORIZED_ID } from "../../constants/categoryConstants";
import { useCategoryStore } from "../../store/categoryStore";
import { useTransactionStore } from "../../store/transactionStore";
import { useConfirmStore } from "../../store/confirmStore";
import { formatCurrency } from "../../utils/formatCurrency";
import { useSettingsStore } from "../../store/settingsStore";
import { toast } from "react-hot-toast";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { transactions, addTransaction } = useTransactionStore();
  const categories = useCategoryStore((state) => state.categories);

  const { t } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const { language, currency } = useSettingsStore();
  const locale = language === "cs" ? "cs-CZ" : "en-US";

  // Abecedně seřazené kategorie pro select boxy
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Zpracování nahrání souboru
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      const data = await parseBankCSV(file, transactions, categories);
      setParsedData(data);
    } catch (err) {
      setError(t("import.parseError"));
      console.error(err);
    } finally {
      setIsParsing(false);
      // Vyresetujeme input, aby šel nahrát stejný soubor znovu
      event.target.value = "";
    }
  };

  // Uživatel ručně změní kategorii v tabulce
  // PROPAGUJ změnu na všechny řádky se stejným title
  const handleCategoryChange = (id: string, newCategoryId: string) => {
    setParsedData((prev) => {
      const changedItem = prev.find((t) => t.id === id);
      if (!changedItem) return prev;

      // Aktualizuj VŠECHNY řádky se stejným title
      return prev.map((t) =>
        t.title === changedItem.title ? { ...t, categoryId: newCategoryId } : t,
      );
    });
  };

  // Vytáhneme samotnou logiku ukládání ven, abychom ji mohli zavolat přímo, nebo po potvrzení v modalu
  const performSave = () => {
    const normalizedData = parsedData.map((t) =>
      t.categoryId === null ? { ...t, categoryId: UNCATEGORIZED_ID } : t,
    );

    normalizedData.forEach((t) => {
      addTransaction({
        title: t.title,
        amount: t.amount,
        date: t.date,
        categoryId: t.categoryId as string,
        originalAmount: t.amount,
        originalCurrency: currency,
        isAiCategorized: false,
      });

      if (t.categoryId !== UNCATEGORIZED_ID) {
        saveUserKeyword(t.title, t.categoryId as string);
      }
    });

    setParsedData([]);
    onClose();
  };

  // Uložení všech plateb do reálné databáze
  const handleSaveAll = () => {
    const uncategorizedCount = parsedData.filter(
      (t) => t.categoryId === null,
    ).length;

    toast.success(t("import.saving")); // Okamžitá zpětná vazba, že se něco děje

    if (uncategorizedCount > 0) {
      // Použití globálního confirm modalu
      showConfirm(
        t("common.warning"),
        t("import.uncategorizedWarning", { count: uncategorizedCount }),
        performSave,
      );
    } else {
      // Vše je přiřazeno, můžeme rovnou uložit
      performSave();
    }
  };

  return (
    <BaseModal title={t("import.title")} isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* 1. Fáze: Nahrání souboru */}
        {parsedData.length === 0 && (
          <>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isParsing}
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-indigo-500/20 dark:file:text-indigo-200 dark:hover:file:bg-indigo-500/30"
              />
              {isParsing && (
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  {t("import.processing")}
                </p>
              )}
              {error && (
                <p className="mt-2 text-red-500 dark:text-red-400">{error}</p>
              )}
            </div>
            <div className="mt-6 text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-indigo-500/10 p-4 rounded-xl text-left shadow-sm">
              <strong>{t("import.helpPrefix")}</strong> {t("import.helpText")}
            </div>
          </>
        )}

        {/* 2. Fáze: Náhled a oprava kategorií */}
        {parsedData.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="bg-yellow-50 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-200 p-3 rounded-lg text-sm font-medium">
              {t("import.summary", { count: parsedData.length })}
            </div>

            <div className="max-h-100 overflow-y-auto border border-slate-200 dark:border-slate-700/50 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 shadow-sm">
                  <tr>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {t("import.columns.date")}
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {t("import.columns.title")}
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 text-right">
                      {t("import.columns.amount")}
                    </th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {t("import.columns.category")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.map((tItem) => (
                    <tr
                      key={tItem.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/70"
                    >
                      <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(tItem.date).toLocaleDateString(locale)}
                      </td>
                      <td
                        className="p-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-37.5"
                        title={tItem.title}
                      >
                        {tItem.title}
                      </td>
                      <td
                        className={`p-3 text-right font-semibold whitespace-nowrap ${tItem.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}
                      >
                        {formatCurrency(tItem.amount)}
                      </td>
                      <td className="p-3">
                        <select
                          value={tItem.categoryId || ""}
                          onChange={(e) =>
                            handleCategoryChange(tItem.id, e.target.value)
                          }
                          className={`w-full p-1 border rounded text-sm ${!tItem.categoryId ? "border-red-400 bg-red-50 dark:bg-red-500/10 dark:text-red-200" : "border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"}`}
                        >
                          <option value="" disabled>
                            {t("import.selectCategory")}
                          </option>
                          {sortedCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setParsedData([])}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                {t("import.saveButton", { count: parsedData.length })}
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
