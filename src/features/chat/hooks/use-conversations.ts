import { useEffect, useState } from "react";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { ConversationsService } from "../api/conversations.service";
import type { Conversation } from "../types/chat.types";

export function useConversations() {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reads, setReads] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!companyId || !userId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = ConversationsService.subscribeToInbox(
      companyId,
      userId,
      (items) => {
        setConversations(items);
        setIsLoading(false);
      }
    );
    return unsub;
  }, [companyId, userId]);

  useEffect(() => {
    if (!companyId || !userId) {
      setReads({});
      return;
    }
    const ids = conversations.map((c) => c.id);
    return ConversationsService.subscribeToInboxReads(
      companyId,
      ids,
      userId,
      setReads
    );
  }, [companyId, userId, conversations]);

  return { conversations, reads, isLoading, companyId, userId };
}

export function useConversation(conversationId: string | undefined) {
  const { companyId } = useCompany();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(!!conversationId);

  useEffect(() => {
    if (!companyId || !conversationId) {
      setConversation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    return ConversationsService.subscribeToConversation(
      companyId,
      conversationId,
      (item) => {
        setConversation(item);
        setIsLoading(false);
      }
    );
  }, [companyId, conversationId]);

  return { conversation, isLoading, companyId };
}
