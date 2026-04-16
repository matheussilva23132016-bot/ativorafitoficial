"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getRoleConfig } from "@/lib/profile/assessment";
import type { PerfilAvaliacao, PerfilComplementar, PerfilUserSummary } from "@/lib/profile/types";
import { ProfileAssessmentPanel } from "../profile/ProfileAssessmentPanel";
import { ProfileHistoryPanel } from "../profile/ProfileHistoryPanel";
import { emptyAssessment, emptyProfile } from "../profile/profileHelpers";
import { ProfileRolePanel } from "../profile/ProfileRolePanel";
import { labelClass } from "../profile/profileUi";

type ProfileViewProps = {
  currentUser: any;
  onBack: () => void;
};

type Tab = "resumo" | "cargo" | "avaliacoes" | "historico";

export function ProfileView({ currentUser, onBack }: ProfileViewProps) {
  const [tab, setTab] = useState<Tab>("resumo");
  const [user, setUser] = useState<PerfilUserSummary | null>(null);
  const [profile, setProfile] = useState<PerfilComplementar>(() => emptyProfile(currentUser));
  const [assessments, setAssessments] = useState<PerfilAvaliacao[]>([]);
  const [draft, setDraft] = useState<PerfilAvaliacao>(() => emptyAssessment(null, "rapida"));
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = getRoleConfig(profile.role || user?.role || currentUser?.role);
  const avatar = user?.avatarUrl || currentUser?.avatar || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=180";
  const displayName = user?.fullName || currentUser?.name || currentUser?.nickname || "Atleta";
  const latestAssessment = assessments[0];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, assessmentsRes] = await Promise.all([
        fetch("/api/perfil/complementar", { cache: "no-store" }),
        fetch("/api/perfil/avaliacoes", { cache: "no-store" }),
      ]);
      const profileJson = await profileRes.json();
      const assessmentsJson = await assessmentsRes.json();
      if (!profileRes.ok) throw new Error(profileJson.error || "Não foi possível carregar o perfil.");
      if (!assessmentsRes.ok) throw new Error(assessmentsJson.error || "Não foi possível carregar avaliações.");

      const loadedUser = profileJson.user as PerfilUserSummary;
      const loadedAssessments = Array.isArray(assessmentsJson.assessments) ? assessmentsJson.assessments : [];
      setUser(loadedUser);
      setProfile(profileJson.profile ?? emptyProfile(currentUser, loadedUser));
      setAssessments(loadedAssessments);
      setDraft(loadedAssessments[0] ?? emptyAssessment(loadedUser, "rapida"));
    } catch (err: any) {
      setError(err?.message || "Não foi possível abrir Meu Perfil.");
      setProfile(emptyProfile(currentUser));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    try {
      const response = await fetch("/api/perfil/complementar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar o perfil.");
      setProfile(data.profile);
      setUser(data.user);
    } catch (err: any) {
      setError(err?.message || "Não foi possível salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAssessment = async (status: "rascunho" | "salvo") => {
    setSavingAssessment(true);
    setError(null);
    try {
      const endpoint = draft.id ? `/api/perfil/avaliacoes/${draft.id}` : "/api/perfil/avaliacoes";
      const response = await fetch(endpoint, {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar avaliação.");
      const saved = data.assessment as PerfilAvaliacao;
      setDraft(saved);
      setAssessments(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
      setTab("historico");
    } catch (err: any) {
      setError(err?.message || "Não foi possível salvar avaliação.");
    } finally {
      setSavingAssessment(false);
    }
  };

  const deleteAssessment = async (assessmentId?: string) => {
    if (!assessmentId) return;
    const response = await fetch(`/api/perfil/avaliacoes/${assessmentId}`, { method: "DELETE" });
    if (response.ok) {
      const next = assessments.filter(item => item.id !== assessmentId);
      setAssessments(next);
      setDraft(next[0] ?? emptyAssessment(user, "rapida"));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="animate-spin text-sky-400" size={30} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Carregando Meu Perfil</p>
      </div>
    );
  }

  return (
    <motion.div
      key="perfil"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-7xl space-y-5 text-left"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </button>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-rose-300" />
          <div>
            <p className="font-bold">Atenção</p>
            <p className="mt-1 text-rose-100/70">{error}</p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#06101D]">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.4fr] lg:p-8">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 sm:h-24 sm:w-24">
              <Image src={avatar} alt="Meu perfil" fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
                <UserRound size={12} />
                {config.label}
              </div>
              <h1 className="mt-3 truncate text-3xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
                {displayName}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                Dados privados para orientar treino, nutrição, avaliações e evolução sem misturar com o perfil social.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <ShieldCheck size={18} className="text-sky-300" />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">Preenchimento</p>
              <p className="mt-1 text-2xl font-black text-white">{profile.progresso}%</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-sky-400" style={{ width: `${profile.progresso}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <FileText size={18} className="text-emerald-300" />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">Avaliações</p>
              <p className="mt-1 text-2xl font-black text-white">{assessments.length}</p>
              <p className="mt-2 text-[10px] text-white/35">Preenchimento opcional</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <LockKeyhole size={18} className="text-amber-300" />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">Privacidade</p>
              <p className="mt-1 text-sm font-black uppercase text-white">{profile.privacidadeDados}</p>
              <p className="mt-2 text-[10px] text-white/35">Dados corporais privados por padrão</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["resumo", "Resumo", UserRound],
          ["cargo", "Dados do cargo", ShieldCheck],
          ["avaliacoes", "Avaliações", ClipboardCheck],
          ["historico", "Histórico", History],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-[9px] font-black uppercase tracking-widest transition ${
              tab === id
                ? "border-sky-500/40 bg-sky-500 text-black"
                : "border-white/10 bg-white/5 text-white/35 hover:text-white"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {tab === "resumo" && (
          <motion.section
            key="resumo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="rounded-lg border border-white/10 bg-white/5 p-5 sm:p-6">
              <p className={labelClass()}>Mapa fitness</p>
              <h2 className="mt-3 text-2xl font-black italic tracking-tighter text-white sm:text-3xl">
                {config.headline}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
                Registre objetivo, rotina, restrições, disponibilidade e medidas opcionais em um só lugar. Essas informações ficam privadas e ajudam treinos, nutrição e acompanhamento a partirem de dados reais.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Objetivo", profile.objetivoPrincipal || "Ainda não definido"],
                  ["Frequência", profile.frequencia || "Ainda não definida"],
                  ["Disponibilidade", profile.disponibilidade || "Ainda não informada"],
                  ["Última avaliação", latestAssessment?.titulo || "Nenhuma avaliação salva"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                    <p className={labelClass()}>{label}</p>
                    <p className="mt-2 text-sm font-bold text-white/75">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-5 sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-200">Resultados recentes</p>
              {latestAssessment?.resultados?.length ? (
                <div className="mt-4 space-y-3">
                  {latestAssessment.resultados.slice(0, 5).map(result => (
                    <div key={`${latestAssessment.id}-${result.metodo}`} className="flex items-center justify-between gap-3 rounded-lg bg-black/25 p-3">
                      <div>
                        <p className="text-sm font-black text-white">{result.metodo}</p>
                        <p className="text-[10px] text-white/35">{result.classificacao || "Registrado"}</p>
                      </div>
                      <p className="text-lg font-black text-sky-200">{result.valor}{result.unidade}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-relaxed text-white/55">
                    Salve uma avaliação rápida para acompanhar IMC, RCQ, RFM, massa gorda e massa magra estimadas com histórico.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("avaliacoes")}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black"
                  >
                    <Plus size={14} />
                    Nova avaliação
                  </button>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {tab === "cargo" && (
          <motion.div key="cargo" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <ProfileRolePanel profile={profile} onChange={setProfile} onSave={saveProfile} saving={savingProfile} />
          </motion.div>
        )}

        {tab === "avaliacoes" && (
          <motion.div key="avaliacoes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <ProfileAssessmentPanel draft={draft} setDraft={setDraft} onSave={saveAssessment} saving={savingAssessment} user={user} />
          </motion.div>
        )}

        {tab === "historico" && (
          <motion.div key="historico" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <ProfileHistoryPanel
              assessments={assessments}
              setDraft={setDraft}
              setTab={setTab as any}
              onDelete={deleteAssessment}
              user={user}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={loadData}
        className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-widest text-white/25 transition hover:text-white"
      >
        <RefreshCw size={13} />
        Atualizar dados
      </button>
    </motion.div>
  );
}
