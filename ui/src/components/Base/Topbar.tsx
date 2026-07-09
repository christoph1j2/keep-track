import { useState } from "react";
import { MobileMenu } from "./MobileMenu";
import {
  InfoOutlined,
  DarkMode,
  LightMode,
  LogoutOutlined,
} from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material";
import { useTransactionStore } from "../../store/transactionStore";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../../store/confirmStore";
import { formatCurrency } from "../../utils/formatCurrency";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../utils/api";
import toast from "react-hot-toast";
import { useSettingsStore } from "../../store/settingsStore";
import ReactCountryFlag from "react-country-flag";

export function Topbar() {
  const [infoOpen, setInfoOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const transactions = useTransactionStore((state) => state.transactions);

  const { t, i18n } = useTranslation();
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  const { language, setLanguage } = useSettingsStore();

  // Načtení dat o uživateli a funkce pro smazání storu
  const { user, logout } = useAuthStore();

  const incomeSum = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const expensesSum = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const handleLogout = async () => {
    try {
      // Zavoláme backend, aby zneplatnil refresh token v databázi
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      // I kdyby backend neodpověděl, smažeme frontendová data a vykopneme uživatele
      logout();
      toast.success(t("topbar.logoutSuccess", "Logged out successfully")); // Zde můžeš použít svůj i18n klíč
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 pl-6 flex items-center justify-between md:justify-between transition-colors">
        {/* Desktop user info - Dynamické zobrazení */}
        <div className="hidden md:block">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {user?.username || ""}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user?.email || ""}
          </p>
        </div>

        <div className="md:hidden">
          <MobileMenu />
        </div>

        {/* Mobile user info - Dynamické zobrazení */}
        <div className="md:hidden text-right">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
            {user?.username || ""}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user?.email || ""}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setInfoOpen(true)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t("topbar.tooltips.info")}
          >
            <InfoOutlined className="text-slate-500 dark:text-slate-400" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t("topbar.tooltips.theme")}
          >
            {theme === "light" ? <DarkMode /> : <LightMode />}
          </button>

          <button
            className="p-2 scale-125 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            onClick={() => {
              // Použití standardních kódů 'cs' a 'en'
              const newLang = language === "cs" ? "en" : "cs";

              setLanguage(newLang);
              i18n.changeLanguage(newLang);
            }}
            aria-label={t("topbar.language", "Změnit jazyk")}
          >
            {language === "cs" ? (
              <ReactCountryFlag countryCode="GB" svg />
            ) : (
              <ReactCountryFlag countryCode="CZ" svg />
            )}
          </button>

          {user?.email && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors ml-2"
              title="Odhlásit se"
            >
              <LogoutOutlined />
            </button>
          )}
        </div>
      </header>

      {/* Info Modal (Zůstává stejný) */}
      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        maxWidth="sm"
        fullWidth
        classes={{
          paper:
            "bg-white dark:bg-slate-900! dark:text-slate-100! transition-colors",
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {t("topbar.about.title")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <div className="space-y-4 text-sm">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("topbar.about.author")}:
                  </span>{" "}
                  <span className="text-slate-600 dark:text-slate-300">
                    Ernst Christoph Leschka
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("topbar.about.subject")}:
                  </span>{" "}
                  <span className="text-slate-600 dark:text-slate-300">
                    KIV/UUR @ ZČU FAV
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {t("topbar.about.work")}:
                  </span>{" "}
                  <span className="text-slate-600 dark:text-slate-300">
                    {t("topbar.about.workName")}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {t("topbar.about.description1")}
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
                {t("topbar.about.description2")}{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {t("topbar.about.currently")}
                </strong>{" "}
                {t("topbar.about.description3")}
              </p>
              <br />
              <p className="text-slate-400 dark:text-slate-500 leading-relaxed">
                {t("topbar.about.statsIncome", {
                  income: formatCurrency(incomeSum),
                })}
                <br />
                {t("topbar.about.statsExpenses", {
                  expenses: formatCurrency(expensesSum),
                })}
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            color="error"
            onClick={() => {
              showConfirm(
                t("topbar.confirm.resetTitle"),
                t("topbar.confirm.resetMessage"),
                () => {
                  localStorage.clear();
                  window.location.reload();
                },
              );
            }}
          >
            {t("topbar.buttons.factoryReset")}
          </Button>
          <Button
            onClick={() => setInfoOpen(false)}
            variant={theme === "dark" ? "outlined" : "contained"}
          >
            {t("topbar.buttons.close")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
