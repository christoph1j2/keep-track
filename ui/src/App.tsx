import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./components/Base/ProtectedRoute";
import { AdminRoute } from "./components/Base/AdminRoute";
import { Dashboard } from "./pages/Dashboard";
import { Overview } from "./pages/Overview";
import { Categories } from "./pages/Categories";
import { Budgeting } from "./pages/Budgeting";
import { QuickAdd } from "./pages/QuickAdd";
import { ExchangeRates } from "./pages/ExchangeRates";
import { Settings } from "./pages/Settings";
import { Homepage } from "./pages/Homepage";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminAnnouncementsPage } from "./pages/admin/AdminAnnouncementsPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminMaintenancePage } from "./pages/admin/AdminMaintenancePage";
import { Toaster } from "react-hot-toast";
import { ConfirmDialog } from "./components/Modals/ConfirmDialog";
import { useConfirmStore } from "./store/confirmStore";

/**
 * Root component defining application routes and top-level providers.
 */
function App() {
  const { isOpen, title, message, onConfirm, onCancel, hideConfirm } =
    useConfirmStore();

  if (window.location.pathname === "/keeptrack") {
    window.location.replace("/keeptrack/");
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "text-slate-800 dark:text-slate-100 dark:bg-slate-800 dark:border dark:border-slate-700",
        }}
      />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          {/* Main User App Layout */}
          <Route
            element={
              <MainLayout>
                <Outlet />
              </MainLayout>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budgeting" element={<Budgeting />} />
            <Route path="/quickadd" element={<QuickAdd />} />
            <Route path="/exchange-rates" element={<ExchangeRates />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Dedicated Admin App Layout */}
          <Route element={<AdminRoute />}>
            <Route
              element={
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route
                path="/admin/announcements"
                element={<AdminAnnouncementsPage />}
              />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route
                path="/admin/maintenance"
                element={<AdminMaintenancePage />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>

      <ConfirmDialog
        open={isOpen}
        title={title}
        message={message}
        onConfirm={async () => {
          if (onConfirm) await onConfirm();
          hideConfirm();
        }}
        onCancel={() => {
          if (onCancel) onCancel();
          hideConfirm();
        }}
      />
    </BrowserRouter>
  );
}

export default App;
