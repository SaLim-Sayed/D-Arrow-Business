import { Button, Input } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  FileDigit,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { AuthService } from "../api/auth.service";
import { GoogleSignInButton } from "./google-sign-in-button";

const inputClassNames = {
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

export function RegisterForm() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { initialize } = useAuthStore();

  const registerSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t("register.error")),
        email: z.string().email(),
        companyName: z.string().min(2),
        commercialRegister: z
          .string()
          .min(5, t("register.commercialRegisterError"))
          .optional()
          .or(z.literal("")),
        password: z.string().min(6),
      }),
    [t]
  );

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors, isSubmitted },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      commercialRegister: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setError("");

    try {
      await AuthService.register(data);
      initialize();
      navigate("/", { replace: true, state: { choosePortal: true } });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("register.error");
      setError(message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-4"
      noValidate
    >
      {error && (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t("register.name")}
              labelPlacement="outside"
              placeholder={t("register.namePlaceholder")}
              variant="bordered"
              size="lg"
              radius="lg"
              isInvalid={isSubmitted && !!errors.name}
              errorMessage={isSubmitted ? errors.name?.message : undefined}
              startContent={
                <User className="pointer-events-none h-4 w-4 text-default-400" />
              }
              classNames={inputClassNames}
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              label={t("register.email")}
              labelPlacement="outside"
              placeholder={t("register.emailPlaceholder")}
              autoComplete="email"
              variant="bordered"
              size="lg"
              radius="lg"
              isInvalid={isSubmitted && !!errors.email}
              errorMessage={isSubmitted ? errors.email?.message : undefined}
              startContent={
                <Mail className="pointer-events-none h-4 w-4 text-default-400" />
              }
              classNames={inputClassNames}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="companyName"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t("register.companyName")}
              labelPlacement="outside"
              placeholder={t("register.companyNamePlaceholder")}
              variant="bordered"
              size="lg"
              radius="lg"
              isInvalid={isSubmitted && !!errors.companyName}
              errorMessage={isSubmitted ? errors.companyName?.message : undefined}
              startContent={
                <Building2 className="pointer-events-none h-4 w-4 text-default-400" />
              }
              classNames={inputClassNames}
            />
          )}
        />

        <Controller
          name="commercialRegister"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label={t("register.commercialRegister")}
              labelPlacement="outside"
              placeholder={t("register.commercialRegisterPlaceholder")}
              variant="bordered"
              size="lg"
              radius="lg"
              description={t("register.commercialRegisterHint")}
              isInvalid={isSubmitted && !!errors.commercialRegister}
              errorMessage={
                isSubmitted ? errors.commercialRegister?.message : undefined
              }
              startContent={
                <FileDigit className="pointer-events-none h-4 w-4 text-default-400" />
              }
              classNames={inputClassNames}
            />
          )}
        />
      </div>

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type={showPassword ? "text" : "password"}
            label={t("register.password")}
            labelPlacement="outside"
            placeholder={t("register.passwordPlaceholder")}
            autoComplete="new-password"
            variant="bordered"
            size="lg"
            radius="lg"
            isInvalid={isSubmitted && !!errors.password}
            errorMessage={isSubmitted ? errors.password?.message : undefined}
            startContent={
              <Lock className="pointer-events-none h-4 w-4 text-default-400" />
            }
            classNames={inputClassNames}
            endContent={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-1.5 text-default-400 transition-colors hover:bg-default-100 hover:text-default-600 focus:outline-none"
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
        )}
      />

      <Button
        type="submit"
        color="primary"
        className="mt-2 h-12 w-full bg-primary-gradient font-bold text-sm shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        isLoading={isSubmitting}
        endContent={
          !isSubmitting && <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        }
      >
        {isSubmitting ? t("register.loading") : t("register.submit")}
      </Button>

      <div className="relative flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-default-200" />
        <span className="text-xs font-medium text-default-400">{t("login.or")}</span>
        <div className="h-px flex-1 bg-default-200" />
      </div>

      <GoogleSignInButton />

      <p className="text-center text-sm text-default-500">
        {t("register.alreadyHaveAccount")}{" "}
        <Link
          to="/login"
          className="font-bold text-primary transition-colors hover:text-primary-600 hover:underline"
        >
          {t("register.signIn")}
        </Link>
      </p>
    </form>
  );
}
