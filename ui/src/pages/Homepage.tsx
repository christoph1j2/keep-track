import React, { useState, useEffect } from "react";

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
  Shield,
  TableChart,
  Launch,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ReceiptLong,
  CalendarMonth,
  Add,
  AccountBalanceWallet,
  LocalCafe,
  Restaurant,
  DirectionsSubway,
} from "@mui/icons-material";

import { ThemeLanguageToggles } from "../components/Base/ThemeLanguageToggles";
import { useAuthStore } from "../store/authStore";

/**
 * GitHub Issue structure returned by the GitHub REST API.
 */
interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  pull_request?: unknown;
  labels?: Array<{ id?: number; name: string; color?: string } | string>;
}

/**
 * Homepage component: The primary landing page for KeepTrack.
 *
 * Designed for everyday users seeking calm, stress-free personal finance
 * and budget tracking. Built with accessible contrast in both light and dark
 * modes, grounded visual product representations, and zero marketing clichés.
 */
export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  // Dynamic roadmap state fetched from GitHub Issues
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState<boolean>(true);

  /**
   * Fetch roadmap items directly from the repository's GitHub Issues API.
   * If issues cannot be loaded or are unavailable, skeleton loaders are displayed.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function fetchRoadmapIssues() {
      setLoadingRoadmap(true);

      try {
        const response = await fetch(
          "https://api.github.com/repos/christoph1j2/keep-track/issues?per_page=10&state=all",
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`GitHub API returned status ${response.status}`);
        }

        const data: unknown = await response.json();
        if (Array.isArray(data)) {
          // Exclude pull requests to keep focus on actionable roadmap issues
          const issuesOnly = data.filter(
            (item: GitHubIssue) => !item.pull_request,
          );
          if (issuesOnly.length > 0) {
            // Prioritize open/active roadmap issues if available
            const openIssues = issuesOnly.filter(
              (item) => item.state === "open",
            );
            const closedIssues = issuesOnly.filter(
              (item) => item.state !== "open",
            );
            const sortedIssues = [...openIssues, ...closedIssues].slice(0, 4);
            setIssues(sortedIssues);
          }
        }
      } catch {
        // Fall through; skeleton loaders will render if issues are unavailable
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRoadmap(false);
        }
      }
    }

    fetchRoadmapIssues();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. Navigation Header                                                      */}
      {/* Clean sticky navigation with branded logo, page links, and auth action.  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between gap-3 transition-colors duration-200 shadow-xs">
        <Logo />

        <nav className="max-md:hidden flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
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
            href="#roadmap"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {t("landing.nav.roadmap")}
          </a>
          <a
            href="#footer"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {t("landing.nav.infoLicense")}
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeLanguageToggles />

          <button
            type="button"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-600/20 transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            {user
              ? t("landing.nav.goToDashboard")
              : t("landing.nav.loginRegister")}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. Main Content                                                           */}
      {/* ========================================================================= */}
      <main className="flex-1 transition-colors duration-200">
        {/* ----------------------------------------------------------------------- */}
        {/* HERO SECTION                                                            */}
        {/* Human-centered value proposition with a realistic, concrete UI preview. */}
        {/* ----------------------------------------------------------------------- */}
        <section className="relative px-6 sm:px-10 lg:px-14 py-16 lg:py-24 max-w-7xl mx-auto transition-colors duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Human Marketing Copy & Purposeful CTA */}
            <div className="lg:col-span-6 text-left flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 mb-6 border border-emerald-200 dark:border-emerald-800 shadow-xs transition-colors duration-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t("landing.hero.badge")}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight transition-colors duration-200">
                {t("landing.hero.titlePart1")}{" "}
                <br className="hidden sm:inline" />
                <span className="bg-linear-to-r from-blue-600 via-sky-600 to-teal-600 bg-clip-text text-transparent">
                  {t("landing.hero.titlePart2")}
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed transition-colors duration-200">
                {t("landing.hero.subtitle")}
              </p>

              {/* Purposeful Call to Action flow: Single primary action + anchor discovery */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-start w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate(user ? "/dashboard" : "/login")}
                  className="w-full sm:w-auto px-8 py-3.5 font-bold text-base rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                >
                  {user
                    ? t("landing.hero.goToDashboard")
                    : t("landing.hero.getStarted")}
                  <ArrowForward fontSize="small" />
                </button>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 font-semibold text-base rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-200 text-center"
                >
                  {t("landing.hero.seeHowItWorks")}
                </a>
              </div>
            </div>

            {/* Right Column: Authentic KeepTrack Dashboard Snapshot */}
            <div className="lg:col-span-6 w-full flex justify-center">
              <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/50 p-4 sm:p-5 transition-all duration-200">
                {/* Window Chrome / Dashboard Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 ml-1.5">
                      KeepTrack
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">
                      •
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t("dashboard.title")}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    {t("landing.hero.preview.currentMonth")}
                  </div>
                </div>

                {/* 1. Stat Cards Grid (Matching StatCard.tsx with concise preview labels) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
                  {/* Income */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 rounded-md bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 shrink-0">
                        <TrendingUp style={{ fontSize: 15 }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {t("landing.hero.preview.statIncome")}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t("landing.hero.preview.salaryAmount")}
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 rounded-md bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 shrink-0">
                        <TrendingDown style={{ fontSize: 15 }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {t("landing.hero.preview.statExpenses")}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t("landing.hero.preview.expensesAmount")}
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 shrink-0">
                        <AccountBalanceWallet style={{ fontSize: 15 }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {t("landing.hero.preview.statBalance")}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t("landing.hero.preview.safeToSpendAmount")}
                    </div>
                  </div>

                  {/* Budget Status */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 shrink-0">
                        <CalendarMonth style={{ fontSize: 15 }} />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {t("landing.hero.preview.statBudget")}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {t("landing.hero.preview.budgetStatusGood")}
                    </div>
                  </div>
                </div>

                {/* 2. Quick Add Section (Matching QuickAddButton.tsx & Dashboard.tsx) */}
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      {t("dashboard.quickAddSection")}
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                      {t("dashboard.links.manageTemplates")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {/* Add button */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-1">
                        <Add fontSize="small" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {t("common.add")}
                      </span>
                    </div>

                    {/* Template 1: Coffee */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center mb-1">
                        <LocalCafe style={{ fontSize: 18 }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {t("landing.hero.preview.quickAddCoffeeTitle")}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("landing.hero.preview.quickAddCoffeeAmount")}
                      </span>
                    </div>

                    {/* Template 2: Groceries */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center mb-1">
                        <ShoppingCart style={{ fontSize: 18 }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {t("landing.hero.preview.quickAddGroceriesTitle")}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("landing.hero.preview.quickAddGroceriesAmount")}
                      </span>
                    </div>

                    {/* Template 3: Lunch */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center mb-1">
                        <Restaurant style={{ fontSize: 18 }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {t("landing.hero.preview.quickAddLunchTitle")}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("landing.hero.preview.quickAddLunchAmount")}
                      </span>
                    </div>

                    {/* Template 4: Metro */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 flex items-center justify-center mb-1">
                        <DirectionsSubway style={{ fontSize: 18 }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {t("landing.hero.preview.quickAddMetroTitle")}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("landing.hero.preview.quickAddMetroAmount")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Last Transactions Widget (Matching LastTransactions.tsx) */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {t("dashboard.lastTransactions.title")}
                    </span>
                    {/* Filter Pills */}
                    <div className="flex items-center rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 p-0.5">
                      <span className="px-2 py-0.5 font-medium rounded-md bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white">
                        {t("common.all")}
                      </span>
                      <span className="px-2 py-0.5 font-medium text-slate-500 dark:text-slate-400">
                        {t("common.income")}
                      </span>
                      <span className="px-2 py-0.5 font-medium text-slate-500 dark:text-slate-400">
                        {t("common.expenses")}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Rows */}
                  <div className="space-y-1">
                    {/* Tx 1: Supermarket Groceries */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 flex items-center justify-center">
                          <ShoppingCart style={{ fontSize: 16 }} />
                        </div>
                        <div className="ml-2.5 flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {t("landing.hero.preview.groceriesTitle")}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {t("landing.hero.preview.groceriesSubtitle")}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                        {t("landing.hero.preview.groceriesAmount")}
                      </span>
                    </div>

                    {/* Tx 2: Salary Deposit */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center">
                          <TrendingUp style={{ fontSize: 16 }} />
                        </div>
                        <div className="ml-2.5 flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {t("landing.hero.preview.salaryTitle")}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {t("landing.hero.preview.salarySubtitle")}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        {t("landing.hero.preview.salaryAmount")}
                      </span>
                    </div>

                    {/* Tx 3: Recurring Utilities with smart tag */}
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center">
                          <ReceiptLong style={{ fontSize: 16 }} />
                        </div>
                        <div className="ml-2.5 flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                              {t("landing.hero.preview.recurringTitle")}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {t("landing.hero.preview.smartCategorized")}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {t("landing.hero.preview.recurringSubtitle")}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                        {t("landing.hero.preview.recurringAmount")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. About Section */}
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

        {/* ----------------------------------------------------------------------- */}
        {/* 4. How It Works / Core Features                                         */}
        {/* Clear explanations of QuickAdd, statement import, and data privacy.    */}
        {/* ----------------------------------------------------------------------- */}
        <section
          id="how-it-works"
          className="py-20 px-6 max-w-6xl mx-auto transition-colors duration-200"
        >
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider transition-colors duration-200">
              {t("landing.howItWorks.tag")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-4 tracking-tight transition-colors duration-200">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base transition-colors duration-200">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: 1-Tap QuickAdd */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 transition-colors duration-200">
                <FlashOn />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-200">
                {t("landing.howItWorks.quickAddTitle")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 transition-colors duration-200">
                {t("landing.howItWorks.quickAddDesc")}
              </p>
            </div>

            {/* Feature 2: Smart Statement Import (OpenRouter LLM categorization) */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 transition-colors duration-200">
                <AutoAwesome />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-200">
                {t("landing.howItWorks.smartCsvTitle")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 transition-colors duration-200">
                {t("landing.howItWorks.smartCsvDesc")}
              </p>
            </div>

            {/* Feature 3: Data Privacy & Self-Hosting */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 transition-colors duration-200">
                <Storage />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight transition-colors duration-200">
                {t("landing.howItWorks.selfHostTitle")}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 transition-colors duration-200">
                {t("landing.howItWorks.selfHostDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* 5. Dynamic Roadmap & GitHub Issues                                      */}
        {/* Real-time GitHub Issues integration with resilient offline fallback.   */}
        {/* ----------------------------------------------------------------------- */}
        <section
          id="roadmap"
          className="py-16 px-6 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors duration-200"
        >
          <div className="max-w-5xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xs transition-colors duration-200">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 transition-colors duration-200">
                    {t("landing.roadmap.tag")}
                  </span>
                  {!loadingRoadmap && issues.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {t("landing.roadmap.liveBadge")}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight transition-colors duration-200">
                  {t("landing.roadmap.title")}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 transition-colors duration-200">
                  {t("landing.roadmap.subtitle")}
                </p>
              </div>

              {/* Purposeful external link to GitHub repository issues */}
              <a
                href="https://github.com/christoph1j2/keep-track/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors duration-200 whitespace-nowrap cursor-pointer"
              >
                <GitHub fontSize="small" />
                <span>{t("landing.roadmap.viewAllIssues")}</span>
                <Launch style={{ fontSize: 14 }} />
              </a>
            </div>

            {/* Roadmap Content Grid: Real GitHub Issues or Skeleton Loaders */}
            <div className="mt-8">
              {!loadingRoadmap && issues.length > 0 ? (
                /* Live GitHub Issues Cards */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {issues.map((issue) => {
                    const isOpen = issue.state === "open";
                    return (
                      <a
                        key={issue.id}
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col justify-between p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 min-h-36"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                              #{issue.number}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isOpen
                                  ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isOpen
                                ? t("landing.roadmap.statusOpen")
                                : t("landing.roadmap.statusClosed")}
                            </span>
                          </div>
                          <Launch
                            fontSize="small"
                            className="text-slate-400 group-hover:text-blue-500 transition-colors duration-200 shrink-0"
                            style={{ fontSize: 16 }}
                          />
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                          {issue.title}
                        </h4>

                        {issue.labels && issue.labels.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            {issue.labels.slice(0, 2).map((lbl, idx) => {
                              const name =
                                typeof lbl === "string" ? lbl : lbl?.name;
                              const key =
                                typeof lbl === "string"
                                  ? `${lbl}-${idx}`
                                  : (lbl?.id ?? `${lbl?.name}-${idx}`);
                              if (!name) return null;
                              return (
                                <span
                                  key={key}
                                  className="px-2 py-0.5 text-[10px] rounded font-medium bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300"
                                >
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-3"></div>
                        )}
                      </a>
                    );
                  })}
                </div>
              ) : (
                /* Skeleton Loaders: Displayed while loading or when milestones/issues are unavailable */
                <div
                  role="status"
                  aria-live="polite"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <span className="sr-only">
                    {t("landing.roadmap.loading")}
                  </span>
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col justify-between h-36"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="space-y-2 my-auto">
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                        <div className="h-4 w-3/5 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer & License */}
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
                  rel="noopener noreferrer"
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
