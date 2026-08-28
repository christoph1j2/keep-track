import { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import { toast } from "react-hot-toast";
import { api } from "../utils/api";
import { useConfirmStore } from "../store/confirmStore";

import { useAuthStore } from "../store/authStore";
import { Delete } from "@mui/icons-material";

// Interface for User data fetched from the admin endpoint
interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export const AdminDashboard = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ userCount: 0, budgetCount: 0, transactionCount: 0, categoryCount: 0, templateCount: 0 }); 
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/stats"),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load admin data");
      console.error(error);
    }
  };

  // Fetch users and stats on component mount
  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Handle changing a user's role
   */
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        userId,
        newRole,
      });
      toast.success("User role updated");
      fetchData(); // Refresh list
    } catch (error) {
      toast.error("Failed to update user role");
      console.error(error);
    }
  };

  /**
   * Handle deleting a user with confirmation modal
   */
  const handleDeleteUser = (userId: string) => {
    showConfirm(
      "Delete User",
      "Are you sure you want to delete this user? This action cannot be undone and will delete all their data.",
      async () => {
        try {
          await api.delete(`/admin/users/${userId}`, {
            data: { userId }, // Included in body as per current API design
          });
          toast.success("User deleted successfully");
          fetchData(); // Refresh list
        } catch (error) {
          toast.error("Failed to delete user");
          console.error(error);
        }
      }
    );
  };

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      <h2 className="text-3xl font-bold mb-6">
        Admin Dashboard
      </h2>

      {/* Stats Overview */}
      <Grid container spacing={2} className="mb-6">
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Total Users
            </h3>
            <p className="text-3xl font-bold">
              {stats.userCount || 0}
            </p>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Total Transactions
            </h3>
            <p className="text-3xl font-bold">
              {stats.transactionCount || 0}
            </p>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                Total Categories
            </h3>
            <p className="text-3xl font-bold">
              {stats.categoryCount || 0}
            </p>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Template Count
            </h3>
            <p className="text-3xl font-bold">
              {stats.templateCount || 0}
            </p>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Active Budgets
            </h3>
            <p className="text-3xl font-bold">
              {stats.budgetCount || 0}
            </p>
          </div>
        </Grid>
        <Grid size={{ xs: 6, md: 6, lg: 4 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Complex Budgets
            </h3>
            <p className="text-3xl font-bold">
              {stats.complexBudgetCount || 0}
            </p>
          </div>
        </Grid>
      </Grid>

      {/* User Management Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xl font-bold mb-4">
          User Management
        </h3>
        <div className="block md:hidden space-y-4">
          {users.map((user) => (
            <div key={user.id} className="p-4 border border-slate-100 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-slate-800/30 transition-colors">
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate">{user.username}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                </div>
                <Button
                  color="error"
                  size="small"
                  disabled={user.id === currentUser?.id}
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Delete />
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <Select
                  value={user.role || "USER"}
                  size="small"
                  disabled={user.id === currentUser?.id}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="bg-white dark:bg-slate-800 dark:text-white"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--tw-prose-body)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                    },
                    '& .MuiSelect-icon': {
                      color: 'inherit',
                    }
                  }}
                >
                  <MenuItem value="USER">USER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Username</th>
                <th className="py-3 px-4 font-semibold">Joined</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={user.role || "USER"}
                      size="small"
                      disabled={user.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-white dark:bg-slate-800 dark:text-white"
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'var(--tw-prose-body)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                        },
                        '& .MuiSelect-icon': {
                          color: 'inherit',
                        }
                      }}
                    >
                      <MenuItem value="USER">USER</MenuItem>
                      <MenuItem value="ADMIN">ADMIN</MenuItem>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      color="error"
                      size="small"
                      disabled={user.id === currentUser?.id}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Delete />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};