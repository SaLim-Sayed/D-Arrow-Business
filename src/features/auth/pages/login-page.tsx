import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/login-form";
import { useAuth } from "../context/auth-context";
import { Navigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Spinner } from "@heroui/react";

import { Logo } from "@/components/shared/logo";

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
    return <Navigate to="/" replace state={{ choosePortal: true }} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-default-50 p-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 flex flex-col items-center gap-6">
        <Logo size="xl" />
        <h1 className="text-xl font-bold text-default-400 uppercase tracking-[0.3em]">
          {t("login.welcome")}
        </h1>
      </div>
      <LoginForm />
    </div>
  );
}
