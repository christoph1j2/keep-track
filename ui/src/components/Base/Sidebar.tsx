import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";
import CategoryIcon from "@mui/icons-material/Category";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { Extension, CurrencyExchange } from "@mui/icons-material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useTranslation } from "react-i18next";
import { NotificationCenter } from "./NotificationCenter";
import { Logo } from "./Logo";
import { FeedbackModal } from "../Modals/FeedbackModal";
import { BaseModal } from "../Modals/BaseModal";
import { useAuthStore } from "../../store/authStore";

interface MenuItem {
  translationKey: string;
  icon: ReactNode;
  path: string;
  isActive?: boolean;
}

/**
 * Static navigation model for the desktop sidebar.
 * Each entry maps a title and icon to a route.
 */
const MENU_ITEMS: MenuItem[] = [
  {
    translationKey: "sidebar.dashboard",
    icon: <DashboardIcon />,
    path: "/dashboard",
    isActive: true,
  },
  {
    translationKey: "sidebar.overview",
    icon: <ShowChartIcon />,
    path: "/overview",
  },
  {
    translationKey: "sidebar.categories",
    icon: <CategoryIcon />,
    path: "/categories",
  },
  {
    translationKey: "sidebar.budgeting",
    icon: <AccountBalanceWalletIcon />,
    path: "/budgeting",
  },
  {
    translationKey: "sidebar.quickAdd",
    icon: <Extension />,
    path: "/quickadd",
  },
  {
    translationKey: "sidebar.exchangeRates",
    icon: <CurrencyExchange />,
    path: "/exchange-rates",
  },
  {
    translationKey: "sidebar.settings",
    icon: <SettingsIcon />,
    path: "/settings",
  },
];

/**
 * Left-side navigation shown on medium screens and up.
 * Hidden on mobile so the main content can use full width.
 */
export function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <aside className="max-md:hidden flex md:w-64 flex-col items-start p-6 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors h-full">
      <Logo />

      {/* navigation */}
      <nav className="flex flex-col gap-2 w-full mt-10">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.translationKey}
            to={item.path} // Kam odkaz vede
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 transition-colors"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
              }`
            }
          >
            {item.icon}
            {t(item.translationKey)}
          </NavLink>
        ))}
      </nav>

      {/* notifications and pending imports */}
      <NotificationCenter />

      {/* feedback form */}
      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer rounded-xl font-medium"
      >
        <FeedbackIcon sx={{ fontSize: 22 }} />
        {t("sidebar.feedback")}
      </button>

      {/* Admin Mode Toggle - Placed directly above notifications */}
      {user?.role === "ADMIN" && (
        <div className="w-full border-slate-100 dark:border-slate-800">
          <NavLink
            to="/admin"
            className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60"
          >
            <span className="flex items-center gap-2">
              <AdminPanelSettingsIcon fontSize="small" />
              Admin Mode
            </span>
            <span className="text-xs font-normal text-rose-500 dark:text-rose-400">
              Switch
            </span>
          </NavLink>
        </div>
      )}

      <BaseModal
        title={t("sidebar.feedback")}
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      >
        <FeedbackModal onCancel={() => setIsFeedbackModalOpen(false)} />
      </BaseModal>
    </aside>
  );
}
