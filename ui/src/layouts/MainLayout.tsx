import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "../components/Base/Sidebar";
import { Topbar } from "../components/Base/Topbar";
import { useCategoryStore } from "../store/categoryStore";
import { useTransactionStore } from "../store/transactionStore";
import { useAuthStore } from "../store/authStore";
import { useBudgetStore } from "../store/budgetStore";
import { useTemplateStore } from "../store/quickAddTemplateStore";
import { useSocketStore } from "../store/socketStore";
import { ReviewImportModal } from "../components/Modals/ReviewImportModal";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Shared app shell with sidebar navigation, top bar, and page content area.
 * The layout keeps navigation stable while allowing the main section to scroll.
 *
 * @param props.children Active page content.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const fetchTransactions = useTransactionStore(
    (state) => state.fetchTransactions,
  );
  const fetchBudgets = useBudgetStore((state) => state.fetchBudgets);
  const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);

  const connectSocket = useSocketStore((state) => state.connectSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);
  const isImportProcessing = useSocketStore((state) => state.isImportProcessing);
  const importedDataReady = useSocketStore((state) => state.importedDataReady);
  const clearImportedData = useSocketStore((state) => state.clearImportedData);

  useEffect(() => {
    if (token && user?.id) {
      connectSocket(user.id);
    } else {
      disconnectSocket();
    }
  }, [token, user, connectSocket, disconnectSocket]);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchTransactions();
      fetchBudgets();
      fetchTemplates();
    }
  }, [token, fetchCategories, fetchTransactions, fetchBudgets, fetchTemplates]);

  return (
    <>
      <div className="flex h-screen bg-slate-50 flex-col md:flex-row dark:bg-slate-800 transition-colors">
        {/* side panel */}
        <Sidebar />

        <div className="flex-1 flex flex-col w-full overflow-y-auto">
          {/* top bar */}
          <Topbar />

          {/* main content */}
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>

      {/* Floating glassmorphic AI processing indicator */}
      {isImportProcessing && (
        <div className="fixed bottom-4 left-4 bg-indigo-600/90 dark:bg-indigo-950/90 backdrop-blur-md text-white border border-indigo-500/30 px-4 py-3 rounded-2xl animate-pulse shadow-2xl z-9999 flex items-center gap-3">
          <CircularProgress size={18} color="inherit" thickness={5} />
          <span className="text-sm font-medium tracking-wide">
            {t("import.aiAnalyzing", "AI analyzuje transakce...")}
          </span>
        </div>
      )}

      {/* Review import modal opens automatically when WS delivers results */}
      <ReviewImportModal
        key={importedDataReady ? "review-active" : "review-inactive"}
        isOpen={!!importedDataReady}
        data={importedDataReady}
        onClose={() => clearImportedData()}
      />
    </>
  );
}
