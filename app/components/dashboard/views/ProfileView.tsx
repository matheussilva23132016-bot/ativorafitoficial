"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ClipboardCheck,
  FileText,
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
import { emptyAssessment, emptyProfile } from "../profile/profileHelpers";
import { ProfileRolePanel } from "../profile/ProfileRolePanel";
import { labelClass } from "../profile/profileUi";

type ProfileViewProps = {
  currentUser: any;
  onBack: () => void;
};

type Tab = "resumo" | "cargo" | "avaliacoes";

const DEFAULT_PROFILE_AVATAR = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=180";
const DEFAULT_AVATAR_FOCUS = { x: 50, y: 50 };
const AVATAR_FOCUS_PREFIX = "atv-focus=";
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;

function normalizeAvatarSrc(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_PROFILE_AVATAR;
  if (raw.startsWith("uploads/")) return `/${raw}`;
  return raw;
}

function clampFocus(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function parseAvatarWithFocus(value?: string | null) {
  const normalized = normalizeAvatarSrc(value);
  const hashIndex = normalized.indexOf("#");
  if (hashIndex === -1) {
    return { src: normalized, focus: { ...DEFAULT_AVATAR_FOCUS } };
  }

  const src = normalized.slice(0, hashIndex) || normalized;
  const hash = normalized.slice(hashIndex + 1);
  const focusEntry = hash
    .split("&")
    .map(item => item.trim())
    .find(item => item.startsWith(AVATAR_FOCUS_PREFIX));

  if (!focusEntry) {
    return { src, focus: { ...DEFAULT_AVATAR_FOCUS } };
  }

  const [xRaw, yRaw] = focusEntry.slice(AVATAR_FOCUS_PREFIX.length).split(",");

  return {
    src,
    focus: {
      x: clampFocus(xRaw),
      y: clampFocus(yRaw),
    },
  };
}

function buildAvatarWithFocus(src: string, focus: { x: number; y: number }) {
  const cleanSrc = src.split("#")[0];
  return `${cleanSrc}#${AVATAR_FOCUS_PREFIX}${clampFocus(focus.x)},${clampFocus(focus.y)}`;
}

export function ProfileView({ currentUser, onBack }: ProfileViewProps) {
  const [tab, setTab] = useState<Tab>("resumo");
  const [user, setUser] = useState<PerfilUserSummary | null>(null);
  const [profile, setProfile] = useState<PerfilComplementar>(() => emptyProfile(currentUser));
  const [assessments, setAssessments] = useState<PerfilAvaliacao[]>([]);
  const [draft, setDraft] = useState<PerfilAvaliacao>(() => emptyAssessment(null, "rapida"));
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const config = getRoleConfig(profile.role || user?.role || currentUser?.role);
  const avatarWithFocus = parseAvatarWithFocus(user?.avatarUrl || currentUser?.avatar || DEFAULT_PROFILE_AVATAR);
  const displayName = user?.fullName || currentUser?.name || currentUser?.nickname || "Atleta";
  const [avatarSrc, setAvatarSrc] = useState(avatarWithFocus.src);
  const [savedAvatarSrc, setSavedAvatarSrc] = useState(avatarWithFocus.src);
  const [avatarFocus, setAvatarFocus] = useState<{ x: number; y: number }>({ ...avatarWithFocus.focus });
  const [savedAvatarFocus, setSavedAvatarFocus] = useState<{ x: number; y: number }>({
    ...avatarWithFocus.focus,
  });
  const [avatarFallback, setAvatarFallback] = useState(false);
  const latestAssessment = assessments[0];

  useEffect(() => {
    setAvatarSrc(avatarWithFocus.src);
    setSavedAvatarSrc(avatarWithFocus.src);
    setAvatarFocus({ ...avatarWithFocus.focus });
    setSavedAvatarFocus({ ...avatarWithFocus.focus });
    setAvatarFallback(false);
  }, [avatarWithFocus.focus.x, avatarWithFocus.focus.y, avatarWithFocus.src]);

  const avatarDirty =
    avatarSrc !== savedAvatarSrc ||
    avatarFocus.x !== savedAvatarFocus.x ||
    avatarFocus.y !== savedAvatarFocus.y;

  const avatarInitial = useMemo(
    () => String(displayName || "A").trim().charAt(0).toUpperCase() || "A",
    [displayName],
  );

  const profileSummary = useMemo(
    () => [
      ["Objetivo", profile.objetivoPrincipal || "Ainda não definido"],
      ["Frequência", profile.frequencia || "Ainda não definida"],
      ["Disponibilidade", profile.disponibilidade || "Ainda não informada"],
      ["Avaliação atual", latestAssessment?.titulo || "Nenhuma avaliação salva"],
    ],
    [latestAssessment?.titulo, profile.disponibilidade, profile.frequencia, profile.objetivoPrincipal],
  );

  const latestResults = useMemo(
    () => (Array.isArray(latestAssessment?.resultados) ? latestAssessment.resultados.slice(0, 4) : []),
    [latestAssessment?.resultados],
  );

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
      const loadedAssessments = Array.isArray(assessmentsJson.assessments) ? assessmentsJson.assessments.slice(0, 1) : [];
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

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem valido.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError("A foto deve ter no máximo 8MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setError("Não foi possível ler a imagem selecionada.");
        return;
      }
      setError(null);
      setAvatarFallback(false);
      setAvatarSrc(result);
      setAvatarFocus({ ...DEFAULT_AVATAR_FOCUS });
    };
    reader.onerror = () => setError("Não foi possível processar a imagem selecionada.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveAvatar = async () => {
    if (!avatarSrc) return;

    setSavingAvatar(true);
    setError(null);
    try {
      const response = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_url: avatarSrc,
          avatar_focus_x: avatarFocus.x,
          avatar_focus_y: avatarFocus.y,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a foto.");

      const savedRaw =
        data?.user?.avatar_url ||
        data?.user?.avatarUrl ||
        data?.url ||
        buildAvatarWithFocus(avatarSrc, avatarFocus);
      const parsedSaved = parseAvatarWithFocus(savedRaw);

      setAvatarSrc(parsedSaved.src);
      setSavedAvatarSrc(parsedSaved.src);
      setAvatarFocus(parsedSaved.focus);
      setSavedAvatarFocus(parsedSaved.focus);
      setAvatarFallback(false);
      setUser(prev => (prev ? { ...prev, avatarUrl: buildAvatarWithFocus(parsedSaved.src, parsedSaved.focus) } : prev));
    } catch (err: any) {
      setError(err?.message || "Não foi possível salvar a foto.");
    } finally {
      setSavingAvatar(false);
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
      setAssessments(saved ? [saved] : []);
      setTab("resumo");
    } catch (err: any) {
      setError(err?.message || "Não foi possível salvar avaliação.");
    } finally {
      setSavingAssessment(false);
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
      className="mx-auto w-full max-w-7xl space-y-4 text-left sm:space-y-5"
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

      <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-6 lg:p-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 shrink-0 rounded-[18px] border border-white/10 bg-black/30 p-1.5 sm:h-28 sm:w-28">
                <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-white/5">
                  {avatarFallback ? (
                    <div className="flex h-full w-full items-center justify-center bg-black/35 text-2xl font-black text-white/45">
                      {avatarInitial}
                    </div>
                  ) : (
                    <img
                      src={avatarSrc}
                      alt={`Foto de ${displayName}`}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${avatarFocus.x}% ${avatarFocus.y}%` }}
                      onError={() => {
                        if (avatarSrc !== DEFAULT_PROFILE_AVATAR) {
                          setAvatarSrc(DEFAULT_PROFILE_AVATAR);
                          setAvatarFocus({ ...DEFAULT_AVATAR_FOCUS });
                          return;
                        }
                        setAvatarFallback(true);
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
                  <UserRound size={12} />
                  {config.label}
                </div>
                <h1 className="mt-3 break-words text-3xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  Painel privado para alinhar rotina, metas e avaliações com seu acompanhamento.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/70 transition hover:text-white"
                >
                  <Camera size={13} />
                  Trocar foto
                </button>
                <button
                  type="button"
                  onClick={saveAvatar}
                  disabled={!avatarDirty || savingAvatar}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-45"
                >
                  {savingAvatar ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Salvar foto
                </button>
                {avatarDirty && (
                  <button
                    type="button"
                    onClick={() => setAvatarFocus({ ...DEFAULT_AVATAR_FOCUS })}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                  >
                    Centralizar
                  </button>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/45">
                    <span>Ajuste horizontal</span>
                    <span>{avatarFocus.x}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={avatarFocus.x}
                    onChange={event =>
                      setAvatarFocus(current => ({ ...current, x: clampFocus(event.target.value) }))
                    }
                    className="h-1.5 w-full cursor-pointer accent-sky-500"
                  />
                </label>
                <label className="space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/45">
                    <span>Ajuste vertical</span>
                    <span>{avatarFocus.y}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={avatarFocus.y}
                    onChange={event =>
                      setAvatarFocus(current => ({ ...current, y: clampFocus(event.target.value) }))
                    }
                    className="h-1.5 w-full cursor-pointer accent-sky-500"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
              <ShieldCheck size={16} className="text-sky-300" />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">Preenchimento</p>
              <p className="mt-1 text-xl font-black text-white sm:text-2xl">{profile.progresso}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-sky-400" style={{ width: `${profile.progresso}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4">
              <FileText size={16} className="text-emerald-300" />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">Avaliação</p>
              <p className="mt-1 text-xl font-black text-white sm:text-2xl">{latestAssessment ? 1 : 0}</p>
              <p className="mt-2 text-[9px] text-white/35">uma ficha por usuário</p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4 lg:col-span-1">
              <LockKeyhole size={16} className="text-amber-300" />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">Privacidade</p>
              <p className="mt-1 text-[11px] font-black uppercase leading-tight text-white">
                {profile.privacidadeDados}
              </p>
              <p className="mt-2 text-[9px] text-white/35">Somente profissional</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {([
          { id: "resumo", label: "Resumo", mobileLabel: "Resumo", icon: UserRound },
          { id: "cargo", label: "Dados do cargo", mobileLabel: "Cargo", icon: ShieldCheck },
          { id: "avaliacoes", label: "Avaliações", mobileLabel: "Avaliações", icon: ClipboardCheck },
        ] as const).map(({ id, label, mobileLabel, icon: Icon }) => (
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
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{label}</span>
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
            className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 sm:p-5">
              <p className={labelClass()}>Mapa fitness</p>
              <h2 className="mt-2 text-2xl font-black italic tracking-tighter text-white sm:text-3xl">
                {config.headline}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                Objetivo, rotina e disponibilidade em leitura rápida para orientar seu próximo passo.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setTab("cargo")}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-[10px] font-black uppercase tracking-widest text-white/65 transition hover:text-white"
                >
                  <ShieldCheck size={13} />
                  Ajustar cargo
                </button>
                <button
                  type="button"
                  onClick={() => setTab("avaliacoes")}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-[10px] font-black uppercase tracking-widest text-white/65 transition hover:text-white"
                >
                  <ClipboardCheck size={13} />
                  {latestAssessment ? "Editar avaliação" : "Criar avaliação"}
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {profileSummary.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className={labelClass()}>{label}</p>
                    <p className="mt-2 text-sm font-bold text-white/75">{value}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setTab("cargo")}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/15"
              >
                <ShieldCheck size={13} />
                Editar dados do cargo
              </button>
            </div>

            <div className="rounded-[20px] border border-sky-500/20 bg-sky-500/10 p-4 sm:p-5">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-200">Resultados recentes</p>

              {latestResults.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {latestResults.map(result => (
                    <div
                      key={`${latestAssessment?.id}-${result.metodo}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{result.metodo}</p>
                        <p className="text-[10px] text-white/35">{result.classificacao || "Registrado"}</p>
                      </div>
                      <p className="shrink-0 text-lg font-black text-sky-200">
                        {result.valor}
                        {result.unidade}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-relaxed text-white/55">
                    Salve sua primeira avaliação para acompanhar RFM, IMC, RCQ e composição corporal.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setTab("avaliacoes")}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black"
              >
                <Plus size={14} />
                {latestAssessment ? "Editar avaliação" : "Criar avaliação"}
              </button>
            </div>
          </motion.section>
        )}

        {tab === "cargo" && (
          <motion.div
            key="cargo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ProfileRolePanel profile={profile} onChange={setProfile} onSave={saveProfile} saving={savingProfile} />
          </motion.div>
        )}

        {tab === "avaliacoes" && (
          <motion.div
            key="avaliacoes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ProfileAssessmentPanel
              draft={draft}
              setDraft={setDraft}
              onSave={saveAssessment}
              saving={savingAssessment}
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
