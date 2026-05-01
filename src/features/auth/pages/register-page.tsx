import { Button, Form, Input, Card, CardHeader, CardBody } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import * as z from "zod";
import { useAuthStore } from "@/stores/auth.store";
import { AuthService } from "../api/auth.service";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  useTranslation("auth");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { initialize } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setError("");

    try {
      await AuthService.register(data);
      initialize(); // Re-initialize store to pick up new user
      navigate("/tasks/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="max-w-md w-full glass-card border-none p-4 md:p-8">
        <CardHeader className="flex flex-col gap-2 items-center pb-8">
          <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 rotate-12 mb-4 hover:rotate-0 transition-transform duration-500">
            <span className="text-3xl font-black text-white">D</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-center">
            Create Account
          </h1>
          <p className="text-default-500 text-center font-medium">
            Start managing your business with D-Arrow
          </p>
        </CardHeader>
        <CardBody>
          <Form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            validationErrors={errors as any}
          >
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-danger/10 p-4 text-sm text-danger border border-danger/20 w-full">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Full Name"
                  labelPlacement="outside"
                  placeholder="John Doe"
                  variant="bordered"
                  color="primary"
                  size="lg"
                  radius="lg"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
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
                  label="Email Address"
                  labelPlacement="outside"
                  placeholder="name@example.com"
                  variant="bordered"
                  color="primary"
                  size="lg"
                  radius="lg"
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            <Controller
              name="companyName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Company Name"
                  labelPlacement="outside"
                  placeholder="D-Arrow Business"
                  variant="bordered"
                  color="primary"
                  size="lg"
                  radius="lg"
                  isInvalid={!!errors.companyName}
                  errorMessage={errors.companyName?.message}
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
                  label="Password"
                  labelPlacement="outside"
                  placeholder="••••••••"
                  variant="bordered"
                  color="primary"
                  size="lg"
                  radius="lg"
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
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
              color="primary"
              className="w-full h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/30 mt-4"
              isLoading={isSubmitting}
              endContent={<ArrowRight className="h-4 w-4" />}
            >
              Get Started
            </Button>

            <p className="text-center text-sm text-default-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
