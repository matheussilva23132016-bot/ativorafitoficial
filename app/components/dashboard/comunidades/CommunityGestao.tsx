"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserX, ShieldCheck, RefreshCw, Search,
  CheckCircle2, X, Clock, UserPlus, Settings2,
  AlertTriangle, Crown, Shield, Zap, ChevronDown, Trash2,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { canDo } from "@/lib/communities/permissions";
import { CommunitySettingsPanel } from "./CommunitySettingsPanel";

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
interface Membro {
  membro_id:  string;
  user_id:    string;
  nickname:   string;
  full_name:  string;
  avatar_url: string | null;
  tags:       string[];
  joined_at:  string;
}

interface Solicitacao {
  id:         string;
  user_id:    string;
  nickname:   string;
  full_name:  string;
  avatar_url: string | null;
  mensagem:   string | null;
  created_at: string;
}

interface CommunityGestaoProps {
  communityId: string;
  currentUser: any;
  userTags:    string[];
  canDelete?:  boolean;
  onNotify?:   (n: any) => void;
  onGroupDeleted?: () => void;
}

type Section = "membros" | "solicitacoes" | "config";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const isValidUrl = (u: unknown): u is string =>
  typeof u === "string" && u.startsWith("http");

const TAG_COLORS: Record<string, string> = {
  Dono:         "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADM:          "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Nutri:        "bg-green-500/10 text-green-400 border-green-500/20",
  Nutricionista:"bg-green-500/10 text-green-400 border-green-500/20",
  Instrutor:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Personal:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Participante: "bg-white/5 text-white/30 border-white/10",
};

const TAG_ICONS: Record<string, React.ReactNode> = {
  Dono:         <Crown size={10} />,
  ADM:          <Shield size={10} />,
  Nutri:        <Zap size={10} />,
  Nutricionista:<Zap size={10} />,
  Instrutor:    <ShieldCheck size={10} />,
  Personal:     <ShieldCheck size={10} />,
  Participante: <Users size={10} />,
};

const TAGS_DISPONIVEIS = ["Participante", "Instrutor", "Personal", "Nutri", "Nutricionista", "ADM"];

// ══════════════════════════════════════════════════════════════════
// COMPONENTE
// ══════════════════════════════════════════════════════════════════
export function CommunityGestao({
  communityId,
  currentUser,
  userTags,
  canDelete = false,
  onNotify,
  onGroupDeleted,
}: CommunityGestaoProps) {
  const [membros,       setMembros]       = useState<Membro[]>([]);
  const [solicitacoes,  setSolicitacoes]  = useState<Solicitacao[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeSection, setActiveSection] = useState<Section>("membros");
  const [processingId,  setProcessingId]  = useState<string | null>(null);
  const [tagMenuId,     setTagMenuId]     = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recusaAlvo,    setRecusaAlvo]    = useState<Solicitacao | null>(null);
  const [motivoRecusa,  setMotivoRecusa]  = useState("");
  const [removeAlvo,    setRemoveAlvo]    = useState<Membro | null>(null);

  const canApprove = canDo(userTags, "member:approve");
  const canRemove  = canDo(userTags, "member:remove");
  const canTag     = canDo(userTags, "tag:assign");

  // ── Carrega dados ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membrosRes, solRes] = await Promise.all([
        fetch(`/api/communities/${communityId}/members`),
        fetch(`/api/communities/${communityId}/requests?requesterId=${currentUser?.id ?? ""}`),
      ]);
      const md = membrosRes.ok ? await membrosRes.json() : {};
      const sd = solRes.ok    ? await solRes.json()     : {};
      setMembros(md.members       ?? []);
      setSolicitacoes(sd.requests ?? []);
    } catch {
      setMembros([]);
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtro de busca ────────────────────────────────────────────
  const membrosFiltrados = membros.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.nickname?.toLowerCase().includes(q) ||
      m.full_name?.toLowerCase().includes(q)
    );
  });

  // ── Lê o ID real do usuário (mesma fonte usada ao criar o grupo) ──
  const getRequesterId = (): string | null => {
    return currentUser?.id ?? null;
  };

  // ── Deletar grupo ──────────────────────────────────────────────
  const handleDeletarGrupo = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeletingGroup(true);
    try {
      const requesterId = getRequesterId();
      const res = await fetch(`/api/communities/${communityId}`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ requesterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao deletar");
      }
      onNotify?.({
        title:   "Grupo Encerrado",
        message: "O grupo foi desativado com sucesso.",
        type:    "social",
      });
      toast.success("Grupo encerrado com sucesso.");
      onGroupDeleted?.();
    } catch (err: any) {
      toast.error("Erro ao deletar grupo: " + err.message);
      setConfirmDelete(false);
    } finally {
      setDeletingGroup(false);
    }
  };

  // ── Aprovar solicitação ────────────────────────────────────────
  const handleAprovar = async (sol: Solicitacao) => {
    setProcessingId(sol.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/requests`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          solicitacaoId: sol.id,
          acao:          "aprovar",
          analisadoPor:  currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao aprovar");
      setSolicitacoes(p => p.filter(s => s.id !== sol.id));
      setRecusaAlvo(null);
      setMotivoRecusa("");
      setRecusaAlvo(null);
      setMotivoRecusa("");
      onNotify?.({
        title:   "Acesso Liberado",
        message: `${sol.nickname || sol.full_name} entrou no esquadrão.`,
        type:    "social",
      });
      toast.success(`${sol.nickname || sol.full_name} aprovado!`);
      await loadData();
    } catch (err: any) {
      toast.error("Erro ao aprovar: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Recusar solicitação ────────────────────────────────────────
  const handleRecusar = async (sol: Solicitacao, motivo = "") => {
    setProcessingId(sol.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/requests`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          solicitacaoId: sol.id,
          acao:          "recusar",
          motivo:        motivo,
          analisadoPor:  currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao recusar");
      setSolicitacoes(p => p.filter(s => s.id !== sol.id));
      onNotify?.({ title: "Acesso Negado", message: "Solicitação recusada.", type: "social" });
      toast.info("Solicitação recusada.");
    } catch (err: any) {
      toast.error("Erro ao recusar: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Remover membro ─────────────────────────────────────────────
  const handleRemover = async (m: Membro) => {
    setProcessingId(m.membro_id);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          membroId:    m.membro_id,
          requesterId: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao remover");
      setMembros(p => p.filter(mb => mb.membro_id !== m.membro_id));
      setRemoveAlvo(null);
      onNotify?.({
        title:   "Membro Removido",
        message: `${m.nickname} foi desligado.`,
        type:    "social",
      });
      toast.success(`${m.nickname} removido.`);
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Alterar tag ────────────────────────────────────────────────
  const handleAlterarTag = async (m: Membro, novaTag: string) => {
    setTagMenuId(null);
    const jaTemTag = m.tags.includes(novaTag);

    if (novaTag === "Participante" && jaTemTag) {
      toast.info("Participante e a tag base de todo membro aprovado.");
      return;
    }

    setProcessingId(m.membro_id);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          membroId:    m.membro_id,
          tagNome:     novaTag,
          acao:        jaTemTag ? "remove" : "add",
          requesterId: currentUser?.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao atualizar tag");
      }
      setMembros(p =>
        p.map(mb =>
          mb.membro_id === m.membro_id
            ? {
                ...mb,
                tags: jaTemTag
                  ? mb.tags.filter(tag => tag !== novaTag)
                  : Array.from(new Set([...mb.tags, novaTag])),
              }
            : mb
        )
      );
      onNotify?.({
        title:   "Tag Atualizada",
        message: jaTemTag
          ? `${m.nickname} perdeu a tag ${novaTag}.`
          : `${m.nickname} recebeu a tag ${novaTag}.`,
        type:    "social",
      });
      toast.success(
        jaTemTag
          ? `Tag ${novaTag} removida de ${m.nickname}.`
          : `Tag ${novaTag} adicionada para ${m.nickname}.`,
      );
    } catch (err: any) {
      toast.error("Erro ao atualizar tag: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 text-left" onClick={() => setTagMenuId(null)}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
            <Settings2 size={22} className="text-sky-500" />
            Gestão do <span className="text-sky-500 ml-2">Esquadrão</span>
          </h2>
          <p className="text-xs text-white/25 font-medium mt-1">
            Gerencie membros, permissões e solicitações de entrada.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/40 hover:text-white hover:border-white/20 transition-all disabled:opacity-40 shrink-0 sm:w-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* ── TABS ────────────────────────────────────────────────── */}
      <div className="grid w-full grid-cols-3 gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/5 sm:inline-flex sm:w-fit sm:gap-2">
        {([
          { id: "membros",      label: "Membros",      count: membros.length,      icon: Users    },
          { id: "solicitacoes", label: "Solicitações", count: solicitacoes.length, icon: UserPlus },
          { id: "config",       label: "Controle",     count: 0,                  icon: Settings2 },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all sm:px-5 sm:text-[10px]
              ${activeSection === tab.id
                ? "bg-sky-500 text-black shadow-lg"
                : "text-white/30 hover:text-white/60"}`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black
                ${activeSection === tab.id
                  ? "bg-black/20 text-black"
                  : "bg-white/10 text-white/40"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── MEMBROS ─────────────────────────────────────────────── */}
        {activeSection === "membros" && (
          <motion.div
            key="membros"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou @nickname..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-5 text-sm text-white outline-none focus:border-sky-500/40 transition-all placeholder:text-white/15"
              />
            </div>

            {loading ? (
              <div className="py-16 flex justify-center">
                <RefreshCw className="animate-spin text-sky-500" size={24} />
              </div>
            ) : membrosFiltrados.length === 0 ? (
              <div className="py-16 text-center opacity-20">
                <Users size={32} className="mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {searchQuery ? "Nenhum resultado encontrado" : "Nenhum membro"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {membrosFiltrados.map(m => (
                  <div
                    key={m.membro_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0">
                        {isValidUrl(m.avatar_url) ? (
                          <Image src={m.avatar_url} alt={m.nickname} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-sm font-black text-white/30">
                              {(m.nickname || m.full_name || "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase italic text-white leading-none mb-1">
                          {m.nickname || m.full_name}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {m.tags.map(tag => (
                            <span
                              key={tag}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border
                                ${TAG_COLORS[tag] ?? TAG_COLORS.Participante}`}
                            >
                              {TAG_ICONS[tag]} {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto" onClick={e => e.stopPropagation()}>
                      {canTag && !m.tags.includes("Dono") && (
                        <div className="relative flex-1 sm:flex-none">
                          <button
                            onClick={() => setTagMenuId(tagMenuId === m.membro_id ? null : m.membro_id)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white/40 hover:text-white hover:border-white/20 transition-all"
                          >
                            <ShieldCheck size={13} />
                            Tag
                            <ChevronDown size={11} className={`transition-transform ${tagMenuId === m.membro_id ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {tagMenuId === m.membro_id && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                className="absolute right-0 top-full mt-2 z-50 bg-[#0A1222] border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[160px]"
                              >
                                {TAGS_DISPONIVEIS.map(tag => (
                                  <button
                                    key={tag}
                                    onClick={() => handleAlterarTag(m, tag)}
                                    className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all text-left
                                      ${m.tags.includes(tag)
                                        ? "bg-sky-500/10 text-sky-400"
                                        : "text-white/40 hover:bg-white/5 hover:text-white"}`}
                                  >
                                    {TAG_ICONS[tag]} {tag}
                                    {m.tags.includes(tag) && (
                                      <CheckCircle2 size={11} className="ml-auto text-sky-400" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {canRemove && !m.tags.includes("Dono") && (
                        <button
                          onClick={() => setRemoveAlvo(m)}
                          disabled={processingId === m.membro_id}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-black transition-all disabled:opacity-40 shrink-0"
                        >
                          {processingId === m.membro_id
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <UserX size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SOLICITAÇÕES ────────────────────────────────────────── */}
        {activeSection === "solicitacoes" && (
          <motion.div
            key="solicitacoes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="py-16 flex justify-center">
                <RefreshCw className="animate-spin text-sky-500" size={24} />
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="py-16 text-center opacity-20">
                <Clock size={32} className="mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Nenhuma solicitação pendente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitacoes.map(sol => (
                  <div
                    key={sol.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-[22px] hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/10 shrink-0">
                        {isValidUrl(sol.avatar_url) ? (
                          <Image src={sol.avatar_url} alt={sol.nickname} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-sky-500/10 flex items-center justify-center">
                            <span className="text-base font-black text-sky-400">
                              {(sol.nickname || sol.full_name || "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase italic text-white leading-none mb-1">
                          {sol.nickname || sol.full_name}
                        </h4>
                        {sol.mensagem && (
                          <p className="text-[10px] text-white/30 font-medium max-w-xs line-clamp-1">
                            "{sol.mensagem}"
                          </p>
                        )}
                        <span className="text-[8px] text-white/15 font-black uppercase tracking-widest">
                          {new Date(sol.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {canApprove && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleAprovar(sol)}
                          disabled={processingId === sol.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-[9px] font-black uppercase hover:bg-green-500 hover:text-black transition-all disabled:opacity-40"
                        >
                          {processingId === sol.id
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <><CheckCircle2 size={13} /> Aprovar</>}
                        </button>
                        <button
                          onClick={() => {
                            setMotivoRecusa("");
                            setRecusaAlvo(sol);
                          }}
                          disabled={processingId === sol.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-black transition-all disabled:opacity-40"
                        >
                          <X size={13} /> Recusar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!canApprove && (
              <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                <AlertTriangle size={15} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-500/80 font-medium leading-relaxed">
                  Você não tem permissão para aprovar ou recusar solicitações.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeSection === "config" && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <CommunitySettingsPanel
              communityId={communityId}
              currentUser={currentUser}
              canEdit={userTags.includes("Dono")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ZONA DE PERIGO — para Dono e ADM ───────────────────────── */}
      <AnimatePresence>
        {recusaAlvo && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1222] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-white">
                    Recusar solicitação
                  </p>
                  <p className="mt-1 text-xs text-white/35">
                    Informe um motivo opcional para {recusaAlvo.nickname || recusaAlvo.full_name}.
                  </p>
                </div>
                <button
                  onClick={() => { setRecusaAlvo(null); setMotivoRecusa(""); }}
                  className="rounded-xl bg-white/5 p-2 text-white/30 transition-colors hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <textarea
                value={motivoRecusa}
                onChange={event => setMotivoRecusa(event.target.value)}
                placeholder="Ex: vagas encerradas nesta turma."
                className="mt-4 h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/15 focus:border-rose-500/40"
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setRecusaAlvo(null); setMotivoRecusa(""); }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase text-white/40 transition-colors hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRecusar(recusaAlvo, motivoRecusa.trim())}
                  disabled={processingId === recusaAlvo.id}
                  className="rounded-xl bg-rose-500 px-4 py-3 text-[10px] font-black uppercase text-black transition-colors hover:bg-rose-400 disabled:opacity-50"
                >
                  {processingId === recusaAlvo.id ? "Recusando..." : "Recusar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removeAlvo && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#0A1222] p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div>
                  <p className="text-sm font-black uppercase text-rose-300">
                    Remover membro
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">
                    {removeAlvo.nickname || removeAlvo.full_name} perderá acesso ao hub, treinos, nutrição e desafios desta comunidade.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRemoveAlvo(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase text-white/40 transition-colors hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRemover(removeAlvo)}
                  disabled={processingId === removeAlvo.membro_id}
                  className="rounded-xl bg-rose-500 px-4 py-3 text-[10px] font-black uppercase text-black transition-colors hover:bg-rose-400 disabled:opacity-50"
                >
                  {processingId === removeAlvo.membro_id ? "Removendo..." : "Remover"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {canDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 pt-6 border-t border-rose-500/10"
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/40 mb-4">
            ⚠ Zona de Perigo
          </p>

          {!confirmDelete ? (
            <button
              onClick={handleDeletarGrupo}
              className="flex items-center gap-3 px-6 py-4 bg-rose-500/5 border border-rose-500/20 text-rose-500/60 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/40 transition-all"
            >
              <Trash2 size={15} />
              Encerrar e Deletar Grupo
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <div className="flex-1">
                <p className="text-sm font-black uppercase text-rose-400 leading-none mb-1">
                  Tem certeza absoluta?
                </p>
                <p className="text-[10px] text-rose-500/60 font-medium">
                  Esta ação é irreversível. O grupo será encerrado permanentemente.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-5 py-3 bg-white/5 border border-white/10 text-white/40 rounded-xl text-[9px] font-black uppercase hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletarGrupo}
                  disabled={deletingGroup}
                  className="flex items-center gap-2 px-5 py-3 bg-rose-500 text-black rounded-xl text-[9px] font-black uppercase hover:bg-rose-400 transition-all disabled:opacity-50"
                >
                  {deletingGroup
                    ? <RefreshCw size={13} className="animate-spin" />
                    : <><Trash2 size={13} /> Confirmar Exclusão</>}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

    </div>
  );
}
