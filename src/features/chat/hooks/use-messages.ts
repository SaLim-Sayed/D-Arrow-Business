import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import { MessagesService } from "../api/messages.service";
import { ConversationsService } from "../api/conversations.service";
import type { ChatMessage } from "../types/chat.types";

export function useMessages(conversationId: string | undefined) {
  const { companyId } = useCompany();
  const userId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(!!conversationId);

  useEffect(() => {
    if (!companyId || !conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = MessagesService.subscribeToMessages(
      companyId,
      conversationId,
      (items) => {
        setMessages(items);
        setIsLoading(false);
      }
    );
    return unsub;
  }, [companyId, conversationId]);

  useEffect(() => {
    if (!companyId || !conversationId || !userId) return;
    void ConversationsService.markRead(companyId, conversationId, userId);
  }, [companyId, conversationId, userId, messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!companyId || !conversationId || !userId) {
        throw new Error("Missing chat context");
      }
      return MessagesService.sendMessage(
        companyId,
        conversationId,
        userId,
        body
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({
      messageId,
      body,
    }: {
      messageId: string;
      body: string;
    }) => {
      if (!companyId || !conversationId) {
        throw new Error("Missing chat context");
      }
      return MessagesService.editMessage(
        companyId,
        conversationId,
        messageId,
        body
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!companyId || !conversationId) {
        throw new Error("Missing chat context");
      }
      return MessagesService.softDeleteMessage(
        companyId,
        conversationId,
        messageId
      );
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    editMessage: editMutation.mutateAsync,
    deleteMessage: deleteMutation.mutateAsync,
  };
}
