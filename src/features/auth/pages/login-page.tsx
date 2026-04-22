import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/login-form";
import { useAuth } from "../context/auth-context";
import { Navigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Spinner } from "@heroui/react";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" color="secondary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/tasks/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-default-50 p-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {t("login.welcome")}
        </h1>
      </div>
      <LoginForm />
    </div>
  );
}
