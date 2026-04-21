import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/login-form";
import { useAuth } from "../context/auth-context";
import { Navigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/tasks/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{t("login.welcome")}</h1>
      </div>
      <LoginForm />
    </div>
  );
}
