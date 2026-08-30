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
import CampaignIcon from "@mui/icons-material/Campaign";
import { BaseModal } from "./BaseModal";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";

interface AdminUserSummary {
  id: string;
  username: string;
  email: string;
}

interface BroadcastAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  users: AdminUserSummary[];
}

export function BroadcastAnnouncementModal({
  open,
  onClose,
  users,
}: BroadcastAnnouncementModalProps) {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

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
      toast.success(`Announcement sent successfully (${res.data.count} notification(s) delivered)`);
      setTitle("");
      setMessage("");
      setType("INFO");
      setTargetUserId("ALL");
      onClose();
    } catch (error) {
      toast.error("Failed to send announcement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectSx = {
    height: 42,
    backgroundColor: isDark ? "#111827" : "#ffffff",
    color: isDark ? "#e2e8f0" : "#0f172a",
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
      borderColor: "#6366f1",
    },
    "& .MuiSelect-icon": {
      color: isDark ? "#94a3b8" : "#64748b",
    },
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: isDark ? "#111827" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
      "& fieldset": {
        borderColor: isDark ? "#334155" : "#cbd5e1",
      },
      "&:hover fieldset": {
        borderColor: isDark ? "#475569" : "#94a3b8",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#6366f1",
      },
    },
    "& .MuiInputBase-input": {
      color: isDark ? "#e2e8f0" : "#0f172a",
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "#94a3b8" : "#475569",
      "&.Mui-focused": {
        color: "#6366f1",
      },
    },
    "& .MuiInputBase-input::placeholder": {
      color: isDark ? "#94a3b8" : "#64748b",
      opacity: 1,
    },
  };

  return (
    <BaseModal isOpen={open} onClose={onClose} title="Broadcast System Announcement">
      <form onSubmit={handleSubmit} className="space-y-6 pt-3 pb-2">
        <div className="space-y-6">
          <TextField
            label="Announcement Title"
            fullWidth
            required
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Scheduled Maintenance / New Feature Release"
            sx={textFieldSx}
          />

          <TextField
            label="Message Details (Optional)"
            fullWidth
            multiline
            rows={3}
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter announcement details for users..."
            sx={textFieldSx}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <FormControl size="small" fullWidth>
              <InputLabel
                id="broadcast-modal-type-label"
                sx={{ color: isDark ? "#94a3b8" : "#475569", "&.Mui-focused": { color: "#6366f1" } }}
              >
                Notification Type
              </InputLabel>
              <Select
                labelId="broadcast-modal-type-label"
                id="broadcast-modal-type-select"
                value={type}
                label="Notification Type"
                onChange={(e) => setType(e.target.value)}
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
                id="broadcast-modal-audience-label"
                sx={{ color: isDark ? "#94a3b8" : "#475569", "&.Mui-focused": { color: "#6366f1" } }}
              >
                Target Audience
              </InputLabel>
              <Select
                labelId="broadcast-modal-audience-label"
                id="broadcast-modal-audience-select"
                value={targetUserId}
                label="Target Audience"
                onChange={(e) => setTargetUserId(e.target.value)}
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

        <div className="pt-6 mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={<CampaignIcon />}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2"
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Send Announcement"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
