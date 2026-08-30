import { Grid } from "@mui/material";
import { useAdmin } from "../../layouts/AdminLayout";
import {
  ShowChart as ShowChartIcon,
  AutoAwesome as AutoAwesomeIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Category as CategoryIcon,
  Extension as ExtensionIcon,
} from "@mui/icons-material";

export const AdminAnalyticsPage = () => {
  const { stats } = useAdmin();

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ShowChartIcon className="text-purple-600 dark:text-purple-400" />
            Platform & AI Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track user adoption, AI categorization rates, 30-day activity trends, and system volume.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <Grid container spacing={3}>
        {/* AI Metrics Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <AutoAwesomeIcon className="text-purple-500" />
                AI Categorization Performance
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {stats?.aiCategorizationRate || 0}% Adoption
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">AI Categorized</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.aiCategorizedCount || 0}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Transactions processed by AI</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Manual / Standard</div>
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {(stats?.transactionCount || 0) - (stats?.aiCategorizedCount || 0)}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Manual or CSV imported</div>
              </div>
            </div>
          </div>
        </Grid>

        {/* 30-Day Growth Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <PeopleIcon className="text-blue-500" />
                30-Day Activity Trends
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">New Users (30d)</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  +{stats?.newUsersLast30Days || 0}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Recent signups</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">New Transactions (30d)</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  +{stats?.transactionsLast30Days || 0}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Recent records added</div>
              </div>
            </div>
          </div>
        </Grid>

        {/* System Resource Totals */}
        <Grid size={{ xs: 12 }}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="font-bold mb-4 text-slate-800 dark:text-slate-100">
              System Resource Totals
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                <ReceiptIcon className="text-emerald-500 mb-1" />
                <div className="text-xs text-slate-400 dark:text-slate-500">Total Transactions</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats?.transactionCount || 0}</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                <AccountBalanceWalletIcon className="text-amber-500 mb-1" />
                <div className="text-xs text-slate-400 dark:text-slate-500">Total Budgets</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {(stats?.budgetCount || 0) + (stats?.complexBudgetCount || 0)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                <CategoryIcon className="text-indigo-500 mb-1" />
                <div className="text-xs text-slate-400 dark:text-slate-500">Custom Categories</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats?.categoryCount || 0}</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                <ExtensionIcon className="text-rose-500 mb-1" />
                <div className="text-xs text-slate-400 dark:text-slate-500">Templates Created</div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats?.templateCount || 0}</div>
              </div>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};
