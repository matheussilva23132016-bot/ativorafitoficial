"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ImageIcon,
  Plus,
  RefreshCw,
  Target,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { canDo } from "@/lib/communities/permissions";

interface Desafio {
  id: string;
  titulo: string;
  descricao: string;
  instrucoes: string | null;
  tipo_envio: "foto" | "video" | "texto" | "link" | "arquivo" | "check";
  xp_recompensa: number;
  dia_semana: string | null;
  prazo: string | null;
  status: "ativo" | "encerrado" | "rascunho";
  entrega_id: string | null;
  entrega_status: "pendente" | "em_analise" | "aprovado" | "reprovado" | "reenvio" | null;
  entrega_conteudo?: string | null;
  entrega_arquivo_url?: string | null;
  xp_aplicado: number;
  tentativa: number | null;
}

interface CommunityDesafiosProps {
  currentUser: any;
  communityId: string;
  userTags: string[];
  onNotify?: (n: any) => void;
  triggerXP?: (n: number) => void;
}

type FiltroLista = "todos" | "para_enviar" | "em_analise" | "concluidos";

const FILTROS_LISTA: { id: FiltroLista; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "para_enviar", label: "Para enviar" },
  { id: "em_analise", label: "Em análise" },
  { id: "concluidos", label: "Concluídos" },
];

const TIPO_ENVIO_LABEL: Record<Desafio["tipo_envio"], string> = {
  foto: "Foto",
  video: "Vídeo",
  texto: "Texto",
  link: "Link",
  arquivo: "Arquivo",
  check: "Check-in",
};

const STATUS_CONFIG = {
  pendente: { bg: "bg-white/5 hover:bg-sky-500 hover:text-black", border: "border-white/10", text: "text-white" },
  aprovado: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300" },
  em_analise: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-300" },
  reprovado: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-300" },
  reenvio: { bg: "bg-yellow-500/10 hover:bg-yellow-500 hover:text-black", border: "border-yellow-500/20", text: "text-yellow-300" },
} as const;

const isFileDelivery = (tipo: Desafio["tipo_envio"]) =>
  tipo === "foto" || tipo === "video" || tipo === "arquivo";

const acceptForDelivery = (tipo: Desafio["tipo_envio"]) => {
  if (tipo === "foto") return "image/*";
  if (tipo === "video") return "video/*";
  if (tipo === "arquivo") return "image/*,video/*,application/pdf";
  return undefined;
};

export function CommunityDesafios({
  currentUser,
  communityId,
  userTags,
  onNotify,
  triggerXP,
}: CommunityDesafiosProps) {
  const canCreate = canDo(userTags, "desafio:create");
  const canEvaluate = canDo(userTags, "desafio:evaluate");

  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtroLista, setFiltroLista] = useState<FiltroLista>("todos");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileVisibleLimit, setMobileVisibleLimit] = useState(4);
  const [showAllMobileKpis, setShowAllMobileKpis] = useState(false);

  const [submitModalDesafio, setSubmitModalDesafio] = useState<Desafio | null>(null);
  const [conteudoEntrega, setConteudoEntrega] = useState("");
  const [arquivoEntrega, setArquivoEntrega] = useState<File | null>(null);
  const [uploadingEntrega, setUploadingEntrega] = useState(false);

  const [avaliarModalDesafio, setAvaliarModalDesafio] = useState<Desafio | null>(null);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");

  const [newDesafio, setNewDesafio] = useState({
    titulo: "",
    descricao: "",
    instrucoes: "",
    tipo_envio: "check" as Desafio["tipo_envio"],
    xp_recompensa: 20,
    dia_semana: "Livre",
    criterio_avaliacao: "",
    aprovador_responsavel: "",
  });

  const loadDesafios = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/desafios?userId=${currentUser.id}`);
      const data = res.ok ? await res.json() : {};
      setDesafios(data.desafios ?? []);
    } catch {
      setDesafios([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => {
    loadDesafios();
  }, [loadDesafios]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (filtroLista !== "todos") setShowMobileFilters(true);
  }, [filtroLista]);

  useEffect(() => {
    setMobileVisibleLimit(4);
  }, [filtroLista, desafios.length]);

  const resetSubmitModal = () => {
    setSubmitModalDesafio(null);
    setConteudoEntrega("");
    setArquivoEntrega(null);
  };

  const uploadArquivoEntrega = async () => {
    if (!arquivoEntrega) return null;
    const formData = new FormData();
    formData.append("file", arquivoEntrega);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.error ?? "Falha ao enviar arquivo");
    }
    return String(data.url);
  };

  const handleEnviar = async (
    desafio: Desafio,
    conteudoFornecido?: string,
    arquivoUrl?: string | null,
  ) => {
    const conteudoNormalizado =
      conteudoFornecido?.trim() || (desafio.tipo_envio === "check" ? "check" : null);

    setProcessingId(desafio.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/desafios/entregar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desafioId: desafio.id,
          userId: currentUser?.id,
          conteudo: conteudoNormalizado,
          arquivo_url: arquivoUrl ?? null,
        }),
      });
      if (!res.ok) throw new Error("Falha ao enviar");

      setDesafios(prev =>
        prev.map(d =>
          d.id === desafio.id
            ? {
                ...d,
                entrega_status: "em_analise",
                entrega_conteudo: conteudoNormalizado,
                entrega_arquivo_url: arquivoUrl ?? null,
                tentativa: (d.tentativa ?? 0) + 1,
              }
            : d,
        ),
      );

      onNotify?.({
        title: "Entrega enviada",
        message: `${desafio.titulo} - aguardando avaliação.`,
        type: "treino",
      });
      toast.success("Desafio enviado com sucesso!");
      return true;
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const handleAvaliar = async (
    desafio: Desafio,
    acao: "aprovar" | "reprovar" | "reenvio",
    comentario?: string,
  ) => {
    if (!desafio.entrega_id) return;
    setProcessingId(desafio.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/desafios/entregar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entregaId: desafio.entrega_id,
          acao,
          avaliado_por: currentUser?.id,
          comentario,
        }),
      });
      if (!res.ok) throw new Error("Falha ao avaliar");

      const novoStatus =
        acao === "aprovar" ? "aprovado" : acao === "reprovar" ? "reprovado" : "reenvio";

      setDesafios(prev =>
        prev.map(d =>
          d.id === desafio.id
            ? {
                ...d,
                entrega_status: novoStatus as Desafio["entrega_status"],
                xp_aplicado: acao === "aprovar" ? d.xp_recompensa : 0,
              }
            : d,
        ),
      );

      if (acao === "aprovar") {
        triggerXP?.(desafio.xp_recompensa);
        onNotify?.({
          title: "Desafio aprovado",
          message: `+${desafio.xp_recompensa} XP concedido.`,
          type: "treino",
        });
        toast.success("Desafio aprovado!");
      } else {
        const statusHumanizado = acao === "reenvio" ? "reenvio solicitado" : "reprovado";
        toast.info(`Avaliação registrada: ${statusHumanizado}.`);
      }
    } catch (err: any) {
      toast.error("Erro ao avaliar: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCriarDesafio = async () => {
    if (!newDesafio.titulo.trim()) return;
    setProcessingId("new");
    try {
      const res = await fetch(`/api/communities/${communityId}/desafios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newDesafio, criado_por: currentUser?.id }),
      });
      if (!res.ok) throw new Error("Falha ao criar");

      const tituloSalvo = newDesafio.titulo;
      setNewDesafio({
        titulo: "",
        descricao: "",
        instrucoes: "",
        tipo_envio: "check",
        xp_recompensa: 20,
        dia_semana: "Livre",
        criterio_avaliacao: "",
        aprovador_responsavel: "",
      });
      setShowNewModal(false);
      onNotify?.({
        title: "Desafio criado",
        message: `${tituloSalvo} publicado para a comunidade.`,
        type: "treino",
      });
      toast.success("Desafio criado!");
      await loadDesafios();
    } catch (err: any) {
      toast.error("Erro ao criar desafio: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const totalParaEnviar = desafios.filter(
    d => !d.entrega_status || d.entrega_status === "pendente" || d.entrega_status === "reenvio",
  ).length;
  const totalAnalise = desafios.filter(d => d.entrega_status === "em_analise").length;
  const totalAprovados = desafios.filter(d => d.entrega_status === "aprovado").length;
  const xpTotal = desafios.reduce((acc, d) => acc + (d.xp_aplicado ?? 0), 0);

  const cardsResumo = [
    { label: "Para enviar", value: totalParaEnviar, icon: Target, tone: "text-sky-300" },
    { label: "Em análise", value: totalAnalise, icon: Clock, tone: "text-amber-300" },
    { label: "Aprovados", value: totalAprovados, icon: CheckCircle2, tone: "text-emerald-300" },
    { label: "XP ganho", value: xpTotal, icon: Zap, tone: "text-yellow-300" },
  ];

  const cardsResumoVisiveis = isMobile && !showAllMobileKpis ? cardsResumo.slice(0, 2) : cardsResumo;

  const desafiosFiltrados = desafios.filter(desafio => {
    if (filtroLista === "todos") return true;
    if (filtroLista === "para_enviar") {
      return !desafio.entrega_status || desafio.entrega_status === "pendente" || desafio.entrega_status === "reenvio";
    }
    if (filtroLista === "em_analise") return desafio.entrega_status === "em_analise";
    return desafio.entrega_status === "aprovado";
  });

  const desafiosRenderizados =
    isMobile && filtroLista === "todos"
      ? desafiosFiltrados.slice(0, mobileVisibleLimit)
      : desafiosFiltrados;

  const hasMoreDesafiosMobile =
    isMobile && filtroLista === "todos" && desafiosRenderizados.length < desafiosFiltrados.length;

  return (
    <div className="space-y-4 text-left sm:space-y-5">
      <section className="rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Desafios da comunidade</p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Missões com status claro e ação rápida
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Fluxo direto para concluir, enviar prova e acompanhar aprovação sem poluição.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadDesafios}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
            >
              <RefreshCw size={13} />
              Atualizar
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400"
              >
                <Plus size={13} />
                Novo desafio
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {cardsResumoVisiveis.map(card => (
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
            onClick={() => setShowAllMobileKpis(current => !current)}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/50 transition hover:text-white sm:hidden"
          >
            {showAllMobileKpis ? "Ver resumo compacto" : "Ver todos os indicadores"}
          </button>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
            Filtro atual: {FILTROS_LISTA.find(item => item.id === filtroLista)?.label ?? "Todos"}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">{desafiosFiltrados.length} itens</p>
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
            value={filtroLista}
            onChange={event => setFiltroLista(event.target.value as FiltroLista)}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/35"
          >
            {FILTROS_LISTA.map(filtro => (
              <option key={filtro.id} value={filtro.id}>
                {filtro.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {FILTROS_LISTA.map(filtro => (
            <button
              key={filtro.id}
              type="button"
              onClick={() => setFiltroLista(filtro.id)}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
                filtroLista === filtro.id
                  ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                  : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-14">
          <RefreshCw className="animate-spin text-sky-500" size={24} />
        </div>
      ) : desafiosFiltrados.length === 0 ? (
        <div className="space-y-3 py-14 text-center opacity-25">
          <Target size={30} className="mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            {desafios.length === 0 ? "Nenhum desafio ativo no momento" : "Nenhum desafio encontrado neste filtro"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          {desafiosRenderizados.map((desafio, i) => {
            const entregaStatus = desafio.entrega_status ?? "pendente";
            const cfg = STATUS_CONFIG[entregaStatus] ?? STATUS_CONFIG.pendente;
            const isExpanded = expandedId === desafio.id;
            const isProcessing = processingId === desafio.id;

            return (
              <motion.article
                key={desafio.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-[22px] border border-white/10 bg-[#050B14] p-4 shadow-xl transition-colors hover:border-white/20 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sky-400">
                    <Target size={16} />
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-300">
                    <Zap size={10} fill="currentColor" /> +{desafio.xp_recompensa} XP
                  </div>
                </div>

                <h3 className="mt-3 text-sm font-black uppercase italic leading-tight tracking-tight text-white sm:text-base">
                  {desafio.titulo}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/35">{desafio.descricao}</p>

                {desafio.instrucoes && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : desafio.id)}
                      className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-sky-300/70 transition hover:text-sky-200"
                    >
                      Ver instruções
                      <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 overflow-hidden text-[10px] leading-relaxed text-white/30"
                        >
                          {desafio.instrucoes}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {desafio.dia_semana && desafio.dia_semana !== "Livre" && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase text-white/35">
                      {desafio.dia_semana}
                    </span>
                  )}
                  {desafio.prazo && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase text-white/35">
                      <Clock size={9} />
                      {new Date(desafio.prazo).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase text-white/35">
                    {TIPO_ENVIO_LABEL[desafio.tipo_envio]}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {(entregaStatus === "pendente" || entregaStatus === "reenvio") && (
                    <button
                      type="button"
                      onClick={() => {
                        if (desafio.tipo_envio === "check") handleEnviar(desafio);
                        else setSubmitModalDesafio(desafio);
                      }}
                      disabled={isProcessing}
                      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-40 ${cfg.bg} ${cfg.border}`}
                    >
                      {isProcessing ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : isFileDelivery(desafio.tipo_envio) || desafio.tipo_envio === "link" ? (
                        <>
                          <Upload size={13} />
                          Enviar prova
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          Concluir
                        </>
                      )}
                    </button>
                  )}

                  {entregaStatus === "em_analise" && (
                    <div className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <Clock size={13} /> Em análise
                    </div>
                  )}

                  {entregaStatus === "aprovado" && (
                    <div className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <CheckCircle2 size={13} /> Missão cumprida
                    </div>
                  )}

                  {entregaStatus === "reprovado" && (
                    <div className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <AlertTriangle size={13} /> Reprovado
                    </div>
                  )}

                  {((desafio.entrega_conteudo && desafio.entrega_conteudo !== "check") || desafio.entrega_arquivo_url) && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/40">Prova enviada</p>
                      {desafio.entrega_conteudo && desafio.entrega_conteudo !== "check" && desafio.tipo_envio === "texto" ? (
                        <p className="line-clamp-3 border-l-2 border-sky-500 pl-2 text-xs italic leading-relaxed text-white/70">
                          "{desafio.entrega_conteudo}"
                        </p>
                      ) : desafio.entrega_conteudo && desafio.entrega_conteudo !== "check" ? (
                        <a
                          href={desafio.entrega_conteudo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center gap-2 rounded-lg bg-sky-500/10 px-2.5 py-2 text-xs text-sky-300 transition hover:text-sky-200"
                        >
                          <ImageIcon size={13} className="shrink-0" />
                          <span className="truncate">{desafio.entrega_conteudo}</span>
                        </a>
                      ) : null}

                      {desafio.entrega_arquivo_url && (
                        <a
                          href={desafio.entrega_arquivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex w-full items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-300 transition hover:text-emerald-200"
                        >
                          <Upload size={13} className="shrink-0" />
                          <span className="truncate">Abrir arquivo enviado</span>
                        </a>
                      )}
                    </div>
                  )}

                  {canEvaluate && entregaStatus === "em_analise" && (
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAvaliar(desafio, "aprovar")}
                        disabled={isProcessing}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-[9px] font-black uppercase text-emerald-300 transition hover:bg-emerald-500 hover:text-black disabled:opacity-40"
                      >
                        {isProcessing ? <RefreshCw size={11} className="mx-auto animate-spin" /> : "Aprovar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvaliarModalDesafio(desafio)}
                        disabled={isProcessing}
                        className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 py-2 text-[9px] font-black uppercase text-yellow-300 transition hover:bg-yellow-500 hover:text-black disabled:opacity-40"
                      >
                        Reenvio
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvaliarModalDesafio(desafio)}
                        disabled={isProcessing}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-[9px] font-black uppercase text-rose-300 transition hover:bg-rose-500 hover:text-black disabled:opacity-40"
                      >
                        Reprovar
                      </button>
                    </div>
                  )}

                  {desafio.tentativa != null && desafio.tentativa > 1 && (
                    <p className="text-center text-[8px] font-black uppercase tracking-widest text-white/20">
                      Tentativa {desafio.tentativa}
                    </p>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {hasMoreDesafiosMobile && (
        <button
          type="button"
          onClick={() => setMobileVisibleLimit(current => current + 4)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white sm:hidden"
        >
          Mostrar mais desafios
        </button>
      )}

      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] border border-white/10 bg-[#0A1222] p-6 text-left shadow-2xl sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
                  Novo <span className="text-sky-400">desafio</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl bg-white/5 p-2 text-white/35 transition hover:text-rose-300"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Título</label>
                  <input
                    value={newDesafio.titulo}
                    onChange={e => setNewDesafio(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Treino concluído"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Descrição</label>
                  <textarea
                    value={newDesafio.descricao}
                    onChange={e => setNewDesafio(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="O que precisa ser feito?"
                    className="h-20 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Instruções (opcional)</label>
                  <textarea
                    value={newDesafio.instrucoes}
                    onChange={e => setNewDesafio(prev => ({ ...prev, instrucoes: e.target.value }))}
                    placeholder="Passo a passo para o aluno."
                    className="h-16 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/35">XP</label>
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={newDesafio.xp_recompensa}
                      onChange={e => setNewDesafio(prev => ({ ...prev, xp_recompensa: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/45"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Tipo de envio</label>
                    <select
                      value={newDesafio.tipo_envio}
                      onChange={e => setNewDesafio(prev => ({ ...prev, tipo_envio: e.target.value as Desafio["tipo_envio"] }))}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/45"
                    >
                      <option value="check">Check</option>
                      <option value="foto">Foto</option>
                      <option value="video">Vídeo</option>
                      <option value="texto">Texto</option>
                      <option value="link">Link</option>
                      <option value="arquivo">Arquivo/PDF</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Dia da semana</label>
                    <select
                      value={newDesafio.dia_semana}
                      onChange={e => setNewDesafio(prev => ({ ...prev, dia_semana: e.target.value }))}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/45"
                    >
                      <option value="Livre">Livre</option>
                      {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map(dia => (
                        <option key={dia} value={dia}>
                          {dia}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Critério de avaliação (opcional)</label>
                    <textarea
                      value={newDesafio.criterio_avaliacao}
                      onChange={e => setNewDesafio(prev => ({ ...prev, criterio_avaliacao: e.target.value }))}
                      placeholder="Ex: vídeo com corpo inteiro."
                      className="h-16 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/35">Aprovador responsável (opcional)</label>
                    <input
                      value={newDesafio.aprovador_responsavel}
                      onChange={e => setNewDesafio(prev => ({ ...prev, aprovador_responsavel: e.target.value }))}
                      placeholder="Ex: Treinador Marcos"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCriarDesafio}
                  disabled={!newDesafio.titulo.trim() || processingId === "new"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 disabled:opacity-45"
                >
                  {processingId === "new" ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Criar desafio
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitModalDesafio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm rounded-[26px] border border-white/10 bg-[#0A1222] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-black uppercase italic tracking-tighter text-white">
                  Enviar <span className="text-sky-400">prova</span>
                </h3>
                <button
                  type="button"
                  onClick={resetSubmitModal}
                  className="rounded-xl bg-white/5 p-1.5 text-white/35 transition hover:text-rose-300"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                  {submitModalDesafio.tipo_envio === "texto"
                    ? "Escreva o relato do desafio:"
                    : isFileDelivery(submitModalDesafio.tipo_envio)
                      ? "Envie o arquivo solicitado e, se quiser, adicione legenda:"
                      : `Insira o link da entrega (${submitModalDesafio.tipo_envio}):`}
                </p>

                {submitModalDesafio.tipo_envio === "texto" ? (
                  <textarea
                    value={conteudoEntrega}
                    onChange={e => setConteudoEntrega(e.target.value)}
                    placeholder="Descreva como concluiu o desafio."
                    className="h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                ) : submitModalDesafio.tipo_envio === "link" ? (
                  <input
                    value={conteudoEntrega}
                    onChange={e => setConteudoEntrega(e.target.value)}
                    placeholder="https://link-da-sua-entrega"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                ) : (
                  <textarea
                    value={conteudoEntrega}
                    onChange={e => setConteudoEntrega(e.target.value)}
                    placeholder="Legenda opcional para o avaliador."
                    className="h-20 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                )}

                {isFileDelivery(submitModalDesafio.tipo_envio) && (
                  <label className="flex min-h-[108px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-center transition hover:border-sky-500/45">
                    <Upload size={18} className="text-sky-400" />
                    <span className="mt-2 text-xs font-black text-white">
                      {arquivoEntrega?.name ?? "Selecionar arquivo"}
                    </span>
                    <span className="mt-1 text-[10px] text-white/35">
                      Foto, vídeo ou PDF conforme o desafio.
                    </span>
                    <input
                      type="file"
                      accept={acceptForDelivery(submitModalDesafio.tipo_envio)}
                      onChange={event => setArquivoEntrega(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    setUploadingEntrega(true);
                    try {
                      const arquivoUrl = isFileDelivery(submitModalDesafio.tipo_envio)
                        ? await uploadArquivoEntrega()
                        : null;
                      const enviado = await handleEnviar(submitModalDesafio, conteudoEntrega, arquivoUrl);
                      if (enviado) resetSubmitModal();
                    } catch (err: any) {
                      toast.error(err.message ?? "Falha ao enviar prova.");
                    } finally {
                      setUploadingEntrega(false);
                    }
                  }}
                  disabled={
                    processingId === submitModalDesafio.id ||
                    uploadingEntrega ||
                    (isFileDelivery(submitModalDesafio.tipo_envio) ? !arquivoEntrega : !conteudoEntrega.trim())
                  }
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-500 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 disabled:opacity-40"
                >
                  {processingId === submitModalDesafio.id || uploadingEntrega ? "Aguarde..." : "Enviar entrega"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {avaliarModalDesafio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm rounded-[26px] border border-white/10 bg-[#0A1222] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-black uppercase italic tracking-tighter text-white">
                  Feedback de <span className="text-sky-400">avaliação</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAvaliarModalDesafio(null);
                    setComentarioAvaliacao("");
                  }}
                  className="rounded-xl bg-white/5 p-1.5 text-white/35 transition hover:text-rose-300"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                  Informe o motivo para solicitar reenvio ou reprovar.
                </p>

                <textarea
                  value={comentarioAvaliacao}
                  onChange={e => setComentarioAvaliacao(e.target.value)}
                  placeholder="Escreva o feedback para o aluno."
                  className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-rose-500/45"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await handleAvaliar(avaliarModalDesafio, "reenvio", comentarioAvaliacao);
                      setAvaliarModalDesafio(null);
                      setComentarioAvaliacao("");
                    }}
                    disabled={!comentarioAvaliacao.trim() || processingId === avaliarModalDesafio.id}
                    className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 py-3 text-[10px] font-black uppercase text-yellow-300 transition hover:bg-yellow-500 hover:text-black disabled:opacity-40"
                  >
                    Exigir reenvio
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleAvaliar(avaliarModalDesafio, "reprovar", comentarioAvaliacao);
                      setAvaliarModalDesafio(null);
                      setComentarioAvaliacao("");
                    }}
                    disabled={!comentarioAvaliacao.trim() || processingId === avaliarModalDesafio.id}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-[10px] font-black uppercase text-rose-300 transition hover:bg-rose-500 hover:text-black disabled:opacity-40"
                  >
                    Reprovar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
