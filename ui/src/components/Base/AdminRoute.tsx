import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const AdminRoute = ({ children }: { children?: ReactNode }) => {
    const user = useAuthStore((state) => state.user);

    // If there is no user or user is not admin, redirect
    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}