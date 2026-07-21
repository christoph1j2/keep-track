import React from "react";
import { useSettingsStore } from "../store/settingsStore";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Base/Logo";
import {
  DarkMode,
  LightMode,
  ArrowForward,
  CheckCircle,
  FlashOn,
  AutoAwesome,
  Storage,
  GitHub,
  Email,
  BugReport,
  Analytics,
  Smartphone,
  Shield,
  TableChart,
  Launch,
} from "@mui/icons-material";
import ReactCountryFlag from "react-country-flag";

export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useSettingsStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-6 h-16 flex items-center justify-between transition-colors duration-200 shadow-sm">
        <Logo />

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#about"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {t("landing.nav.about")}
          </a>
          <a
            href="#how-it-works"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {t("landing.nav.howItWorks")}
          </a>
          <a
            href="#beta-notes"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {t("landing.nav.betaNotes")}
          </a>
          <a
            href="#footer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {t("landing.nav.infoLicense")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-200"
            title={t("topbar.tooltips.theme", "Toggle theme")}
          >
            {theme === "light" ? (
              <DarkMode fontSize="small" />
            ) : (
              <LightMode fontSize="small" />
            )}
          </button>

          <button
            type="button"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-200"
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

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20 transition-all duration-200 cursor-pointer"
          >
            {t("landing.nav.loginRegister")}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 transition-colors duration-200">
        {/* 1. Hero Section */}
        <section className="relative px-6 py-20 lg:py-28 max-w-6xl mx-auto text-center flex flex-col items-center overflow-hidden transition-colors duration-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mb-6 border border-emerald-300 dark:border-emerald-800/80 shadow-xs transition-colors duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t("landing.hero.badge")}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight transition-colors duration-200">
            {t("landing.hero.titlePart1")} <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
              {t("landing.hero.titlePart2")}
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed transition-colors duration-200">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-8 py-3.5 font-bold text-base rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            >
              {t("landing.hero.getStarted")} <ArrowForward fontSize="small" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3.5 font-semibold text-base rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-200 text-center"
            >
              {t("landing.hero.seeHowItWorks")}
            </a>
          </div>

          {/* Hero Dashboard Graphic Mockup */}
          <div className="mt-14 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-3 sm:p-5 shadow-2xl backdrop-blur-sm transition-colors duration-200">
            <div className="w-full rounded-xl bg-slate-900 text-slate-100 p-6 border border-slate-800 shadow-inner flex flex-col gap-4 text-left transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-400 font-mono ml-2">
                    {t("landing.hero.mockupTitle")}
                  </span>
                </div>
                <span className="text-xs text-blue-400 font-mono">
                  {t("landing.hero.liveDemo")}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors duration-200">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("landing.hero.monthlyIncome")}
                  </span>
                  <span className="text-xl font-bold text-emerald-400">
                    + $4,250.00
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors duration-200">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("landing.hero.totalExpenses")}
                  </span>
                  <span className="text-xl font-bold text-rose-400">
                    - $1,840.50
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors duration-200">
                  <span className="text-xs text-slate-400 block mb-1">
                    {t("landing.hero.netSavings")}
                  </span>
                  <span className="text-xl font-bold text-blue-400">
                    $2,409.50
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span>⚡ {t("landing.hero.quickAddHotbar")}</span>
                <span>🤖 {t("landing.hero.aiCsvCategorization")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. About Section */}
        <section
          id="about"
          className="py-20 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors duration-200"
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wider transition-colors duration-200">
                  {t("landing.about.tag")}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-6 transition-colors duration-200">
                  {t("landing.about.title")}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4 transition-colors duration-200">
                  {t("landing.about.desc1")}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed transition-colors duration-200">
                  {t("landing.about.desc2")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
                  <TableChart className="text-rose-500 mb-3" />
                  <h3 className="font-semibold text-base mb-1 transition-colors duration-200">
                    {t("landing.about.excelFrustrations")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
                    {t("landing.about.excelFrustrationsDesc")}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 transition-colors duration-200">
                  <CheckCircle className="text-blue-600 dark:text-blue-400 mb-3" />
                  <h3 className="font-semibold text-base mb-1 transition-colors duration-200">
                    {t("landing.about.keepTrackSolution")}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 transition-colors duration-200">
                    {t("landing.about.keepTrackSolutionDesc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works + What's It Good For */}
        <section
          id="how-it-works"
          className="py-20 px-6 max-w-6xl mx-auto transition-colors duration-200"
        >
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wider transition-colors duration-200">
              {t("landing.howItWorks.tag")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-4 transition-colors duration-200">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 transition-colors duration-200">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 transition-colors duration-200">
                <FlashOn />
              </div>
              <h3 className="text-xl font-bold mb-2 transition-colors duration-200">
                {t("landing.howItWorks.quickAddTitle")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 transition-colors duration-200">
                {t("landing.howItWorks.quickAddDesc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 transition-colors duration-200">
                <AutoAwesome />
              </div>
              <h3 className="text-xl font-bold mb-2 transition-colors duration-200">
                {t("landing.howItWorks.smartCsvTitle")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 transition-colors duration-200">
                {t("landing.howItWorks.smartCsvDesc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 transition-colors duration-200">
                <Storage />
              </div>
              <h3 className="text-xl font-bold mb-2 transition-colors duration-200">
                {t("landing.howItWorks.selfHostTitle")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 transition-colors duration-200">
                {t("landing.howItWorks.selfHostDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* 4. Beta Notes & Roadmap */}
        <section
          id="beta-notes"
          className="py-16 px-6 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors duration-200"
        >
          <div className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-sm transition-colors duration-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
              <div>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 transition-colors duration-200">
                  {t("landing.beta.tag")}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 transition-colors duration-200">
                  {t("landing.beta.title")}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 transition-colors duration-200">
                  {t("landing.beta.subtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap cursor-pointer"
              >
                {t("landing.beta.joinBeta")}
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-4 transition-colors duration-200">
                {t("landing.beta.roadmapTitle")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                  <BugReport className="text-blue-500" fontSize="small" />
                  <span className="text-sm font-medium transition-colors duration-200">
                    {t("landing.beta.feedbackSystem")}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                  <Smartphone className="text-indigo-500" fontSize="small" />
                  <span className="text-sm font-medium transition-colors duration-200">
                    {t("landing.beta.pwaSupport")}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                  <Analytics className="text-teal-500" fontSize="small" />
                  <span className="text-sm font-medium transition-colors duration-200">
                    {t("landing.beta.advancedAnalytics")}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
                  <AutoAwesome className="text-amber-500" fontSize="small" />
                  <span className="text-sm font-medium transition-colors duration-200">
                    {t("landing.beta.llmInsights")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Footer & License */}
      <footer
        id="footer"
        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-6 transition-colors duration-200"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm transition-colors duration-200">
              {t("landing.footer.desc")}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3 transition-colors duration-200">
              {t("landing.footer.techStack")}
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium transition-colors duration-200">
                React
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium transition-colors duration-200">
                TypeScript
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium transition-colors duration-200">
                Tailwind CSS
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium transition-colors duration-200">
                NestJS
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium transition-colors duration-200">
                PostgreSQL
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium transition-colors duration-200">
                Docker
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3 transition-colors duration-200">
              {t("landing.footer.projectContact")}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <GitHub fontSize="small" />
                <a
                  href="https://github.com/christoph1j2/keep-track"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1 transition-colors duration-200"
                >
                  {t("landing.footer.githubRepo")}{" "}
                  <Launch style={{ fontSize: 12 }} />
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Email fontSize="small" />
                <span>
                  Ernst Christoph Leschka &lt;ernst.leschka@gmail.com&gt;
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Shield fontSize="small" />
                <span>{t("landing.footer.license")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 transition-colors duration-200">
          <p>{t("landing.footer.copyright")}</p>
          <p>{t("landing.footer.version")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
