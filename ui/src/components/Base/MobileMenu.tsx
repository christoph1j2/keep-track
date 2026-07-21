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
import { NotificationCenter } from "./NotificationCenter";
import { useTranslation } from "react-i18next";
import { Logo } from "./Logo";
import { Extension } from "@mui/icons-material";

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
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const location = useLocation();
  const isOpen = openedPath === location.pathname;
  const { t } = useTranslation();

  const MENU_ITEMS: MenuItem[] = [
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

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setOpenedPath(open ? location.pathname : null);
    };

  return (
    <aside>
      {/* Drawer */}
      <Drawer
        open={isOpen}
        onClose={toggleDrawer(false)}
        classes={{
          paper: "dark:bg-slate-900", // Overrides the default white MUI background in dark mode
        }}
      >
        <div className="w-64 flex flex-col h-full bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
          <Logo />

          {/* Navigation list */}
          <List className="flex-1 px-2 py-4">
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    className={`rounded-xl mb-2 transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors"
                    }`}
                  >
                    <ListItemIcon
                      className={
                        isActive
                          ? "text-slate-900! dark:text-slate-100!"
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

          {/* Mobile Notification Center */}
          <NotificationCenter />
        </div>
      </Drawer>

      {/* Hamburger button trigger */}
      <button
        onClick={toggleDrawer(true)}
        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Open menu"
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
