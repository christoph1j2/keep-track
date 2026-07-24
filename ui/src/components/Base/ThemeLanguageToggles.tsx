import { useTheme } from "../../contexts/ThemeContext";
import { useSettingsStore } from "../../store/settingsStore";
import { useTranslation } from "react-i18next";
import { DarkMode, LightMode } from "@mui/icons-material";
import ReactCountryFlag from "react-country-flag";

export const ThemeLanguageToggles = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useSettingsStore();
  const { t, i18n } = useTranslation();

  return (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-200"
        title={t("topbar.tooltips.theme", "Toggle theme")}
      >
        {theme === "light" ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
      </button>
      <button
        type="button"
        className="p-2 scale-125 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-200"
        onClick={() => {
          const newLang = language === "cs" ? "en" : "cs";
          setLanguage(newLang);
          i18n.changeLanguage(newLang);
        }}
        aria-label={t("topbar.language", "Change language")}
      >
        {language === "cs" ? (
          <ReactCountryFlag countryCode="GB" svg />
        ) : (
          <ReactCountryFlag countryCode="CZ" svg />
        )}
      </button>
    </>
  );
};
