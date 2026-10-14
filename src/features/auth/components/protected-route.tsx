import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { companyRedirectTarget } from "@/app/company-url";
import { useAuth } from "../context/auth-context";

function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Signed-in pages always live under the user's company id (/d-arrow/...).
  // The basename is fixed when the router is created, so switching it needs a
  // full navigation.
  const companyTarget =
    isAuthenticated && user ? companyRedirectTarget(user.companyId, location) : null;

  useEffect(() => {
    if (companyTarget) window.location.replace(companyTarget);
  }, [companyTarget]);

  if (isLoading || companyTarget) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
