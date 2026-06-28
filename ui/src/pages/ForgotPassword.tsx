import { useState } from "react";
import { Link } from "react-router-dom";
import { TextField, CircularProgress, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import { useTheme } from "../contexts/ThemeContext";

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
    if (isSubmitting || !email) return;

    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setIsSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response.status === 429) {
        setError(
          t(
            "auth.errors.tooManyRequests",
            "Příliš mnoho požadavků. Zkuste to prosím později.",
          ),
        );
      } else {
        setError(
          t("auth.errors.generic", "Něco se pokazilo. Zkuste to prosím znovu."),
        );
      }
      console.error("Error during forgot password request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid place-items-center h-full bg-slate-50 dark:bg-slate-800 transition-colors px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
            KeepTrack
          </h1>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {t("auth.forgotPassword.title", "Obnova hesla")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {t(
              "auth.forgotPassword.subtitle",
              "Zadejte svůj e-mail a my vám zašleme odkaz pro vytvoření nového hesla.",
            )}
          </p>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" sx={{ borderRadius: "8px" }}>
            {error}
          </Alert>
        )}

        {isSuccess ? (
          <div className="text-center flex flex-col gap-4">
            <Alert severity="success" sx={{ borderRadius: "8px" }}>
              {t(
                "auth.forgotPassword.success",
                "Pokud je e-mail zaregistrovaný, odeslali jsme na něj instrukce k obnově hesla.",
              )}
            </Alert>
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
            >
              {t("auth.backToLogin", "Zpět na přihlášení")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label={t("auth.fields.email", "E-mail")}
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
              {t("auth.forgotPassword.submit", "Odeslat odkaz")}
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
              >
                {t("auth.backToLogin", "Zpět na přihlášení")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
