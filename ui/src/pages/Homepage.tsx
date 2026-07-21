/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Base/Logo";
import { DarkMode, LightMode } from "@mui/icons-material";
import ReactCountryFlag from "react-country-flag";

export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useSettingsStore();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-800 transition-colors">
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors shadow-sm">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={t("topbar.tooltips.theme")}
          >
            {theme === "light" ? <DarkMode /> : <LightMode />}
          </button>
          <button
            type="button"
            className="p-2 scale-125 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            onClick={() => {
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
        </div>
      </header>
    </div>
  );
};

export default Homepage;
