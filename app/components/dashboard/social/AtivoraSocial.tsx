"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtivoraFeed } from "./AtivoraFeed";
import { SocialProfile } from "./SocialProfile";
import { SocialMessages } from "./SocialMessages";

export interface UserProfileData {
  username: string;
  avatar?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  bio?: string | null;
  description?: string | null;
  role?: string;
  xp?: number;
  nivel?: number;
  streak?: number;
  followers?: number;
  following?: number;
  is_verified?: boolean;
  is_private?: boolean;
}

type UserProfile = UserProfileData;

interface AtivoraSocialProps {
  onBack: () => void;
  initialRoute?: "feed" | "profile" | "messages" | "notifications" | "onboarding";
  isGuest?: boolean;
}

type SocialView = "feed" | "profile" | "messages" | "notifications" | "onboarding" | "cadastro" | "viewing_profile";
type CadastroStep = "foto" | "usuario" | "bio";
const STEP_ORDER: CadastroStep[] = ["foto", "usuario", "bio"];

export const AtivoraSocial = ({
  onBack,
  initialRoute = "feed",
  isGuest = false,
}: AtivoraSocialProps) => {
  const [currentView, setCurrentView] = useState<SocialView>("feed");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean>(false);

  // Estados do cadastro
  const [cadastroStep, setCadastroStep] = useState<CadastroStep>("foto");
  const [cadastroFoto, setCadastroFoto] = useState<string | null>(null);
  const [cadastroUsername, setCadastroUsername] = useState("");
  const [cadastroBio, setCadastroBio] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [selectedNickname, setSelectedNickname] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isGuest) {
        setHasAccount(false);
        setCurrentView("feed");
        return;
      }

      try {
        const res = await fetch("/api/perfil");
        if (res.ok) {
          const data = await res.json();
          // Mapeia os campos do banco para o estado do Social
          const mappedUser: UserProfile = {
            username: data.nickname || "Atleta",
            avatar: data.avatar_url,
            avatar_url: data.avatar_url,
            foto_url: data.avatar_url,
            bio: data.bio,
            xp: data.xp,
            nivel: data.nivel_int,
            streak: data.current_streak,
            followers: data.followers,
            following: data.following,
            is_verified: data.is_verified,
          };
          setUser(mappedUser);
          setHasAccount(true);
          setCurrentView(initialRoute);
        } else {
          setHasAccount(false);
          setCurrentView("onboarding");
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setCurrentView("onboarding");
      }
    };

    fetchProfile();
  }, [initialRoute, isGuest]);

  const safeUser: UserProfile = user ?? {
    username: "Guest",
    avatar: null,
    avatar_url: null,
    foto_url: null,
    bio: null,
    xp: 0,
    nivel: 1,
    streak: 0,
    followers: 0,
    is_verified: false,
  };

  const profileImage =
    safeUser.avatar ||
    safeUser.avatar_url ||
    safeUser.foto_url ||
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100";

  // ─── Handlers do cadastro ──────────────────────────────────────────────────
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCadastroFoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUsernameNext = () => {
    const cleaned = cadastroUsername.trim().replace(/^@/, "");
    if (cleaned.length < 3) {
      setUsernameError("O @ precisa ter pelo menos 3 caracteres.");
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(cleaned)) {
      setUsernameError("Use apenas letras, números, _ ou .");
      return;
    }
    setUsernameError("");
    setCadastroUsername(cleaned);
    setCadastroStep("bio");
  };

  const handleFinalizarCadastro = async (skipBio = false) => {
    const bioToSave = skipBio ? null : cadastroBio.trim() || null;
    
    try {
      const res = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: cadastroUsername,
          avatar_url: cadastroFoto,
          bio: bioToSave,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar perfil");
      }

      const newProfile: UserProfile = {
        username: cadastroUsername,
        avatar: cadastroFoto,
        avatar_url: cadastroFoto,
        foto_url: cadastroFoto,
        bio: bioToSave,
        nivel: 1,
        xp: 0,
        streak: 0,
        is_verified: false,
      };
      setUser(newProfile);
      setHasAccount(true);
      setCurrentView("feed");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(cadastroStep);

  // ══════════════════════════════════════════════════════════════════════════
  // TELA: ONBOARDING (landing — sem alteração no visual)
  // ══════════════════════════════════════════════════════════════════════════
  if (currentView === "onboarding") {
    return (
      <div className="relative flex flex-col h-full bg-[#010307] text-white font-sans overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200"
            alt="Academia"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#010307]/80 via-[#010307]/60 to-sky-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#010307] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col h-full px-6 pt-10 pb-10 max-w-md">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full w-fit mb-8">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Portal da Elite
          </div>

          <div className="mb-6">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">
              ATIVORA
            </h1>
            <h2 className="text-6xl font-black italic uppercase tracking-tighter text-sky-500 leading-none">
              SOCIAL
            </h2>
          </div>

          <p className="text-white/70 font-semibold italic text-lg leading-snug mb-12 max-w-xs">
            Compartilhe os seus resultados
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {hasAccount ? (
              <>
                <button
                  onClick={() => setCurrentView("feed")}
                  className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-black font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.4)]"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setCurrentView("profile")}
                  className="w-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200"
                >
                  Editar Perfil
                </button>
              </>
            ) : (
              <>
                {/* ✅ CORRIGIDO: agora vai pro cadastro em vez de criar perfil direto */}
                <button
                  onClick={() => {
                    setCadastroStep("foto");
                    setCadastroFoto(null);
                    setCadastroUsername("");
                    setCadastroBio("");
                    setUsernameError("");
                    setCurrentView("cadastro");
                  }}
                  className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-black font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.4)]"
                >
                  Criar Conta
                </button>
                <button
                  onClick={() => setCurrentView("feed")}
                  className="w-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200"
                >
                  Entrar Sem Conta
                </button>
              </>
            )}
          </div>

          <div className="mt-auto pt-8">
            <p className="text-white/15 text-[10px] uppercase tracking-[0.3em] font-bold">
              AtivoraFit · Protocolo Social v1.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA: CADASTRO (3 etapas: foto → @ → bio)
  // ══════════════════════════════════════════════════════════════════════════
  if (currentView === "cadastro") {
    return (
      <div className="relative flex flex-col h-full bg-[#010307] text-white font-sans overflow-hidden">

        {/* Mesh gradient sutil */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full px-6 pt-10 pb-10 max-w-md mx-auto w-full">

          {/* Header: voltar + barra de progresso */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => {
                if (cadastroStep === "foto") {
                  setCurrentView("onboarding");
                } else {
                  setCadastroStep(STEP_ORDER[stepIndex - 1]);
                }
              }}
              className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-xs font-black uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>

            {/* Dots de progresso */}
            <div className="flex gap-1.5 items-center">
              {STEP_ORDER.map((s, i) => (
                <div
                  key={s}
                  className={`rounded-full transition-all duration-500 ${
                    i < stepIndex
                      ? "w-2 h-2 bg-sky-500"
                      : i === stepIndex
                      ? "w-6 h-2 bg-sky-500"
                      : "w-2 h-2 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Etapas animadas */}
          <AnimatePresence mode="wait">

            {/* ── ETAPA 1: FOTO ────────────────────────────────────────── */}
            {cadastroStep === "foto" && (
              <motion.div
                key="foto"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1"
              >
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                  1 de 3
                </p>
                <h2 className="text-4xl font-black italic uppercase tracking-tight text-white leading-tight mb-2">
                  Sua Foto
                </h2>
                <p className="text-white/40 text-sm mb-10">
                  Coloque uma foto que represente você na plataforma.
                </p>

                {/* Upload */}
                <div className="flex flex-col items-center gap-5 mb-10">
                  <div
                    className="relative w-32 h-32 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500 to-purple-600 p-[2px]">
                      <div className="w-full h-full rounded-[22px] bg-[#010307] overflow-hidden">
                        {cadastroFoto ? (
                          <img src={cadastroFoto} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white/3">
                            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                            <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
                              Toque aqui
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Botão de editar */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(14,165,233,0.4)] group-hover:scale-110 transition-transform">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                      </svg>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFotoUpload}
                  />

                  {cadastroFoto && (
                    <button
                      onClick={() => setCadastroFoto(null)}
                      className="text-white/25 hover:text-white/50 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => setCadastroStep("usuario")}
                    className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-black font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                  >
                    {cadastroFoto ? "Continuar" : "Continuar sem foto"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── ETAPA 2: @ USUÁRIO ───────────────────────────────────── */}
            {cadastroStep === "usuario" && (
              <motion.div
                key="usuario"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1"
              >
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                  2 de 3
                </p>
                <h2 className="text-4xl font-black italic uppercase tracking-tight text-white leading-tight mb-2">
                  Seu @
                </h2>
                <p className="text-white/40 text-sm mb-10">
                  Escolha um nome único. Ele será seu identificador na plataforma.
                </p>

                <div className="flex flex-col gap-2 mb-4">
                  <div className={`flex items-center gap-3 bg-white/5 border rounded-2xl px-5 py-4 transition-all duration-200 ${
                    usernameError
                      ? "border-red-500/50"
                      : "border-white/10 focus-within:border-sky-500/50"
                  }`}>
                    <span className="text-sky-500 font-black text-lg leading-none">@</span>
                    <input
                      type="text"
                      placeholder="seu_usuario"
                      value={cadastroUsername}
                      onChange={(e) => {
                        setCadastroUsername(e.target.value);
                        setUsernameError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleUsernameNext()}
                      className="flex-1 bg-transparent text-white font-bold text-base placeholder:text-white/20 outline-none"
                      autoFocus
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </div>

                  {usernameError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs font-bold px-1"
                    >
                      {usernameError}
                    </motion.p>
                  )}

                  <p className="text-white/20 text-xs px-1">
                    Letras, números, _ e . são permitidos. Mínimo 3 caracteres.
                  </p>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={handleUsernameNext}
                    disabled={!cadastroUsername.trim()}
                    className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                  >
                    Continuar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── ETAPA 3: BIO ─────────────────────────────────────────── */}
            {cadastroStep === "bio" && (
              <motion.div
                key="bio"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1"
              >
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                  3 de 3
                </p>
                <h2 className="text-4xl font-black italic uppercase tracking-tight text-white leading-tight mb-2">
                  Sua Bio
                </h2>
                <p className="text-white/40 text-sm mb-8">
                  Conte um pouco sobre você. Pode pular se preferir.
                </p>

                <div className="flex flex-col gap-2 mb-6">
                  <div className="bg-white/5 border border-white/10 focus-within:border-sky-500/50 rounded-2xl px-5 py-4 transition-all duration-200">
                    <textarea
                      placeholder="Ex: Atleta natural, 3 anos de treino. Foco em hipertrofia e força..."
                      value={cadastroBio}
                      onChange={(e) => setCadastroBio(e.target.value.slice(0, 160))}
                      rows={4}
                      className="w-full bg-transparent text-white font-medium text-sm placeholder:text-white/20 outline-none resize-none leading-relaxed"
                      autoFocus
                    />
                  </div>
                  <p className="text-white/20 text-xs text-right px-1">
                    {cadastroBio.length}/160
                  </p>
                </div>

                {/* Preview do card de perfil */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-4 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 p-[2px] shrink-0">
                    <div className="w-full h-full rounded-[10px] bg-[#010307] overflow-hidden">
                      {cadastroFoto ? (
                        <img src={cadastroFoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <span className="text-white/40 text-base font-black">
                            {cadastroUsername[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-black text-sm">@{cadastroUsername}</span>
                    <span className="text-white/35 text-xs truncate">
                      {cadastroBio || "Sem bio ainda"}
                    </span>
                  </div>
                  <div className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0">
                    LVL 1
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <button
                    onClick={() => handleFinalizarCadastro(false)}
                    className="w-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-black font-black uppercase tracking-widest text-sm py-4 px-6 rounded-2xl transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.4)]"
                  >
                    Entrar na Plataforma 🚀
                  </button>
                  <button
                    onClick={() => handleFinalizarCadastro(true)}
                    className="w-full text-white/25 hover:text-white/50 font-bold uppercase tracking-widest text-xs py-2 transition-colors"
                  >
                    Pular bio
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA: APP PRINCIPAL (Feed + Profile) — sem nenhuma alteração
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-full min-w-0 w-full flex-col overflow-hidden bg-[#010307] text-white font-sans relative">
      
      {/* Global Atmospheric Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full min-w-0 w-full flex-col">
        {currentView !== "feed" && currentView !== "messages" && (
          <header className="w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/5">
          <div className="flex flex-col text-left cursor-pointer" onClick={onBack}>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
              ATIVORA <span className="text-sky-500">SOCIAL</span>
            </h1>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mt-1.5">
              Compartilhe os seus resultados
            </span>
          </div>

          <div
            className="relative cursor-pointer"
            onClick={() => setCurrentView("profile")}
          >
            <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-sky-500 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-transform hover:scale-105">
              <div className="w-full h-full rounded-[14px] bg-[#010307] overflow-hidden">
                <img
                  src={profileImage}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-sky-500 text-black text-[8px] font-[1000] px-2 py-0.5 rounded-full border-2 border-[#010307]">
              LVL {safeUser.nivel || 1}
            </div>
          </div>
        </header>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
        <AnimatePresence mode="wait">
          {currentView === "feed" && (
            <AtivoraFeed
              currentUser={safeUser}
              isGuest={isGuest}
              onViewProfile={() => setCurrentView("profile")}
              onBack={onBack}
              onOpenMessages={() => setCurrentView("messages")}
              onOpenNotifications={() => setCurrentView("notifications")}
              onOpenUserProfile={(nickname: string) => {
                setSelectedNickname(nickname.replace(/^@/, ""));
                setCurrentView("viewing_profile");
              }}
            />
          )}

          {currentView === "messages" && (
            <SocialMessages
              currentUser={safeUser}
              onBack={() => setCurrentView("feed")}
              onOpenUserProfile={(nickname: string) => {
                setSelectedNickname(nickname.replace(/^@/, ""));
                setCurrentView("viewing_profile");
              }}
            />
          )}

          {/* VISUALIZAÇÃO DE PERFIL DE TERCEIROS */}
          {currentView === "viewing_profile" && selectedNickname && (
            <SocialProfile
              profileData={{ username: selectedNickname } as any}
              isOwnProfile={false}
              loggedUserNickname={safeUser.username}
              onBack={() => {
                setSelectedNickname(null);
                setCurrentView("feed");
              }}
              onProfileUpdate={() => {}}
            />
          )}

          {/* PERFIL DO PRÓPRIO USUÁRIO */}
          {currentView === "profile" && (
            <SocialProfile
              profileData={safeUser}
              isOwnProfile={true}
              loggedUserNickname={safeUser.username}
              onBack={() => setCurrentView("feed")}
              onProfileUpdate={async (updatedData: UserProfile) => {
                try {
                  const res = await fetch("/api/perfil", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      nickname: updatedData.username,
                      avatar_url: updatedData.avatar_url || updatedData.avatar,
                      bio: updatedData.bio,
                    }),
                  });

                  if (!res.ok) throw new Error("Erro ao atualizar base de dados");

                  setUser(updatedData);
                  setHasAccount(true);
                } catch (error) {
                  console.error(error);
                }
              }}
            />
          )}
        </AnimatePresence>
      </main>
      </div>
    </div>
  );
};

export default AtivoraSocial;
