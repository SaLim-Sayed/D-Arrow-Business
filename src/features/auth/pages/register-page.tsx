import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Spinner } from "@heroui/react";
import {
  BarChart3,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import { AuthBrandLayout } from "../components/auth-brand-layout";
import { RegisterForm } from "../components/register-form";
import { useAuth } from "../context/auth-context";

const REGISTER_FEATURES = [
  { key: "free", icon: Sparkles },
  { key: "setup", icon: Rocket },
  { key: "team", icon: Users },
  { key: "tools", icon: BarChart3 },
] as const;

export function RegisterPage() {
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
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      backLabel={t("login.backToHome")}
      brandEyebrow={t("register.brandEyebrow")}
      brandHeadline={t("register.brandHeadline")}
      brandDescription={t("register.brandDescription")}
      features={REGISTER_FEATURES}
      featureLabel={(key) => t(`register.brandFeatures.${key}`)}
      maxWidthClass="max-w-[520px]"
    >
      <RegisterForm />
    </AuthBrandLayout>
  );
}
