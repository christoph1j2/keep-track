import { useState } from "react";
import {
  Select,
  MenuItem,
  TextField,
  Pagination,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { toast } from "react-hot-toast";
import { api } from "../../utils/api";
import { useConfirmStore } from "../../store/confirmStore";
import { useAuthStore } from "../../store/authStore";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import { useAdmin } from "../../layouts/AdminLayout";
import {
  Delete,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { UserDetailModal } from "../../components/Modals/UserDetailModal";

export const AdminUsersPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const { users, fetchUsers } = useAdmin();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [selectedUserIdForDetail, setSelectedUserIdForDetail] = useState<string | null>(null);
  const usersPerPage = 10;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * usersPerPage,
    page * usersPerPage
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        userId,
        newRole,
      });
      toast.success("User role updated");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role");
      console.error(error);
    }
  };

  const handleDeleteUser = (userId: string) => {
    showConfirm(
      "Delete User",
      "Are you sure you want to delete this user? This action cannot be undone and will delete all their data.",
      async () => {
        try {
          await api.delete(`/admin/users/${userId}`, {
            data: { userId },
          });
          toast.success("User deleted successfully");
          fetchUsers();
        } catch (error) {
          toast.error("Failed to delete user");
          console.error(error);
        }
      }
    );
  };

  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        color: isDark ? "#f8fafc" : "#0f172a",
        border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
        "& .MuiMenuItem-root": {
          color: isDark ? "#f8fafc" : "#0f172a",
          fontSize: "0.875rem",
          "&:hover": {
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          },
          "&.Mui-selected": {
            backgroundColor: isDark ? "rgba(99, 102, 241, 0.22)" : "rgba(99, 102, 241, 0.12)",
            "&:hover": {
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.18)",
            },
          },
        },
      },
    },
  };

  const selectSx = {
    height: 38,
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f8fafc" : "#0f172a",
    "& .MuiSelect-select": {
      py: 1,
      px: 1.5,
      fontSize: "0.875rem",
      fontWeight: 500,
      color: isDark ? "#f8fafc" : "#0f172a",
      WebkitTextFillColor: isDark ? "#f8fafc" : "#0f172a",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: isDark ? "#334155" : "#cbd5e1",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: isDark ? "#475569" : "#94a3b8",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#3b82f6",
    },
    "& .MuiSelect-icon": {
      color: isDark ? "#94a3b8" : "#64748b",
    },
    "&.Mui-disabled": {
      opacity: 0.65,
      backgroundColor: isDark ? "#0f172a" : "#f8fafc",
      "& .MuiSelect-select": {
        color: isDark ? "#94a3b8" : "#64748b",
        WebkitTextFillColor: isDark ? "#94a3b8" : "#64748b",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
      },
      "& .MuiSelect-icon": {
        color: isDark ? "#475569" : "#cbd5e1",
      },
    },
  };

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <PeopleIcon className="text-blue-600 dark:text-blue-400" />
            User Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search users, inspect activity statistics, update roles, and manage access.
          </p>
        </div>
      </div>

      {/* User Table & Filters Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length}</strong> user(s)
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <FormControl size="small" className="w-full sm:w-40">
              <InputLabel
                id="role-filter-label"
                sx={{ color: isDark ? "#94a3b8" : "#64748b", "&.Mui-focused": { color: "#3b82f6" } }}
              >
                Filter by Role
              </InputLabel>
              <Select
                labelId="role-filter-label"
                id="role-filter-select"
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => {
                  setRoleFilter(e.target.value as "ALL" | "USER" | "ADMIN");
                  setPage(1);
                }}
                MenuProps={menuProps}
                sx={selectSx}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="USER">USER</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-64"
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 38,
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  "& fieldset": { borderColor: isDark ? "#334155" : "#cbd5e1" },
                  "&:hover fieldset": { borderColor: isDark ? "#475569" : "#94a3b8" },
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
                "& .MuiInputBase-input": { color: isDark ? "#f8fafc" : "#0f172a" },
                "& .MuiInputLabel-root": {
                  color: isDark ? "#94a3b8" : "#64748b",
                  "&.Mui-focused": { color: "#3b82f6" },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: isDark ? "#94a3b8" : "#64748b",
                  opacity: 1,
                },
              }}
            />
          </div>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-4">
          {paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.username}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip title="Inspect User Details">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedUserIdForDetail(user.id)}
                      sx={{
                        color: isDark ? "#60a5fa" : "#2563eb",
                        "&:hover": {
                          backgroundColor: isDark ? "rgba(30, 58, 138, 0.4)" : "rgba(219, 234, 254, 0.7)",
                        },
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete User">
                    <IconButton
                      size="small"
                      disabled={user.id === currentUser?.id}
                      onClick={() => handleDeleteUser(user.id)}
                      sx={{
                        color: isDark ? "#f87171" : "#dc2626",
                        "&:hover": {
                          backgroundColor: isDark ? "rgba(136, 19, 55, 0.4)" : "rgba(254, 226, 226, 0.7)",
                        },
                        "&.Mui-disabled": {
                          color: isDark ? "#475569" : "#cbd5e1",
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <Select
                  value={user.role || "USER"}
                  size="small"
                  disabled={user.id === currentUser?.id}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  MenuProps={menuProps}
                  sx={selectSx}
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <th className="py-3 px-4 font-semibold text-sm">Email</th>
                <th className="py-3 px-4 font-semibold text-sm">Username</th>
                <th className="py-3 px-4 font-semibold text-sm">Joined Date</th>
                <th className="py-3 px-4 font-semibold text-sm w-36 text-slate-700 dark:text-slate-300">Role</th>
                <th className="py-3 px-4 font-semibold text-sm text-right w-28 text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-slate-800 dark:text-slate-200"
                >
                  <td className="py-3 px-4 text-sm">{user.email}</td>
                  <td className="py-3 px-4 text-sm font-medium">{user.username}</td>
                  <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={user.role || "USER"}
                      size="small"
                      disabled={user.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      MenuProps={menuProps}
                      sx={selectSx}
                    >
                      <MenuItem value="USER">USER</MenuItem>
                      <MenuItem value="ADMIN">ADMIN</MenuItem>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip title="Inspect User Details">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedUserIdForDetail(user.id)}
                          sx={{
                            color: isDark ? "#60a5fa" : "#2563eb",
                            "&:hover": {
                              backgroundColor: isDark ? "rgba(30, 58, 138, 0.4)" : "rgba(219, 234, 254, 0.7)",
                            },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          disabled={user.id === currentUser?.id}
                          onClick={() => handleDeleteUser(user.id)}
                          sx={{
                            color: isDark ? "#f87171" : "#dc2626",
                            "&:hover": {
                              backgroundColor: isDark ? "rgba(136, 19, 55, 0.4)" : "rgba(254, 226, 226, 0.7)",
                            },
                            "&.Mui-disabled": {
                              color: isDark ? "#475569" : "#cbd5e1",
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              sx={{
                ".dark &": {
                  "& .MuiPaginationItem-root": {
                    color: "rgb(241, 245, 249)",
                  },
                },
              }}
            />
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <UserDetailModal
        open={Boolean(selectedUserIdForDetail)}
        onClose={() => setSelectedUserIdForDetail(null)}
        userId={selectedUserIdForDetail}
      />
    </div>
  );
};
