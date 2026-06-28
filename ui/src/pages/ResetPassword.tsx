import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TextField, CircularProgress, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import { useTheme } from "../contexts/ThemeContext";
import toast from "react-hot-toast";

export const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  // PŘIDÁNO: Stav pro potvrzení hesla
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: isDark ? "#e2e8f0" : "#0f172a",
      backgroundColor: isDark ? "#111827" : "#ffffff",
      "& fieldset": { borderColor: isDark ? "#334155" : "#cbd5e1" },
      "&:hover fieldset": { borderColor: isDark ? "#475569" : "#94a3b8" },
      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "#94a3b8" : "#475569",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#6366f1",
    },
    "& .MuiInputBase-input::placeholder": {
      color: isDark ? "#94a3b8" : "#64748b",
      opacity: 1,
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !newPassword || !confirmPassword || !token) return;

    // Lokální kontrola, ať nezatěžujeme API, když se uživatel překlikne
    if (newPassword !== confirmPassword) {
      setError(t("auth.resetPassword.mismatch", "Hesla se neshodují."));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // OPRAVENO: Voláme metodu PATCH a token dáváme přímo do URL
      await api.patch(`/auth/reset-password/${token}`, {
        newPassword,
        confirmPassword,
      });

      toast.success(
        t("auth.resetPassword.success", "Heslo bylo úspěšně změněno."),
      );
      navigate("/login");
    } catch (err) {
      // Zobrazení chybové hlášky z backendu (např. 'Invalid or expired reset token')
      setError(
        t("auth.errors.generic", "Něco se pokazilo. Zkuste to prosím znovu."),
      );
      console.error("Error during reset password request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="grid place-items-center h-full bg-slate-50 dark:bg-slate-800">
        <Alert severity="error">
          {t(
            "auth.resetPassword.missingToken",
            "Neplatný nebo chybějící token pro obnovu hesla.",
          )}
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid place-items-center h-full bg-slate-50 dark:bg-slate-800 transition-colors px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
            KeepTrack
          </h1>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {t("auth.resetPassword.title", "Nové heslo")}
          </h2>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" sx={{ borderRadius: "8px" }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label={t("settings.newPassword", "Nové heslo")}
            type="password"
            size="small"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            sx={inputSx}
          />

          {/* PŘIDÁNO: Input pro potvrzení hesla */}
          <TextField
            label={t("settings.confirmPassword", "Potvrzení hesla")}
            type="password"
            size="small"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            sx={inputSx}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <CircularProgress size={16} color="inherit" />}
            {t("auth.resetPassword.submit", "Uložit nové heslo")}
          </button>
        </form>
      </div>
    </div>
  );
};
