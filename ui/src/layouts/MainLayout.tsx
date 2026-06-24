import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "../components/Base/Sidebar";
import { Topbar } from "../components/Base/Topbar";
import { useCategoryStore } from "../store/categoryStore";
import { useTransactionStore } from "../store/transactionStore";
import { useAuthStore } from "../store/authStore";
import { useBudgetStore } from "../store/budgetStore";

/**
 * Shared app shell with sidebar navigation, top bar, and page content area.
 * The layout keeps navigation stable while allowing the main section to scroll.
 *
 * @param props.children Active page content.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.accessToken);

  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const fetchTransactions = useTransactionStore(
    (state) => state.fetchTransactions,
  );
  const fetchBudgets = useBudgetStore((state) => state.fetchBudgets);

  useEffect(() => {
    if (token) {
      fetchCategories();
      fetchTransactions();
      fetchBudgets();
    }
  }, [token, fetchCategories, fetchTransactions, fetchBudgets]);

  return (
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
  );
}
