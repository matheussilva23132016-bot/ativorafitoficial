"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, Loader2, MessageCircle, Search, Send, User, X } from "lucide-react";

interface UserProfile {
  username: string;
  avatar?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
}

interface DirectContact {
  username: string;
  full_name?: string | null;
  avatar?: string | null;
  role?: string | null;
  is_verified?: boolean;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number;
}

interface DirectMessage {
  id: number;
  remetente_nickname: string;
  destinatario_nickname: string;
  conteudo: string;
  lida?: number;
  created_at: string;
}

interface SocialMessagesProps {
  currentUser: UserProfile;
  onBack: () => void;
  onOpenUserProfile?: (username: string) => void;
}

const normalizeNickname = (value: string) => value.trim().replace(/^@/, "");

const repairText = (value: unknown) => {
  if (typeof value !== "string") return "";
  if (!/[ÃÂâð]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded && !decoded.includes("�") ? decoded : value;
  } catch {
    return value;
  }
};

const formatDirectTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  return `${Math.floor(diffHours / 24)}d`;
};

const Avatar = ({ contact, size = "md" }: { contact: DirectContact; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-14 w-14",
  };

  return (
    <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04]`}>
      {contact.avatar ? (
        <img src={contact.avatar} alt={contact.username} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/25">
          <User size={size === "lg" ? 24 : 18} />
        </div>
      )}
    </div>
  );
};

export const SocialMessages = ({ currentUser, onBack, onOpenUserProfile }: SocialMessagesProps) => {
  const [activeContact, setActiveContact] = useState<DirectContact | null>(null);
  const [conversations, setConversations] = useState<DirectContact[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DirectContact[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUsername = normalizeNickname(currentUser.username || "");

  const filteredConversations = useMemo(
    () => conversations.filter((contact) => contact.username),
    [conversations]
  );

  const loadInbox = async () => {
    if (!currentUsername) {
      setLoadingInbox(false);
      return;
    }

    try {
      const response = await fetch(`/api/social/mensagens?user=${encodeURIComponent(currentUsername)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Falha ao carregar conversas");

      const data = await response.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[SocialMessages] Erro ao carregar inbox:", error);
    } finally {
      setLoadingInbox(false);
    }
  };

  const loadChat = async (contact = activeContact) => {
    if (!currentUsername || !contact?.username) {
      setLoadingChat(false);
      return;
    }

    try {
      setLoadingChat((current) => current || messages.length === 0);
      const response = await fetch(
        `/api/social/mensagens?user=${encodeURIComponent(currentUsername)}&target=${encodeURIComponent(contact.username)}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Falha ao carregar conversa");

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
      setConversations((current) =>
        current.map((item) => item.username === contact.username ? { ...item, unread_count: 0 } : item)
      );
    } catch (error) {
      console.error("[SocialMessages] Erro ao carregar conversa:", error);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    loadInbox();
    const interval = window.setInterval(loadInbox, 10000);
    return () => window.clearInterval(interval);
  }, [currentUsername]);

  useEffect(() => {
    if (!activeContact) return;
    setMessages([]);
    loadChat(activeContact);
    const interval = window.setInterval(() => loadChat(activeContact), 3500);
    return () => window.clearInterval(interval);
  }, [activeContact?.username, currentUsername]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeContact?.username]);

  useEffect(() => {
    const term = normalizeNickname(query);
    if (!currentUsername || term.length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/social/mensagens?user=${encodeURIComponent(currentUsername)}&q=${encodeURIComponent(term)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );
        if (!response.ok) return;

        const data = await response.json();
        const results = Array.isArray(data)
          ? data
              .filter((item) => item?.username && item.username !== currentUsername)
              .map((item) => ({
                username: item.username,
                full_name: item.full_name,
                avatar: item.avatar,
                role: item.role,
                is_verified: item.is_verified,
              }))
          : [];
        setSearchResults(results);
      } catch (error: any) {
        if (error?.name !== "AbortError") console.error("[SocialMessages] Erro na busca:", error);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, currentUsername]);

  const openContact = (contact: DirectContact) => {
    setActiveContact({
      ...contact,
      username: normalizeNickname(contact.username),
    });
    setQuery("");
    setSearchResults([]);
  };

  const sendMessage = async () => {
    if (!currentUsername || !activeContact || !inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    const optimistic: DirectMessage = {
      id: Date.now(),
      remetente_nickname: currentUsername,
      destinatario_nickname: activeContact.username,
      conteudo: text,
      lida: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimistic]);

    try {
      const response = await fetch("/api/social/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remetente: currentUsername,
          destinatario: activeContact.username,
          conteudo: text,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao enviar mensagem");

      if (data.message) {
        setMessages((current) => current.map((item) => item.id === optimistic.id ? data.message : item));
      }

      setConversations((current) => {
        const nextContact = {
          ...activeContact,
          last_message: text,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        };
        return [nextContact, ...current.filter((item) => item.username !== activeContact.username)];
      });
    } catch (error) {
      console.error("[SocialMessages] Erro ao enviar:", error);
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const renderContact = (contact: DirectContact, source: "inbox" | "search") => (
    <button
      key={`${source}-${contact.username}`}
      type="button"
      onClick={() => openContact(contact)}
      className={`group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all active:scale-[0.99]
        ${activeContact?.username === contact.username ? "border-sky-500/35 bg-sky-500/10" : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.04]"}`}
    >
      <Avatar contact={contact} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[14px] font-bold text-white">@{contact.username}</p>
          {Number(contact.unread_count || 0) > 0 && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          )}
        </div>
        <p className="mt-0.5 truncate text-[12px] font-medium text-white/35">
          {source === "search"
            ? contact.full_name || contact.role || "Atleta Ativora"
            : repairText(contact.last_message) || contact.full_name || "Toque para conversar"}
        </p>
      </div>
      {source === "inbox" && (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-white/20">{formatDirectTime(contact.last_message_at)}</span>
          {Number(contact.unread_count || 0) > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-black text-black">
              {contact.unread_count}
            </span>
          )}
        </div>
      )}
    </button>
  );

  return (
    <div className="flex h-full min-h-dvh w-full flex-col overflow-hidden bg-[#010307] text-white">
      <div className="flex h-full min-h-0 w-full">
        <aside className={`${activeContact ? "hidden md:flex" : "flex"} min-h-0 w-full flex-col border-r border-white/[0.06] bg-[#010307] md:w-[360px] lg:w-[400px]`}>
          <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/45 transition-all hover:text-white active:scale-95"
                aria-label="Voltar ao feed"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-black tracking-tight text-white">Direct</h2>
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">@{currentUsername}</p>
              </div>
            </div>
            <MessageCircle size={20} className="text-sky-400/70" />
          </header>

          <div className="shrink-0 border-b border-white/[0.04] p-4">
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-3">
              <Search size={17} className="shrink-0 text-white/25" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar atleta"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-white/25 transition-colors hover:text-white"
                  aria-label="Limpar busca"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
            {query.trim().length >= 2 ? (
              <div className="space-y-1">
                {searchResults.length > 0 ? (
                  searchResults.map((contact) => renderContact(contact, "search"))
                ) : (
                  <div className="px-4 py-12 text-center text-sm font-medium text-white/30">
                    Nenhum atleta encontrado.
                  </div>
                )}
              </div>
            ) : loadingInbox ? (
              <div className="flex items-center justify-center py-16 text-white/25">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-1">
                {filteredConversations.map((contact) => renderContact(contact, "inbox"))}
              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/20">
                  <MessageCircle size={24} />
                </div>
                <p className="text-sm font-bold text-white/45">Nenhuma conversa ainda.</p>
                <p className="mt-2 text-xs leading-5 text-white/25">Busque um atleta pelo @ para começar um direct.</p>
              </div>
            )}
          </div>
        </aside>

        <section className={`${activeContact ? "flex" : "hidden md:flex"} min-h-0 flex-1 flex-col bg-[#02050a]`}>
          {activeContact ? (
            <>
              <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#010307]/95 px-4 py-3 backdrop-blur-xl sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveContact(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/45 transition-all hover:text-white active:scale-95 md:hidden"
                    aria-label="Voltar para conversas"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenUserProfile?.(activeContact.username)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <Avatar contact={activeContact} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-white">@{activeContact.username}</p>
                      <p className="truncate text-[11px] font-medium text-white/30">
                        {activeContact.full_name || activeContact.role || "Atleta Ativora"}
                      </p>
                    </div>
                  </button>
                </div>
              </header>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {loadingChat && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-white/25">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                    {messages.map((message) => {
                      const isMine = message.remetente_nickname === currentUsername;
                      return (
                        <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[82%] rounded-lg px-4 py-2.5 text-sm leading-6 shadow-lg sm:max-w-[70%]
                              ${isMine ? "bg-sky-500 text-black" : "border border-white/[0.07] bg-white/[0.06] text-white/85"}`}
                          >
                            <p className="break-words">{repairText(message.conteudo)}</p>
                            <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] font-bold ${isMine ? "text-black/45" : "text-white/25"}`}>
                              {formatDirectTime(message.created_at)}
                              {isMine && <CheckCheck size={12} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center px-8 text-center">
                    <div>
                      <Avatar contact={activeContact} size="lg" />
                      <p className="mt-4 text-lg font-black text-white">@{activeContact.username}</p>
                      <p className="mt-2 text-sm text-white/35">Envie a primeira mensagem para começar a conversa.</p>
                    </div>
                  </div>
                )}
              </div>

              <footer className="shrink-0 border-t border-white/[0.06] bg-[#010307]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl sm:px-5 sm:pb-5">
                <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] p-2">
                  <textarea
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Mensagem..."
                    rows={1}
                    className="custom-scrollbar max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm font-medium text-white outline-none placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={sending || !inputText.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-black transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Enviar mensagem"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-10 text-center">
              <div>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/20">
                  <MessageCircle size={28} />
                </div>
                <p className="text-xl font-black text-white">Selecione uma conversa</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/35">
                  Suas mensagens aparecem aqui em tempo real enquanto você conversa com outros atletas.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
