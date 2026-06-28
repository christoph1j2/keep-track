import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import {
  Select,
  MenuItem,
  TextField,
  InputLabel,
  FormControl,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";
import { useSettingsStore } from "../store/settingsStore";
import { Link } from "react-router-dom";

export const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("CZK");

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  const selectSx = {
    color: isDark ? "#e2e8f0" : "#0f172a",
    backgroundColor: isDark ? "#111827" : "#ffffff",
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

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    try {
      if (isRegister) {
        await api.post("/users", {
          email,
          password,
          username,
          baseCurrency,
        });

        const initCurrency = useSettingsStore.getState().initCurrency;
        initCurrency(baseCurrency as "CZK" | "USD" | "EUR" | "PLN" | "ISK");

        const loginRes = await api.post("/auth/login", { email, password });
        setAuth(
          loginRes.data.user,
          loginRes.data.access_token,
          loginRes.data.refresh_token,
        );
        navigate("/");
      } else {
        const loginRes = await api.post("/auth/login", { email, password });

        const initCurrency = useSettingsStore.getState().initCurrency;
        if (loginRes.data.user.baseCurrency) {
          initCurrency(
            loginRes.data.user.baseCurrency as
              | "CZK"
              | "USD"
              | "EUR"
              | "PLN"
              | "ISK",
          );
        }

        setAuth(
          loginRes.data.user,
          loginRes.data.access_token,
          loginRes.data.refresh_token,
        );
        navigate("/");
      }
      toast.success(
        isRegister ? t("auth.register.success") : t("auth.login.success"),
      );
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t("auth.errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid place-items-center h-full bg-slate-50 dark:bg-slate-800 transition-colors px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-1">
            KeepTrack
          </h1>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {isRegister ? t("auth.register.title") : t("auth.login.title")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRegister
              ? t("auth.register.subtitle")
              : t("auth.login.subtitle")}
          </p>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" sx={{ borderRadius: "8px" }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <TextField
              label={t("auth.fields.username")}
              type="text"
              size="small"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={inputSx}
            />
          )}

          <TextField
            label={t("auth.fields.email")}
            type="email"
            size="small"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={inputSx}
          />

          <TextField
            label={t("auth.fields.password")}
            type="password"
            size="small"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={inputSx}
          />

          {isRegister && (
            <FormControl size="small" fullWidth>
              <InputLabel
                sx={{
                  color: isDark ? "#94a3b8" : "#475569",
                  "&.Mui-focused": { color: "#6366f1" },
                }}
              >
                {t("auth.fields.baseCurrency")}
              </InputLabel>
              <Select
                value={baseCurrency}
                label={t("auth.fields.baseCurrency")}
                onChange={(e) => setBaseCurrency(e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="CZK">CZK</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="PLN">PLN</MenuItem>
                <MenuItem value="ISK">ISK</MenuItem>
              </Select>
            </FormControl>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting && <CircularProgress size={16} color="inherit" />}
            {isRegister ? t("auth.register.submit") : t("auth.login.submit")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
          >
            {isRegister
              ? t("auth.register.switchToLogin")
              : t("auth.login.switchToRegister")}
          </button>

          {!isRegister && (
            <div className="mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
