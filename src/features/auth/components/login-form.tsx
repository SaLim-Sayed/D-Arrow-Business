import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/auth-context";
import {
  Button,
  Input,
  InputGroup,
  InputGroupInput,
  InputGroupSuffix,
  Card,
  CardHeader,
  CardContent,
  Spinner,
  Form,
} from "@heroui/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

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
    <Card className="w-full max-w-md p-2">
      <CardHeader className="flex flex-col gap-1 items-center">
        <h2 className="text-2xl font-bold">{t("login.title")}</h2>
        <p className="text-default-500 text-small">{t("login.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-medium bg-danger/10 p-3 text-sm text-danger w-full">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {t("login.email")}
                </label>
                <Input
                  {...field}
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  variant="primary"
                  fullWidth
                />
                {errors.email && (
                  <span className="text-xs text-danger">
                    {errors.email.message}
                  </span>
                )}
              </div>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {t("login.password")}
                </label>
                <InputGroup fullWidth variant="primary">
                  <InputGroupInput
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(e.target.value)
                    }
                  />
                  <InputGroupSuffix>
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-default-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-default-400" />
                      )}
                    </button>
                  </InputGroupSuffix>
                </InputGroup>
                {errors.password && (
                  <span className="text-xs text-danger">
                    {errors.password.message}
                  </span>
                )}
              </div>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-4 flex items-center justify-center gap-2"
            isDisabled={isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" color="current" />}
            {isSubmitting ? t("login.loading") : t("login.submit")}
          </Button>

          <p className="text-center text-xs text-default-400">
            Demo: admin@darrow.com / admin123
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}
