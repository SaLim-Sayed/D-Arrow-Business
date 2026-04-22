import { Button, Form, Input } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";
import { useAuth } from "../context/auth-context";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/tasks/dashboard";

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setError("");

    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch {
      setError(t("login.error"));
    }
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-sm w-full mx-auto"
      validationErrors={errors as any}
    >
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-danger/10 p-4 text-sm text-danger border border-danger/20 w-full animate-in fade-in slide-in-from-top-2 duration-300">
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
            placeholder="name@example.com"
            autoComplete="email"
            variant="bordered"
            color="primary"
            size="lg"
            radius="lg"
            isInvalid={!!errors.email}
            errorMessage={errors.email?.message}
            className="group"
            classNames={{
              inputWrapper:
                "group-data-[focus=true]:border-primary group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-primary/20 transition-all duration-300",
              label: "font-bold text-default-700 tracking-tight mb-1",
            }}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            type={showPassword ? "text" : "password"}
            label={t("login.password")}
            labelPlacement="outside"
            placeholder="••••••••"
            autoComplete="current-password"
            variant="bordered"
            color="primary"
            size="lg"
            radius="lg"
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
            classNames={{
              inputWrapper:
                "group-data-[focus=true]:border-primary group-data-[focus=true]:ring-2 group-data-[focus=true]:ring-primary/20 transition-all duration-300",
              label: "font-bold text-default-700 tracking-tight mb-1",
            }}
            endContent={
              <button
                className="focus:outline-none p-2 hover:bg-default-100 rounded-xl transition-all active:scale-90"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-default-400" />
                ) : (
                  <Eye className="h-5 w-5 text-default-400" />
                )}
              </button>
            }
          />
        )}
      />

      <Button
        type="submit"
        variant="solid"
        color="primary"
        className="w-full mt-4 h-12 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
        isLoading={isSubmitting}
      >
        {t("login.submit")}
      </Button>

      <div className="pt-6 border-t  w-full  border-default-100 mt-2">
        <div className="rounded-2xl bg-default-50 p-4 border border-default-200">
          <p className="text-center text-[10px] font-bold text-default-400 uppercase tracking-wider mb-2">
            Demo Credentials
          </p>
          <div className="flex justify-center items-center gap-4 text-xs">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-default-400 uppercase">
                Email
              </span>
              <span className="text-default-900 font-bold">
                admin@darrow.com
              </span>
            </div>
            <div className="h-8 w-px bg-default-200" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-default-400 uppercase">
                Password
              </span>
              <span className="text-default-900 font-bold">admin123</span>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
