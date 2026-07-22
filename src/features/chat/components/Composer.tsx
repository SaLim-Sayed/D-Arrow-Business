import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Textarea } from "@heroui/react";
import { Send } from "lucide-react";

interface ComposerProps {
  onSend: (body: string) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export function Composer({
  onSend,
  onTyping,
  onStopTyping,
  disabled,
}: ComposerProps) {
  const { t } = useTranslation("chat");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      onStopTyping();
    };
  }, [onStopTyping]);

  const handleChange = (next: string) => {
    setValue(next);
    if (!next.trim()) {
      onStopTyping();
      return;
    }
    onTyping();
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  const submit = async () => {
    const body = value.trim();
    if (!body || sending || disabled) return;
    setSending(true);
    try {
      await onSend(body);
      setValue("");
      onStopTyping();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-default-100 bg-content1/80 p-3">
      <Textarea
        minRows={1}
        maxRows={5}
        value={value}
        onValueChange={handleChange}
        placeholder={t("conversation.placeholder")}
        variant="bordered"
        classNames={{ inputWrapper: "bg-background" }}
        isDisabled={disabled || sending}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <Button
        color="primary"
        isIconOnly
        aria-label={t("conversation.send")}
        isLoading={sending}
        isDisabled={!value.trim() || disabled}
        onPress={() => void submit()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
