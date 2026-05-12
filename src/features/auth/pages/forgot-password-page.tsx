import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { AuthService } from "../api/auth.service";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      await AuthService.sendPasswordReset(email.trim());
      setSent(true);
    } catch {
      setError(t("forgotPassword.sendError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-default-50 p-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 mb-2">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("forgotPassword.step.email.title")}
          </h1>
          <p className="text-sm text-default-500">
            {t("forgotPassword.step.email.subtitle")}
          </p>
        </div>

        {sent ? (
          /* Success */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl bg-success/10 border border-success/20 p-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
              <p className="font-bold text-success text-sm">
                {t("forgotPassword.step.done.title")}
              </p>
              <p className="text-xs text-default-500">
                {t("forgotPassword.step.done.subtitle", { email })}
              </p>
            </div>
            <Button
              as={Link}
              to="/login"
              variant="flat"
              color="primary"
              className="w-full h-12 font-bold"
              startContent={<ArrowLeft className="h-4 w-4" />}
            >
              {t("forgotPassword.backToLogin")}
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-danger/10 p-4 text-sm text-danger border border-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <Input
              type="email"
              label={t("login.email")}
              labelPlacement="outside"
              placeholder="name@example.com"
              autoComplete="email"
              variant="bordered"
              color="primary"
              size="lg"
              radius="lg"
              value={email}
              onValueChange={setEmail}
              classNames={{ label: "font-bold text-default-700 mb-1" }}
            />

            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="w-full h-12 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30"
              isLoading={loading}
            >
              {t("forgotPassword.step.email.submit")}
            </Button>

            <p className="text-center text-sm text-default-500">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("forgotPassword.backToLogin")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
