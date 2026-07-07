import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TextField, CircularProgress } from "@mui/material";
import { useSettingsStore } from "../store/settingsStore";
import { useConfirmStore } from "../store/confirmStore";
import { useTransactionStore } from "../store/transactionStore";
import { useAuthStore } from "../store/authStore";
import { api } from "../utils/api";
import toast from "react-hot-toast";


export function Settings() {
  const { t, i18n } = useTranslation();

  // Stores
  const { language, currency, setLanguage, setCurrency } = useSettingsStore();
  const user = useAuthStore((state) => state.user);
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const logout = useAuthStore((state) => state.logout);
  const transactions = useTransactionStore((state) => state.transactions);
  const hasTransactions = transactions.length > 0;

  // Lokální stavy pro změnu hesla
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lokální stavy pro změnu uživatelského jména
  const [newUsername, setNewUsername] = useState("");

  // --- Handlery pro preference ---
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as "cs" | "en";
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleCurrencyChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newCurr = e.target.value as "CZK" | "EUR" | "USD" | "PLN" | "ISK";

    try {
      await setCurrency(newCurr);
      toast.success(t("settings.currencyChanged"));
    } catch (error) {
      toast.error(t("common.error"));
      console.error("Error changing currency:", error);
    }
  };

  // --- Handlery pro zabezpečení ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setIsSubmitting(true);
    try {
      await api.patch("/users/me/password", { oldPassword, newPassword });
      toast.success(
        t(
          "settings.passwordChanged",
          "Heslo bylo úspěšně změněno. Znovu se přihlaste.",
        ),
      );
      logout(); // Odhlásí uživatele po změně hesla
    } catch (error) {
      toast.error(t("settings.passwordError", "Chyba při změně hesla."));
      console.error("Error changing password:", error);
    } finally {
      setIsSubmitting(false);
      setOldPassword("");
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/users/me");
      toast.success(t("settings.accountDeleted", "Účet byl úspěšně smazán."));
      logout(); // Vyčistí frontendový stav a tokeny
    } catch (error) {
      toast.error(t("settings.deleteError", "Nepodařilo se smazat účet."));
      console.error("Error deleting account:", error);
    }
  };

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;

    setIsSubmitting(true);
    try {
      await api.patch("/users/me", { username: newUsername });

      if (user) {
        useAuthStore.setState({ user: { ...user, username: newUsername } });
      }

      toast.success(
        t(
          "settings.usernameChanged",
          "Uživatelské jméno bylo úspěšně změněno.",
        ),
      );
    } catch (error) {
      toast.error(
        t("settings.usernameError", "Chyba při změně uživatelského jména."),
      );
      console.error("Error changing username:", error);
    } finally {
      setIsSubmitting(false);
      setNewUsername("");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-0 max-w-4xl mx-auto w-full">
      {/* Hlavička */}
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {t("settings.title", "Nastavení")}
        </h2>
      </div>

      {/* KARTA 1: Předvolby (Jazyk a Měna) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
          {t("settings.preferences", "Předvolby aplikace")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Výběr Jazyka */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="language"
              className="text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              {t("settings.language", "Jazyk aplikace")}
            </label>
            <select
              id="language"
              value={language}
              onChange={handleLanguageChange}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="cs">Čeština (CZ)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>

          {/* Výběr Měny */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="currency"
              className="text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              {t("settings.currency", "Hlavní měna")}
            </label>
            <select
              id="currency"
              value={currency}
              onChange={handleCurrencyChange}
              disabled={hasTransactions}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="PLN">PLN</option>
              <option value="ISK">ISK</option>
            </select>

            {hasTransactions && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {t(
                  "settings.currencyLocked",
                  "Základní měnu nelze změnit, protože již máte uložené transakce.",
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* KARTA 2: Zabezpečení (Změna hesla) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 text-center">
          {t("settings.security", "Zabezpečení účtu")}
        </h3>
        <div className="flex gap-4">
          <form
            onSubmit={handlePasswordChange}
            className="flex flex-col justify gap-4 max-w-sm mx-auto w-full"
          >
            <TextField
              label={t("settings.oldPassword", "Současné heslo")}
              type="password"
              size="small"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgb(226, 232, 240)" },
                  "&:hover fieldset": { borderColor: "rgb(203, 213, 225)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgb(59, 130, 246)",
                  },
                },
                "& .MuiInputBase-input": { color: "rgb(30, 41, 59)" },
                "& .MuiInputLabel-root": { color: "rgb(100, 116, 139)" },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgb(59, 130, 246)",
                },
                ".dark &": {
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgb(51, 65, 85)" },
                    "&:hover fieldset": { borderColor: "rgb(71, 85, 105)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(59, 130, 246)",
                    },
                  },
                  "& .MuiInputBase-input": { color: "rgb(241, 245, 249)" },
                  "& .MuiInputLabel-root": { color: "rgb(148, 163, 184)" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(59, 130, 246)",
                  },
                },
              }}
            />
            <TextField
              label={t("settings.newPassword", "Nové heslo")}
              type="password"
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 6 } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgb(226, 232, 240)" },
                  "&:hover fieldset": { borderColor: "rgb(203, 213, 225)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgb(59, 130, 246)",
                  },
                },
                "& .MuiInputBase-input": { color: "rgb(30, 41, 59)" },
                "& .MuiInputLabel-root": { color: "rgb(100, 116, 139)" },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgb(59, 130, 246)",
                },
                ".dark &": {
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgb(51, 65, 85)" },
                    "&:hover fieldset": { borderColor: "rgb(71, 85, 105)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(59, 130, 246)",
                    },
                  },
                  "& .MuiInputBase-input": { color: "rgb(241, 245, 249)" },
                  "& .MuiInputLabel-root": { color: "rgb(148, 163, 184)" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(59, 130, 246)",
                  },
                },
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !oldPassword || !newPassword}
              className="mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 w-full"
            >
              {isSubmitting && <CircularProgress size={16} color="inherit" />}
              {t("settings.changePasswordBtn", "Změnit heslo")}
            </button>
          </form>
          <form
            onSubmit={handleUsernameChange}
            className="flex flex-col justify-between gap-4 max-w-sm mx-auto w-full"
          >
            <TextField
              label={t("settings.newUsername", "Nové uživatelské jméno")}
              type="text"
              size="small"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgb(226, 232, 240)" },
                  "&:hover fieldset": { borderColor: "rgb(203, 213, 225)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgb(59, 130, 246)",
                  },
                },
                "& .MuiInputBase-input": { color: "rgb(30, 41, 59)" },
                "& .MuiInputLabel-root": { color: "rgb(100, 116, 139)" },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "rgb(59, 130, 246)",
                },
                ".dark &": {
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "rgb(51, 65, 85)" },
                    "&:hover fieldset": { borderColor: "rgb(71, 85, 105)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(59, 130, 246)",
                    },
                  },
                  "& .MuiInputBase-input": { color: "rgb(241, 245, 249)" },
                  "& .MuiInputLabel-root": { color: "rgb(148, 163, 184)" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgb(59, 130, 246)",
                  },
                },
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newUsername}
              className="mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 w-full"
            >
              {isSubmitting && <CircularProgress size={16} color="inherit" />}
              {t("settings.changeUsernameBtn", "Změnit uživatelské jméno")}
            </button>
          </form>
        </div>
      </section>

      {/* KARTA 2.5: Bankovní připojení */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          {t("settings.bankConnections", "Bankovní připojení")}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {t(
            "settings.bankConnectionsDesc",
            "Připojte svůj bankovní účet pro automatický import transakcí (v přípravě)."
          )}
        </p>
        <div className="flex gap-4">
          <button
            disabled
            className="py-2.5 px-4 bg-emerald-600/50 text-white font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t("settings.connectBankWip", "Připojit bankovní účet (WiP)")}
          </button>
        </div>
      </section>

      {/* KARTA 3: Nebezpečná zóna */}
      <section className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 transition-colors">
        <h3 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">
          {t("settings.dangerZone", "Nebezpečná zóna")}
        </h3>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
          {t(
            "settings.dangerWarning",
            "Akce v této sekci are nevratné. Smazáním účtu přijdete o všechny transakce, kategorie a nastavení.",
          )}
        </p>

        <button
          onClick={() =>
            showConfirm(
              t("settings.deleteAccountTitle", "Smazat účet"),
              t(
                "settings.deleteAccountConfirm",
                "Opravdu chcete nenávratně smazat svůj účet a veškerá svá data?",
              ),
              handleDeleteAccount,
            )
          }
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors"
        >
          {t("settings.deleteAccount", "Smazat účet a všechna data")}
        </button>
      </section>
    </div>
  );
}
