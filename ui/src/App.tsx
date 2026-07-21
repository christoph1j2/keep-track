import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Overview } from "./pages/Overview";
import { Budgeting } from "./pages/Budgeting";
import { QuickAdd } from "./pages/QuickAdd";
import { NotFound } from "./pages/404";
import { Categories } from "./pages/Categories";
import { useConfirmStore } from "./store/confirmStore";
import { ConfirmDialog } from "./components/Modals/ConfirmDialog";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/Base/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Homepage } from "./pages/Homepage";

/**
 * Root application component that wires routing into the shared layout shell.
 */
function App() {
  const { isOpen, title, message, onConfirm, onCancel, hideConfirm } =
    useConfirmStore();
  console.log("BASE_URL: "+import.meta.env.BASE_URL);

  if (window.location.pathname === '/keeptrack') {
	window.location.replace('/keeptrack/');
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          element={
            <MainLayout>
              <Outlet />
            </MainLayout>
          }
        >
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budgeting" element={<Budgeting />} />
            <Route path="/quickadd" element={<QuickAdd />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>

      <ConfirmDialog
        open={isOpen}
        title={title}
        message={message}
        onConfirm={() => {
          onConfirm();
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
