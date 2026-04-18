"use client";

import { useCallback, useMemo, useState } from "react";
import type { RequestMiniChatMessage } from "./RequestMiniChat";

interface UseRequestMiniChatOptions {
  communityId: string;
  requestScopePath: string;
  userId: string;
  userName: string;
}

interface UseRequestMiniChatResult {
  activeRequestId: string | null;
  chatEnabled: boolean;
  chatStatus: string | null;
  chatLoading: boolean;
  chatSending: boolean;
  chatError: string | null;
  chatMessages: RequestMiniChatMessage[];
  openChat: (requestId: string) => Promise<void>;
  closeChat: () => void;
  refreshChat: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
}

const mapMessage = (input: any): RequestMiniChatMessage => ({
  id: String(input?.id || ""),
  userId: String(input?.userId || input?.user_id || ""),
  userName: String(input?.userName || input?.user_nome || "Membro"),
  roleLabel: input?.roleLabel ? String(input.roleLabel) : undefined,
  message: String(input?.message || input?.mensagem || ""),
  createdAt: String(input?.createdAt || input?.created_at || new Date().toISOString()),
});

export function useRequestMiniChat({
  communityId,
  requestScopePath,
  userId,
  userName,
}: UseRequestMiniChatOptions): UseRequestMiniChatResult {
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<RequestMiniChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [chatStatus, setChatStatus] = useState<string | null>(null);

  const buildEndpoint = useCallback(
    (requestId: string) =>
      `/api/communities/${communityId}/${requestScopePath}/${requestId}/chat?userId=${encodeURIComponent(userId)}`,
    [communityId, requestScopePath, userId],
  );

  const refreshChat = useCallback(async () => {
    if (!activeRequestId || !communityId || !userId) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const response = await fetch(buildEndpoint(activeRequestId), { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(data?.error || "Falha ao carregar a conversa."));
      }
      setChatEnabled(Boolean(data?.enabled));
      setChatStatus(data?.status ? String(data.status) : null);
      setChatMessages(Array.isArray(data?.messages) ? data.messages.map(mapMessage) : []);
    } catch (error: any) {
      setChatError(error?.message || "Falha ao carregar a conversa.");
    } finally {
      setChatLoading(false);
    }
  }, [activeRequestId, buildEndpoint, communityId, userId]);

  const openChat = useCallback(
    async (requestId: string) => {
      if (!requestId) return;
      setActiveRequestId(requestId);
      setChatMessages([]);
      setChatError(null);
      setChatEnabled(false);
      setChatStatus(null);
      setChatLoading(true);

      try {
        const response = await fetch(buildEndpoint(requestId), { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(data?.error || "Falha ao carregar a conversa."));
        setChatEnabled(Boolean(data?.enabled));
        setChatStatus(data?.status ? String(data.status) : null);
        setChatMessages(Array.isArray(data?.messages) ? data.messages.map(mapMessage) : []);
      } catch (error: any) {
        setChatError(error?.message || "Falha ao carregar a conversa.");
      } finally {
        setChatLoading(false);
      }
    },
    [buildEndpoint],
  );

  const closeChat = useCallback(() => {
    setActiveRequestId(null);
    setChatMessages([]);
    setChatError(null);
    setChatEnabled(false);
    setChatStatus(null);
  }, []);

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!activeRequestId || !chatEnabled || !message.trim()) return;
      setChatSending(true);
      setChatError(null);
      try {
        const endpoint = buildEndpoint(activeRequestId).replace(/\?userId=.*$/, "");
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            userName,
            message: message.trim(),
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(data?.error || "Falha ao enviar a mensagem."));

        if (data?.message) {
          setChatMessages(prev => [...prev, mapMessage(data.message)]);
        } else {
          await refreshChat();
        }
      } catch (error: any) {
        setChatError(error?.message || "Falha ao enviar a mensagem.");
      } finally {
        setChatSending(false);
      }
    },
    [activeRequestId, buildEndpoint, chatEnabled, refreshChat, userId, userName],
  );

  return useMemo(
    () => ({
      activeRequestId,
      chatEnabled,
      chatStatus,
      chatLoading,
      chatSending,
      chatError,
      chatMessages,
      openChat,
      closeChat,
      refreshChat,
      sendChatMessage,
    }),
    [
      activeRequestId,
      chatEnabled,
      chatError,
      chatLoading,
      chatMessages,
      chatSending,
      chatStatus,
      closeChat,
      openChat,
      refreshChat,
      sendChatMessage,
    ],
  );
}

