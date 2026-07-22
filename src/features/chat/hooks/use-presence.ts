import { useCallback, useEffect, useState } from "react";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { PresenceService } from "../api/presence.service";
import type { PresenceRecord, PresenceStatus } from "../types/chat.types";

const HEARTBEAT_MS = 30_000;

export function usePresenceMap() {
  const { companyId } = useCompany();
  const [presence, setPresence] = useState<Record<string, PresenceRecord>>({});

  useEffect(() => {
    if (!companyId) {
      setPresence({});
      return;
    }
    return PresenceService.subscribeToPresence(companyId, setPresence);
  }, [companyId]);

  return presence;
}

export function usePresenceHeartbeat(enabled = true) {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!enabled || !companyId || !userId) return;

    const setStatus = (status: PresenceStatus) => {
      void PresenceService.setPresence(companyId, userId, status);
    };

    setStatus("online");
    const interval = window.setInterval(() => setStatus("online"), HEARTBEAT_MS);

    const onVisibility = () => {
      setStatus(document.visibilityState === "visible" ? "online" : "away");
    };
    const onUnload = () => {
      void PresenceService.setPresence(companyId, userId, "offline");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      void PresenceService.setPresence(companyId, userId, "offline");
    };
  }, [enabled, companyId, userId]);
}

export function useTyping(
  conversationId: string | undefined,
  enabled = true
) {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || !companyId || !conversationId) {
      setTypingUserIds([]);
      return;
    }

    return PresenceService.subscribeToTyping(
      companyId,
      conversationId,
      (records) => {
        setTypingUserIds(
          records.map((r) => r.userId).filter((id) => id !== userId)
        );
      }
    );
  }, [enabled, companyId, conversationId, userId]);

  const notifyTyping = useCallback(() => {
    if (!companyId || !conversationId || !userId) return;
    void PresenceService.setTyping(companyId, conversationId, userId);
  }, [companyId, conversationId, userId]);

  const stopTyping = useCallback(() => {
    if (!companyId || !conversationId || !userId) return;
    void PresenceService.clearTyping(companyId, conversationId, userId);
  }, [companyId, conversationId, userId]);

  return { typingUserIds, notifyTyping, stopTyping };
}
