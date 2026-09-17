import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "../components/Base/AdminSidebar";
import { Topbar } from "../components/Base/Topbar";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { api } from "../utils/api";

/**
 * Interface representing the statistics available in the Admin dashboard.
 */
export interface AdminStats {
  userCount: number;
  transactionCount: number;
  categoryCount: number;
  templateCount: number;
  budgetCount: number;
  complexBudgetCount: number;
  aiCategorizedCount: number;
  aiCategorizationRate: number;
  newUsersLast30Days: number;
  transactionsLast30Days: number;
  importJobStats: {
    PROCESSING: number;
    READY_FOR_REVIEW: number;
    FAILED: number;
    COMPLETED: number;
    total: number;
  };
}

/**
 * Interface representing a user in the Admin dashboard.
 */
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

/**
 * Context type for the AdminContext, providing statistics, user data, loading states, and functions to fetch and refresh data.
 */
interface AdminContextType {
  stats: AdminStats | null;
  users: AdminUser[];
  loadingStats: boolean;
  loadingUsers: boolean;
  fetchStats: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

/**
 * Custom hook to access the AdminContext.
 * 
 * @returns - The current value of the AdminContext, which includes statistics, user data, loading states, and functions to fetch and refresh data.
 */
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminLayout Provider");
  }
  return context;
}

/**
 * Dedicated Admin layout shell with AdminSidebar navigation, top bar,
 * and centralized Admin data fetching context.
 * 
 * @param param0 - An object containing the children components that will be rendered within the main content area of the Admin layout.
 * @returns - A React component that provides a consistent Admin layout for the application, including an AdminSidebar, top bar, and main content area, along with centralized data fetching and state management for Admin-related data.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  // Zustand stores for global state management
  const token = useAuthStore((state) => state.accessToken); // Get the access token from the auth store to determine if the user is logged in
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications); // Fetch notifications when the user is logged in

  // State management for Admin statistics and user data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch Admin statistics from the backend API
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Admin user data from the backend API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load admin users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Refresh all Admin data (statistics and users) concurrently
  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchUsers()]);
  };

  // Effect to fetch Admin data when the user is logged in or when the window gains focus
  useEffect(() => {
    if (!token) return;

    let isMounted = true; // Flag to prevent state updates on unmounted component
    fetchNotifications();

    // Load initial Admin data (statistics and users) concurrently
    const loadInitialData = async () => {
      setLoadingStats(true);
      setLoadingUsers(true);
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
        ]);
        if (isMounted) {
          setStats(statsRes.data);
          setUsers(usersRes.data);
        }
      } catch (err) {
        console.error("Failed to load admin layout data", err);
      } finally {
        if (isMounted) {
          setLoadingStats(false);
          setLoadingUsers(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [token, fetchNotifications]);

  return (
    <AdminContext.Provider
      value={{
        stats,
        users,
        loadingStats,
        loadingUsers,
        fetchStats,
        fetchUsers,
        refreshAll,
      }}
    >
      <div className="flex h-dvh bg-slate-50 flex-col md:flex-row dark:bg-slate-800 transition-colors">
        {/* Dedicated Admin Side Panel */}
        <AdminSidebar />

        <div className="flex-1 flex flex-col w-full overflow-y-auto">
          {/* Top bar */}
          <Topbar />

          {/* Main Admin Content */}
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
