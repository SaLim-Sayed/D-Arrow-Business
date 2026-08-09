import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuthStore } from "@/stores/auth.store";
import {
  MessagesService,
  type SendMessageOptions,
} from "../api/messages.service";
import {
  uploadChatAudio,
  uploadChatFile,
} from "../api/chat-storage.service";
import { ConversationsService } from "../api/conversations.service";
import {
  inferMessageType,
  type ChatAttachment,
  type ChatMessage,
} from "../types/chat.types";

export interface SendMessageInput {
  body: string;
  options?: SendMessageOptions;
  files?: File[];
  audio?: { blob: Blob; durationMs: number };
}

function isPendingId(id: string) {
  return id.startsWith("pending-");
}

/** Keep optimistic rows until a matching server message lands. */
function mergeServerMessages(
  serverItems: ChatMessage[],
  previous: ChatMessage[]
): ChatMessage[] {
  const pending = previous.filter((message) => isPendingId(message.id));
  if (!pending.length) return serverItems;

  const stillPending = pending.filter((local) => {
    const localUrl = local.attachments?.[0]?.url;
    if (
      localUrl &&
      !localUrl.startsWith("blob:") &&
      serverItems.some((remote) =>
        remote.attachments?.some((file) => file.url === localUrl)
      )
    ) {
      return false;
    }

    // Blob previews won't match Storage URLs — drop once the same sender's
    // audio/file message exists on the server around the same time.
    const localTime = new Date(local.createdAt).getTime();
    const matched = serverItems.some((remote) => {
      if (remote.senderId !== local.senderId) return false;
      if (remote.messageType !== local.messageType) return false;
      const remoteTime = new Date(remote.createdAt).getTime();
      return Math.abs(remoteTime - localTime) < 120_000;
    });
    return !matched;
  });

  return [...serverItems, ...stillPending];
}

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
        setMessages((prev) => mergeServerMessages(items, prev));
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
    mutationFn: async (input: string | SendMessageInput) => {
      if (!companyId || !conversationId || !userId) {
        throw new Error("Missing chat context");
      }

      const payload: SendMessageInput =
        typeof input === "string" ? { body: input } : input;

      const body = payload.body.trim();
      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const parentMessageId = payload.options?.parentMessageId ?? null;
      let localObjectUrl: string | null = null;

      const attachments: ChatAttachment[] = [
        ...(payload.options?.attachments ?? []),
      ];

      if (payload.audio && !parentMessageId) {
        localObjectUrl = URL.createObjectURL(payload.audio.blob);
        const previewUrl = localObjectUrl;
        setMessages((prev) => [
          ...prev,
          {
            id: pendingId,
            conversationId,
            senderId: userId,
            body,
            messageType: "audio",
            createdAt: new Date().toISOString(),
            attachments: [
              {
                url: previewUrl,
                name: `voice-${Date.now()}.webm`,
                mimeType: payload.audio!.blob.type?.startsWith("audio/")
                  ? payload.audio!.blob.type.split(";")[0] || "audio/webm"
                  : "audio/webm",
                sizeBytes: payload.audio!.blob.size,
                durationMs: Math.max(0, Math.round(payload.audio!.durationMs)),
              },
            ],
            mentionedUserIds: payload.options?.mentionedUserIds ?? [],
            mentionsEveryone: payload.options?.mentionsEveryone === true,
            parentMessageId: null,
            replyCount: 0,
            lastReplyAt: null,
          },
        ]);
      }

      try {
        if (payload.files?.length) {
          for (const file of payload.files) {
            attachments.push(
              await uploadChatFile(companyId, conversationId, file)
            );
          }
        }

        if (payload.audio) {
          const uploaded = await uploadChatAudio(
            companyId,
            conversationId,
            payload.audio.blob,
            payload.audio.durationMs
          );
          attachments.push(uploaded);

          if (!parentMessageId) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === pendingId
                  ? { ...message, attachments: [uploaded], messageType: "audio" }
                  : message
              )
            );
          }
        }

        const messageType = inferMessageType(attachments);

        if (!payload.audio && !parentMessageId) {
          setMessages((prev) => [
            ...prev,
            {
              id: pendingId,
              conversationId,
              senderId: userId,
              body,
              messageType,
              createdAt: new Date().toISOString(),
              attachments,
              mentionedUserIds: payload.options?.mentionedUserIds ?? [],
              mentionsEveryone: payload.options?.mentionsEveryone === true,
              parentMessageId: null,
              replyCount: 0,
              lastReplyAt: null,
            },
          ]);
        }

        const id = await MessagesService.sendMessage(
          companyId,
          conversationId,
          userId,
          body,
          {
            ...payload.options,
            attachments,
            messageType,
          }
        );

        // Promote optimistic row to the real Firestore id immediately.
        if (!parentMessageId) {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === pendingId
                ? { ...message, id, attachments, messageType }
                : message
            )
          );
        }

        return id;
      } catch (error) {
        setMessages((prev) => prev.filter((message) => message.id !== pendingId));
        console.error("sendMessage failed", error);
        throw error;
      } finally {
        if (localObjectUrl) {
          const url = localObjectUrl;
          window.setTimeout(() => URL.revokeObjectURL(url), 2500);
        }
      }
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

export function useThread(
  conversationId: string | undefined,
  parentMessageId: string | undefined
) {
  const { companyId } = useCompany();
  const [state, setState] = useState<{ key: string; items: ChatMessage[] }>({
    key: "",
    items: [],
  });

  const key =
    companyId && conversationId && parentMessageId
      ? `${companyId}/${conversationId}/${parentMessageId}`
      : "";

  useEffect(() => {
    if (!companyId || !conversationId || !parentMessageId) return;

    return MessagesService.subscribeToThread(
      companyId,
      conversationId,
      parentMessageId,
      (items) => setState({ key, items })
    );
  }, [companyId, conversationId, parentMessageId, key]);

  const replies = state.key === key ? state.items : [];
  const isLoading = Boolean(key) && state.key !== key;

  return { replies, isLoading };
}
