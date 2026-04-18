"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  CheckCircle2,
  Clock,
  Filter,
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

type AvisoFiltro = "todos" | "nao_lidos" | "fixados" | "urgentes" | "com_acao";

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

const PRIORIDADE_LABEL: Record<Aviso["prioridade"], string> = {
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

function formatDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityStyle(priority: Aviso["prioridade"]) {
  if (priority === "urgente") return "border-rose-400/25 bg-rose-500/10 text-rose-200";
  if (priority === "alta") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  return "border-sky-400/20 bg-sky-500/10 text-sky-200";
}

function isRead(aviso: Aviso) {
  return aviso.lida === 1 || aviso.lida === true;
}

function isPinned(aviso: Aviso) {
  return aviso.fixado === 1 || aviso.fixado === true;
}

function createdTime(aviso: Aviso) {
  const ts = new Date(aviso.created_at).getTime();
  return Number.isFinite(ts) ? ts : 0;
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
  const [filtro, setFiltro] = useState<AvisoFiltro>("todos");
  const [showComposer, setShowComposer] = useState(false);
  const [expandedAvisoId, setExpandedAvisoId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAllMobileStats, setShowAllMobileStats] = useState(false);
  const [mobileAvisosLimit, setMobileAvisosLimit] = useState(6);

  const [form, setForm] = useState({
    titulo: "",
    mensagem: "",
    audience: "todos" as Aviso["audience"],
    targetUserId: "",
    categoria: "geral",
    prioridade: "normal" as Aviso["prioridade"],
    acaoRecomendada: "",
    fixado: false,
  });

  const canSend = canDo(userTags, "aviso:create");
  const approvedStudents = useMemo(
    () => members.filter(member => String(member.user_id) !== String(currentUser?.id || "")),
    [members, currentUser?.id],
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(CATEGORIAS.map(item => [item.value, item.label])),
    [],
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (filtro !== "todos") setShowMobileFilters(true);
  }, [filtro]);

  useEffect(() => {
    setMobileAvisosLimit(6);
  }, [filtro, avisos.length]);

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
        message: data.message || "Os membros foram notificados.",
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
      setShowComposer(false);
      setFiltro("todos");
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
      // Mantem a experiencia fluida mesmo se a leitura falhar.
    }
  };

  const avisosOrdenados = useMemo(() => {
    return [...avisos].sort((a, b) => {
      const pinDiff = Number(isPinned(b)) - Number(isPinned(a));
      if (pinDiff !== 0) return pinDiff;
      return createdTime(b) - createdTime(a);
    });
  }, [avisos]);

  const totalAvisos = avisosOrdenados.length;
  const totalNaoLidos = avisosOrdenados.filter(aviso => !isRead(aviso)).length;
  const totalFixados = avisosOrdenados.filter(aviso => isPinned(aviso)).length;
  const totalUrgentes = avisosOrdenados.filter(aviso => aviso.prioridade === "urgente").length;
  const totalComAcao = avisosOrdenados.filter(aviso => Boolean(aviso.acao_recomendada?.trim())).length;

  const avisosFiltrados = useMemo(() => {
    if (filtro === "todos") return avisosOrdenados;
    if (filtro === "nao_lidos") return avisosOrdenados.filter(aviso => !isRead(aviso));
    if (filtro === "fixados") return avisosOrdenados.filter(aviso => isPinned(aviso));
    if (filtro === "urgentes") return avisosOrdenados.filter(aviso => aviso.prioridade === "urgente");
    return avisosOrdenados.filter(aviso => Boolean(aviso.acao_recomendada?.trim()));
  }, [avisosOrdenados, filtro]);

  const filtros = [
    { id: "todos" as AvisoFiltro, label: "Todos", value: totalAvisos },
    { id: "nao_lidos" as AvisoFiltro, label: "Não lidos", value: totalNaoLidos },
    { id: "fixados" as AvisoFiltro, label: "Fixados", value: totalFixados },
    { id: "urgentes" as AvisoFiltro, label: "Urgentes", value: totalUrgentes },
    { id: "com_acao" as AvisoFiltro, label: "Com ação", value: totalComAcao },
  ];

  const avisosRenderizados =
    isMobile && filtro === "todos"
      ? avisosFiltrados.slice(0, mobileAvisosLimit)
      : avisosFiltrados;
  const hasMoreAvisosMobile =
    isMobile && filtro === "todos" && avisosRenderizados.length < avisosFiltrados.length;

  return (
    <div className="space-y-4 text-left sm:space-y-5">
      <section className="rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
              Central de avisos
            </p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Comunicação clara e ação rápida
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Veja o que está pendente, filtre por prioridade e responda sem perder tempo no mobile.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            {canSend && (
              <button
                type="button"
                onClick={() => setShowComposer(current => !current)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/65 transition hover:text-white lg:flex-none"
              >
                <Megaphone size={13} />
                {showComposer ? "Ocultar editor" : "Novo aviso"}
                <ChevronDown size={12} className={`transition-transform ${showComposer ? "rotate-180" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={loadAvisos}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/65 transition hover:text-white lg:flex-none"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: "Não lidos", value: totalNaoLidos, icon: Bell, tone: "text-sky-300" },
            { label: "Urgentes", value: totalUrgentes, icon: AlertTriangle, tone: "text-rose-300" },
            { label: "Com ação", value: totalComAcao, icon: CheckCircle2, tone: "text-amber-300" },
            { label: "Fixados", value: totalFixados, icon: Pin, tone: "text-white" },
          ].slice(0, isMobile && !showAllMobileStats ? 2 : 4).map(card => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <card.icon size={16} className={card.tone} />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
              <p className="mt-1 text-sm font-black text-white">{card.value}</p>
            </article>
          ))}
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setShowAllMobileStats(current => !current)}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/50 transition hover:text-white sm:hidden"
          >
            {showAllMobileStats ? "Ver resumo compacto" : "Ver todos os indicadores"}
          </button>
        )}
      </section>

      {canSend && showComposer && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[22px] border border-white/10 bg-[#050B14] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2 text-sky-200">
              <Megaphone size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                Enviar aviso
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-white/35">
                Escreva objetivo claro, contexto curto e ação recomendada.
              </p>
            </div>
          </div>

          <form onSubmit={submitAviso} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(current => ({ ...current, audience: "todos", targetUserId: "" }))}
                className={`min-h-11 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition ${
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
                className={`min-h-11 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition ${
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
                <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Aluno</span>
                <select
                  value={form.targetUserId}
                  onChange={event => setForm(current => ({ ...current, targetUserId: event.target.value }))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none transition focus:border-sky-500/45"
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

            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Título</span>
              <input
                value={form.titulo}
                onChange={event => setForm(current => ({ ...current, titulo: event.target.value }))}
                placeholder="Ex: Enviar medida da cintura até sexta"
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
              />
            </label>

            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Mensagem</span>
              <textarea
                value={form.mensagem}
                onChange={event => setForm(current => ({ ...current, mensagem: event.target.value }))}
                placeholder="Explique o aviso com objetividade."
                className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
              />
            </label>

            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Ação recomendada (opcional)</span>
              <textarea
                value={form.acaoRecomendada}
                onChange={event => setForm(current => ({ ...current, acaoRecomendada: event.target.value }))}
                placeholder="Ex: reenviar foto, concluir treino, responder avaliação."
                className="mt-2 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Área</span>
                <select
                  value={form.categoria}
                  onChange={event => setForm(current => ({ ...current, categoria: event.target.value }))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none transition focus:border-sky-500/45"
                >
                  {CATEGORIAS.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Prioridade</span>
                <select
                  value={form.prioridade}
                  onChange={event => setForm(current => ({ ...current, prioridade: event.target.value as Aviso["prioridade"] }))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none transition focus:border-sky-500/45"
                >
                  {PRIORIDADES.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 text-xs font-bold text-white/55">
              Fixar no topo
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
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 disabled:opacity-45"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar aviso
            </button>
          </form>
        </motion.section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/45">
            <Filter size={12} />
            Filtro atual: {filtros.find(item => item.id === filtro)?.label ?? "Todos"}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
            {avisosFiltrados.length} avisos
          </p>
        </div>

        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowMobileFilters(current => !current)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
          >
            {showMobileFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        <div className={`${showMobileFilters ? "block" : "hidden"} sm:hidden`}>
          <select
            value={filtro}
            onChange={event => setFiltro(event.target.value as AvisoFiltro)}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/35"
          >
            {filtros.map(item => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.value})
              </option>
            ))}
          </select>
        </div>

        <div className="hidden grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {filtros.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
                filtro === item.id
                  ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                  : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
              }`}
            >
              {item.label}
              <span className="text-white/45">{item.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[22px] border border-white/10 bg-[#050B14]">
            <Loader2 className="animate-spin text-sky-400" size={26} />
          </div>
        ) : avisosFiltrados.length === 0 ? (
          <div className="rounded-[22px] border border-white/10 bg-[#050B14] p-8 text-center">
            <Bell className="mx-auto text-white/20" size={32} />
            <h3 className="mt-4 text-sm font-black uppercase tracking-widest text-white">
              {avisosOrdenados.length === 0 ? "Nenhum aviso ainda" : "Nenhum aviso neste filtro"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/35">
              Ajuste o filtro ou atualize a lista para ver os recados mais recentes.
            </p>
          </div>
        ) : (
          avisosRenderizados.map((aviso, index) => {
            const lida = isRead(aviso);
            const fixado = isPinned(aviso);
            const expanded = expandedAvisoId === aviso.id;
            const mensagemLonga =
              (aviso.mensagem?.length ?? 0) > 220 || (aviso.mensagem?.includes("\n") ?? false);
            const categoriaLabel = categoryMap[aviso.categoria] ?? aviso.categoria;
            const audienceLabel =
              aviso.audience === "todos"
                ? "Todos os membros"
                : `@${aviso.target_nickname || "aluno"}`;

            return (
              <motion.article
                key={aviso.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className={`rounded-[22px] border p-4 transition sm:p-5 ${
                  lida ? "border-white/10 bg-[#050B14]" : "border-sky-400/25 bg-sky-500/10"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {fixado && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/45">
                          <Pin size={10} /> Fixado
                        </span>
                      )}
                      <span className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${priorityStyle(aviso.prioridade)}`}>
                        {PRIORIDADE_LABEL[aviso.prioridade]}
                      </span>
                      <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/40">
                        {categoriaLabel}
                      </span>
                    </div>

                    <h3 className="mt-3 break-words text-base font-black text-white sm:text-lg">
                      {aviso.titulo}
                    </h3>
                    <p
                      className={`mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-white/60 ${
                        expanded ? "" : "line-clamp-3"
                      }`}
                    >
                      {aviso.mensagem}
                    </p>

                    {mensagemLonga && (
                      <button
                        type="button"
                        onClick={() => setExpandedAvisoId(current => (current === aviso.id ? null : aviso.id))}
                        className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-sky-300/80 transition hover:text-sky-200"
                      >
                        {expanded ? "Mostrar menos" : "Ver detalhes"}
                        <ChevronDown size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {!lida ? (
                    <button
                      type="button"
                      onClick={() => markRead(aviso.id)}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-500/15"
                    >
                      <CheckCircle2 size={13} />
                      Marcar como lido
                    </button>
                  ) : (
                    <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/45">
                      Lido
                    </span>
                  )}
                </div>

                {aviso.acao_recomendada && (
                  <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-200" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-200">
                          Ação recomendada
                        </p>
                        <p className="mt-1 break-words text-sm leading-relaxed text-white/70">
                          {aviso.acao_recomendada}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/35">
                    <span className="inline-flex items-center gap-1">
                      <User size={12} />
                      @{aviso.autor_nickname || "profissional"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {aviso.audience === "todos" ? <Users size={12} /> : <User size={12} />}
                      {audienceLabel}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/30">
                    <Clock size={12} />
                    {formatDate(aviso.created_at)}
                  </span>
                </div>
              </motion.article>
            );
          })
        )}
        {hasMoreAvisosMobile && (
          <button
            type="button"
            onClick={() => setMobileAvisosLimit(current => current + 6)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white sm:hidden"
          >
            Mostrar mais avisos
          </button>
        )}
      </section>
    </div>
  );
}
