"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, X, Globe, Lock, Users,
  Target, ImageIcon, Palette, RefreshCw, Zap, AlignLeft,
} from "lucide-react";
import { CommunityCard } from "./CommunityCard";
import { motion, AnimatePresence } from "framer-motion";
import { CommunityHub } from "./CommunityHub";
import { toast } from "sonner";
import {
  appendCommunityCoverFocus,
  DEFAULT_COVER_POSITION,
} from "./cover-utils";

interface CommunityListProps {
  currentUser:       any;
  initialDeepLink?:  { communityId: string; tab: string } | null;
  onClearDeepLink?:  () => void;
  onNotify?:         (notif: any) => void;
  triggerXP?:        (amount: number) => void;
}

const ELITE_THEMES = [
  { id: "sky",     label: "Céu Neon",    bg: "bg-sky-500",     text: "text-sky-500"     },
  { id: "rose",    label: "Sangue Alpha", bg: "bg-rose-500",    text: "text-rose-500"    },
  { id: "emerald", label: "Bio Digital",  bg: "bg-emerald-500", text: "text-emerald-500" },
  { id: "purple",  label: "Cyber Roxo",   bg: "bg-purple-500",  text: "text-purple-500"  },
  { id: "amber",   label: "Ouro Puro",    bg: "bg-amber-500",   text: "text-amber-500"   },
];

const CATEGORIAS = [
  "Emagrecimento", "Hipertrofia", "Definição", "Força",
  "Resistência", "Condicionamento", "Mobilidade",
  "Performance", "Saúde geral", "Recomposição corporal", "Todas",
];

const FORM_INITIAL = {
  name:        "",
  description: "",
  focus:       "Todas",
  privacy:     "public" as "public" | "private",
  cover_url:   "",
  theme:       "sky",
};

export function CommunityList({
  currentUser, initialDeepLink, onClearDeepLink, onNotify, triggerXP,
}: CommunityListProps) {
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(
    initialDeepLink?.communityId ?? null
  );
  const [comunidades,   setComunidades]   = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [joiningId,     setJoiningId]     = useState<string | null>(null);
  const [isCreating,    setIsCreating]    = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [newGroup,      setNewGroup]      = useState(FORM_INITIAL);
  const [coverFile,     setCoverFile]     = useState<File | null>(null);
  const [coverPosition, setCoverPosition] = useState<{ x: number; y: number }>({
    ...DEFAULT_COVER_POSITION,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTheme  = ELITE_THEMES.find(t => t.id === newGroup.theme) ?? ELITE_THEMES[0];

  const closeCreateModal = () => {
    setIsCreating(false);
    setNewGroup(FORM_INITIAL);
    setCoverFile(null);
    setCoverPosition({ ...DEFAULT_COVER_POSITION });
  };

  const getUserId = useCallback((): string | null => {
    return currentUser?.id ?? null;
  }, [currentUser]);

  const loadCommunities = useCallback(async () => {
    const uid = getUserId();
    if (!uid) { setComunidades([]); setLoading(false); return []; }
    try {
      const res  = await fetch(`/api/communities?userId=${uid}`);
      const data = res.ok ? await res.json() : {};
      const next = Array.isArray(data.communities) ? data.communities : [];
      setComunidades(next);
      return next;
    } catch {
      setComunidades([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);

  useEffect(() => {
    if (initialDeepLink?.communityId) {
      setActiveCommunityId(initialDeepLink.communityId);
    }
  }, [initialDeepLink?.communityId, initialDeepLink?.tab]);

  const handleOpenCommunity = useCallback(
    async (community: any) => {
      const uid = getUserId();
      if (!uid) {
        toast.error("Faca login para acessar as comunidades.");
        return;
      }

      if (joiningId) return;

      if (community.isMember || community.owner_id === uid) {
        setActiveCommunityId(community.id);
        return;
      }

      if (community.privacidade === "private" && community.request_status === "pendente") {
        toast.info("Sua solicitação já está pendente de aprovação.");
        return;
      }

      setJoiningId(community.id);
      try {
        const res = await fetch(`/api/communities/${community.id}/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid }),
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 409 && result?.requestStatus === "pendente") {
            toast.info("Sua solicitação já está pendente de aprovação.");
            await loadCommunities();
            return;
          }
          throw new Error(result?.error ?? "Não foi possível entrar no grupo.");
        }

        await loadCommunities();

        if (result?.joined) {
          setActiveCommunityId(community.id);
          toast.success("Você entrou no grupo.");
          onNotify?.({
            title: "Entrada confirmada",
            message: "Você agora faz parte da comunidade.",
            type: "comunidade",
            targetId: community.id,
            targetTab: "geral",
          });
          triggerXP?.(40);
          return;
        }

        if (result?.requested) {
          toast.success("Solicitação enviada. Aguarde a aprovação do dono ou ADM.");
          onNotify?.({
            title: "Solicitação enviada",
            message: "Você será avisado quando o pedido for analisado.",
            type: "comunidade",
          });
          return;
        }
      } catch (err: any) {
        toast.error(`Erro ao entrar no grupo: ${err.message}`);
      } finally {
        setJoiningId(null);
      }
    },
    [getUserId, joiningId, loadCommunities, onNotify, triggerXP],
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPosition({ ...DEFAULT_COVER_POSITION });
    const reader = new FileReader();
    reader.onloadend = () =>
      setNewGroup(prev => ({ ...prev, cover_url: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = getUserId();
    if (!uid) { 
      toast.error("⚠️ Usuário não autenticado."); 
      return; 
    }
    setIsSubmitting(true);

    let coverUrl = newGroup.cover_url;

    try {
      if (coverFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", coverFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson?.url) {
          throw new Error(uploadJson?.error ?? "Falha ao enviar a capa do grupo.");
        }
        coverUrl = String(uploadJson.url);
      }
    } catch (uploadError: any) {
      toast.error("Erro no upload da capa: " + (uploadError?.message || "Falha desconhecida."));
      setIsSubmitting(false);
      return;
    }

    const groupData = {
      id:       `group-${Date.now()}`,
      ...newGroup,
      cover_url: appendCommunityCoverFocus(coverUrl, coverPosition.x, coverPosition.y),
      name:     newGroup.name.toUpperCase(),
      owner_id: uid,
    };

    try {
      const res    = await fetch("/api/communities", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(groupData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Falha na criação");

      // Recarrega do banco para garantir dados completos (corrige bug 3)
      await loadCommunities();

      closeCreateModal();
      onNotify?.({
        title:   "Base Operacional",
        message: "Esquadrão forjado com sucesso.",
        type:    "comunidade",
        targetId: String(result?.communityId || ""),
        targetTab: "geral",
      });
      toast.success("Esquadrão forjado com sucesso!");
      triggerXP?.(250);
    } catch (err: any) {
      toast.error("Erro ao criar grupo: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeCommunityId) {
    const activeData = comunidades.find(c => c.id === activeCommunityId) ?? null;
    return (
      <CommunityHub
        communityId={activeCommunityId}
        communityData={activeData}
        currentUser={currentUser}
        triggerXP={triggerXP ?? (() => {})}
        onNotify={onNotify}
        initialTab={initialDeepLink?.tab}
        onBack={() => {
          setActiveCommunityId(null);
          onClearDeepLink?.();
          // Recarrega lista ao voltar para refletir possível deleção
          loadCommunities();
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto px-0 pb-6 text-left selection:bg-sky-500/30 sm:pb-8"
    >
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:gap-6 sm:pb-6 mb-5 sm:mb-8">
        <div>
          <h1 className="text-[1.9rem] sm:text-6xl font-black italic uppercase tracking-tighter text-white leading-none">
            COMUNIDADES <span className="text-sky-500">ELITE</span>
          </h1>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-2 italic">
            Grupos de performance e acompanhamento profissional
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex min-h-11 w-full sm:w-auto items-center justify-center gap-2.5 rounded-lg bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-sky-500 active:scale-95 shadow-lg shrink-0 sm:min-h-12 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-xs"
        >
          <Plus size={16} /> CRIAR GRUPO
        </button>
      </header>

      {/* Lista */}
      {loading ? (
        <div className="py-14 sm:py-20 flex justify-center opacity-20">
          <RefreshCw className="animate-spin" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {comunidades.length > 0 ? (
            comunidades.map(com => (
              <CommunityCard
                key={com.id}
                com={com}
                onClick={() => handleOpenCommunity(com)}
                actionLoading={joiningId === com.id}
              />
            ))
          ) : (
            <div className="col-span-full py-16 sm:py-24 text-center opacity-20">
              <Users size={40} className="mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                Nenhuma base operacional encontrada
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Grupo */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010307]/98 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-none bg-[#0a0c10] border border-white/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-10 relative"
            >
              {/* Header do modal */}
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tighter leading-none">
                    CONFIGURAR{" "}
                    <span className={activeTheme.text}>MEU GRUPO</span>
                  </h3>
                  <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mt-2 italic">
                    Defina a alma do seu esquadrão
                  </p>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left">
                {/* Coluna esquerda */}
                <div className="space-y-7">
                  {/* Foto de capa */}
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${activeTheme.text} flex items-center gap-2`}>
                      <ImageIcon size={13} /> Foto de Capa
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative flex h-64 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/10 bg-black/40 transition-all hover:border-sky-500/40 sm:h-72"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {newGroup.cover_url ? (
                        <img
                          src={newGroup.cover_url}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-all"
                          style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
                          alt="Preview"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/10 group-hover:text-sky-500 transition-colors">
                          <Plus size={28} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            Clique para adicionar
                          </span>
                        </div>
                      )}
                    </div>
                    {newGroup.cover_url && (
                      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50">
                          posição da capa
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/35">
                            <span>Horizontal</span>
                            <span>{coverPosition.x}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={coverPosition.x}
                            onChange={(e) =>
                              setCoverPosition((prev) => ({ ...prev, x: Number(e.target.value) }))
                            }
                            className="h-1.5 w-full cursor-pointer accent-sky-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/35">
                            <span>Vertical</span>
                            <span>{coverPosition.y}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={coverPosition.y}
                            onChange={(e) =>
                              setCoverPosition((prev) => ({ ...prev, y: Number(e.target.value) }))
                            }
                            className="h-1.5 w-full cursor-pointer accent-sky-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                      Nome do Esquadrão
                    </label>
                    <input
                      required
                      value={newGroup.name}
                      onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black italic uppercase outline-none focus:border-sky-500/50 transition-all text-base placeholder:text-white/10 placeholder:not-italic placeholder:normal-case"
                      placeholder="Ex: TEAM SAIYAJIN"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                      <AlignLeft size={13} /> Manifesto / Descrição
                    </label>
                    <textarea
                      required
                      value={newGroup.description}
                      onChange={e => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-medium outline-none focus:border-sky-500/50 h-28 resize-none text-sm placeholder:text-white/10"
                      placeholder="Qual o propósito deste grupo? Descreva as regras ou o foco..."
                    />
                  </div>
                </div>

                {/* Coluna direita */}
                <div className="space-y-7">
                  {/* Objetivo */}
                  <div className="space-y-3">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${activeTheme.text} flex items-center gap-2`}>
                      <Target size={13} /> Objetivo Principal
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIAS.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewGroup(prev => ({ ...prev, focus: cat }))}
                          className={`p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wide transition-all
                            ${newGroup.focus === cat
                              ? `${activeTheme.bg} text-black border-transparent shadow-lg scale-[1.02]`
                              : "bg-white/5 border-white/10 text-white/30 hover:text-white hover:border-white/20"}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Tema */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                        <Palette size={13} /> Tema Neon
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {ELITE_THEMES.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewGroup(prev => ({ ...prev, theme: t.id }))}
                            className={`w-8 h-8 rounded-full ${t.bg} border-2 transition-all
                              ${newGroup.theme === t.id
                                ? "border-white scale-110"
                                : "border-transparent opacity-40 hover:opacity-80"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Privacidade */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                        Privacidade
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewGroup(prev => ({ ...prev, privacy: "public" }))}
                          className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all
                            ${newGroup.privacy === "public"
                              ? "bg-sky-500/10 border-sky-500 text-sky-500"
                              : "bg-white/5 border-white/5 text-white/20 hover:border-white/20"}`}
                        >
                          <Globe size={15} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Aberto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewGroup(prev => ({ ...prev, privacy: "private" }))}
                          className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all
                            ${newGroup.privacy === "private"
                              ? "bg-sky-500/10 border-sky-500 text-sky-500"
                              : "bg-white/5 border-white/5 text-white/20 hover:border-white/20"}`}
                        >
                          <Lock size={15} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Privado</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Botão submit */}
                  <div className="pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-6 ${activeTheme.bg} text-black font-black uppercase italic rounded-3xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSubmitting ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <><Zap size={20} fill="black" /> FORJAR GRUPO AGORA</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
