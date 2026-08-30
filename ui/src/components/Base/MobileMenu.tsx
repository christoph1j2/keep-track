import { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import type { ReactNode } from "react";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CategoryIcon from "@mui/icons-material/Category";
import SettingsIcon from "@mui/icons-material/Settings";
import FeedbackIcon from "@mui/icons-material/Feedback";
import PeopleIcon from "@mui/icons-material/People";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Extension } from "@mui/icons-material";
import { NotificationCenter } from "./NotificationCenter";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";
import { BaseModal } from "../Modals/BaseModal";
import { FeedbackModal } from "../Modals/FeedbackModal";
import { useAuthStore } from "../../store/authStore";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import CampaignIcon from "@mui/icons-material/Campaign";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

interface MenuItem {
  label: string;
  icon: ReactNode;
  path: string;
}

/**
 * Mobile navigation drawer that opens from the left side.
 * Closes automatically when route changes.
 */
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const isAdminMode = location.pathname.startsWith("/admin");

  const USER_MENU_ITEMS: MenuItem[] = [
    {
      label: t("sidebar.dashboard"),
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      label: t("sidebar.overview"),
      icon: <ShowChartIcon />,
      path: "/overview",
    },
    {
      label: t("sidebar.categories"),
      icon: <CategoryIcon />,
      path: "/categories",
    },
    {
      label: t("sidebar.budgeting"),
      icon: <AccountBalanceWalletIcon />,
      path: "/budgeting",
    },
    { label: t("sidebar.quickAdd"), icon: <Extension />, path: "/quickadd" },
    { label: t("sidebar.settings"), icon: <SettingsIcon />, path: "/settings" },
  ];

  const ADMIN_MENU_ITEMS: MenuItem[] = [
    {
      label: "Overview",
      icon: <DashboardIcon />,
      path: "/admin",
    },
    {
      label: "User Management",
      icon: <PeopleIcon />,
      path: "/admin/users",
    },
    {
      label: "Announcements",
      icon: <CampaignIcon />,
      path: "/admin/announcements",
    },
    {
      label: "Analytics",
      icon: <ShowChartIcon />,
      path: "/admin/analytics",
    },
    {
      label: "Maintenance",
      icon: <CleaningServicesIcon />,
      path: "/admin/maintenance",
    },
  ];

  const currentItems = isAdminMode ? ADMIN_MENU_ITEMS : USER_MENU_ITEMS;

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setIsOpen(open);
    };

  return (
    <aside>
      {/* Drawer */}
      <Drawer
        open={isOpen}
        onClose={toggleDrawer(false)}
        classes={{
          paper: "dark:bg-slate-900", // Overrides default white MUI background in dark mode
        }}
      >
        <div className="w-64 flex flex-col h-full bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors p-4">
          <div className="px-6 py-2">
            <Logo isAdmin={isAdminMode} />
          </div>

          {/* Navigation list */}
          <List className="flex-1 px-2 py-4">
            {isAdminMode && (
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-3 mb-2">
                Admin Panel
              </div>
            )}
            {currentItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-xl mb-2 transition-colors ${
                      isActive
                        ? isAdminMode
                          ? "bg-rose-50 text-rose-900 dark:bg-slate-800 dark:text-rose-300 font-semibold"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors"
                    }`}
                  >
                    <ListItemIcon
                      className={
                        isActive
                          ? isAdminMode
                            ? "text-rose-700! dark:text-rose-400!"
                            : "text-slate-900! dark:text-slate-100!"
                          : "text-slate-600! dark:text-slate-400!"
                      }
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Toggle between Normal App and Admin Layout - Placed directly above notifications */}
          {isAdminMode ? (
            <div className="px-2 mb-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <NavLink
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <span className="flex items-center gap-2">
                  <ArrowBackIcon fontSize="small" />
                  User App
                </span>
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">Exit Admin</span>
              </NavLink>
            </div>
          ) : (
            user?.role === "ADMIN" && (
              <div className="px-2 mb-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <NavLink
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60"
                >
                  <span className="flex items-center gap-2">
                    <AdminPanelSettingsIcon fontSize="small" />
                    Admin Mode
                  </span>
                  <span className="text-xs font-normal text-rose-500 dark:text-rose-400">Switch</span>
                </NavLink>
              </div>
            )
          )}

          {/* Mobile Notification Center */}
          <NotificationCenter />

          {/* feedback form */}
          <button
            onClick={() => {
              setIsOpen(false);
              setIsFeedbackModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer rounded-xl font-medium"
          >
            <FeedbackIcon sx={{ fontSize: 22 }} />
            {t("sidebar.feedback")}
          </button>
        </div>
      </Drawer>

      <BaseModal
        title={t("sidebar.feedback")}
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      >
        <FeedbackModal onCancel={() => setIsFeedbackModalOpen(false)} />
      </BaseModal>

      {/* Hamburger button trigger */}
      <button
        onClick={toggleDrawer(true)}
        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        aria-label={t("common.openMenu")}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </aside>
  );
}
