import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * ProtectedRoute guards authenticated routes by checking user session state.
 * Redirects unauthenticated visitors to the login view.
 */
export const ProtectedRoute = () => {
  const user = useAuthStore((state) => state.user);

  // If user is not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, render protected child routes
  return <Outlet />;
};
