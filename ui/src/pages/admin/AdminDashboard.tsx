import { Link } from "react-router-dom";
import { Grid, Button } from "@mui/material";
import { useAdmin } from "../../layouts/AdminLayout";
import {
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AutoAwesome as AutoAwesomeIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Campaign as CampaignIcon,
  ShowChart as ShowChartIcon,
  CleaningServices as CleaningServicesIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";

export const AdminDashboard = () => {
  const { stats } = useAdmin();

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Admin Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep Track Platform Command Center & Executive Summary.
          </p>
        </div>
      </div>

      {/* Primary Key Stats Grid */}
      <Grid container spacing={2} className="mb-6">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <PeopleIcon fontSize="small" className="text-blue-500" />
                Total Users
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                +{stats?.newUsersLast30Days || 0} in 30d
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.userCount || 0}</p>
          </div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ReceiptIcon fontSize="small" className="text-emerald-500" />
                Total Transactions
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                +{stats?.transactionsLast30Days || 0} in 30d
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.transactionCount || 0}</p>
          </div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AutoAwesomeIcon fontSize="small" className="text-purple-500" />
                AI Categorization
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {stats?.aiCategorizationRate || 0}%
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.aiCategorizedCount || 0}</p>
          </div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <AccountBalanceWalletIcon fontSize="small" className="text-amber-500" />
                Active Budgets
              </h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {(stats?.budgetCount || 0) + (stats?.complexBudgetCount || 0)}
            </p>
          </div>
        </Grid>
      </Grid>

      {/* Admin Modules Navigation Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Admin Modules & Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Management Module */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-200 dark:hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <PeopleIcon />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Management</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                View all registered accounts, inspect user usage stats, update user roles, and manage access.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">{stats?.userCount || 0} Total Accounts</span>
              <Button
                component={Link}
                to="/admin/users"
                size="small"
                endIcon={<ArrowForwardIcon />}
                className="text-blue-600 dark:text-blue-400 font-semibold"
              >
                Go to Users
              </Button>
            </div>
          </div>

          {/* Announcements Module */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-200 dark:hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <CampaignIcon />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Broadcast Announcements</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Send system updates, maintenance alerts, or feature announcements directly to user notification centers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">Broadcast Center</span>
              <Button
                component={Link}
                to="/admin/announcements"
                size="small"
                endIcon={<ArrowForwardIcon />}
                className="text-purple-600 dark:text-purple-400 font-semibold"
              >
                Go to Announcements
              </Button>
            </div>
          </div>

          {/* Analytics Module */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-200 dark:hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <ShowChartIcon />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Platform & AI Analytics</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Deep-dive into AI categorization rate, 30-day user growth, transaction volume, and resource usage.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">{stats?.aiCategorizationRate || 0}% AI Rate</span>
              <Button
                component={Link}
                to="/admin/analytics"
                size="small"
                endIcon={<ArrowForwardIcon />}
                className="text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                Go to Analytics
              </Button>
            </div>
          </div>

          {/* Maintenance Module */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-200 dark:hover:border-slate-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <CleaningServicesIcon />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">System Maintenance</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Monitor background CSV import jobs status and execute database maintenance & stale job purging.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">{stats?.importJobStats?.total || 0} Import Jobs</span>
              <Button
                component={Link}
                to="/admin/maintenance"
                size="small"
                endIcon={<ArrowForwardIcon />}
                className="text-rose-600 dark:text-rose-400 font-semibold"
              >
                Go to Maintenance
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};