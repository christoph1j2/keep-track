import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CampaignIcon from "@mui/icons-material/Campaign";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { NotificationCenter } from "./NotificationCenter";
import { Logo } from "./Logo";
import { FeedbackModal } from "../Modals/FeedbackModal";
import { BaseModal } from "../Modals/BaseModal";
import { useTranslation } from "react-i18next";

interface MenuItem {
  label: string;
  icon: ReactNode;
  path: string;
}

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

/**
 * Dedicated left-side navigation for the Admin interface.
 */
export function AdminSidebar() {
  const { t } = useTranslation();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <aside className="max-md:hidden flex md:w-64 flex-col items-start p-6 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors h-full">
      <Logo isAdmin={true} />

      {/* Admin navigation */}
      <nav className="flex flex-col gap-2 w-full mt-10">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-4 mb-1">
          Admin Panel
        </div>
        {ADMIN_MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-rose-50 text-rose-900 border border-rose-200 dark:bg-slate-800 dark:text-rose-300 dark:border-slate-700 transition-colors shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Notifications */}
      <NotificationCenter />

      {/* Feedback form */}
      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer rounded-xl font-medium"
      >
        <FeedbackIcon sx={{ fontSize: 22 }} />
        {t("sidebar.feedback")}
      </button>

      {/* Switch back to User Mode - Placed directly under Feedback */}
      <div className="w-full">
        <NavLink
          to="/dashboard"
          className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800/60"
        >
          <span className="flex items-center gap-2">
            <ArrowBackIcon fontSize="small" />
            User Mode
          </span>
          <span className="text-xs font-normal text-blue-500 dark:text-blue-400">
            Switch
          </span>
        </NavLink>
      </div>

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
