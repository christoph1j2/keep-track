import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "./BaseModal";
import { useCategoryStore } from "../../store/categoryStore";
import { useTransactionStore } from "../../store/transactionStore";
import { useConfirmStore } from "../../store/confirmStore";
import { formatCurrency } from "../../utils/formatCurrency";
import { useSettingsStore } from "../../store/settingsStore";
import { toast } from "react-hot-toast";
import { AutoAwesome } from "@mui/icons-material";
import { useSocketStore } from "../../store/socketStore";
import { useNotificationStore } from "../../store/notificationStore";
import { api } from "../../utils/api";
import { type Transaction } from "../../types/transaction";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { t } = useTranslation();
  const categories = useCategoryStore((state) => state.categories);
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const { language } = useSettingsStore();
  const locale = language === "cs" ? "cs-CZ" : "en-US";

  // Načteme data a job ID ze storu
  const { importedDataReady, importJobId, clearImportedData } = useSocketStore();
  const [parsedData, setParsedData] = useState<any[]>(() => importedDataReady || []);

  useEffect(() => {
    if (importedDataReady) {
      setParsedData(importedDataReady);
    }
  }, [importedDataReady]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const handleCategoryChange = (id: string, newCategoryId: string) => {
    setParsedData((prev) => {
      const changedItem = prev.find((t) => t.id === id);
      if (!changedItem) return prev;

      return prev.map((t) =>
        t.title === changedItem.title
          ? { ...t, categoryId: newCategoryId, isAiCategorized: false }
          : t,
      );
    });
  };

  const performSave = async () => {
    const normalizedData = parsedData.map((tItem) => ({
      title: tItem.title,
      date: tItem.date,
      amount: tItem.amount,
      categoryId: tItem.categoryId === "" ? undefined : tItem.categoryId,
      originalAmount: tItem.originalAmount,
      originalCurrency: tItem.originalCurrency,
      isAiCategorized: tItem.isAiCategorized,
    }));

    try {
      await useTransactionStore
        .getState()
        .addTransactionsBatch(
          normalizedData as unknown as Omit<
            Transaction,
            "id" | "userId" | "createdAt" | "updatedAt" | "category"
          >[],
        );

      toast.success(t("import.saved", "Transakce byly úspěšně uloženy!"));

      // Vyčištění DB na backendu
      if (importJobId) {
        try {
          await api.delete(`/ai/import/${importJobId}`);
          
          // Vymazání notifikace po úspěšném uložení
          const { notifications, removeNotification } = useNotificationStore.getState();
          const targetNotification = notifications.find(
            (n) => n.type === "IMPORT_READY" && n.metadata?.jobId === importJobId
          );
          if (targetNotification) {
            await removeNotification(targetNotification.id);
          }
        } catch (err) {
          console.error("Nepodařilo se smazat import job", err);
        }
      }

      // Vyčištění storu a zavření
      clearImportedData();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t("common.error"));
    }
  };

  const handleSaveAll = () => {
    const uncategorizedCount = parsedData.filter(
      (tItem) => tItem.categoryId === null || tItem.categoryId === "",
    ).length;

    if (uncategorizedCount > 0) {
      showConfirm(
        t("common.warning"),
        t("import.uncategorizedWarning", { count: uncategorizedCount }),
        performSave,
      );
    } else {
      performSave();
    }
  };

  return (
    <BaseModal title={t("import.title")} isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {parsedData.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-blue-50 text-blue-800 dark:bg-indigo-500/10 dark:text-indigo-200 p-3 rounded-lg text-sm font-medium">
              <span>{t("import.summary", { count: parsedData.length })}</span>
              <span className="text-xs opacity-80">{t("import.summaryAi")}</span>
            </div>

            <div className="max-h-100 overflow-y-auto border border-slate-200 dark:border-slate-700/50 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">{t("import.columns.date")}</th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">{t("import.columns.title")}</th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300 text-right">{t("import.columns.amount")}</th>
                    <th className="p-3 font-semibold text-slate-700 dark:text-slate-300">{t("import.columns.category")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.map((tItem) => (
                    <tr key={tItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                      <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(tItem.date).toLocaleDateString(locale)}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-37.5" title={tItem.title}>
                        {tItem.title}
                      </td>
                      <td className={`p-3 text-right font-semibold whitespace-nowrap ${tItem.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}>
                        {formatCurrency(tItem.amount)}
                      </td>
                      <td className="p-3 relative min-w-45">
                        <select
                          value={tItem.categoryId || ""}
                          onChange={(e) => handleCategoryChange(tItem.id, e.target.value)}
                          className={`w-full p-2 pr-8 border rounded text-sm transition-colors ${
                            !tItem.categoryId
                              ? "border-red-400 bg-red-50 dark:bg-red-500/10 dark:text-red-200 focus:border-red-500"
                              : tItem.isAiCategorized
                                ? "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-500/30 dark:bg-purple-900/20 dark:text-purple-200 focus:border-purple-500"
                                : "border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500"
                          }`}
                        >
                          <option value="">{t("import.selectCategory")}</option>
                          {sortedCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                        {tItem.isAiCategorized && (
                          <span title={t("import.summaryAi")} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none drop-shadow-sm text-purple-600 dark:text-purple-400">
                            <AutoAwesome sx={{ fontSize: 16 }} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors cursor-pointer">
                {t("common.cancel")}
              </button>
              <button onClick={handleSaveAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors cursor-pointer">
                {t("import.saveButton", { count: parsedData.length })}
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
