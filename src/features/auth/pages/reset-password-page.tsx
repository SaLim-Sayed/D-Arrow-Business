import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Input } from "@heroui/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { AuthService } from "../api/auth.service";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

type PageState = "verifying" | "form" | "success" | "invalid";

export function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("verifying");
  const [resetEmail, setResetEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const oobCode = searchParams.get("oobCode") ?? "";
  const mode = searchParams.get("mode") ?? "";

  /* ── On mount: verify the oobCode from the URL ── */
  useEffect(() => {
    // Firebase puts mode=resetPassword in the URL — guard against other modes
    if (!oobCode || (mode && mode !== "resetPassword")) {
      setPageState("invalid");
      return;
    }
    AuthService.verifyResetCode(oobCode)
      .then((email) => {
        setResetEmail(email);
        setPageState("form");
      })
      .catch(() => setPageState("invalid"));
  }, [oobCode]);

  /* ── Submit new password ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("resetPassword.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("resetPassword.passwordMismatch"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await AuthService.confirmReset(oobCode, password);
      setPageState("success");
      // Redirect to login after 2.5 s
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch {
      setError(t("resetPassword.error"));
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
        {/* ── VERIFYING ── */}
        {pageState === "verifying" && (
          <div className="flex flex-col items-center gap-4 text-default-400">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {t("resetPassword.verifying")}
            </p>
          </div>
        )}

        {/* ── INVALID LINK ── */}
        {pageState === "invalid" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-danger/10 mb-2">
                <AlertCircle className="h-8 w-8 text-danger" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("resetPassword.invalidTitle")}
              </h1>
              <p className="text-sm text-default-500">
                {t("resetPassword.invalidSubtitle")}
              </p>
            </div>
            <Button
              as={Link}
              to="/forgot-password"
              color="primary"
              variant="flat"
              className="w-full h-12 font-bold"
            >
              {t("resetPassword.tryAgain")}
            </Button>
          </div>
        )}

        {/* ── NEW PASSWORD FORM ── */}
        {pageState === "form" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 mb-2">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("resetPassword.title")}
              </h1>
              <p className="text-sm text-default-500">
                {t("resetPassword.subtitle", { email: resetEmail })}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 space-y-5"
            >
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-danger/10 p-4 text-sm text-danger border border-danger/20 animate-in fade-in duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <Input
                label={t("resetPassword.newPassword")}
                labelPlacement="outside"
                placeholder="••••••••"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                variant="bordered"
                color="primary"
                size="lg"
                radius="lg"
                value={password}
                onValueChange={setPassword}
                classNames={{ label: "font-bold text-default-700 mb-1" }}
                endContent={
                  <button
                    type="button"
                    className="p-2 hover:bg-default-100 rounded-xl transition-all"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? (
                      <EyeOff className="h-5 w-5 text-default-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-default-400" />
                    )}
                  </button>
                }
              />

              <Input
                label={t("resetPassword.confirmPassword")}
                labelPlacement="outside"
                placeholder="••••••••"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                variant="bordered"
                color="primary"
                size="lg"
                radius="lg"
                value={confirm}
                onValueChange={setConfirm}
                classNames={{ label: "font-bold text-default-700 mb-1" }}
                endContent={
                  <button
                    type="button"
                    className="p-2 hover:bg-default-100 rounded-xl transition-all"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5 text-default-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-default-400" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="solid"
                color="primary"
                className="w-full h-12 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30"
                isLoading={loading}
              >
                {t("resetPassword.submit")}
              </Button>

              <p className="text-center text-sm">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("forgotPassword.backToLogin")}
                </Link>
              </p>
            </form>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {pageState === "success" && (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {t("resetPassword.successTitle")}
              </h2>
              <p className="text-sm text-default-500">
                {t("resetPassword.successSubtitle")}
              </p>
            </div>
            <div className="h-1 w-full rounded-full bg-default-100 overflow-hidden">
              <div className="h-full bg-success rounded-full animate-[progress_2.5s_linear_forwards]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
