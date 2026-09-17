import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TextField, CircularProgress, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import { useTheme } from "../contexts/ThemeContext";
import toast from "react-hot-toast";

import { Logo } from "../components/Base/Logo";
import { ThemeLanguageToggles } from "../components/Base/ThemeLanguageToggles";

/**
 * Reset password page component.
 * Validates token from URL query parameters and allows user to specify a new password.
 */
export const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  // Local state for confirming identical password entry
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: isDark ? "#e2e8f0" : "#0f172a",
      backgroundColor: isDark ? "#111827" : "#ffffff",
      "& fieldset": { borderColor: isDark ? "#334155" : "#cbd5e1" },
      "&:hover fieldset": { borderColor: isDark ? "#475569" : "#94a3b8" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb" },
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "#94a3b8" : "#475569",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#2563eb",
    },
    "& .MuiInputBase-input::placeholder": {
      color: isDark ? "#94a3b8" : "#64748b",
      opacity: 1,
    },
  };

  /**
   * Submits the updated password with token to the auth API.
   */
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !newPassword || !confirmPassword || !token) return;

    // Client-side verification to avoid unnecessary API requests if passwords mismatch
    if (newPassword !== confirmPassword) {
      setError(t("auth.resetPassword.mismatch", "Passwords do not match."));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Call PATCH endpoint with reset token in path URL
      await api.patch(`/auth/reset-password/${token}`, {
        newPassword,
        confirmPassword,
      });

      toast.success(
        t("auth.resetPassword.success", "Password was successfully changed."),
      );
      navigate("/login");
    } catch (err: unknown) {
      // Extract backend error message (e.g. 'Invalid or expired reset token')
      const backendMessage = (
        err as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      const finalMessage = Array.isArray(backendMessage)
        ? backendMessage[0]
        : backendMessage;

      setError(
        finalMessage ||
          t("auth.errors.generic", "Something went wrong. Please try again."),
      );
      console.error("Error during reset password request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const header = (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors shadow-sm w-full">
      <Logo />
      <div className="flex items-center gap-2">
        <ThemeLanguageToggles />
      </div>
    </header>
  );

  if (!token) {
    return (
      <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-slate-800 transition-colors">
        {header}
        <main className="flex-1 grid place-items-center px-4 py-8">
          <Alert severity="error">
            {t(
              "auth.resetPassword.missingToken",
              "Invalid or missing password reset token.",
            )}
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-slate-800 transition-colors">
      {header}
      <main className="flex-1 grid place-items-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {t("auth.resetPassword.title", "New Password")}
            </h2>
          </div>

          {error && (
            <Alert
              severity="error"
              className="mb-4"
              sx={{ borderRadius: "8px" }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label={t("settings.newPassword", "New Password")}
              type="password"
              size="small"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              sx={inputSx}
            />

            {/* Password confirmation field */}
            <TextField
              label={t("settings.confirmPassword", "Confirm Password")}
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
              {t("auth.resetPassword.submit", "Save New Password")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
