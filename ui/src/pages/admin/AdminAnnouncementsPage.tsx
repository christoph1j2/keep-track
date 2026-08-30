import { useState } from "react";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-hot-toast";
import { api } from "../../utils/api";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import { useAdmin } from "../../layouts/AdminLayout";
import { Campaign as CampaignIcon } from "@mui/icons-material";

export const AdminAnnouncementsPage = () => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const { users } = useAdmin();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [targetUserId, setTargetUserId] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Announcement title is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim() || undefined,
        type,
        targetUserIds: targetUserId === "ALL" ? undefined : [targetUserId],
      };

      const res = await api.post("/admin/broadcast-notification", payload);
      toast.success(
        `Announcement broadcasted successfully (${res.data.count} notification(s) delivered)`
      );
      setTitle("");
      setMessage("");
      setType("INFO");
      setTargetUserId("ALL");
    } catch (error) {
      toast.error("Failed to broadcast announcement");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
          },
        },
      },
    },
  };

  const selectSx = {
    height: 42,
    backgroundColor: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f8fafc" : "#0f172a",
    "& .MuiSelect-select": {
      py: 1.25,
      px: 2,
      fontSize: "0.875rem",
      fontWeight: 500,
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
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#f8fafc" : "#0f172a",
      "& fieldset": {
        borderColor: isDark ? "#334155" : "#cbd5e1",
      },
      "&:hover fieldset": {
        borderColor: isDark ? "#475569" : "#94a3b8",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3b82f6",
      },
    },
    "& .MuiInputBase-input": {
      color: isDark ? "#f8fafc" : "#0f172a",
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "#94a3b8" : "#64748b",
      "&.Mui-focused": {
        color: "#3b82f6",
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: isDark ? "#94a3b8" : "#64748b",
      opacity: 1,
    },
  };

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CampaignIcon className="text-blue-600 dark:text-blue-400" />
            Broadcast System Announcements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Send platform announcements, maintenance warnings, or feature updates directly to users' notification centers.
          </p>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xl font-bold border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 text-slate-900 dark:text-slate-100">
            Compose New Announcement
          </h3>

          <div className="space-y-6">
            <div>
              <TextField
                label="Announcement Title"
                fullWidth
                required
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Scheduled System Maintenance / New Feature Release"
                sx={textFieldSx}
              />
            </div>

            <div>
              <TextField
                label="Message Details (Optional)"
                fullWidth
                multiline
                rows={4}
                size="small"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide additional context or instructions for users..."
                sx={textFieldSx}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <FormControl size="small" fullWidth>
                <InputLabel
                  id="page-type-label"
                  sx={{ color: isDark ? "#94a3b8" : "#64748b", "&.Mui-focused": { color: "#3b82f6" } }}
                >
                  Notification Type
                </InputLabel>
                <Select
                  labelId="page-type-label"
                  id="page-type-select"
                  value={type}
                  label="Notification Type"
                  onChange={(e) => setType(e.target.value)}
                  MenuProps={menuProps}
                  sx={selectSx}
                >
                  <MenuItem value="INFO">Information</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance Alert</MenuItem>
                  <MenuItem value="FEATURE">Feature Update</MenuItem>
                  <MenuItem value="ALERT">Warning / Alert</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel
                  id="page-audience-label"
                  sx={{ color: isDark ? "#94a3b8" : "#64748b", "&.Mui-focused": { color: "#3b82f6" } }}
                >
                  Target Audience
                </InputLabel>
                <Select
                  labelId="page-audience-label"
                  id="page-audience-select"
                  value={targetUserId}
                  label="Target Audience"
                  onChange={(e) => setTargetUserId(e.target.value)}
                  MenuProps={menuProps}
                  sx={selectSx}
                >
                  <MenuItem value="ALL">All Active Users</MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<CampaignIcon />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5"
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : "Broadcast Announcement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
