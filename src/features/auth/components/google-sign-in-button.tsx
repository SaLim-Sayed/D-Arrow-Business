import { Button } from "@heroui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.5.4-2.2 1.7C5.5 19.1 8.5 21 12 21c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-6-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.9 7.6C3.3 8.8 3 10.1 3 11.5s.3 2.7.9 3.9c0 .1 2.7-2.1 2.7-2.1-.2-.5-.3-1.1-.3-1.8 0-.7.1-1.3.3-1.8L3.9 7.6z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.7 14.7 3 12 3 8.5 3 5.5 4.9 3.9 7.6l2.7 2.1C7 8.7 9.2 6.8 12 6.8z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation("auth");
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/", { replace: true, state: { choosePortal: true } });
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("");
      } else {
        setError(t("login.googleError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {error && (
        <p className="mb-3 text-center text-xs font-semibold text-danger">{error}</p>
      )}
      <Button
        type="button"
        variant="bordered"
        size="lg"
        radius="lg"
        className="h-12 w-full border-default-200 bg-background font-semibold"
        isLoading={loading}
        startContent={!loading && <GoogleIcon className="h-5 w-5" />}
        onPress={() => void handleClick()}
      >
        {loading ? t("login.googleLoading") : t("login.google")}
      </Button>
    </div>
  );
}
