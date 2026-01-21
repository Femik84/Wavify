import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authstore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const loading = useAuthStore((state) => state.loading);

  // Optional: show loader while auth is resolving
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}
