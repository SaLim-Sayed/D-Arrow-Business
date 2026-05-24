import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Button, Card, CardBody } from "@heroui/react";
import { AlertTriangle, Home, RefreshCw, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = "An unexpected error occurred.";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || errorMessage;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md w-full"
      >
        <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <div className="h-2 bg-danger w-full" />
          <CardBody className="p-10 flex flex-col items-center text-center space-y-8">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="p-6 bg-danger/10 rounded-full text-danger"
              >
                <AlertTriangle size={48} />
              </motion.div>
              <div className="absolute -top-1 -right-1 bg-background rounded-full p-1 border border-danger/20">
                <div className="bg-danger text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {errorStatus}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="text-default-500 font-medium leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col w-full gap-3">
              <Button
                color="primary"
                variant="shadow"
                size="lg"
                className="font-bold rounded-2xl h-14 shadow-primary/30"
                startContent={<RefreshCw size={18} />}
                onPress={() => window.location.reload()}
              >
                Try Again
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="flat"
                  size="lg"
                  className="font-bold rounded-2xl h-14"
                  startContent={<ChevronLeft size={18} />}
                  onPress={() => navigate(-1)}
                >
                  Go Back
                </Button>
                <Button
                  variant="flat"
                  size="lg"
                  className="font-bold rounded-2xl h-14"
                  startContent={<Home size={18} />}
                  onPress={() => navigate("/")}
                >
                  Home
                </Button>
              </div>
            </div>

            <p className="text-[10px] text-default-400 font-black uppercase tracking-widest pt-4">
              D-Arrow Business HRMS • Error Recovery System
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
