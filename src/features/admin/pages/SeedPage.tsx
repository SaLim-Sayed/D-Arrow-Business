import { useState } from "react";
import { seedFirestore } from "@/lib/seed-firestore";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { Database, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useTranslation } from "react-i18next";

export function SeedPage() {
  const { t } = useTranslation("common");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setStatus("loading");
    setError(null);
    try {
      await seedFirestore();
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setError(err.message || t("seed.failed"));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title={t("seed.title")} 
        description={t("seed.description")}
      />

      <Card className="glass-card border-none overflow-hidden">
        <CardHeader className="bg-primary/10 px-6 py-4 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl text-white">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-primary">{t("seed.cardTitle")}</h3>
              <p className="text-xs text-primary/70 font-medium">{t("seed.cardSubtitle")}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-8">
          <div className="flex flex-col items-center gap-6 py-4">
            {status === "idle" && (
              <div className="text-center space-y-4">
                <p className="text-default-500 text-sm leading-relaxed">
                  {t("seed.instructions")}
                </p>
                <Button 
                  color="primary" 
                  size="lg" 
                  onPress={handleSeed}
                  className="font-black uppercase tracking-widest shadow-xl shadow-primary/30 h-14 px-12 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  {t("seed.startButton")}
                </Button>
              </div>
            )}

            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Spinner size="lg" color="primary" />
                <p className="font-bold text-default-700 animate-pulse uppercase tracking-widest text-xs">
                  {t("seed.loading")}
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4 text-center animate-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center text-success mb-2">
                  <CheckCircle2 className="h-10 w-10 stroke-[3px]" />
                </div>
                <h3 className="text-2xl font-black text-default-900">{t("seed.success")}</h3>
                <p className="text-default-500 max-w-sm">
                  {t("seed.successMessage")}
                </p>
                <Button 
                  color="primary" 
                  variant="flat"
                  onPress={() => setStatus("idle")}
                  className="mt-4 font-bold"
                >
                  {t("seed.againButton")}
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4 text-center animate-in shake duration-500">
                <div className="h-20 w-20 rounded-full bg-danger/20 flex items-center justify-center text-danger mb-2">
                  <AlertCircle className="h-10 w-10 stroke-[3px]" />
                </div>
                <h3 className="text-2xl font-black text-danger">{t("seed.failed")}</h3>
                <p className="text-danger/70 font-medium text-sm">
                  {error}
                </p>
                <Button 
                  color="danger" 
                  variant="flat"
                  onPress={handleSeed}
                  className="mt-4 font-bold"
                >
                  {t("seed.retryButton")}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="rounded-3xl bg-default-100 p-6 border border-default-200">
        <h4 className="text-xs font-black uppercase tracking-widest text-default-400 mb-4">{t("seed.whatWillBeSeeded")}</h4>
        <ul className="grid grid-cols-2 gap-3">
          {[
            t("seed.items.company"),
            t("seed.items.users"),
            t("seed.items.tasks"),
            t("seed.items.activity"),
            t("seed.items.projects"),
            t("seed.items.stats")
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-default-600 font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
