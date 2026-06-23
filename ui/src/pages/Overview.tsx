import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CategoryTree } from "../components/Overview/CategoryTree";
import { TransactionDataGrid } from "../components/Overview/TransactionDataGrid";
import { BaseModal } from "../components/Modals/BaseModal";
import { AddTransactionModal } from "../components/Modals/AddTransactionModal";
import { SplitTransactionModal } from "../components/Modals/SplitTransactionModal";
import { ImportModal } from "../components/Modals/ImportModal";
import { useTransactionStore } from "../store/transactionStore";
import { useCategoryStore } from "../store/categoryStore";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

/**
 * Overview page for browsing, filtering, and editing transactions.
 * This page coordinates category filtering, grid editing, and modal-driven create/split flows.
 */
export function Overview() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction } =
    useTransactionStore();
  const categories = useCategoryStore((state) => state.categories);
  const location = useLocation();
  const { t } = useTranslation();

  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);
  const [isSplitTransactionModalOpen, setIsSplitTransactionModalOpen] =
    useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<
    (typeof transactions)[0] | null
  >(null);

  // Get initial category from navigation state, otherwise null
  const initialCategoryId =
    (location.state as { selectedCategoryId: string } | null)
      ?.selectedCategoryId || null;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId,
  );

  // Filtrované transakce pro datagrid
  const filteredTransactions = selectedCategoryId
    ? transactions.filter((t) => {
        // VIRTUÁLNÍ FILTR: Zobrazení jen těch transakcí, které v DB mají categoryId = null
        if (selectedCategoryId === "unassigned") {
          return t.categoryId === null;
        }

        // STANDARDNÍ FILTR: Zobrazení podle vybrané kategorie
        const selected = categories.find((c) => c.id === selectedCategoryId);
        if (!selected) return false;

        // Pokud jde o hlavní kategorii, chceme vidět ji i všechny její podkategorie
        if (!selected.parentId) {
          const subcatIds = categories
            .filter((c) => c.parentId === selectedCategoryId)
            .map((c) => c.id);

          return (
            t.categoryId === selectedCategoryId ||
            (t.categoryId && subcatIds.includes(t.categoryId))
          );
        }

        // Pokud jde o podkategorii, chceme vidět jen tu
        return t.categoryId === selectedCategoryId;
      })
    : transactions;

  return (
    <div className="lg:h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 items-center text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
          {t("overview.title")}
        </h2>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium w-full md:w-fit"
            onClick={() => setIsImportModalOpen(true)}
          >
            {t("overview.importBank")}
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full md:w-fit"
            onClick={() => setIsAddTransactionModalOpen(true)}
          >
            {t("overview.newTransaction")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:flex-1 lg:min-h-0">
        {/** TREE VIEW, KATEGORIE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:col-span-1 flex flex-col dark:bg-slate-900 dark:border-slate-700 min-h-106 transition-colors dark:text-slate-300">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">
              {t("overview.categories")}
            </h3>

            {/* Navigace filtrů */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setSelectedCategoryId("unassigned")}
                className={`text-xs font-semibold ${selectedCategoryId === "unassigned" ? "text-slate-800 dark:text-slate-200 underline" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                {t("overview.unassigned", "Nezařazeno")}
              </button>

              {selectedCategoryId && (
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  {t("overview.clearFilter")}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <CategoryTree onSelectCategory={setSelectedCategoryId} />
          </div>
        </div>

        {/** DATA GRID */}
        <div className="bg-white rounded-2xl lg:shadow-sm border border-slate-100 p-0 lg:col-span-3 lg:flex lg:flex-col lg:overflow-hidden min-h-106 dark:bg-slate-900 dark:border-slate-700 transition-colors">
          <TransactionDataGrid
            transactions={filteredTransactions}
            // ZMĚNA: Přijímá updatedTransaction přímo z tabulky a je async
            onUpdateTransaction={async (updatedTransaction) => {
              await updateTransaction(updatedTransaction);
            }}
            onDeleteTransaction={async (id) => {
              try {
                await deleteTransaction(id);
                toast.success(t("transactions.deleted"));
              } catch (error) {
                toast.error(t("common.error"));
                console.error(error);
              }
            }}
            onSplitTransaction={(transaction) => {
              setSelectedTransaction(transaction);
              setIsSplitTransactionModalOpen(true);
            }}
          />
        </div>
      </div>

      <BaseModal
        title={t("overview.newTransaction2")}
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
      >
        <AddTransactionModal
          onCancel={() => setIsAddTransactionModalOpen(false)}
        />
      </BaseModal>

      <BaseModal
        title={t("overview.splitTransaction")}
        isOpen={isSplitTransactionModalOpen}
        onClose={() => setIsSplitTransactionModalOpen(false)}
      >
        {selectedTransaction && (
          <SplitTransactionModal
            transaction={selectedTransaction}
            onSubmit={async (titles, amounts, categoryIds, date) => {
              // ZMĚNA: Async zpracování rozdělení pro backend!
              try {
                // 1. Nejprve založíme nové transakce
                for (let i = 0; i < titles.length; i++) {
                  await addTransaction({
                    title: titles[i],
                    amount: amounts[i],
                    categoryId: categoryIds[i] || null, // Pošleme null místo ""
                    date: date,
                    originalAmount: amounts[i],
                    originalCurrency:
                      selectedTransaction.originalCurrency || "EUR",
                    isAiCategorized: false,
                  });
                }

                // 2. Až když se úspěšně vytvoří, smažeme tu původní velkou
                await deleteTransaction(selectedTransaction.id);

                toast.success(t("transactions.split"));
                setIsSplitTransactionModalOpen(false);
              } catch (error) {
                console.error("Error splitting transaction:", error);
                toast.error(t("common.error"));
              }
            }}
            onCancel={() => setIsSplitTransactionModalOpen(false)}
          />
        )}
      </BaseModal>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
