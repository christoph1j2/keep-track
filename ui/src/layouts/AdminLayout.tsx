import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "../components/Base/AdminSidebar";
import { Topbar } from "../components/Base/Topbar";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { api } from "../utils/api";

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

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

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

// eslint-disable-next-line react-refresh/only-export-components
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
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.accessToken);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchUsers()]);
  };

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    fetchNotifications();

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
