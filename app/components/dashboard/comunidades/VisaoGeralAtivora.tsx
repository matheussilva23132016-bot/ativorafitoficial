// app/components/dashboard/comunidades/VisaoGeralAtivora.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Flame, ShieldCheck, Megaphone, CheckCircle2,
  Users, BrainCircuit, Database, Plus, X, Send,
  RefreshCw, Target, UtensilsCrossed, Dumbbell,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
interface Anuncio {
  id:         string;
  titulo:     string;
  conteudo:   string;
  autor_id:   string;
  fixado:     boolean;
  created_at: string;
}

interface VisaoGeralProps {
  currentUser: any;
  communityId: string;
  powerLevel:  number;
  workouts:    any[];
  requests:    any[];
  onNotify?:   (n: any) => void;
  onNavigate:  (tab: string) => void;
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE
// ══════════════════════════════════════════════════════════════════
export function VisaoGeralAtivora({
  currentUser, communityId, powerLevel,
  workouts, requests, onNotify, onNavigate,
}: VisaoGeralProps) {
  const [anuncios, setAnuncios]               = useState<Anuncio[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(true);
  const [showModal, setShowModal]             = useState(false);
  const [sending, setSending]                 = useState(false);
  const [announcement, setAnnouncement]       = useState({ titulo: "", conteudo: "" });
  const [statsData, setStatsData]             = useState({
    totalMembros:   0,
    desafiosAtivos: 0,
    rankingPos:     null as number | null,
  });

  const isProfessional = powerLevel >= 2;
  const canAnnounce    = powerLevel >= 3;

  // ── Carrega anúncios ───────────────────────────────────────────
  const loadAnuncios = useCallback(async () => {
    setLoadingAnuncios(true);
    try {
      const res  = await fetch(`/api/communities/${communityId}/announcements`);
      const data = res.ok ? await res.json() : {};
      setAnuncios(data.announcements ?? []);
    } catch {
      setAnuncios([]);
    } finally {
      setLoadingAnuncios(false);
    }
  }, [communityId]);

  // ── Carrega stats ──────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const [membRes, rankRes] = await Promise.all([
        fetch(`/api/communities/${communityId}/members`),
        fetch(`/api/communities/${communityId}/ranking?semana=atual`),
      ]);
      const membData = membRes.ok ? await membRes.json() : {};
      const rankData = rankRes.ok ? await rankRes.json() : {};

      const myRank = (rankData.ranking ?? []).find(
        (r: any) => r.user_id === currentUser?.id
      );

      setStatsData({
        totalMembros:   membData.members?.length ?? 0,
        desafiosAtivos: workouts.length,
        rankingPos:     myRank?.posicao ?? null,
      });
    } catch {
      // silencioso
    }
  }, [communityId, currentUser?.id, workouts.length]);

  useEffect(() => {
    loadAnuncios();
    loadStats();
  }, [loadAnuncios, loadStats]);

  // ── Enviar anúncio ─────────────────────────────────────────────
  const handleSendAnnouncement = async () => {
    if (!announcement.titulo.trim() || !announcement.conteudo.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/announcements`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autorId:  currentUser?.id,
          titulo:   announcement.titulo,
          conteudo: announcement.conteudo,
          fixado:   false,
        }),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      setShowModal(false);
      setAnnouncement({ titulo: "", conteudo: "" });
      onNotify?.({
        title:   "Diretriz Disparada",
        message: "O esquadrão foi notificado.",
        type:    "social",
      });
      await loadAnuncios();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // ── Stats cards ────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (isProfessional) {
      return [
        {
          label: "Efetivo",
          v: statsData.totalMembros > 0 ? String(statsData.totalMembros) : "—",
          i: Users,
          c: "text-sky-500",
          bg: "bg-sky-500/10",
        },
        {
          label: "Acervo",
          v: `${workouts.length}`,
          sub: "treinos",
          i: Database,
          c: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
        {
          label: "Triagem",
          v: requests.length > 0 ? String(requests.length) : "0",
          sub: requests.length > 0 ? "pendentes" : "limpa",
          i: BrainCircuit,
          c: requests.length > 0 ? "text-rose-500" : "text-emerald-500",
          bg: requests.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10",
        },
      ];
    }
    return [
      {
        label: "Score",
        v: String(currentUser?.xp ?? "0"),
        sub: "XP",
        i: Flame,
        c: "text-rose-500",
        bg: "bg-rose-500/10",
      },
      {
        label: "Ranking",
        v: statsData.rankingPos ? `${statsData.rankingPos}º` : "—",
        i: Trophy,
        c: "text-amber-500",
        bg: "bg-amber-500/10",
      },
      {
        label: "Membros",
        v: statsData.totalMembros > 0 ? String(statsData.totalMembros) : "—",
        i: Users,
        c: "text-sky-500",
        bg: "bg-sky-500/10",
      },
    ];
  }, [isProfessional, statsData, workouts.length, requests.length, currentUser]);

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-4 sm:space-y-6">

      {/* ── ROW 1 — Status + Mural ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

        {/* STATUS OPERACIONAL */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px]
          bg-gradient-to-br from-[#0A1222] to-[#010307]
          border border-white/5 p-5 sm:p-7">

          {/* Glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48
            bg-sky-500/10 blur-[70px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Título */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[8px] sm:text-[9px] font-black uppercase
                  tracking-widest text-sky-500/60 italic block mb-1">
                  Telemetria Ativora
                </span>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase
                  text-white tracking-tighter leading-none">
                  Status{" "}
                  <span className="text-sky-500">Operacional</span>
                </h2>
              </div>
              <ShieldCheck className="text-sky-500 shrink-0 mt-1" size={24} />
            </div>

            {/* Cards de stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className={`${s.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4
                    border border-white/5 flex flex-col gap-1.5`}
                >
                  <s.i size={15} className={s.c} />
                  <p className="text-[7px] sm:text-[8px] font-black text-white/30
                    uppercase tracking-widest leading-none">
                    {s.label}
                  </p>
                  <p className="text-base sm:text-xl font-black text-white italic leading-none">
                    {s.v}
                  </p>
                  {"sub" in s && s.sub && (
                    <p className="text-[7px] font-black text-white/20 uppercase
                      tracking-widest leading-none">
                      {s.sub}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MURAL DO COMANDO */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px]
          bg-[#050B14] border border-orange-500/10 p-5 sm:p-7 flex flex-col gap-4">

          <div className="absolute -top-8 -right-8 w-36 h-36
            bg-orange-500/5 blur-[50px] rounded-full pointer-events-none" />

          {/* Header mural */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-black uppercase
              tracking-widest text-orange-500/60 flex items-center gap-2">
              <Megaphone size={11} /> Mural do Comando
            </span>
            {canAnnounce && (
              <button
                onClick={() => setShowModal(true)}
                className="p-2 bg-orange-500/10 rounded-xl text-orange-500
                  hover:bg-orange-500 hover:text-black transition-all">
                <Plus size={13} />
              </button>
            )}
          </div>

          {/* Conteúdo mural */}
          <div className="relative z-10 flex-1 min-h-[100px]">
            {loadingAnuncios ? (
              <div className="flex justify-center items-center h-full py-8">
                <RefreshCw size={18} className="animate-spin text-orange-500/30" />
              </div>
            ) : anuncios.length > 0 ? (
              <div className="space-y-4">
                {anuncios.slice(0, 2).map(a => (
                  <div key={a.id} className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.fixado && (
                        <span className="text-[7px] bg-orange-500/10 text-orange-500
                          px-1.5 py-0.5 rounded font-black uppercase
                          border border-orange-500/20">
                          📌 Fixado
                        </span>
                      )}
                      <span className="text-[8px] text-white/15 font-bold">
                        {new Date(a.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black uppercase italic
                      text-white tracking-tighter leading-tight line-clamp-1">
                      {a.titulo}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-white/30 italic
                      leading-relaxed line-clamp-2">
                      {a.conteudo}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full
                py-8 gap-2">
                <Megaphone size={22} className="text-white/5" />
                <p className="text-[8px] sm:text-[9px] text-white/10 font-black
                  uppercase tracking-widest text-center">
                  Nenhuma diretriz publicada
                </p>
              </div>
            )}
          </div>

          {/* Confirmar ciência */}
          {!canAnnounce && anuncios.length > 0 && (
            <button className="relative z-10 flex items-center gap-2 text-white/15
              text-[8px] sm:text-[9px] font-black uppercase italic
              hover:text-orange-500 transition-colors w-fit">
              Confirmar Ciência <CheckCircle2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── ROW 2 — Atalhos rápidos ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Treinos",
            icon:  <Dumbbell size={20} />,
            tab:   "treinos",
            color: "text-sky-500",
            bg:    "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20",
          },
          {
            label: "Nutrição",
            icon:  <UtensilsCrossed size={20} />,
            tab:   "nutricao",
            color: "text-emerald-500",
            bg:    "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
          },
          {
            label: "Desafios",
            icon:  <Target size={20} />,
            tab:   "desafios",
            color: "text-amber-500",
            bg:    "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
          },
          {
            label: "Ranking",
            icon:  <Trophy size={20} />,
            tab:   "ranking",
            color: "text-rose-500",
            bg:    "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20",
          },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            className={`flex flex-col items-center justify-center gap-2.5
              p-4 sm:p-5 rounded-[18px] sm:rounded-[22px] border
              ${item.bg} ${item.color}
              active:scale-95 hover:scale-[1.02] transition-all duration-150`}
          >
            {item.icon}
            <span className="text-[8px] sm:text-[9px] font-black uppercase
              tracking-widest">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── MODAL DE ANÚNCIO ───────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center
              justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0,  opacity: 1, scale: 1    }}
              exit={{    y: 60, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full sm:max-w-lg bg-[#0A1222]
                border border-orange-500/20
                rounded-t-[28px] sm:rounded-[28px]
                p-6 sm:p-8 text-left shadow-2xl
                max-h-[90dvh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-black uppercase italic
                  text-white tracking-tighter">
                  Nova <span className="text-orange-500">Diretriz</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 bg-white/5 rounded-xl text-white/30
                    hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Campos */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[8px] sm:text-[9px] font-black uppercase
                    tracking-widest text-white/30">
                    Título
                  </label>
                  <input
                    value={announcement.titulo}
                    onChange={e =>
                      setAnnouncement(p => ({ ...p, titulo: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl
                      p-3.5 sm:p-4 text-white font-bold text-sm outline-none
                      focus:border-orange-500/50 transition-all
                      placeholder:text-white/15"
                    placeholder="Título da diretriz"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] sm:text-[9px] font-black uppercase
                    tracking-widest text-white/30">
                    Mensagem
                  </label>
                  <textarea
                    value={announcement.conteudo}
                    onChange={e =>
                      setAnnouncement(p => ({ ...p, conteudo: e.target.value }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl
                      p-3.5 sm:p-4 text-white text-sm h-28 sm:h-32 outline-none
                      focus:border-orange-500/50 resize-none
                      placeholder:text-white/15"
                    placeholder="Ordens técnicas para o esquadrão..."
                  />
                </div>

                <button
                  onClick={handleSendAnnouncement}
                  disabled={
                    sending ||
                    !announcement.titulo.trim() ||
                    !announcement.conteudo.trim()
                  }
                  className="w-full py-3.5 sm:py-4 bg-orange-500 text-black
                    font-black uppercase italic rounded-2xl flex items-center
                    justify-center gap-3 text-sm
                    hover:bg-orange-400 active:scale-95 transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><RefreshCw size={15} className="animate-spin" /> Enviando...</>
                  ) : (
                    <><Send size={15} /> Disparar Comunicado</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
