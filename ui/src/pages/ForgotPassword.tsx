import { useState } from "react";
import { Link } from "react-router-dom";
import { TextField, CircularProgress, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { api } from "../utils/api";
import { useTheme } from "../contexts/ThemeContext";

import { Logo } from "../components/Base/Logo";
import { ThemeLanguageToggles } from "../components/Base/ThemeLanguageToggles";

/**
 * Forgot password page component.
 * Allows users to request a password reset email link.
 */
export const ForgotPassword = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
   * Submits email to forgot-password API endpoint.
   */
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !email) return;

    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setError(
          t(
            "auth.errors.tooManyRequests",
            "Too many requests. Please try again later.",
          ),
        );
      } else {
        setError(
          t("auth.errors.generic", "Something went wrong. Please try again."),
        );
      }
      console.error("Error during forgot password request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-slate-800 transition-colors">
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors shadow-sm">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeLanguageToggles />
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {t("auth.forgotPassword.title", "Reset Password")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {t(
                "auth.forgotPassword.subtitle",
                "Enter your email address and we will send you a password reset link.",
              )}
            </p>
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

          {isSuccess ? (
            <div className="text-center flex flex-col gap-4">
              <Alert severity="success" sx={{ borderRadius: "8px" }}>
                {t(
                  "auth.forgotPassword.success",
                  "If this email is registered, we have sent password reset instructions.",
                )}
              </Alert>
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
              >
                {t("auth.backToLogin", "Back to Log In")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <TextField
                label={t("auth.fields.email", "Email")}
                type="email"
                size="small"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={inputSx}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <CircularProgress size={16} color="inherit" />}
                {t("auth.forgotPassword.submit", "Send Reset Link")}
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                >
                  {t("auth.backToLogin", "Back to Log In")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
