import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Spinner } from "@heroui/react";
import {
  BarChart3,
  FileText,
  Layers,
  Users,
} from "lucide-react";
import { AuthBrandLayout } from "../components/auth-brand-layout";
import { LoginForm } from "../components/login-form";
import { useAuth } from "../context/auth-context";

const LOGIN_FEATURES = [
  { key: "crm", icon: FileText },
  { key: "billing", icon: BarChart3 },
  { key: "people", icon: Users },
  { key: "apps", icon: Layers },
] as const;

export function LoginPage() {
  const { t } = useTranslation("auth");
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dashboard-gradient">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace state={{ choosePortal: true }} />;
  }

  return (
    <AuthBrandLayout
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      backLabel={t("login.backToHome")}
      brandEyebrow={t("login.brandEyebrow")}
      brandHeadline={t("login.brandHeadline")}
      brandDescription={t("login.brandDescription")}
      features={LOGIN_FEATURES}
      featureLabel={(key) => t(`login.brandFeatures.${key}`)}
    >
      <LoginForm />
    </AuthBrandLayout>
  );
}
