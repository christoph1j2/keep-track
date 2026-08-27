import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import { toast } from "react-hot-toast";
import { api } from "../utils/api";
import { useConfirmStore } from "../store/confirmStore";

// Interface for User data fetched from the admin endpoint
interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeBudgets: 0 }); // update with actual stat fields if different
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  // Fetch users and stats on component mount
  useEffect(() => {
    fetchData();
  }, []);

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
    <div className="p-6 space-y-6">
      <Typography variant="h4" className="text-gray-800 dark:text-white font-bold mb-6">
        Admin Dashboard
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={4} className="mb-6">
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">{stats.totalUsers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Budgets
              </Typography>
              <Typography variant="h4">{stats.activeBudgets || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Management Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-4">
            User Management
          </Typography>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || "USER"}
                        size="small"
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                      >
                        <MenuItem value="USER">USER</MenuItem>
                        <MenuItem value="ADMIN">ADMIN</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};