import React from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Base/Logo";
import {
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

import { ThemeLanguageToggles } from "../components/Base/ThemeLanguageToggles";

export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <ThemeLanguageToggles />

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
        <section className="relative px-14 py-20 lg:py-32 max-w-7xl mx-auto overflow-hidden transition-colors duration-200">
          
          {/* Animated Background Orbs */}
          <div className="absolute top-0 left-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-20 w-72 h-72 bg-teal-400/20 dark:bg-teal-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 left-1/2 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Content */}
            <div className="text-left flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mb-6 border border-emerald-300 dark:border-emerald-800/80 shadow-xs transition-colors duration-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("landing.hero.badge")}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight transition-colors duration-200">
                {t("landing.hero.titlePart1")} <br className="hidden sm:inline" />
                <span className="bg-linear-to-r from-blue-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
                  {t("landing.hero.titlePart2")}
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-lg font-normal leading-relaxed transition-colors duration-200">
                {t("landing.hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-start w-full sm:w-auto">
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
            </div>

            {/* Right Column: Abstract Art / Visuals */}
            <div className="relative hidden lg:flex items-center justify-center w-full h-[500px]">
              {/* Central glowing backdrop specific to right side */}
              <div className="absolute inset-0 bg-linear-to-tr from-blue-500/10 via-indigo-500/10 to-teal-500/10 rounded-full blur-3xl opacity-50"></div>
              
              {/* Glassmorphic card 1 (Top Left) */}
              <div className="absolute top-10 left-4 w-64 p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-xl transform -rotate-6 animate-blob">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Analytics className="text-blue-600 dark:text-blue-400" fontSize="small" />
                  </div>
                  <div>
                    <div className="h-2.5 w-20 bg-slate-300 dark:bg-slate-600 rounded-full mb-2"></div>
                    <div className="h-2 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="h-2 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="h-2 w-4/6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
              </div>

              {/* Glassmorphic card 2 (Right) */}
              <div className="absolute top-36 right-0 w-72 p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-2xl transform rotate-3 animate-blob animation-delay-2000 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <CheckCircle className="text-emerald-600 dark:text-emerald-400" fontSize="small" />
                    </div>
                    <div>
                      <div className="h-2.5 w-24 bg-slate-300 dark:bg-slate-600 rounded-full mb-2"></div>
                      <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-500">+24%</div>
                </div>
                <div className="flex gap-2 h-16 items-end mt-4">
                  <div className="w-1/4 bg-emerald-500/20 dark:bg-emerald-500/40 rounded-t-md h-2/5"></div>
                  <div className="w-1/4 bg-emerald-500/40 dark:bg-emerald-500/60 rounded-t-md h-3/5"></div>
                  <div className="w-1/4 bg-emerald-500/60 dark:bg-emerald-500/80 rounded-t-md h-4/5"></div>
                  <div className="w-1/4 bg-emerald-500/80 dark:bg-emerald-500 rounded-t-md h-full"></div>
                </div>
              </div>

              {/* Glassmorphic card 3 (Bottom Left) */}
              <div className="absolute bottom-16 left-12 w-60 p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-lg transform -rotate-3 animate-blob animation-delay-4000">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                     <AutoAwesome className="text-amber-600 dark:text-amber-400" fontSize="small" />
                  </div>
                  <div>
                    <div className="h-2.5 w-16 bg-slate-300 dark:bg-slate-600 rounded-full mb-2"></div>
                    <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-slate-100/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <div className="h-2 w-full bg-slate-300 dark:bg-slate-600 rounded-full mb-2"></div>
                  <div className="h-2 w-2/3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                </div>
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
