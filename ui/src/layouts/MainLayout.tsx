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
import { useNotificationStore } from "../store/notificationStore";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";

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

  useEffect(() => {
    if (token && user) {
      // 1. Připojíme WebSockets
      connectSocket();

      // 2. Zeptáme se backendu, jestli náhodou nevisí v DB hotový import z minula
      const fetchPendingJob = async () => {
        try {
          const response = await api.get("/ai/import/pending");
          if (response.data) {
            // Frontend si to natáhne do storu (jakoby to zrovna přišlo ze socketu)
            useSocketStore.setState({
              importedDataReady: response.data.transactions,
              importJobId: response.data.jobId,
              isImportProcessing: false,
            });
          }
        } catch (error) {
          console.error("Nepodařilo se načíst čekající import", error);
        }
      };

      fetchPendingJob();
    } else {
      // Odpojíme při odhlášení
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [token, user, connectSocket, disconnectSocket]);

  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchTransactions();
      fetchBudgets();
      fetchTemplates();
      fetchNotifications();
    }
  }, [token, fetchCategories, fetchTransactions, fetchBudgets, fetchTemplates, fetchNotifications]);

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
    </>
  );
}

