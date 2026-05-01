import { Button, Card, CardBody } from "@heroui/react";
import { ArrowLeft, Rocket, Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full glass-card border-none overflow-hidden shadow-2xl">
        <CardBody className="p-12 flex flex-col items-center text-center space-y-8">
          {/* Animated Illustration Header */}
          <div className="relative">
            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary relative z-10 animate-bounce duration-[2000ms]">
              <Rocket className="h-12 w-12" />
            </div>
            <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary animate-pulse">
              <Construction className="h-5 w-5" />
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 bg-primary/20 rounded-full blur-3xl -z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {t("notFound.comingSoon")}
            </h1>
            <p className="text-default-500 font-medium leading-relaxed">
              {t("notFound.description")}
            </p>
          </div>

          <div className="flex flex-col w-full gap-3">
            <Button
              color="primary"
              size="lg"
              className="font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-primary/30"
              onPress={() => navigate(-1)}
              startContent={<ArrowLeft className="h-4 w-4 stroke-[3px]" />}
            >
              {t("notFound.goBack")}
            </Button>
            
            <Button
              variant="flat"
              size="lg"
              className="font-bold rounded-2xl h-14"
              onPress={() => navigate("/tasks/dashboard")}
            >
              {t("notFound.returnToDashboard")}
            </Button>
          </div>
          
          <div className="pt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-default-300">
              {t("notFound.businessSuite")}
            </p>
          </div>
        </CardBody>
      </Card>
      
      {/* Subtle Background Elements */}
      <div className="fixed top-1/4 -left-20 h-64 w-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-20 h-64 w-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
