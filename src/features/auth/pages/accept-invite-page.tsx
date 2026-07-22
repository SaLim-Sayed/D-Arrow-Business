import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Input, Spinner } from "@heroui/react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Users } from "lucide-react";
import { AuthBrandLayout } from "../components/auth-brand-layout";
import { AuthService } from "../api/auth.service";
import { InvitesService } from "@/features/companies/api/invites.service";
import { useAuthStore } from "@/stores/auth.store";
import type { TeamInvite } from "@/features/companies/types/invite.types";
import { cn } from "@/lib/utils";

const INVITE_FEATURES = [
  { key: "join", icon: Users },
  { key: "secure", icon: Lock },
] as const;

const inputClassNames = {
  label: "font-semibold text-default-700 pb-1",
  input: "text-sm",
  inputWrapper: cn(
    "bg-default-50/50 shadow-none border-default-200",
    "group-data-[focus=true]:border-primary group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-primary/15",
    "transition-all duration-200"
  ),
};

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] || "User";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function AcceptInvitePage() {
  const { token = "" } = useParams<{ token: string }>();
  const { t } = useTranslation(["auth", "settings"]);
  const navigate = useNavigate();
  const setAuthUser = useAuthStore.setState;

  const [invite, setInvite] = useState<TeamInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await InvitesService.getByToken(token);
        if (!cancelled) setInvite(data);
      } catch {
        if (!cancelled) setInvite(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const statusError = useMemo(() => {
    if (loading) return "";
    if (!invite) return t("invite.notFound");
    if (invite.status === "expired") return t("invite.expired");
    if (invite.status === "revoked") return t("invite.revoked");
    if (invite.status === "accepted") return t("invite.alreadyAccepted");
    return "";
  }, [invite, loading, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("invite.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("invite.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const response = await AuthService.acceptInvite({
        token,
        name: nameFromEmail(invite?.email || "User"),
        password,
      });
      setAuthUser({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      navigate("/", { replace: true, state: { choosePortal: true } });
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      const message = err instanceof Error ? err.message : "";
      if (code === "auth/email-already-in-use") {
        setError(t("invite.emailInUse"));
      } else if (message.startsWith("INVITE_")) {
        setError(t("invite.invalid"));
      } else {
        setError(t("invite.error"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dashboard-gradient">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <AuthBrandLayout
      title={t("invite.title")}
      subtitle={
        invite && invite.status === "pending"
          ? t("invite.subtitle", {
              company: invite.companyName,
              email: invite.email,
            })
          : t("invite.subtitleFallback")
      }
      backLabel={t("login.backToHome")}
      brandEyebrow={t("invite.brandEyebrow")}
      brandHeadline={t("invite.brandHeadline")}
      brandDescription={t("invite.brandDescription")}
      features={INVITE_FEATURES}
      featureLabel={(key) => t(`invite.brandFeatures.${key}`)}
    >
      {statusError ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-semibold">{statusError}</span>
          </div>
          <Button as={Link} to="/login" color="primary" className="w-full">
            {t("invite.goLogin")}
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-5" noValidate>
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <Input
            label={t("invite.email")}
            labelPlacement="outside"
            value={invite?.email ?? ""}
            isReadOnly
            variant="bordered"
            size="lg"
            radius="lg"
            classNames={inputClassNames}
          />

          <Input
            type={showPassword ? "text" : "password"}
            label={t("invite.password")}
            labelPlacement="outside"
            placeholder={t("invite.passwordPlaceholder")}
            value={password}
            onValueChange={setPassword}
            variant="bordered"
            size="lg"
            radius="lg"
            autoFocus
            autoComplete="new-password"
            startContent={<Lock className="h-4 w-4 text-default-400" />}
            endContent={
              <button
                type="button"
                className="rounded-lg p-1.5 text-default-400"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            classNames={inputClassNames}
          />

          <Input
            type={showPassword ? "text" : "password"}
            label={t("invite.confirmPassword")}
            labelPlacement="outside"
            placeholder={t("invite.passwordPlaceholder")}
            value={confirm}
            onValueChange={setConfirm}
            variant="bordered"
            size="lg"
            radius="lg"
            autoComplete="new-password"
            startContent={<Lock className="h-4 w-4 text-default-400" />}
            classNames={inputClassNames}
          />

          <p className="text-xs text-default-500">
            {t("invite.roleHint", {
              role: t(`team.globalRoles.${invite?.role}`, { ns: "settings" }),
            })}
          </p>

          <Button
            type="submit"
            color="primary"
            className="h-12 w-full bg-primary-gradient font-bold"
            isLoading={submitting}
            endContent={!submitting && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          >
            {submitting ? t("invite.loading") : t("invite.submit")}
          </Button>
        </form>
      )}
    </AuthBrandLayout>
  );
}
