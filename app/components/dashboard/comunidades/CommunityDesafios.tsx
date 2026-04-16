"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, CheckCircle2, Clock, Zap, Plus,
  ImageIcon, X, Upload, AlertTriangle, RefreshCw,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { canDo } from "@/lib/communities/permissions";

interface Desafio {
  id:             string;
  titulo:         string;
  descricao:      string;
  instrucoes:     string | null;
  tipo_envio:     "foto" | "video" | "texto" | "link" | "arquivo" | "check";
  xp_recompensa:  number;
  dia_semana:     string | null;
  prazo:          string | null;
  status:         "ativo" | "encerrado" | "rascunho";
  entrega_id:          string | null;
  entrega_status:      "pendente" | "em_analise" | "aprovado" | "reprovado" | "reenvio" | null;
  entrega_conteudo?:   string | null;
  entrega_arquivo_url?:string | null;
  xp_aplicado:         number;
  tentativa:           number | null;
}

interface CommunityDesafiosProps {
  currentUser: any;
  communityId: string;
  userTags:    string[];
  onNotify?:   (n: any) => void;
  triggerXP?:  (n: number) => void;
}

const STATUS_CONFIG = {
  pendente:   { bg: "bg-white/5 hover:bg-sky-500 hover:text-black",         border: "border-white/10",      text: "text-white"      },
  aprovado:   { bg: "bg-green-500/10",                                       border: "border-green-500/20",  text: "text-green-500"  },
  em_analise: { bg: "bg-orange-500/10",                                      border: "border-orange-500/20", text: "text-orange-500" },
  reprovado:  { bg: "bg-rose-500/10",                                        border: "border-rose-500/20",   text: "text-rose-500"   },
  reenvio:    { bg: "bg-yellow-500/10 hover:bg-yellow-500 hover:text-black", border: "border-yellow-500/20", text: "text-yellow-400" },
};

const isFileDelivery = (tipo: Desafio["tipo_envio"]) =>
  tipo === "foto" || tipo === "video" || tipo === "arquivo";

const acceptForDelivery = (tipo: Desafio["tipo_envio"]) => {
  if (tipo === "foto") return "image/*";
  if (tipo === "video") return "video/*";
  if (tipo === "arquivo") return "image/*,video/*,application/pdf";
  return undefined;
};

export function CommunityDesafios({
  currentUser, communityId, userTags, onNotify, triggerXP,
}: CommunityDesafiosProps) {
  const canCreate   = canDo(userTags, "desafio:create");
  const canEvaluate = canDo(userTags, "desafio:evaluate");

  const [desafios, setDesafios]         = useState<Desafio[]>([]);
  const [loading, setLoading]           = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  // States de Modais de Gamificação
  const [submitModalDesafio, setSubmitModalDesafio] = useState<Desafio | null>(null);
  const [conteudoEntrega, setConteudoEntrega]       = useState("");
  const [arquivoEntrega, setArquivoEntrega]         = useState<File | null>(null);
  const [uploadingEntrega, setUploadingEntrega]     = useState(false);

  const [avaliarModalDesafio, setAvaliarModalDesafio] = useState<Desafio | null>(null);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");

  const [newDesafio, setNewDesafio] = useState({
    titulo:                "",
    descricao:             "",
    instrucoes:            "",
    tipo_envio:            "check" as Desafio["tipo_envio"],
    xp_recompensa:         20,
    dia_semana:            "Livre",
    criterio_avaliacao:    "",
    aprovador_responsavel: "",
  });

  const loadDesafios = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/communities/${communityId}/desafios?userId=${currentUser.id}`);
      const data = res.ok ? await res.json() : {};
      setDesafios(data.desafios ?? []);
    } catch {
      setDesafios([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => { loadDesafios(); }, [loadDesafios]);

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
    const conteudoNormalizado = conteudoFornecido?.trim()
      || (desafio.tipo_envio === "check" ? "check" : null);

    setProcessingId(desafio.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/desafios/entregar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desafioId: desafio.id,
          userId:    currentUser?.id,
          conteudo:  conteudoNormalizado,
          arquivo_url: arquivoUrl ?? null,
        }),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      setDesafios(prev =>
        prev.map(d => d.id === desafio.id ? {
          ...d,
          entrega_status: "em_analise",
          entrega_conteudo: conteudoNormalizado,
          entrega_arquivo_url: arquivoUrl ?? null,
          tentativa: (d.tentativa ?? 0) + 1,
        } : d)
      );
      onNotify?.({ title: "Entrega Enviada", message: `${desafio.titulo} — aguardando avaliação.`, type: "treino" });
      toast.success("Missão enviada com sucesso!");
      return true;
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const handleAvaliar = async (desafio: Desafio, acao: "aprovar" | "reprovar" | "reenvio", comentario?: string) => {
    if (!desafio.entrega_id) return;
    setProcessingId(desafio.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/desafios/entregar`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entregaId: desafio.entrega_id, acao, avaliado_por: currentUser?.id, comentario }),
      });
      if (!res.ok) throw new Error("Falha ao avaliar");
      const novoStatus = acao === "aprovar" ? "aprovado" : acao === "reprovar" ? "reprovado" : "reenvio";
      setDesafios(prev =>
        prev.map(d =>
          d.id === desafio.id
            ? { ...d, entrega_status: novoStatus as Desafio["entrega_status"], xp_aplicado: acao === "aprovar" ? d.xp_recompensa : 0 }
            : d
        )
      );
      if (acao === "aprovar") {
        triggerXP?.(desafio.xp_recompensa);
        onNotify?.({ title: "Desafio Aprovado! ✅", message: `+${desafio.xp_recompensa} XP concedido.`, type: "treino" });
        toast.success("Desafio aprovado!");
      } else {
        toast.info(`Desafio marcado como ${novoStatus}.`);
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
        method:  "POST",
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
      onNotify?.({ title: "Missão Criada", message: `${tituloSalvo} publicada para o esquadrão.`, type: "treino" });
      toast.success("Missão criada!");
      await loadDesafios();
    } catch (err: any) {
      toast.error("Erro ao criar missão: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const totalAprovados = desafios.filter(d => d.entrega_status === "aprovado").length;
  const totalPendentes = desafios.filter(d => d.entrega_status === "em_analise").length;
  const xpTotal        = desafios.reduce((acc, d) => acc + (d.xp_aplicado ?? 0), 0);

  return (
    <div className="space-y-6 text-left">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Central de <span className="text-sky-500">Missões</span>
          </h2>
          <p className="text-xs text-white/30 font-medium mt-1">
            Cumpra os desafios diários, acumule XP e domine o ranking.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shrink-0 sm:w-auto"
          >
            <Plus size={13} /> Nova Missão
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Aprovados",  value: totalAprovados, icon: CheckCircle2, color: "text-green-500",  bg: "bg-green-500/10 border-green-500/20"  },
          { label: "Em Análise", value: totalPendentes, icon: Clock,        color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "XP Ganho",   value: xpTotal,        icon: Zap,          color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20"   },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-[22px] p-4 flex flex-col items-center gap-2`}>
            <stat.icon size={18} className={stat.color} />
            <span className="text-xl font-black italic text-white">{stat.value}</span>
            <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <RefreshCw className="animate-spin text-sky-500" size={24} />
        </div>
      ) : desafios.length === 0 ? (
        <div className="py-16 text-center opacity-20 space-y-3">
          <Target size={32} className="mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma missão ativa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {desafios.map((desafio, i) => {
            const entregaStatus = desafio.entrega_status ?? "pendente";
            const cfg           = STATUS_CONFIG[entregaStatus] ?? STATUS_CONFIG.pendente;
            const isExpanded    = expandedId === desafio.id;
            const isProcessing  = processingId === desafio.id;

            return (
              <motion.div
                key={desafio.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#050B14] border border-white/5 rounded-[26px] p-6 shadow-xl flex flex-col justify-between hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-sky-500 border border-white/5">
                      <Target size={18} />
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                      <Zap size={11} fill="currentColor" /> +{desafio.xp_recompensa} XP
                    </div>
                  </div>

                  <h3 className="text-base font-black uppercase italic tracking-tighter text-white mb-1.5 leading-tight">
                    {desafio.titulo}
                  </h3>
                  <p className="text-xs text-white/30 font-medium leading-relaxed line-clamp-2">
                    {desafio.descricao}
                  </p>

                  {desafio.instrucoes && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : desafio.id)}
                        className="flex items-center gap-1 text-[9px] font-black uppercase text-sky-500/60 hover:text-sky-400 transition-colors"
                      >
                        Instruções
                        <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-[10px] text-white/25 mt-2 leading-relaxed overflow-hidden"
                          >
                            {desafio.instrucoes}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {desafio.dia_semana && desafio.dia_semana !== "Livre" && (
                      <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-white/25 font-black uppercase border border-white/5">
                        {desafio.dia_semana}
                      </span>
                    )}
                    {desafio.prazo && (
                      <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-white/25 font-black uppercase border border-white/5 flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(desafio.prazo).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-white/25 font-black uppercase border border-white/5">
                      {desafio.tipo_envio}
                    </span>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="mt-5 pt-5 border-t border-white/5 space-y-2">
                  {(entregaStatus === "pendente" || entregaStatus === "reenvio") && (
                    <button
                      onClick={() => {
                        if (desafio.tipo_envio === "check") handleEnviar(desafio);
                        else setSubmitModalDesafio(desafio);
                      }}
                      disabled={isProcessing}
                      className={`w-full flex items-center justify-center gap-2 py-3 transition-all text-white text-[10px] font-black uppercase tracking-widest rounded-xl border ${cfg.bg} ${cfg.border} disabled:opacity-40`}
                    >
                      {isProcessing
                        ? <RefreshCw size={13} className="animate-spin" />
                        : isFileDelivery(desafio.tipo_envio) || desafio.tipo_envio === "link"
                          ? <><Upload size={13} /> Enviar Prova</>
                          : <><CheckCircle2 size={13} /> Concluir</>
                      }
                    </button>
                  )}

                  {entregaStatus === "em_analise" && (
                    <div className={`w-full flex items-center justify-center gap-2 py-3 ${cfg.bg} ${cfg.text} text-[10px] font-black uppercase tracking-widest rounded-xl border ${cfg.border}`}>
                      <Clock size={13} /> Em Análise
                    </div>
                  )}

                  {entregaStatus === "aprovado" && (
                    <div className={`w-full flex items-center justify-center gap-2 py-3 ${cfg.bg} ${cfg.text} text-[10px] font-black uppercase tracking-widest rounded-xl border ${cfg.border}`}>
                      <CheckCircle2 size={13} /> Missão Cumprida
                    </div>
                  )}

                  {entregaStatus === "reprovado" && (
                    <div className={`w-full flex items-center justify-center gap-2 py-3 ${cfg.bg} ${cfg.text} text-[10px] font-black uppercase tracking-widest rounded-xl border ${cfg.border}`}>
                      <AlertTriangle size={13} /> Reprovado
                    </div>
                  )}

                  {((desafio.entrega_conteudo && desafio.entrega_conteudo !== "check") || desafio.entrega_arquivo_url) && (
                    <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2">Prova Enviada:</p>
                      {desafio.entrega_conteudo && desafio.entrega_conteudo !== "check" && desafio.tipo_envio === "texto" ? (
                        <p className="text-xs text-white/80 leading-relaxed italic border-l-2 border-sky-500 pl-3">
                          "{desafio.entrega_conteudo}"
                        </p>
                      ) : desafio.entrega_conteudo && desafio.entrega_conteudo !== "check" ? (
                        <a href={desafio.entrega_conteudo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 px-3 py-2 rounded-lg truncate">
                          <ImageIcon size={13} className="shrink-0" />
                          <span className="truncate">{desafio.entrega_conteudo}</span>
                        </a>
                      ) : null}
                      {desafio.entrega_arquivo_url && (
                        <a href={desafio.entrega_arquivo_url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 text-xs text-emerald-300 hover:text-emerald-200 transition-colors bg-emerald-500/10 px-3 py-2 rounded-lg truncate">
                          <Upload size={13} className="shrink-0" />
                          <span className="truncate">Abrir arquivo enviado</span>
                        </a>
                      )}
                    </div>
                  )}

                  {canEvaluate && entregaStatus === "em_analise" && (
                    <div className="grid grid-cols-1 gap-2 mt-2 sm:grid-cols-3">
                      <button
                        onClick={() => handleAvaliar(desafio, "aprovar")}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase rounded-xl hover:bg-green-500 hover:text-black transition-all disabled:opacity-40"
                      >
                        {isProcessing ? <RefreshCw size={11} className="animate-spin mx-auto" /> : "✓ Aprovar"}
                      </button>
                      <button
                        onClick={() => setAvaliarModalDesafio(desafio)}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-black uppercase rounded-xl hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-40"
                      >
                        ↩ Reenvio
                      </button>
                      <button
                        onClick={() => setAvaliarModalDesafio(desafio)}
                        disabled={isProcessing}
                        className="flex-1 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase rounded-xl hover:bg-rose-500 hover:text-black transition-all disabled:opacity-40"
                      >
                        ✗ Reprovar
                      </button>
                    </div>
                  )}

                  {desafio.tentativa != null && desafio.tentativa > 1 && (
                    <p className="text-[8px] text-white/15 font-black uppercase text-center tracking-widest">
                      Tentativa {desafio.tentativa}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL NOVA MISSÃO */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0A1222] border border-white/10 rounded-[28px] p-8 shadow-2xl text-left max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase italic text-white tracking-tighter">
                  Nova <span className="text-sky-500">Missão</span>
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-2 bg-white/5 rounded-xl text-white/30 hover:text-rose-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Título da Missão</label>
                  <input
                    value={newDesafio.titulo}
                    onChange={e => setNewDesafio(p => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ex: Treino Concluído"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-sky-500/50 transition-all placeholder:text-white/15"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Descrição</label>
                  <textarea
                    value={newDesafio.descricao}
                    onChange={e => setNewDesafio(p => ({ ...p, descricao: e.target.value }))}
                    placeholder="O que o atleta precisa fazer?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-20 resize-none outline-none focus:border-sky-500/50 transition-all placeholder:text-white/15"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Instruções Detalhadas (opcional)</label>
                  <textarea
                    value={newDesafio.instrucoes}
                    onChange={e => setNewDesafio(p => ({ ...p, instrucoes: e.target.value }))}
                    placeholder="Passo a passo, dicas, referências..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-16 resize-none outline-none focus:border-sky-500/50 transition-all placeholder:text-white/15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">XP Recompensa</label>
                    <input
                      type="number"
                      min={5}
                      max={500}
                      value={newDesafio.xp_recompensa}
                      onChange={e => setNewDesafio(p => ({ ...p, xp_recompensa: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-sky-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Tipo de Envio</label>
                    <select
                      value={newDesafio.tipo_envio}
                      onChange={e => setNewDesafio(p => ({ ...p, tipo_envio: e.target.value as Desafio["tipo_envio"] }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-sky-500/50 transition-all appearance-none"
                    >
                      <option value="check">Check (confirmar)</option>
                      <option value="foto">Foto</option>
                      <option value="video">Vídeo</option>
                      <option value="texto">Texto</option>
                      <option value="link">Link</option>
                      <option value="arquivo">Arquivo/PDF</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Dia da Semana</label>
                    <select
                      value={newDesafio.dia_semana}
                      onChange={e => setNewDesafio(p => ({ ...p, dia_semana: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-sky-500/50 transition-all appearance-none"
                    >
                      <option value="Livre">Livre (qualquer dia)</option>
                      {["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Critério de Avaliação (opcional)</label>
                    <textarea
                      value={newDesafio.criterio_avaliacao}
                      onChange={e => setNewDesafio(p => ({ ...p, criterio_avaliacao: e.target.value }))}
                      placeholder="Ex: O vídeo precisa estar gravado de corpo inteiro."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-16 resize-none outline-none focus:border-sky-500/50 transition-all placeholder:text-white/15"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Aprovador Responsável (opcional)</label>
                    <input
                      value={newDesafio.aprovador_responsavel}
                      onChange={e => setNewDesafio(p => ({ ...p, aprovador_responsavel: e.target.value }))}
                      placeholder="Ex: Treinador Marcos"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-sky-500/50 transition-all placeholder:text-white/15"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCriarDesafio}
                  disabled={!newDesafio.titulo.trim() || processingId === "new"}
                  className="w-full py-4 bg-sky-500 text-black font-black uppercase italic rounded-2xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {processingId === "new"
                    ? <><RefreshCw size={14} className="animate-spin" /> Criando...</>
                    : <><Upload size={15} /> Criar Missão</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ENVIAR PROVA (PARTICIPANTE) */}
      <AnimatePresence>
        {submitModalDesafio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0A1222] border border-white/10 rounded-[28px] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-black uppercase italic text-white tracking-tighter">
                  Enviar <span className="text-sky-500">Prova</span>
                </h3>
                <button
                  onClick={resetSubmitModal}
                  className="p-1.5 bg-white/5 rounded-xl text-white/30 hover:text-rose-400"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest font-bold">
                  {submitModalDesafio.tipo_envio === "texto" 
                    ? "Escreva o relato da sua missão abaixo:"
                    : isFileDelivery(submitModalDesafio.tipo_envio)
                      ? "Envie o arquivo solicitado e adicione uma legenda opcional:"
                    : `Insira o link (URL) da sua ${submitModalDesafio.tipo_envio} abaixo:`}
                </p>

                {submitModalDesafio.tipo_envio === "texto" ? (
                  <textarea
                    value={conteudoEntrega}
                    onChange={e => setConteudoEntrega(e.target.value)}
                    placeholder="Minha missão foi..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-32 resize-none outline-none focus:border-sky-500/50"
                  />
                ) : submitModalDesafio.tipo_envio === "link" ? (
                  <input
                    value={conteudoEntrega}
                    onChange={e => setConteudoEntrega(e.target.value)}
                    placeholder={`https://link-da-sua-${submitModalDesafio.tipo_envio}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-sky-500/50 placeholder:text-white/15"
                  />
                ) : (
                  <textarea
                    value={conteudoEntrega}
                    onChange={e => setConteudoEntrega(e.target.value)}
                    placeholder="Legenda opcional para o avaliador..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-20 resize-none outline-none focus:border-sky-500/50 placeholder:text-white/15"
                  />
                )}

                {isFileDelivery(submitModalDesafio.tipo_envio) && (
                  <label className="flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-center transition-colors hover:border-sky-500/40">
                    <Upload size={18} className="text-sky-400" />
                    <span className="mt-2 text-xs font-black text-white">
                      {arquivoEntrega?.name ?? "Selecionar arquivo"}
                    </span>
                    <span className="mt-1 text-[10px] text-white/30">
                      Foto, video ou PDF conforme a missao.
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
                    processingId === submitModalDesafio.id
                    || uploadingEntrega
                    || (isFileDelivery(submitModalDesafio.tipo_envio)
                      ? !arquivoEntrega
                      : !conteudoEntrega.trim())
                  }
                  className="w-full py-3 bg-sky-500 text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40"
                >
                  {processingId === submitModalDesafio.id || uploadingEntrega ? "Aguarde..." : "Finalizar Missão"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL AVALIAR PROVA (ADM) */}
      <AnimatePresence>
        {avaliarModalDesafio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0A1222] border border-white/10 rounded-[28px] p-6 shadow-2xl"
            >
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-black uppercase italic text-white tracking-tighter">
                  Feedback de <span className="text-sky-500">Avaliação</span>
                </h3>
                <button
                  onClick={() => { setAvaliarModalDesafio(null); setComentarioAvaliacao(""); }}
                  className="p-1.5 bg-white/5 rounded-xl text-white/30 hover:text-rose-400"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
                  Por que o aluno reprovou ou precisa reenviar?
                </p>

                <textarea
                  value={comentarioAvaliacao}
                  onChange={e => setComentarioAvaliacao(e.target.value)}
                  placeholder="Escreva o motivo..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-24 resize-none outline-none focus:border-rose-500/50"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      await handleAvaliar(avaliarModalDesafio, "reenvio", comentarioAvaliacao);
                      setAvaliarModalDesafio(null);
                      setComentarioAvaliacao("");
                    }}
                    disabled={!comentarioAvaliacao.trim() || processingId === avaliarModalDesafio.id}
                    className="py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase rounded-xl hover:bg-yellow-500 hover:text-black transition-all disabled:opacity-40"
                  >
                    Exigir Reenvio
                  </button>
                  <button
                    onClick={async () => {
                      await handleAvaliar(avaliarModalDesafio, "reprovar", comentarioAvaliacao);
                      setAvaliarModalDesafio(null);
                      setComentarioAvaliacao("");
                    }}
                    disabled={!comentarioAvaliacao.trim() || processingId === avaliarModalDesafio.id}
                    className="py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase rounded-xl hover:bg-rose-500 hover:text-black transition-all disabled:opacity-40"
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
