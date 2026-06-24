import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import {
  ArrowRight,
  Layers,
  Globe2,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LANDING_APPS } from "../constants/landing-apps";
import { cn } from "@/lib/utils";

function LandingNav() {
  const { t } = useTranslation("landing");

  return (
    <header className="sticky top-0 z-50 border-b border-default-100 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className="shrink-0">
          <Logo size="sm" className="h-9" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-default-600 md:flex">
          <a href="#apps" className="hover:text-primary transition-colors">
            {t("nav.apps")}
          </a>
          <a href="#features" className="hover:text-primary transition-colors">
            {t("nav.features")}
          </a>
          <a href="#cta" className="hover:text-primary transition-colors">
            {t("nav.pricing")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Button
            as={Link}
            to="/login"
            variant="light"
            size="sm"
            className="hidden font-semibold sm:inline-flex"
          >
            {t("nav.signIn")}
          </Button>
          <Button
            as={Link}
            to="/register"
            color="primary"
            size="sm"
            className="font-semibold"
          >
            {t("nav.tryFree")}
          </Button>
        </div>
      </div>
    </header>
  );
}

function AppTile({
  label,
  icon: Icon,
  gradient,
}: {
  label: string;
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-3 text-center">
      <div
        className={cn(
          "flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform group-hover:scale-105 group-hover:shadow-lg",
          gradient
        )}
      >
        <Icon className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <span className="text-sm font-semibold text-foreground leading-tight max-w-[100px]">
        {label}
      </span>
    </div>
  );
}

const FEATURE_ITEMS = [
  { key: "integrated", icon: Layers },
  { key: "rtl", icon: Globe2 },
  { key: "secure", icon: Shield },
  { key: "fast", icon: Zap },
] as const;

export function LandingPage() {
  const { t } = useTranslation("landing");
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-default-50 text-foreground">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:px-6 md:pt-20 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
            {t("hero.title")}{" "}
            <span className="relative inline-block">
              <span className="relative z-10">{t("hero.titleHighlight")}</span>
              <span
                className="absolute -inset-x-2 bottom-1 z-0 h-3 rounded-sm bg-warning/70 md:h-4 md:bottom-2"
                aria-hidden
              />
            </span>
          </h1>
          <p className="mt-6 text-xl font-medium text-default-600 md:text-2xl">
            {t("hero.subtitle")}{" "}
            <span className="font-bold text-primary underline decoration-primary/30 underline-offset-4">
              {t("hero.subtitleHighlight")}
            </span>
          </p>
          <p className="mt-3 text-sm font-semibold text-default-500">
            {t("hero.priceNote")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              as={Link}
              to="/register"
              color="primary"
              size="lg"
              className="min-w-[200px] font-bold shadow-lg shadow-primary/25"
              endContent={<ArrowRight className="h-4 w-4" />}
            >
              {t("hero.ctaPrimary")}
            </Button>
            <Button
              as={Link}
              to="/login"
              variant="bordered"
              size="lg"
              className="min-w-[160px] font-semibold bg-background"
            >
              {t("hero.ctaSecondary")}
            </Button>
          </div>
        </div>
      </section>

      {/* Apps grid */}
      <section id="apps" className="bg-background px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-black md:text-3xl">{t("apps.title")}</h2>
            <p className="mt-3 text-default-500 max-w-2xl mx-auto">
              {t("apps.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 sm:grid-cols-4 md:grid-cols-7 md:gap-6">
            {LANDING_APPS.map((app) => (
              <AppTile
                key={app.id}
                label={t(app.labelKey)}
                icon={app.icon}
                gradient={app.gradient}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              as={Link}
              to="/register"
              variant="flat"
              color="primary"
              className="font-semibold"
              endContent={<ArrowRight className="h-4 w-4" />}
            >
              {t("apps.viewAll")}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 md:px-6 md:py-20 bg-default-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-black md:text-3xl">
            {t("features.title")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURE_ITEMS.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="rounded-2xl border border-default-200 bg-background p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-default-500 leading-relaxed">
                  {t(`features.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-primary to-violet-600 px-8 py-14 text-center text-white shadow-xl">
          <h2 className="text-2xl font-black md:text-4xl">{t("cta.title")}</h2>
          <p className="mt-4 text-white/80 md:text-lg">{t("cta.subtitle")}</p>
          <Button
            as={Link}
            to="/register"
            size="lg"
            className="mt-8 min-w-[200px] bg-white font-bold text-primary"
          >
            {t("cta.button")}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-default-200 bg-background px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-default-500 sm:flex-row sm:text-start">
          <p>{t("footer.tagline")}</p>
          <p>© {year} D-Arrow. {t("footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
}
