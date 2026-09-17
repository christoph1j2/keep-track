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

/**
 * Shared app shell with sidebar navigation, top bar, and page content area.
 * The layout keeps navigation stable while allowing the main section to scroll.
 *
 * @param param0 - An object containing the children components that will be rendered within the main content area of the layout.
 * @returns - A React component that provides a consistent layout for the application, including a sidebar, top bar, and main content area.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  // Zustand stores for global state management
  const token = useAuthStore((state) => state.accessToken); // Get the access token from the auth store to determine if the user is logged in
  const user = useAuthStore((state) => state.user); // Get the user from the auth store

  // Fetch functions from Zustand stores for categories, transactions, budgets, complex budgets, templates, and notifications
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const fetchTransactions = useTransactionStore(
    (state) => state.fetchTransactions,
  );
  const fetchBudgets = useBudgetStore((state) => state.fetchBudgets);
  const fetchComplexBudget = useBudgetStore((state) => state.fetchComplexBudget);
  const fetchTemplates = useTemplateStore((state) => state.fetchTemplates);

  // Socket connection management
  const connectSocket = useSocketStore((state) => state.connectSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  // Effect to manage WebSocket connection based on user authentication state
  useEffect(() => {
    if (token && user) {
      // 1. Connect to the WebSocket server when the user is logged in
      connectSocket();

      // 2. Fetch any pending jobs for the user when the component mounts or when the user logs in
      useSocketStore.getState().fetchPendingJob();
    } else {
      // Disconnect from the WebSocket server when the user logs out or when there is no valid token
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [token, user, connectSocket, disconnectSocket]);

  // Fetch notifications when the user is logged in
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  // Effect to refetch all relevant data when the user logs in or when the window gains focus
  useEffect(() => {
    if (!token) return;

    const refetchAll = () => {
      fetchCategories();
      fetchTransactions();
      fetchBudgets();
      fetchComplexBudget();
      fetchTemplates();
      fetchNotifications();
    };

    refetchAll();

    const handleFocus = () => {
      if (document.visibilityState === "visible") { // Refetch data when the window gains focus
        refetchAll();
        useSocketStore.getState().fetchPendingJob();
      }
    };

    window.addEventListener("focus", handleFocus); 
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [token, fetchCategories, fetchTransactions, fetchBudgets, fetchComplexBudget, fetchTemplates, fetchNotifications]);

  return (
    <>
      <div className="flex h-dvh bg-slate-50 flex-col md:flex-row dark:bg-slate-800 transition-colors">
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

