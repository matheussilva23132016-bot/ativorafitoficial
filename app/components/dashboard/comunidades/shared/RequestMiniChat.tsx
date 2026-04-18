"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageCircle, RefreshCw, Send } from "lucide-react";

export interface RequestMiniChatMessage {
  id: string;
  userId: string;
  userName: string;
  roleLabel?: string;
  message: string;
  createdAt: string;
}

interface RequestMiniChatProps {
  title: string;
  subtitle?: string;
  currentUserId: string;
  enabled: boolean;
  loading: boolean;
  sending: boolean;
  messages: RequestMiniChatMessage[];
  disabledReason?: string | null;
  emptyStateText?: string;
  placeholder?: string;
  onSend: (message: string) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
}

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function RequestMiniChat({
  title,
  subtitle,
  currentUserId,
  enabled,
  loading,
  sending,
  messages,
  disabledReason,
  emptyStateText = "Nenhuma mensagem ainda. Comece a conversa quando precisar.",
  placeholder = "Escreva sua mensagem...",
  onSend,
  onRefresh,
}: RequestMiniChatProps) {
  const [draft, setDraft] = useState("");

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      ),
    [messages],
  );

  const canSend = enabled && !sending && draft.trim().length > 0;

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text || !enabled || sending) return;
    await onSend(text);
    setDraft("");
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">{title}</p>
          {subtitle ? <p className="mt-1 text-xs leading-relaxed text-white/40">{subtitle}</p> : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-[9px] font-black uppercase tracking-widest text-white/45 transition hover:text-white"
          >
            <RefreshCw size={11} />
            Atualizar
          </button>
        ) : null}
      </div>

      {!enabled ? (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-[10px] leading-relaxed text-amber-200">
            {disabledReason || "O mini chat fica liberado quando o plano for concluído."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-white/35">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : orderedMessages.length > 0 ? (
              orderedMessages.map(message => {
                const isMine = String(message.userId) === String(currentUserId);
                return (
                  <article
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-xl border px-3 py-2 ${
                        isMine
                          ? "border-sky-500/30 bg-sky-500/15 text-sky-100"
                          : "border-white/10 bg-black/25 text-white/85"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[9px] font-black uppercase tracking-widest">
                          {message.userName}
                        </p>
                        {message.roleLabel ? (
                          <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">
                            {message.roleLabel}
                          </span>
                        ) : null}
                        <span className="text-[8px] opacity-70">{formatTime(message.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
                <MessageCircle size={16} className="mx-auto text-white/25" />
                <p className="mt-2 text-xs text-white/40">{emptyStateText}</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              rows={2}
              placeholder={placeholder}
              className="min-h-11 flex-1 resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/35"
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => void handleSubmit()}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest transition ${
                canSend
                  ? "border border-sky-500/30 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25"
                  : "cursor-not-allowed border border-white/10 bg-white/5 text-white/25"
              }`}
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Enviar
            </button>
          </div>
        </>
      )}
    </section>
  );
}

