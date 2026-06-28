import { Button, Input } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/auth-context";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const authInputClassNames = {
  label: "font-semibold text-default-700 pb-1",
  input: "text-sm",
  inputWrapper: cn(
    "bg-default-50/50 shadow-none border-default-200",
    "group-data-[focus=true]:border-primary group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-primary/15",
    "group-data-[invalid=true]:border-danger group-data-[invalid=true]:ring-2 group-data-[invalid=true]:ring-danger/15",
    "transition-all duration-200"
  ),
  errorMessage: "text-danger text-xs",
};

export function LoginForm() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors, isSubmitted },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setError("");

    try {
      await login(data.email, data.password);
      navigate("/", { replace: true, state: { choosePortal: true } });
    } catch {
      setError(t("login.error"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-5"
      noValidate
    >
      {error && (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type="email"
            label={t("login.email")}
            labelPlacement="outside"
            placeholder={t("login.emailPlaceholder")}
            autoComplete="email"
            variant="bordered"
            size="lg"
            radius="lg"
            isInvalid={isSubmitted && !!errors.email}
            errorMessage={isSubmitted ? errors.email?.message : undefined}
            startContent={
              <Mail className="pointer-events-none h-4 w-4 text-default-400" />
            }
            classNames={authInputClassNames}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="login-password"
                className="text-sm font-semibold text-default-700"
              >
                {t("login.password")}
              </label>
              <Link
                to="/forgot-password"
                className="shrink-0 text-xs font-medium text-default-500 transition-colors hover:text-primary hover:underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              {...field}
              id="login-password"
              type={showPassword ? "text" : "password"}
              aria-label={t("login.password")}
              placeholder={t("login.passwordPlaceholder")}
              autoComplete="current-password"
              variant="bordered"
              size="lg"
              radius="lg"
              isInvalid={isSubmitted && !!errors.password}
              errorMessage={isSubmitted ? errors.password?.message : undefined}
              startContent={
                <Lock className="pointer-events-none h-4 w-4 text-default-400" />
              }
              classNames={authInputClassNames}
              endContent={
                <button
                  className="rounded-lg p-1.5 text-default-400 transition-colors hover:bg-default-100 hover:text-default-600 focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
          </div>
        )}
      />

      <Button
        type="submit"
        color="primary"
        className="mt-1 h-12 w-full bg-primary-gradient font-bold text-sm shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        isLoading={isSubmitting}
        endContent={!isSubmitting && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
      >
        {isSubmitting ? t("login.loading") : t("login.submit")}
      </Button>

      <p className="text-center text-sm text-default-500">
        {t("login.dontHaveAccount")}{" "}
        <Link
          to="/register"
          className="font-bold text-secondary transition-colors hover:text-secondary-600 hover:underline"
        >
          {t("login.createAccountLink")}
        </Link>
      </p>
    </form>
  );
}
