// app/components/dashboard/comunidades/treinos/CommunityTreinos.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  Download,
  Dumbbell,
  History,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Target,
  UploadCloud,
  Users,
} from "lucide-react";
import type { CommunityTreinosProps, FocoTreino, SolicitacaoTreino, Treino } from "./types";
import { DIAS, FOCOS_LIST, ROLES_GESTAO } from "./constants";
import { now, novoTreino, totalExercicios, uid } from "./utils";
import { useTreinos } from "./hooks/useTreinos";
import { WorkoutCard } from "./components/WorkoutCard";
import { WorkoutEditor } from "./components/WorkoutEditor";
import { WorkoutExecution } from "./components/WorkoutExecution";
import { WorkoutViewer } from "./components/WorkoutViewer";
import { SolicitacaoCard } from "./components/SolicitacaoCard";
import { IAAssistente } from "./components/IAAssistente";
import { RequestMiniChat } from "../shared/RequestMiniChat";
import { useRequestMiniChat } from "../shared/useRequestMiniChat";

type Screen =
  | "resumo"
  | "treinos"
  | "solicitacoes"
  | "biblioteca"
  | "histórico"
  | "editor"
  | "visualizar"
  | "execucao"
  | "ia";

const statusText: Partial<Record<SolicitacaoTreino["status"], string>> = {
  pendente: "Aguardando profissional",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const pluralizar = (valor: number, singular: string, plural: string) =>
  `${valor} ${valor === 1 ? singular : plural}`;

export default function CommunityTreinos({
  communityId,
  userId,
  userRole,
  userName,
}: CommunityTreinosProps) {
  const isGestao = ROLES_GESTAO.includes(userRole as (typeof ROLES_GESTAO)[number]);

  const {
    treinos,
    treinosPublicados,
    solicitacoes,
    solicitacoesPendentes,
    historico,
    gerandoIA,
    salvarTreino,
    removerTreino,
    duplicarTreino,
    publicarTreino,
    solicitarTreino,
    removerSolicitacao,
    gerarComIA,
    marcarExercicioConcluido,
    concluirTreino,
    sincronizar,
  } = useTreinos(communityId, userId);

  const [screen, setScreen] = useState<Screen>("resumo");
  const [treinoAtivo, setTreinoAtivo] = useState<Treino | null>(null);
  const [solAtiva, setSolAtiva] = useState<SolicitacaoTreino | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroFoco, setFiltroFoco] = useState<FocoTreino | "todos">("todos");
  const [focosSelecionados, setFocosSelecionados] = useState<FocoTreino[]>([]);
  const [obsAluno, setObsAluno] = useState("");
  const [importandoDoc, setImportandoDoc] = useState(false);
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileTreinoLimit, setMobileTreinoLimit] = useState(4);
  const [mobileHistoricoLimit, setMobileHistoricoLimit] = useState(6);
  const [mobileSolicitacoesView, setMobileSolicitacoesView] = useState<"novo" | "acompanhamento">(
    "novo",
  );

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const treinoPdfUrl = `/api/communities/${communityId}/offline-pdf?type=treino&userId=${encodeURIComponent(userId)}`;

  const minhasSolicitacoes = useMemo(
    () => solicitacoes.filter(item => item.alunoId === userId),
    [solicitacoes, userId],
  );

  const solicitacoesConcluidas = useMemo(
    () => solicitacoes.filter(item => item.status === "concluida"),
    [solicitacoes],
  );

  const {
    activeRequestId: activeTreinoChatId,
    chatEnabled: treinoChatEnabled,
    chatStatus: treinoChatStatus,
    chatLoading: treinoChatLoading,
    chatSending: treinoChatSending,
    chatError: treinoChatError,
    chatMessages: treinoChatMessages,
    openChat: openTreinoChat,
    closeChat: closeTreinoChat,
    refreshChat: refreshTreinoChat,
    sendChatMessage: sendTreinoChatMessage,
  } = useRequestMiniChat({
    communityId,
    requestScopePath: "treinos/requests",
    userId,
    userName,
  });

  const treinoPrincipal = treinosPublicados[0] ?? null;

  const treinosFiltradosGestao = useMemo(() => {
    return treinos.filter(item => {
      const byBusca = item.titulo.toLowerCase().includes(busca.toLowerCase());
      const byFoco = filtroFoco === "todos" || item.foco === filtroFoco;
      return byBusca && byFoco;
    });
  }, [treinos, busca, filtroFoco]);

  const treinosFiltradosAluno = useMemo(() => {
    return treinosPublicados.filter(item => {
      const byBusca = item.titulo.toLowerCase().includes(busca.toLowerCase());
      const byFoco = filtroFoco === "todos" || item.foco === filtroFoco;
      return byBusca && byFoco;
    });
  }, [treinosPublicados, busca, filtroFoco]);

  const pendentesAluno = useMemo(
    () => minhasSolicitacoes.filter(item => item.status === "pendente").length,
    [minhasSolicitacoes],
  );

  const emAndamentoAluno = useMemo(
    () => minhasSolicitacoes.filter(item => item.status === "em_andamento").length,
    [minhasSolicitacoes],
  );

  const historicoHoje = useMemo(() => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    return historico.filter(item => new Date(item.concluidoEm).toLocaleDateString("pt-BR") === hoje).length;
  }, [historico]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (busca.trim() || filtroFoco !== "todos") {
      setShowMobileFilters(true);
    }
  }, [busca, filtroFoco]);

  useEffect(() => {
    if (screen !== "treinos" && screen !== "biblioteca") {
      setShowMobileFilters(false);
    }
  }, [screen]);

  useEffect(() => {
    setMobileTreinoLimit(4);
  }, [screen, busca, filtroFoco, isGestao]);

  useEffect(() => {
    setMobileHistoricoLimit(6);
  }, [screen, historico.length]);

  useEffect(() => {
    if (screen === "solicitacoes") {
      setMobileSolicitacoesView("novo");
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "solicitacoes" && activeTreinoChatId) {
      closeTreinoChat();
    }
  }, [activeTreinoChatId, closeTreinoChat, screen]);

  const chatSolicitacaoAtiva = useMemo(
    () => solicitacoes.find(item => item.id === activeTreinoChatId) ?? null,
    [activeTreinoChatId, solicitacoes],
  );

  const abrirEditor = (treino?: Treino) => {
    setTreinoAtivo(treino ? JSON.parse(JSON.stringify(treino)) : novoTreino());
    setScreen("editor");
  };

  const abrirVisualizador = (treino: Treino) => {
    setTreinoAtivo(treino);
    setScreen("visualizar");
  };

  const abrirExecucao = (treino: Treino) => {
    setTreinoAtivo(JSON.parse(JSON.stringify(treino)));
    setScreen("execucao");
  };

  const handleSalvar = (treino: Treino) => {
    salvarTreino(treino);
    setTreinoAtivo(null);
    setSolAtiva(null);
    setScreen(isGestao ? "biblioteca" : "treinos");
  };

  const handlePublicar = (treino: Treino) => {
    salvarTreino(treino);
    publicarTreino(treino.id);
    setTreinoAtivo(null);
    setSolAtiva(null);
    setScreen(isGestao ? "biblioteca" : "treinos");
  };

  const handleGerarIA = async (foco: FocoTreino, solicitacaoId?: string) => {
    const solicitacao = solicitacaoId ? solicitacoes.find(item => item.id === solicitacaoId) ?? null : null;
    const treino = await gerarComIA(foco, solicitacaoId);

    setTreinoAtivo({
      ...treino,
      paraTodos: !solicitacao,
      paraAluno: solicitacao?.alunoId,
      solicitacaoId: solicitacao?.id,
    });
    setSolAtiva(solicitacao);
    setScreen("editor");
  };

  const normalizarTexto = (value: unknown) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const resolverDia = (value: unknown): Treino["dia"] => {
    const original = String(value || "").trim();
    const texto = normalizarTexto(value);
    const match = DIAS.find(dia => texto.includes(normalizarTexto(dia).slice(0, 3)));
    return match ?? (original || "Livre");
  };

  const resolverFoco = (value: unknown): FocoTreino => {
    const texto = normalizarTexto(value);
    const match = FOCOS_LIST.find(
      foco => texto.includes(normalizarTexto(foco.id)) || texto.includes(normalizarTexto(foco.label)),
    );
    return match?.id ?? "hipertrofia";
  };

  const montarTreinoImportado = (payload: any, warnings: string[] = []): Treino => {
    const grupos = (Array.isArray(payload?.grupos) ? payload.grupos : [])
      .map((grupo: any) => ({
        id: uid(),
        nome: String(grupo?.nome || "Grupo"),
        exercicios: (Array.isArray(grupo?.exercicios) ? grupo.exercicios : [])
          .map((exercicio: any) => {
            const obs = [
              exercicio?.obs,
              exercicio?.cadencia ? `Cadência: ${exercicio.cadencia}` : "",
              exercicio?.rpe ? `RPE: ${exercicio.rpe}` : "",
            ]
              .filter(Boolean)
              .join(" | ");

            return {
              id: uid(),
              nome: String(exercicio?.nome || "").trim(),
              series: exercicio?.series === null || exercicio?.series === undefined || exercicio?.series === "" ? 0 : Number(exercicio.series),
              repeticoes: String(exercicio?.repeticoes || exercicio?.reps || ""),
              descanso: String(exercicio?.descanso || ""),
              obs,
            };
          })
          .filter((exercicio: any) => exercicio.nome),
      }))
      .filter((grupo: any) => grupo.exercicios.length > 0);

    const cardio = payload?.cardio
      ? {
          tipo: String(payload.cardio.tipo || "Cardio"),
          duracao: String(payload.cardio.duracao || ""),
          intensidade: String(payload.cardio.intensidade || ""),
          obs: String(payload.cardio.obs || ""),
        }
      : undefined;

    return {
      id: uid(),
      titulo: String(payload?.titulo || "Treino importado"),
      dia: resolverDia(payload?.dia),
      letra: payload?.letra ? String(payload.letra).slice(0, 2).toUpperCase() : undefined,
      foco: resolverFoco(payload?.foco),
      status: "draft",
      grupos: grupos.length ? grupos : [],
      cardio,
      obs: [payload?.obs, ...warnings].filter(Boolean).join("\n"),
      criadoEm: now(),
      atualizadoEm: now(),
      paraTodos: true,
    };
  };

  const handleImportarDocumento = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importandoDoc) return;

    setImportandoDoc(true);
    setErroImportacao(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", "treino");
      form.append("userId", userId);

      const response = await fetch(`/api/communities/${communityId}/document-import`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível ler o documento.");

      const treino = montarTreinoImportado(data.result?.treino, data.result?.warnings);
      setTreinoAtivo(treino);
      setSolAtiva(null);
      setScreen("editor");
    } catch (error: any) {
      setErroImportacao(error?.message || "Não foi possível importar o documento.");
    } finally {
      setImportandoDoc(false);
    }
  };

  const handleSolicitarTreino = () => {
    if (focosSelecionados.length === 0) return;
    focosSelecionados.forEach(foco => {
      solicitarTreino(userId, userName, foco, obsAluno || undefined);
    });
    setFocosSelecionados([]);
    setObsAluno("");
    setScreen("solicitacoes");
  };

  const handleToggleExercicio = (exercicioId: string) => {
    if (!treinoAtivo) return;
    marcarExercicioConcluido(treinoAtivo.id, exercicioId);
    setTreinoAtivo(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        grupos: prev.grupos.map(grupo => ({
          ...grupo,
          exercicios: grupo.exercicios.map(exercicio =>
            exercicio.id === exercicioId ? { ...exercicio, concluido: !exercicio.concluido } : exercicio,
          ),
        })),
      };
    });
  };

  const handleConcluirTreino = () => {
    if (!treinoAtivo) return;
    concluirTreino(treinoAtivo.id);
  };

  const abrirMiniChat = (solicitacao: SolicitacaoTreino) => {
    if (solicitacao.status !== "concluida") return;
    void openTreinoChat(solicitacao.id);
    if (!isGestao) setMobileSolicitacoesView("acompanhamento");
  };

  const tabs = isGestao
    ? [
        { id: "resumo" as Screen, label: "Resumo", icon: LayoutGrid },
        { id: "solicitacoes" as Screen, label: "Pedidos", icon: ClipboardList, badge: solicitacoesPendentes.length },
        { id: "biblioteca" as Screen, label: "Biblioteca", icon: Settings2 },
        { id: "histórico" as Screen, label: "Histórico", icon: History },
      ]
    : [
        { id: "resumo" as Screen, label: "Resumo", icon: LayoutGrid },
        { id: "treinos" as Screen, label: "Treinos", icon: Dumbbell },
        { id: "solicitacoes" as Screen, label: "Pedidos", icon: ClipboardList, badge: pendentesAluno },
        { id: "histórico" as Screen, label: "Histórico", icon: History },
      ];

  const quickActions = isGestao
    ? [
        { id: "novo", label: "Novo treino", detail: "Abrir editor", icon: Plus, action: () => abrirEditor() },
        {
          id: "pedidos",
          label: "Fila de pedidos",
          detail: `${solicitacoesPendentes.length} pendente(s)`,
          icon: ClipboardList,
          action: () => setScreen("solicitacoes"),
        },
        { id: "ia", label: "Assistente IA", detail: "Gerar base rápida", icon: Sparkles, action: () => setScreen("ia") },
      ]
    : [
        {
          id: "start",
          label: "Treino principal",
          detail: treinoPrincipal ? "Iniciar agora" : "Aguardar publicação",
          icon: Dumbbell,
          action: () => treinoPrincipal && abrirExecucao(treinoPrincipal),
          disabled: !treinoPrincipal,
        },
        { id: "request", label: "Pedir treino", detail: "Abrir solicitações", icon: Target, action: () => setScreen("solicitacoes") },
        {
          id: "history",
          label: "Histórico",
          detail: pluralizar(historico.length, "sessão", "sessões"),
          icon: History,
          action: () => setScreen("histórico"),
        },
      ];

  const treinosVisiveis = isGestao ? treinosFiltradosGestao : treinosFiltradosAluno;
  const filtrosAtivos = busca.trim().length > 0 || filtroFoco !== "todos";
  const treinosRenderizados = useMemo(() => {
    if (!isMobile || filtrosAtivos) return treinosVisiveis;
    return treinosVisiveis.slice(0, mobileTreinoLimit);
  }, [filtrosAtivos, isMobile, mobileTreinoLimit, treinosVisiveis]);
  const hasMoreTreinosMobile =
    isMobile && !filtrosAtivos && treinosRenderizados.length < treinosVisiveis.length;
  const historicoRenderizado = useMemo(
    () => (isMobile ? historico.slice(0, mobileHistoricoLimit) : historico),
    [historico, isMobile, mobileHistoricoLimit],
  );
  const hasMoreHistoricoMobile = isMobile && historicoRenderizado.length < historico.length;

  if (screen === "editor" && treinoAtivo) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 text-left text-white">
        <WorkoutEditor
          treino={treinoAtivo}
          onSave={handleSalvar}
          onPublish={handlePublicar}
          onClose={() => {
            setTreinoAtivo(null);
            setScreen(isGestao ? "biblioteca" : "treinos");
          }}
        />
        <AnimatePresence>
          {gerandoIA && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#010307]/95 backdrop-blur-2xl"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 size={34} className="animate-spin text-sky-400" />
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Gerando base do treino</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (screen === "visualizar" && treinoAtivo) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 text-left text-white">
        <WorkoutViewer
          treino={treinoAtivo}
          isGestao={isGestao}
          onClose={() => {
            setTreinoAtivo(null);
            setScreen(isGestao ? "biblioteca" : "treinos");
          }}
          onEdit={isGestao ? () => setScreen("editor") : undefined}
          onIniciar={!isGestao ? () => abrirExecucao(treinoAtivo) : undefined}
          onToggleExercicio={!isGestao ? handleToggleExercicio : undefined}
          pdfUrl={!isGestao ? treinoPdfUrl : undefined}
        />
      </div>
    );
  }

  if (screen === "execucao" && treinoAtivo) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pb-20 text-left text-white">
        <WorkoutExecution
          treino={treinoAtivo}
          onClose={() => {
            setTreinoAtivo(null);
            setScreen("treinos");
          }}
          onConcluir={handleConcluirTreino}
          onToggleExercicio={handleToggleExercicio}
        />
      </div>
    );
  }

  if (screen === "ia") {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pb-20 text-left text-white">
        <IAAssistente
          gerandoIA={gerandoIA}
          onGerar={handleGerarIA}
          solicitacao={solAtiva ?? undefined}
          onClose={() => {
            setSolAtiva(null);
            setScreen(isGestao ? "solicitacoes" : "resumo");
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-2 pb-10 text-left text-white sm:space-y-5 sm:px-1">
      <section className="rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Treinos da comunidade</p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Visão prática para treinar com consistência
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {isGestao
                ? "Gerencie pedidos, biblioteca e histórico com foco no que precisa de decisão."
                : "Acompanhe treino, pedidos e histórico sem excesso de informação na tela."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={sincronizar}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
            >
              <RefreshCw size={13} />
              Atualizar
            </button>
            {isGestao ? (
              <button
                type="button"
                onClick={() => abrirEditor()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500/20"
              >
                <Plus size={13} />
                Novo treino
              </button>
            ) : (
              <a
                href={treinoPdfUrl}
                download
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Download size={13} />
                PDF
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            {
              label: "Publicados",
              value: String(treinosPublicados.length),
              detail: "treinos ativos",
              tone: "text-sky-300",
            },
            {
              label: "Pendentes",
              value: String(isGestao ? solicitacoesPendentes.length : pendentesAluno),
              detail: isGestao ? "pedidos para revisar" : "pedidos aguardando",
              tone: "text-amber-300",
            },
            {
              label: isGestao ? "Biblioteca" : "Em andamento",
              value: String(isGestao ? treinos.length : emAndamentoAluno),
              detail: isGestao ? "treinos totais" : "solicitações abertas",
              tone: "text-white/70",
            },
            {
              label: "Hoje",
              value: String(historicoHoje),
              detail: "sessões concluídas",
              tone: "text-emerald-300",
            },
          ].map(card => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
              <p className={`mt-1 text-lg font-black ${card.tone}`}>{card.value}</p>
              <p className="text-[10px] text-white/35">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = screen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScreen(tab.id)}
              className={`relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
                active
                  ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                  : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
              }`}
            >
              <Icon size={12} />
              <span className="truncate">{tab.label}</span>
              {"badge" in tab && tab.badge && tab.badge > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-4"
        >
          {screen === "resumo" && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
                    {isGestao ? "Treino em destaque" : "Próximo treino"}
                  </p>
                  <h3 className="mt-2 text-xl font-black italic text-white">
                    {treinoPrincipal?.titulo || "Nenhum treino publicado"}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">
                    {treinoPrincipal
                      ? `${treinoPrincipal.dia} - foco em ${FOCOS_LIST.find(item => item.id === treinoPrincipal.foco)?.label || treinoPrincipal.foco}.`
                      : "Publique um treino para liberar início rápido e acompanhamento no resumo."}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <article className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Exercicios</p>
                      <p className="mt-1 text-sm font-black text-white">
                        {treinoPrincipal ? totalExercicios(treinoPrincipal) : 0}
                      </p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Dia</p>
                      <p className="mt-1 text-sm font-black text-white">{treinoPrincipal?.dia || "-"}</p>
                    </article>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={!treinoPrincipal}
                      onClick={() => treinoPrincipal && abrirVisualizador(treinoPrincipal)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-[10px] font-black uppercase tracking-widest transition ${
                        treinoPrincipal
                          ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                          : "cursor-not-allowed border-white/10 bg-white/5 text-white/25"
                      }`}
                    >
                      <LayoutGrid size={13} />
                      Ver treino
                    </button>

                    <button
                      type="button"
                      disabled={!treinoPrincipal}
                      onClick={() => treinoPrincipal && abrirExecucao(treinoPrincipal)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-[10px] font-black uppercase tracking-widest transition ${
                        treinoPrincipal
                          ? "bg-sky-500 text-black hover:bg-sky-400"
                          : "cursor-not-allowed bg-white/5 text-white/25"
                      }`}
                    >
                      <Dumbbell size={13} />
                      Iniciar
                    </button>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    {isGestao ? "Fila de pedidos" : "Minhas solicitações"}
                  </p>
                  <h3 className="mt-2 text-xl font-black italic text-white">
                    {isGestao ? `${solicitacoesPendentes.length} aguardando resposta` : `${minhasSolicitacoes.length} registradas`}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">
                    {isGestao
                      ? "Priorize as pendentes e monte treinos manualmente ou com apoio da IA."
                      : "Envie foco, acompanhe status e receba atualizações sem precisar procurar em várias telas."}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <article className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Pendentes</p>
                      <p className="mt-1 text-sm font-black text-white">{isGestao ? solicitacoesPendentes.length : pendentesAluno}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/20 p-2.5">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Em andamento</p>
                      <p className="mt-1 text-sm font-black text-white">{isGestao ? "-" : emAndamentoAluno}</p>
                    </article>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setScreen("solicitacoes")}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/15"
                    >
                      <ClipboardList size={13} />
                      Abrir pedidos
                    </button>
                    {isGestao ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSolAtiva(null);
                          setScreen("ia");
                        }}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500/20"
                      >
                        <Sparkles size={13} />
                        Assistente IA
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setScreen("solicitacoes")}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        <Target size={13} />
                        Pedir treino
                      </button>
                    )}
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Fluxo rápido</p>
                  <button
                    type="button"
                    onClick={() => setScreen(isGestao ? "biblioteca" : "treinos")}
                    className="text-[9px] font-black uppercase tracking-widest text-sky-300 transition hover:text-sky-200"
                  >
                    Abrir lista completa
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {quickActions.map(action => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.action}
                        disabled={"disabled" in action && action.disabled}
                        className={`rounded-xl border p-3 text-left transition ${
                          "disabled" in action && action.disabled
                            ? "cursor-not-allowed border-white/10 bg-black/20 text-white/25"
                            : "border-white/10 bg-black/20 text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={13} className={"disabled" in action && action.disabled ? "text-white/25" : "text-sky-300"} />
                          <p className="text-[10px] font-black uppercase tracking-widest">{action.label}</p>
                        </div>
                        <p className="mt-2 text-xs text-white/40">{action.detail}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {(screen === "treinos" || screen === "biblioteca") && (
            <section className="space-y-4">
              {isGestao && screen === "biblioteca" && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => abrirEditor()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500/20"
                  >
                    <Plus size={13} />
                    Novo treino
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSolAtiva(null);
                      setScreen("ia");
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/15"
                  >
                    <BrainCircuit size={13} />
                    IA treino
                  </button>

                  <input
                    ref={importInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleImportarDocumento}
                  />
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importandoDoc}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {importandoDoc ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                    Importar
                  </button>
                </div>
              )}

              {erroImportacao && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  <AlertTriangle size={13} />
                  {erroImportacao}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {pluralizar(treinosVisiveis.length, "treino exibido", "treinos exibidos")}
                </p>
                {filtrosAtivos && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      setFiltroFoco("todos");
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-sky-300 transition hover:text-sky-200"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(current => !current)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                >
                  <Settings2 size={13} />
                  {showMobileFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
              </div>

              <div className={`${showMobileFilters ? "grid" : "hidden"} gap-2 sm:grid sm:grid-cols-[1fr_auto_auto]`}>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    value={busca}
                    onChange={event => setBusca(event.target.value)}
                    placeholder="Buscar treino..."
                    className="min-h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/35"
                  />
                </div>
                <select
                  value={filtroFoco}
                  onChange={event => setFiltroFoco(event.target.value as FocoTreino | "todos")}
                  className="min-h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/35"
                >
                  <option value="todos">Todos os focos</option>
                  {FOCOS_LIST.map(foco => (
                    <option key={foco.id} value={foco.id}>
                      {foco.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={sincronizar}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/45 transition hover:text-white"
                >
                  <RefreshCw size={13} />
                  Atualizar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {treinosRenderizados.map(treino => (
                  <WorkoutCard
                    key={treino.id}
                    treino={treino}
                    isGestao={isGestao}
                    onView={() => abrirVisualizador(treino)}
                    onEdit={isGestao ? () => abrirEditor(treino) : undefined}
                    onDelete={isGestao ? () => removerTreino(treino.id) : undefined}
                    onDuplicate={isGestao ? () => duplicarTreino(treino) : undefined}
                    onPublish={isGestao ? () => publicarTreino(treino.id) : undefined}
                    onIniciar={!isGestao ? () => abrirExecucao(treino) : undefined}
                  />
                ))}
              </div>

              {hasMoreTreinosMobile && (
                <button
                  type="button"
                  onClick={() => setMobileTreinoLimit(current => current + 4)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white sm:hidden"
                >
                  Mostrar mais treinos
                </button>
              )}

              {treinosRenderizados.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <Dumbbell size={28} className="mx-auto text-white/20" />
                  <p className="mt-3 text-sm font-black text-white">
                    {isGestao ? "Nenhum treino encontrado com os filtros atuais." : "Nenhum treino publicado com esses filtros."}
                  </p>
                </div>
              )}

              {activeTreinoChatId && chatSolicitacaoAtiva && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={closeTreinoChat}
                      className="text-[9px] font-black uppercase tracking-widest text-white/40 transition hover:text-white"
                    >
                      Fechar chat
                    </button>
                  </div>
                  {treinoChatError ? (
                    <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                      {treinoChatError}
                    </p>
                  ) : null}

                  <RequestMiniChat
                    title={`Mini chat • ${chatSolicitacaoAtiva.alunoNome}`}
                    subtitle="Conversa entre aluno e equipe responsavel por este pedido."
                    currentUserId={userId}
                    enabled={treinoChatEnabled}
                    loading={treinoChatLoading}
                    sending={treinoChatSending}
                    messages={treinoChatMessages}
                    disabledReason={
                      treinoChatStatus && treinoChatStatus !== "concluida"
                        ? "Este mini chat sera liberado quando o treino for concluido."
                        : null
                    }
                    placeholder="Digite uma mensagem rapida..."
                    onSend={sendTreinoChatMessage}
                    onRefresh={refreshTreinoChat}
                  />
                </div>
              )}
            </section>
          )}

          {screen === "solicitacoes" && (
            <section className="space-y-4">
              {isGestao ? (
                <>
                  {solicitacoesPendentes.length > 0 ? (
                    <div className="space-y-3">
                      {solicitacoesPendentes.map(solicitacao => (
                        <SolicitacaoCard
                          key={solicitacao.id}
                          solicitacao={solicitacao}
                          gerandoIA={gerandoIA}
                          onGerarIA={() => {
                            setSolAtiva(solicitacao);
                            setScreen("ia");
                          }}
                          onMontarManual={() => {
                            setTreinoAtivo({
                              ...novoTreino(solicitacao.foco),
                              titulo: `Treino ${solicitacao.foco.toUpperCase()}`,
                              paraTodos: false,
                              paraAluno: solicitacao.alunoId,
                              solicitacaoId: solicitacao.id,
                            });
                            setScreen("editor");
                          }}
                          onDescartar={() => removerSolicitacao(solicitacao.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                      <Users size={28} className="mx-auto text-white/20" />
                      <p className="mt-3 text-sm font-black text-white">Sem solicitações pendentes no momento.</p>
                    </div>
                  )}

                  {solicitacoesConcluidas.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        Pedidos concluídos
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        Abra o mini chat para alinhar ajustes com o aluno.
                      </p>
                      <div className="mt-3 space-y-2">
                        {solicitacoesConcluidas.map(solicitacao => {
                          const foco = FOCOS_LIST.find(item => item.id === solicitacao.foco);
                          const active = activeTreinoChatId === solicitacao.id;
                          return (
                            <article
                              key={`chat-${solicitacao.id}`}
                              className={`rounded-xl border p-3 ${
                                active
                                  ? "border-sky-500/25 bg-sky-500/10"
                                  : "border-white/10 bg-black/20"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-white">
                                    {solicitacao.alunoNome}
                                  </p>
                                  <p className="text-[10px] text-white/35">
                                    {foco?.label || solicitacao.foco}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => abrirMiniChat(solicitacao)}
                                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest transition ${
                                    active
                                      ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                                      : "border border-white/10 bg-white/5 text-white/55 hover:text-white"
                                  }`}
                                >
                                  <MessageCircle size={11} />
                                  {active ? "Chat aberto" : "Abrir mini chat"}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid grid-cols-2 gap-2 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileSolicitacoesView("novo")}
                      className={`min-h-11 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition ${
                        mobileSolicitacoesView === "novo"
                          ? "border-sky-500/30 bg-sky-500/15 text-sky-200"
                          : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                      }`}
                    >
                      Novo pedido
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileSolicitacoesView("acompanhamento")}
                      className={`min-h-11 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition ${
                        mobileSolicitacoesView === "acompanhamento"
                          ? "border-sky-500/30 bg-sky-500/15 text-sky-200"
                          : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                      }`}
                    >
                      Acompanhamento
                    </button>
                  </div>

                  <section
                    className={`rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 ${
                      mobileSolicitacoesView === "novo" ? "block" : "hidden lg:block"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Novo pedido</p>
                    <h3 className="mt-2 text-xl font-black italic text-white">Solicitar treino</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/40">
                      Escolha o foco e envie uma observação objetiva para o profissional.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {FOCOS_LIST.map(foco => {
                        const active = focosSelecionados.includes(foco.id);
                        const Icon = foco.icon as React.ElementType;
                        return (
                          <button
                            key={foco.id}
                            type="button"
                            onClick={() =>
                              setFocosSelecionados(prev =>
                                prev.includes(foco.id)
                                  ? prev.filter(item => item !== foco.id)
                                  : [...prev, foco.id],
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-left transition-all ${
                              active
                                ? `${foco.bg} ${foco.border}`
                                : "border-white/10 bg-black/20 hover:border-white/20"
                            }`}
                          >
                            <Icon size={14} className={active ? foco.cor : "text-white/25"} />
                            <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${active ? foco.cor : "text-white/35"}`}>
                              {foco.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      value={obsAluno}
                      onChange={event => setObsAluno(event.target.value)}
                      rows={3}
                      className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/35"
                      placeholder="observações para o profissional..."
                    />

                    <button
                      type="button"
                      disabled={focosSelecionados.length === 0}
                      onClick={handleSolicitarTreino}
                      className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${
                        focosSelecionados.length > 0
                          ? "bg-sky-500 text-black hover:bg-sky-400"
                          : "cursor-not-allowed bg-white/5 text-white/25"
                      }`}
                    >
                      <Target size={13} />
                      Enviar solicitação
                    </button>
                  </section>

                  <section
                    className={`rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 ${
                      mobileSolicitacoesView === "acompanhamento" ? "block" : "hidden lg:block"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Acompanhamento</p>
                    <h3 className="mt-2 text-xl font-black italic text-white">Minhas solicitações</h3>
                    <div className="mt-4 space-y-2">
                      {minhasSolicitacoes.length > 0 ? (
                        minhasSolicitacoes.map(solicitacao => {
                          const foco = FOCOS_LIST.find(item => item.id === solicitacao.foco);
                          return (
                            <article key={solicitacao.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-black text-white">{foco?.label || solicitacao.foco}</p>
                                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/60">
                                  {statusText[solicitacao.status] || "Atualizado"}
                                </span>
                              </div>
                              {solicitacao.obs && (
                                <p className="mt-1 text-xs leading-relaxed text-white/40">{solicitacao.obs}</p>
                              )}
                              {solicitacao.status === "concluida" && (
                                <button
                                  type="button"
                                  onClick={() => abrirMiniChat(solicitacao)}
                                  className={`mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-[9px] font-black uppercase tracking-widest transition ${
                                    activeTreinoChatId === solicitacao.id
                                      ? "border-sky-500/30 bg-sky-500/15 text-sky-200"
                                      : "border-white/10 bg-white/5 text-white/55 hover:text-white"
                                  }`}
                                >
                                  <MessageCircle size={11} />
                                  {activeTreinoChatId === solicitacao.id ? "Chat aberto" : "Abrir mini chat"}
                                </button>
                              )}
                            </article>
                          );
                        })
                      ) : (
                        <p className="rounded-xl bg-black/20 p-4 text-sm text-white/35">Nenhuma solicitação enviada ainda.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </section>
          )}

          {screen === "histórico" && (
            <section className="space-y-3">
              {historico.length > 0 ? (
                historicoRenderizado.map(item => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{item.treinoTitulo}</p>
                        <p className="text-xs text-white/35">
                          {item.exerciciosConcluidos.length} exercícios concluídos
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                        {new Date(item.concluidoEm).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <History size={28} className="mx-auto text-white/20" />
                  <p className="mt-3 text-sm font-black text-white">Sem histórico de treinos concluídos.</p>
                </div>
              )}
              {hasMoreHistoricoMobile && (
                <button
                  type="button"
                  onClick={() => setMobileHistoricoLimit(current => current + 6)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white sm:hidden"
                >
                  Mostrar mais histórico
                </button>
              )}
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
