"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  Award,
  Bell,
  CalendarCheck,
  Crown,
  HelpCircle,
  MessageSquarePlus,
  ShieldCheck,
  Target,
  UserRound,
  Users,
  Utensils,
} from "lucide-react";
import { FunctionCard } from "../../ui/FunctionCard";
import { HubComunidadesCard } from "../comunidades/HubComunidadesCard";

interface HomeViewProps {
  hasProfile: boolean;
  currentUser: any;
  onStartWorkout: (id: string) => void;
  setCurrentView: (view: any) => void;
  setSocialRoute: (route: any) => void;
  setIsGuestMode: (mode: boolean) => void;
  canBossPanel?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

const roleLabels: Record<string, string> = {
  aluno: "Aluno",
  personal: "Personal trainer",
  instrutor: "Instrutor",
  nutri: "Nutricionista",
  nutricionista: "Nutricionista",
  influencer: "Influenciador",
  adm: "Administrador",
  admin: "Administrador",
};

const getFirstName = (user: any) => {
  const value = String(user?.name || user?.nickname || "Atleta").trim();
  return value.split(/\s+/)[0] || "Atleta";
};

export const HomeView = ({
  hasProfile,
  currentUser,
  onStartWorkout,
  setCurrentView,
  setSocialRoute,
  setIsGuestMode,
  canBossPanel = false,
}: HomeViewProps) => {
  const [stats, setStats] = useState<any>(null);
  const [profileProgress, setProfileProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/treinos/dashboard?userId=${currentUser.id}`);
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) fetchDashboard();
    else setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    let alive = true;
    if (!currentUser?.id) return;

    fetch("/api/perfil/complementar", { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (alive && data?.profile) setProfileProgress(Number(data.profile.progresso || 0));
      })
      .catch(() => {
        if (alive) setProfileProgress(0);
      });

    return () => {
      alive = false;
    };
  }, [currentUser?.id]);

  const firstName = getFirstName(currentUser);
  const roleLabel = roleLabels[String(currentUser?.role || "").toLowerCase()] || "Perfil ativo";
  const todayWorkout = stats?.hoje;
  const weekStats = stats?.stats;
  const pendingNotifs = stats?.notificacoes?.length ?? 0;

  return (
    <motion.div
      key="home"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20 }}
      variants={containerVariants}
      className="mx-auto max-w-7xl space-y-7 text-left lg:space-y-9"
    >
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#06101D] p-5 shadow-2xl sm:p-7 lg:p-8"
      >
        <div className="absolute right-[-60px] top-[-80px] hidden h-56 w-56 rounded-full border border-sky-500/15 lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <Activity size={12} />
              {roleLabel}
            </div>
            <h1 className="mt-5 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl lg:text-6xl">
              Olá, {firstName}. <span className="text-sky-400">Escolha seu próximo passo.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
              Entre no Social, abra suas comunidades, consulte treinos e cardápios ou registre uma dúvida sem procurar função escondida.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {todayWorkout?.id && todayWorkout.status !== "concluido" ? (
                <button
                  type="button"
                  onClick={() => onStartWorkout(todayWorkout.id)}
                  className="w-full rounded-lg bg-sky-500 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 active:scale-[0.98] sm:w-auto"
                >
                  Começar treino de hoje
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentView("treinos")}
                  className="w-full rounded-lg bg-sky-500 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 active:scale-[0.98] sm:w-auto"
                >
                  Abrir treinos
                </button>
              )}
              <button
                type="button"
                onClick={() => setCurrentView("comunidades")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/75 transition hover:bg-white/10 hover:text-white active:scale-[0.98] sm:w-auto"
              >
                Ver comunidades
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <CalendarCheck className="text-sky-300" size={18} />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">
                Hoje
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {loading ? "Carregando" : todayWorkout?.titulo || "Sem treino"}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <Target className="text-sky-300" size={18} />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">
                Semana
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {weekStats ? `${weekStats.concluidosSemana}/${weekStats.metaSemanal} treinos` : "Pronta"}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <Bell className="text-sky-300" size={18} />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">
                Avisos
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {pendingNotifs > 0 ? `${pendingNotifs} pendente${pendingNotifs === 1 ? "" : "s"}` : "Tudo em dia"}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <motion.section
          variants={itemVariants}
          className="relative group flex min-h-[420px] flex-col overflow-hidden rounded-[28px] border border-white/10 text-left shadow-2xl sm:min-h-[460px] lg:min-h-[540px]"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200"
              alt="Ativora Social"
              fill
              className="object-cover grayscale brightness-50 transition-all duration-1000 group-hover:scale-105 group-hover:brightness-75"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          </div>

          <div className="relative z-20 flex h-full flex-col justify-between p-7 text-left lg:p-10">
            <div className="flex h-full max-w-xl flex-col justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-black shadow-neon">
                  <Users size={12} fill="currentColor" />
                  Resultados reais
                </div>
                <div>
                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
                    Ativora <span className="text-sky-500 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">Social</span>
                  </h2>
                  <p className="mt-3 text-sm font-bold italic leading-snug text-white/65">
                    Compartilhe os seus resultados
                  </p>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
                    Publique evolução, responda directs, crie enquetes, veja stories e mantenha seus resultados registrados no mesmo lugar.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Feed", "Stories", "Mensagens", "Enquetes"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/55"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col flex-wrap gap-3 pt-4 sm:flex-row">
                {hasProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentView("social")}
                      className="w-full rounded-lg bg-sky-500 px-7 py-4 text-[11px] font-black uppercase tracking-widest text-black shadow-xl shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 sm:w-auto"
                    >
                      Abrir feed
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSocialRoute("profile"); setCurrentView("social"); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-7 py-4 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95 sm:w-auto"
                    >
                      Meu perfil
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentView("social")}
                      className="w-full rounded-lg bg-sky-500 px-7 py-4 text-[11px] font-black uppercase tracking-widest text-black shadow-xl shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 sm:w-auto"
                    >
                      Criar perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsGuestMode(true); setCurrentView("social"); }}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-7 py-4 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95 sm:w-auto"
                    >
                      Ver como visitante
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div variants={itemVariants} className="min-h-[420px] sm:min-h-[460px] lg:min-h-[540px]">
          <HubComunidadesCard onClick={() => setCurrentView("comunidades")} />
        </motion.div>
      </div>

      <motion.section
        variants={itemVariants}
        className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10">
            <UserRound size={20} className="text-sky-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Meu Perfil</p>
              <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/35">
                Privado
              </span>
            </div>
            <h2 className="mt-2 text-xl font-black italic tracking-tighter text-white">
              Complete seus dados para treinos e nutrição
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-white/45">
              Objetivo, rotina, restrições, dados do cargo e avaliações opcionais ficam privados e prontos para orientar os próximos recursos do app.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-sky-400" style={{ width: `${profileProgress}%` }} />
              </div>
              <span className="text-[10px] font-black text-white/50">{profileProgress}%</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView("perfil")}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400"
        >
          <ShieldCheck size={14} />
          Abrir Meu Perfil
        </button>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FunctionCard
          icon={<Target className="text-sky-500" />}
          title="Treinos"
          desc="Guia, vídeos e PDFs"
          code="03"
          bgImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
          onClick={() => setCurrentView("treinos")}
        />
        <FunctionCard
          icon={<Utensils className="text-orange-500" />}
          title="Nutrição"
          desc="RFM e cardápios"
          code="NUT"
          bgImage="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400"
          onClick={() => setCurrentView("nutricao")}
        />
        <FunctionCard
          icon={<Activity className="text-green-500" />}
          title="Evolução"
          desc="Medidas e constância"
          code="04"
          bgImage="https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=400"
          onClick={() => setCurrentView("metricas")}
        />
        <FunctionCard
          icon={<Award className="text-yellow-500" />}
          title="Ranking"
          desc="Semana nas comunidades"
          code="RNK"
          bgImage="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400"
          onClick={() => setCurrentView("comunidades")}
        />
        <FunctionCard
          icon={<HelpCircle className="text-sky-500" />}
          title="Ajuda"
          desc="Rotas, voz e passos"
          code="AI"
          bgImage="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"
          onClick={() => setCurrentView("ajuda")}
        />
        <FunctionCard
          icon={<MessageSquarePlus className="text-emerald-500" />}
          title="Sugestões"
          desc="Relatos do beta"
          code="SUG"
          bgImage="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400"
          onClick={() => setCurrentView("sugestoes")}
        />
        {canBossPanel && (
          <FunctionCard
            icon={<Crown className="text-sky-400" />}
            title="Boss"
            desc="Contas e acessos"
            code="BOSS"
            bgImage="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400"
            onClick={() => setCurrentView("boss")}
          />
        )}
      </div>
    </motion.div>
  );
};
