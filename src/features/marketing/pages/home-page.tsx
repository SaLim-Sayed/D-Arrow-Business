import { useAuth } from "@/features/auth/context/auth-context";
import { PortalPickerPage } from "@/features/portals/pages/PortalPickerPage";
import { LandingPage } from "./landing-page";
import { Spinner } from "@heroui/react";

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-default-50">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <PortalPickerPage />;
  }

  return <LandingPage />;
}
