import { Link } from "react-router-dom";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import {
  LanguageSwitcher,
  LanguageTogglePills,
} from "@/components/layout/language-switcher";
import { Logo } from "@/components/shared/logo";

export interface AuthBrandFeature {
  key: string;
  icon: LucideIcon;
}

interface AuthBrandLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  brandEyebrow: string;
  brandHeadline: string;
  brandDescription: string;
  features: readonly AuthBrandFeature[];
  featureLabel: (key: string) => string;
  backLabel: string;
  maxWidthClass?: string;
}

export function AuthBrandLayout({
  title,
  subtitle,
  children,
  brandEyebrow,
  brandHeadline,
  brandDescription,
  features,
  featureLabel,
  backLabel,
  maxWidthClass = "max-w-[420px]",
}: AuthBrandLayoutProps) {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden"
      >
        <div className="absolute -top-24 end-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <aside className="relative hidden w-[44%] max-w-xl shrink-0 flex-col justify-between overflow-hidden bg-primary-gradient p-10 text-white lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
        >
          <div className="absolute -top-20 -start-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 end-0 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-block transition-opacity hover:opacity-90">
            <Logo size="md" className="h-16 w-auto max-w-[220px] drop-shadow-md" />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              {brandEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight xl:text-4xl">
              {brandHeadline}
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/80">
              {brandDescription}
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="font-medium text-white/90">{featureLabel(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} D-Arrow Business
        </p>
      </aside>

      <main className="relative flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-default-500 transition-colors hover:bg-default-100 hover:text-default-800"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageTogglePills className="hidden sm:inline-flex" />
            <LanguageSwitcher compact className="sm:hidden" />
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-2 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="mb-6 transition-opacity hover:opacity-90 lg:hidden"
          >
            <Logo size="lg" className="h-24 w-auto max-w-[280px]" />
          </Link>

          <div
            className={`w-full ${maxWidthClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}
          >
            <div className="mb-6 text-center lg:text-start">
              <div className="mb-5 hidden justify-start lg:flex">
                <Link to="/" className="transition-opacity hover:opacity-90">
                  <Logo size="sm" className="h-12 w-auto max-w-[180px]" />
                </Link>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-default-900 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-default-500 sm:text-base">{subtitle}</p>
            </div>

            <div className="glass-card rounded-3xl p-6 shadow-premium sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
