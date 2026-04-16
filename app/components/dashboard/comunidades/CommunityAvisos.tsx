"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  Pin,
  RefreshCw,
  Send,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { canDo } from "@/lib/communities/permissions";

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  categoria: string;
  prioridade: "normal" | "alta" | "urgente";
  audience: "todos" | "aluno";
  target_user_id?: string | null;
  target_nickname?: string | null;
  acao_recomendada?: string | null;
  related_area?: string | null;
  fixado?: number | boolean;
  created_at: string;
  autor_nickname?: string | null;
  autor_nome?: string | null;
  lida?: number | boolean;
};

type Member = {
  user_id: string;
  nickname: string;
  full_name?: string;
  tags?: string[];
};

interface CommunityAvisosProps {
  communityId: string;
  currentUser: any;
  userTags: string[];
  onNotify?: (notif: any) => void;
}

const CATEGORIAS = [
  { value: "geral", label: "Geral" },
  { value: "treino", label: "Treino" },
  { value: "nutricao", label: "Nutrição" },
  { value: "desafio", label: "Desafio" },
  { value: "pendencia", label: "Pendência" },
];

const PRIORIDADES = [
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

function formatDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityStyle(priority: string) {
  if (priority === "urgente") return "border-rose-400/25 bg-rose-500/10 text-rose-200";
  if (priority === "alta") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  return "border-sky-400/20 bg-sky-500/10 text-sky-200";
}

export function CommunityAvisos({
  communityId,
  currentUser,
  userTags,
  onNotify,
}: CommunityAvisosProps) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    audience: "todos",
    targetUserId: "",
    categoria: "geral",
    prioridade: "normal",
    acaoRecomendada: "",
    fixado: false,
  });

  const canSend = canDo(userTags, "aviso:create");
  const approvedStudents = useMemo(
    () => members.filter(member => String(member.user_id) !== String(currentUser?.id || "")),
    [members, currentUser?.id],
  );

  const loadAvisos = useCallback(async () => {
    if (!communityId || !currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/announcements?userId=${encodeURIComponent(currentUser.id)}`,
        { cache: "no-store" },
      );
      const data = res.ok ? await res.json() : {};
      setAvisos(Array.isArray(data.announcements) ? data.announcements : []);
    } catch {
      setAvisos([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  const loadMembers = useCallback(async () => {
    if (!canSend || !communityId) return;
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, { cache: "no-store" });
      const data = res.ok ? await res.json() : {};
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch {
      setMembers([]);
    }
  }, [canSend, communityId]);

  useEffect(() => {
    loadAvisos();
    loadMembers();
  }, [loadAvisos, loadMembers]);

  const submitAviso = async (event: React.FormEvent) => {
    event.preventDefault();

    if (sending) return;
    if (!form.titulo.trim() || !form.mensagem.trim()) {
      toast.error("Preencha o título e a mensagem do aviso.");
      return;
    }

    if (form.audience === "aluno" && !form.targetUserId) {
      toast.error("Escolha o aluno que receberá o aviso.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autorId: currentUser?.id,
          titulo: form.titulo,
          mensagem: form.mensagem,
          audience: form.audience,
          targetUserId: form.targetUserId,
          categoria: form.categoria,
          prioridade: form.prioridade,
          acaoRecomendada: form.acaoRecomendada,
          relatedArea: form.categoria,
          fixado: form.fixado,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar o aviso.");

      toast.success(data.message || "Aviso enviado.");
      onNotify?.({
        title: "Aviso enviado",
        message: data.message || "Os alunos foram notificados.",
        type: "comunidade",
      });
      setForm({
        titulo: "",
        mensagem: "",
        audience: "todos",
        targetUserId: "",
        categoria: "geral",
        prioridade: "normal",
        acaoRecomendada: "",
        fixado: false,
      });
      await loadAvisos();
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível enviar o aviso.");
    } finally {
      setSending(false);
    }
  };

  const markRead = async (avisoId: string) => {
    setAvisos(current =>
      current.map(aviso => (aviso.id === avisoId ? { ...aviso, lida: true } : aviso)),
    );

    try {
      await fetch(`/api/communities/${communityId}/announcements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisoId, userId: currentUser?.id }),
      });
    } catch {
      // Mantem a tela leve mesmo se a leitura falhar.
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-sky-500/15 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Central de avisos
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Recados importantes, pendências e próximos passos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Aqui ficam os avisos enviados pelos profissionais da comunidade. Quando houver uma ação pendente, ela aparece junto da mensagem para o aluno saber exatamente o que fazer.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAvisos}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-widest text-white/60 transition hover:text-white lg:w-auto"
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>
      </section>

      <div className={`grid gap-4 ${canSend ? "xl:grid-cols-[0.9fr_1.1fr]" : ""}`}>
        {canSend && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-sky-400/20 bg-sky-500/10 p-2 text-sky-200">
                <Megaphone size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Enviar aviso
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/35">
                  Use para cobranças de medida, treino pendente, ajuste de cardápio, desafio ou orientação individual.
                </p>
              </div>
            </div>

            <form onSubmit={submitAviso} className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(current => ({ ...current, audience: "todos", targetUserId: "" }))}
                  className={`min-h-12 rounded-lg border px-3 text-xs font-black uppercase tracking-widest transition ${
                    form.audience === "todos"
                      ? "border-sky-400/40 bg-sky-500 text-black"
                      : "border-white/10 bg-black/20 text-white/45"
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setForm(current => ({ ...current, audience: "aluno" }))}
                  className={`min-h-12 rounded-lg border px-3 text-xs font-black uppercase tracking-widest transition ${
                    form.audience === "aluno"
                      ? "border-sky-400/40 bg-sky-500 text-black"
                      : "border-white/10 bg-black/20 text-white/45"
                  }`}
                >
                  Um aluno
                </button>
              </div>

              {form.audience === "aluno" && (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                    Aluno
                  </span>
                  <select
                    value={form.targetUserId}
                    onChange={event => setForm(current => ({ ...current, targetUserId: event.target.value }))}
                    className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none focus:border-sky-500/50"
                  >
                    <option value="">Selecione quem recebe</option>
                    {approvedStudents.map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        @{member.nickname || member.full_name || member.user_id}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <input
                value={form.titulo}
                onChange={event => setForm(current => ({ ...current, titulo: event.target.value }))}
                placeholder="Ex: Enviar medida da cintura até sexta"
                className="min-h-12 w-full rounded-lg border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-sky-500/50"
              />

              <textarea
                value={form.mensagem}
                onChange={event => setForm(current => ({ ...current, mensagem: event.target.value }))}
                placeholder="Explique o motivo do aviso com clareza."
                className="min-h-32 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-sky-500/50"
              />

              <textarea
                value={form.acaoRecomendada}
                onChange={event => setForm(current => ({ ...current, acaoRecomendada: event.target.value }))}
                placeholder="O que o aluno precisa fazer? Ex: responder a avaliação rápida, reenviar foto, concluir treino."
                className="min-h-24 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-sky-500/50"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                    Área
                  </span>
                  <select
                    value={form.categoria}
                    onChange={event => setForm(current => ({ ...current, categoria: event.target.value }))}
                    className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none focus:border-sky-500/50"
                  >
                    {CATEGORIAS.map(item => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                    Prioridade
                  </span>
                  <select
                    value={form.prioridade}
                    onChange={event => setForm(current => ({ ...current, prioridade: event.target.value }))}
                    className="mt-2 min-h-12 w-full rounded-lg border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none focus:border-sky-500/50"
                  >
                    {PRIORIDADES.map(item => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-4 text-sm font-bold text-white/55">
                Fixar aviso no topo
                <input
                  type="checkbox"
                  checked={form.fixado}
                  onChange={event => setForm(current => ({ ...current, fixado: event.target.checked }))}
                  className="h-4 w-4 accent-sky-500"
                />
              </label>

              <button
                type="submit"
                disabled={sending}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-sky-400 disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar aviso
              </button>
            </form>
          </section>
        )}

        <section className="space-y-3">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Loader2 className="animate-spin text-sky-400" size={28} />
            </div>
          ) : avisos.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <Bell className="mx-auto text-white/20" size={34} />
              <h3 className="mt-4 text-sm font-black uppercase tracking-widest text-white">
                Nenhum aviso ainda
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/35">
                Quando um profissional enviar uma orientação, ela aparecerá aqui e também nas notificações principais do app.
              </p>
            </div>
          ) : (
            avisos.map(aviso => {
              const lida = aviso.lida === 1 || aviso.lida === true;
              return (
                <motion.article
                  key={aviso.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 sm:p-5 transition ${
                    lida ? "border-white/10 bg-white/5" : "border-sky-400/25 bg-sky-500/10"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {aviso.fixado ? (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white/45">
                            <Pin size={11} /> Fixado
                          </span>
                        ) : null}
                        <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${priorityStyle(aviso.prioridade)}`}>
                          {aviso.prioridade}
                        </span>
                        <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white/40">
                          {aviso.categoria}
                        </span>
                      </div>
                      <h3 className="mt-3 break-words text-lg font-black text-white sm:text-xl">
                        {aviso.titulo}
                      </h3>
                      <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-white/55">
                        {aviso.mensagem}
                      </p>
                    </div>
                    {!lida && (
                      <button
                        type="button"
                        onClick={() => markRead(aviso.id)}
                        className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-200"
                      >
                        <CheckCircle2 size={14} />
                        Li
                      </button>
                    )}
                  </div>

                  {aviso.acao_recomendada && (
                    <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-200" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                            O que fazer
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-white/65">
                            {aviso.acao_recomendada}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/35">
                      <span className="inline-flex items-center gap-1">
                        <User size={12} />
                        @{aviso.autor_nickname || "profissional"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {aviso.audience === "todos" ? <Users size={12} /> : <User size={12} />}
                        {aviso.audience === "todos" ? "Todos os membros" : `@${aviso.target_nickname || "aluno"}`}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/25">
                      <Clock size={12} />
                      {formatDate(aviso.created_at)}
                    </span>
                  </div>
                </motion.article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
