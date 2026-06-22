import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const ProtectedRoute = () => {
  const user = useAuthStore((state) => state.user);

  // Pokud není uživatel přihlášen, přesměrujeme ho na přihlašovací stránku
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Pokud je uživatel přihlášen, renderujeme požadovanou komponentu
  return <Outlet />;
};
