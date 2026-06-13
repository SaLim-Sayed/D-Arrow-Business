import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, CardHeader, Chip, Textarea } from "@heroui/react";
import { AlertCircle, ExternalLink, MessageCircle, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  buildWhatsAppUrl,
  formatPhoneDisplay,
  isValidWhatsAppPhone,
} from "../utils/phone.utils";
import {
  useEntityWhatsAppMessages,
  useLogWhatsAppMessageMutation,
  useWhatsAppApiStatus,
} from "../hooks/use-whatsapp";
import {
  WHATSAPP_BUSINESS_PHONE,
  WHATSAPP_BUSINESS_PHONE_DISPLAY,
} from "../config/whatsapp.config";
import type { CrmEntityType } from "../types/crm.common.types";
import { ActivitiesService } from "../api/activities.service";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";

interface CrmWhatsAppPanelProps {
  phone: string;
  entityType: CrmEntityType;
  entityId: string;
  entityLabel: string;
  canManage: boolean;
}

export function CrmWhatsAppPanel({
  phone,
  entityType,
  entityId,
  entityLabel,
  canManage,
}: CrmWhatsAppPanelProps) {
  const { t } = useTranslation("crm");
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const { data: messages = [], isLoading } = useEntityWhatsAppMessages(
    entityType,
    entityId
  );
  const logMessage = useLogWhatsAppMessageMutation(
    entityType,
    entityId,
    entityLabel
  );
  const { data: apiStatus, isLoading: statusLoading } = useWhatsAppApiStatus();
  const [draft, setDraft] = useState("");
  const [opening, setOpening] = useState(false);

  const hasPhone = isValidWhatsAppPhone(phone);
  const displayPhone = formatPhoneDisplay(phone);
  const senderDisplay = formatPhoneDisplay(WHATSAPP_BUSINESS_PHONE_DISPLAY);
  const apiSendEnabled = apiStatus?.configured === true;
  const isMockMode = apiStatus?.mock === true;

  const openWhatsApp = async (prefill?: string) => {
    const url = buildWhatsAppUrl(phone, prefill);
    if (!url) return;

    setOpening(true);
    try {
      window.open(url, "_blank", "noopener,noreferrer");
      if (companyId && userId) {
        await ActivitiesService.createActivity(companyId, {
          type: "whatsapp",
          subject: t("whatsapp.openedChat"),
          description: prefill?.trim() || undefined,
          entityType,
          entityId,
          occurredAt: new Date().toISOString(),
          userId,
        });
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEYS.crm.activities(companyId), entityType, entityId],
        });
      }
    } finally {
      setOpening(false);
    }
  };

  const sendDirect = async () => {
    if (!draft.trim() || !hasPhone) return;
    await logMessage.mutateAsync({ phone, body: draft, sendViaApi: true });
    setDraft("");
  };

  return (
    <Card className="border border-success/20 bg-success/5">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-success" />
          <h3 className="font-bold text-sm">{t("whatsapp.title")}</h3>
          <Chip
            size="sm"
            variant="flat"
            color={apiSendEnabled ? (isMockMode ? "warning" : "success") : "warning"}
            className="text-[9px] h-5"
          >
            {isMockMode
              ? t("whatsapp.testMode")
              : apiSendEnabled
                ? t("whatsapp.apiConnected")
                : t("whatsapp.setupRequired")}
          </Chip>
        </div>
        <p className="text-[10px] text-default-500">{t("whatsapp.subtitleDirect")}</p>
        <p className="text-[10px] text-default-500">
          {t("whatsapp.fromLine", { phone: senderDisplay || WHATSAPP_BUSINESS_PHONE })}
        </p>
      </CardHeader>
      <CardBody className="gap-4 pt-0">
        {!statusLoading && isMockMode && (
          <div className="flex gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-default-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
            <p>{t("whatsapp.mockHint")}</p>
          </div>
        )}

        {!statusLoading && !apiSendEnabled && !isMockMode && (
          <div className="flex gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-default-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
            <p>{t("whatsapp.setupHint")}</p>
          </div>
        )}

        {hasPhone ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-default-400 uppercase font-bold">
              {t("whatsapp.to")}
            </span>
            <span className="font-mono text-sm font-semibold">{displayPhone}</span>
            <Button
              size="sm"
              variant="flat"
              className="rounded-full font-bold"
              startContent={<ExternalLink className="h-3.5 w-3.5" />}
              isLoading={opening}
              onPress={() => openWhatsApp(draft || undefined)}
            >
              {t("whatsapp.openChat")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-default-500">{t("whatsapp.noPhone")}</p>
        )}

        {canManage && hasPhone && (
          <div className="space-y-2">
            <Textarea
              size="sm"
              minRows={2}
              placeholder={t("whatsapp.messagePlaceholder")}
              value={draft}
              onValueChange={setDraft}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                color="success"
                className="rounded-full font-semibold"
                startContent={<Send className="h-3.5 w-3.5" />}
                isDisabled={!draft.trim() || !apiSendEnabled}
                isLoading={logMessage.isPending}
                onPress={sendDirect}
              >
                {t("whatsapp.sendMessage")}
              </Button>
              {!apiSendEnabled && (
                <Button
                  size="sm"
                  variant="flat"
                  className="rounded-full"
                  isDisabled={!draft.trim()}
                  onPress={() => openWhatsApp(draft)}
                >
                  {t("whatsapp.sendAndOpen")}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <p className="text-xs text-default-400">{t("whatsapp.loading")}</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-default-400">{t("whatsapp.empty")}</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-default-100 bg-background/80 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Chip size="sm" variant="flat" color="success" className="h-5 text-[9px]">
                      {t(`whatsapp.direction.${msg.direction}`)}
                    </Chip>
                    {msg.status === "sent" && (
                      <Chip size="sm" variant="flat" color="primary" className="h-5 text-[9px]">
                        {t("whatsapp.statusSent")}
                      </Chip>
                    )}
                  </div>
                  <span className="text-[10px] text-default-400">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-default-700">{msg.body}</p>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
