// app/components/dashboard/comunidades/treinos/CommunityTreinos.tsx
"use client";

import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Settings2, BrainCircuit, RefreshCw,
  Plus, Search, Filter, Database, History,
  UploadCloud, Loader2, AlertTriangle, Download,
} from "lucide-react";

import type { Treino, FocoTreino, SolicitacaoTreino } from "./types";
import type { CommunityTreinosProps } from "./types";
import { DIAS, FOCOS_LIST, ROLES_GESTAO } from "./constants";
import { novoTreino, uid, now } from "./utils";
import { useTreinos } from "./hooks/useTreinos";

import { FocoBadge }          from "./components/FocoBadge";
import { WorkoutCard }         from "./components/WorkoutCard";
import { WorkoutViewer }       from "./components/WorkoutViewer";
import { WorkoutEditor }       from "./components/WorkoutEditor";
import { WorkoutExecution }    from "./components/WorkoutExecution";
import { SolicitacaoCard }     from "./components/SolicitacaoCard";
import { IAAssistente }        from "./components/IAAssistente";

// ── Tipos de view ─────────────────────────────────────────────
type View =
  | "dashboard"
  | "gestao"
  | "visualizar"
  | "editor"
  | "execucao"
  | "historico"
  | "ia";

export default function CommunityTreinos({
  communityId,
  userId,
  userRole,
  userName,
}: CommunityTreinosProps) {

  const isGestao = ROLES_GESTAO.includes(userRole as typeof ROLES_GESTAO[number]);

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
  } = useTreinos(communityId, userId);

  // ── State de navegação ────────────────────────────────────────
  const [view, setView]                         = useState<View>(isGestao ? "gestao" : "dashboard");
  const [treinoAtivo, setTreinoAtivo]           = useState<Treino | null>(null);
  const [solAtiva, setSolAtiva]                 = useState<SolicitacaoTreino | null>(null);
  const [importandoDoc, setImportandoDoc]       = useState(false);
  const [erroImportacao, setErroImportacao]     = useState<string | null>(null);
  const importInputRef                          = useRef<HTMLInputElement | null>(null);

  // ── Filtros (gestão) ──────────────────────────────────────────
  const [busca, setBusca]         = useState("");
  const [filtroFoco, setFiltroFoco] = useState<FocoTreino | "todos">("todos");
  const treinoPdfUrl = `/api/communities/${communityId}/offline-pdf?type=treino&userId=${encodeURIComponent(userId)}`;

  // ── Solicitação (aluno) ───────────────────────────────────────
  const [focosSelecionados, setFocosSelecionados] = useState<FocoTreino[]>([]);
  const [obsAluno, setObsAluno]                   = useState("");

  // ── Treinos filtrados ─────────────────────────────────────────
  const treinosFiltrados = useMemo(() => {
    return treinos.filter(t => {
      const matchBusca = t.titulo.toLowerCase().includes(busca.toLowerCase());
      const matchFoco  = filtroFoco === "todos" || t.foco === filtroFoco;
      return matchBusca && matchFoco;
    });
  }, [treinos, busca, filtroFoco]);

  // ── Handlers ──────────────────────────────────────────────────
  const abrirEditor = (t?: Treino) => {
    setTreinoAtivo(t ? JSON.parse(JSON.stringify(t)) : novoTreino());
    setView("editor");
  };

  const normalizarTexto = (value: unknown) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const resolverDia = (value: unknown): Treino["dia"] => {
    const original = String(value || "").trim();
    const texto = normalizarTexto(value);
    const match = DIAS.find((dia) => texto.includes(normalizarTexto(dia).slice(0, 3)));
    return match ?? (original || "Livre");
  };

  const resolverFoco = (value: unknown): FocoTreino => {
    const texto = normalizarTexto(value);
    const match = FOCOS_LIST.find((foco) =>
      texto.includes(normalizarTexto(foco.id)) || texto.includes(normalizarTexto(foco.label))
    );
    return match?.id ?? "hipertrofia";
  };

  const montarTreinoImportado = (payload: any, warnings: string[] = []): Treino => {
    const foco = resolverFoco(payload?.foco);
    const grupos = (Array.isArray(payload?.grupos) ? payload.grupos : [])
      .map((grupo: any) => ({
        id: uid(),
        nome: String(grupo?.nome || "Grupo"),
        exercicios: (Array.isArray(grupo?.exercicios) ? grupo.exercicios : [])
          .map((ex: any) => {
            const obs = [
              ex?.obs,
              ex?.cadencia ? `Cadencia: ${ex.cadencia}` : "",
              ex?.rpe ? `RPE: ${ex.rpe}` : "",
            ].filter(Boolean).join(" | ");

            return {
              id: uid(),
              nome: String(ex?.nome || "").trim(),
              series: ex?.series === null || ex?.series === undefined || ex?.series === "" ? 0 : Number(ex.series),
              repeticoes: String(ex?.repeticoes || ""),
              descanso: String(ex?.descanso || ""),
              obs,
            };
          })
          .filter((ex: any) => ex.nome),
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
      foco,
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
      setView("editor");
    } catch (error: any) {
      setErroImportacao(error?.message || "Não foi possível importar o documento.");
    } finally {
      setImportandoDoc(false);
    }
  };

  const abrirVisualizador = (t: Treino) => {
    setTreinoAtivo(t);
    setView("visualizar");
  };

  const abrirExecucao = (t: Treino) => {
    setTreinoAtivo(JSON.parse(JSON.stringify(t)));
    setView("execucao");
  };

  const handleSalvar = (t: Treino) => {
    salvarTreino(t);
    setView(isGestao ? "gestao" : "dashboard");
    setTreinoAtivo(null);
  };

  const handlePublicar = (t: Treino) => {
    salvarTreino(t);
    publicarTreino(t.id);
    setView(isGestao ? "gestao" : "dashboard");
    setTreinoAtivo(null);
  };

  const handleGerarIA = async (foco: FocoTreino, solicitacaoId?: string) => {
    const solicitacao = solicitacoes.find(s => s.id === solicitacaoId) ?? null;
    const treino = await gerarComIA(foco, solicitacaoId);
    setTreinoAtivo({
      ...treino,
      paraTodos: !solicitacao,
      paraAluno: solicitacao?.alunoId,
      solicitacaoId: solicitacao?.id,
    });
    setSolAtiva(solicitacao);
    setView("editor");
  };

  const handleSolicitarTreino = () => {
    if (focosSelecionados.length === 0) return;
    focosSelecionados.forEach(foco =>
      solicitarTreino(userId, userName, foco, obsAluno || undefined)
    );
    setFocosSelecionados([]);
    setObsAluno("");
  };

  const handleToggleExercicio = (exercicioId: string) => {
    if (!treinoAtivo) return;
    marcarExercicioConcluido(treinoAtivo.id, exercicioId);
    // Atualiza o estado local também
    setTreinoAtivo(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        grupos: prev.grupos.map(g => ({
          ...g,
          exercicios: g.exercicios.map(e =>
            e.id === exercicioId ? { ...e, concluido: !e.concluido } : e
          ),
        })),
      };
    });
  };

  const handleConcluirTreino = () => {
    if (!treinoAtivo) return;
    concluirTreino(treinoAtivo.id);
  };

  // ── Overlay IA ────────────────────────────────────────────────
  const OverlayIA = () => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#010307]/98 backdrop-blur-3xl z-[9999]
        flex flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-10 max-w-sm text-center">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-48 h-48 border-2 border-purple-500/20 border-dashed rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border border-sky-500/10 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-purple-500/10 p-10 rounded-full border border-purple-500/20">
              <BrainCircuit size={52} className="text-purple-400" />
            </motion.div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-4xl font-black italic uppercase text-white tracking-tighter">
            GERANDO TREINO
          </h4>
          <p className="text-[10px] font-black uppercase text-purple-400/60 tracking-[0.6em]">
            IA montando sugestão base...
          </p>
        </div>
      </div>
    </motion.div>
  );

  // ══════════════════════════════════════════════════════════════
  // VIEWS FULL-PAGE
  // ══════════════════════════════════════════════════════════════

  if (view === "editor" && treinoAtivo) {
    return (
      <div className="w-full max-w-4xl mx-auto text-white pb-20 px-4">
        <WorkoutEditor
          treino={treinoAtivo}
          onSave={handleSalvar}
          onPublish={handlePublicar}
          onClose={() => { setView(isGestao ? "gestao" : "dashboard"); setTreinoAtivo(null); }}
        />
        <AnimatePresence>{gerandoIA && <OverlayIA />}</AnimatePresence>
      </div>
    );
  }

  if (view === "visualizar" && treinoAtivo) {
    return (
      <div className="w-full max-w-4xl mx-auto text-white pb-20 px-4">
        <WorkoutViewer
          treino={treinoAtivo}
          isGestao={isGestao}
          onClose={() => { setView(isGestao ? "gestao" : "dashboard"); setTreinoAtivo(null); }}
          onEdit={() => setView("editor")}
          onIniciar={() => abrirExecucao(treinoAtivo)}
          onToggleExercicio={!isGestao ? handleToggleExercicio : undefined}
          pdfUrl={!isGestao ? treinoPdfUrl : undefined}
        />
      </div>
    );
  }

  if (view === "execucao" && treinoAtivo) {
    return (
      <div className="w-full max-w-2xl mx-auto text-white pb-20 px-4">
        <WorkoutExecution
          treino={treinoAtivo}
          onClose={() => { setView("dashboard"); setTreinoAtivo(null); }}
          onConcluir={handleConcluirTreino}
          onToggleExercicio={handleToggleExercicio}
        />
      </div>
    );
  }

  if (view === "ia") {
    return (
      <div className="w-full max-w-xl mx-auto text-white pb-20 px-4">
        <IAAssistente
          gerandoIA={gerandoIA}
          onGerar={handleGerarIA}
          solicitacao={solAtiva ?? undefined}
          onClose={() => { setView("gestao"); setSolAtiva(null); }}
        />
        <AnimatePresence>{gerandoIA && <OverlayIA />}</AnimatePresence>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="w-full max-w-6xl mx-auto pb-40 text-white text-left
      selection:bg-sky-500/30">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between items-start
        sm:items-end gap-6 mb-10 px-1">
        <div>
          <h1 className="text-4xl sm:text-7xl font-black italic uppercase
            tracking-tighter leading-none text-white">
            TREI<span className="text-sky-500">NOS</span>
          </h1>
          <p className="text-[9px] font-black uppercase tracking-[0.5em]
            text-white/15 mt-2 italic">
            PLATAFORMA DE TREINAMENTO PERSONALIZADO
          </p>
        </div>

        {/* Nav */}
        <nav className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl
          border border-white/10 shadow-xl w-full sm:w-auto">
          {isGestao && (
            <button
              onClick={() => setView("gestao")}
              className={`flex-1 sm:flex-none p-3.5 rounded-xl transition-all
                flex items-center justify-center gap-2
                ${view === "gestao"
                  ? "bg-white/10 text-white font-black"
                  : "text-white/30 hover:text-white/60"}`}>
              <Settings2 size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">
                Gestão
              </span>
            </button>
          )}
          <button
            onClick={() => setView("dashboard")}
            className={`flex-1 sm:flex-none p-3.5 rounded-xl transition-all
              flex items-center justify-center gap-2
              ${view === "dashboard"
                ? "bg-sky-500 text-black font-black shadow-lg"
                : "text-white/30 hover:text-white/60"}`}>
            <LayoutGrid size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">
              Meus Treinos
            </span>
          </button>
          <button
            onClick={() => setView("historico")}
            className={`flex-1 sm:flex-none p-3.5 rounded-xl transition-all
              flex items-center justify-center gap-2
              ${view === "historico"
                ? "bg-sky-500 text-black font-black shadow-lg"
                : "text-white/30 hover:text-white/60"}`}>
            <History size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">
              Histórico
            </span>
          </button>
        </nav>
      </header>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════
            DASHBOARD — ALUNO
            ════════════════════════════════════════════════════ */}
        {view === "dashboard" && (
          <motion.div key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8">

            {/* Card principal — iniciar treino */}
            <div className="relative overflow-hidden bg-gradient-to-br
              from-[#0a0c10] to-[#010307] border border-white/5
              rounded-[32px] p-8 sm:p-14 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-bl
                from-sky-500/5 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row
                justify-between items-center gap-10">
                <div className="flex-1 space-y-5 text-left w-full">
                  <div className="inline-flex items-center gap-2 px-4 py-2
                    bg-sky-500/10 border border-sky-500/20 rounded-full
                    text-[9px] font-black text-sky-400 uppercase tracking-widest italic">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      treinosPublicados.length > 0 ? "bg-sky-400 animate-pulse" : "bg-white/20"
                    }`} />
                    {treinosPublicados.length > 0 ? "Treino disponível" : "Nenhum treino publicado"}
                  </div>

                  {treinosPublicados.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-4xl sm:text-6xl font-black italic uppercase
                        leading-[0.85] tracking-tighter text-white">
                        {treinosPublicados[0].titulo}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <FocoBadge foco={treinosPublicados[0].foco} size="md" />
                        <span className="text-white/20 font-bold uppercase text-xs
                          tracking-[0.2em] border-l border-white/10 pl-3">
                          {treinosPublicados[0].grupos.reduce(
                            (a, g) => a + g.exercicios.length, 0
                          )} exercícios
                          {treinosPublicados[0].cardio
                            ? ` + ${treinosPublicados[0].cardio.tipo}`
                            : ""}
                        </span>
                      </div>
                      {treinosPublicados[0].obs && (
                        <p className="text-xs text-white/25 italic
                          border-l-2 border-sky-500/20 pl-4">
                          {treinosPublicados[0].obs}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-3xl sm:text-5xl font-black italic uppercase
                        text-white/10 leading-none tracking-tighter">
                        AGUARDANDO<br />TREINO
                      </h3>
                      <p className="text-[10px] text-white/10 font-black uppercase
                        tracking-widest italic">
                        Solicite um treino ao seu personal abaixo
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col gap-3 lg:w-auto">
                  <button
                    disabled={treinosPublicados.length === 0}
                    onClick={() => treinosPublicados[0] && abrirExecucao(treinosPublicados[0])}
                    className={`w-full h-16 sm:h-24 px-8 sm:px-14 rounded-[24px]
                      font-black uppercase italic text-base sm:text-xl transition-all
                      flex items-center justify-center gap-4 shrink-0
                      ${treinosPublicados.length > 0
                        ? "bg-sky-500 text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(14,165,233,0.4)]"
                        : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed"}`}>
                    {treinosPublicados.length > 0 ? "INICIAR" : "OFFLINE"}
                  </button>
                  <a
                    href={treinoPdfUrl}
                    download
                    aria-disabled={treinosPublicados.length === 0}
                    className={`w-full rounded-2xl border px-5 py-3 text-center text-[10px]
                      font-black uppercase tracking-widest transition-all flex items-center
                      justify-center gap-2
                      ${treinosPublicados.length > 0
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "pointer-events-none border-white/5 bg-white/3 text-white/10"}`}
                  >
                    <Download size={13} /> Baixar semana em PDF
                  </a>
                </div>
              </div>
            </div>

            {/* Grade de treinos publicados */}
            {treinosPublicados.length > 1 && (
              <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.4em]
                  text-white/20 italic px-1">
                  Todos os treinos — {treinosPublicados.length}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {treinosPublicados.map(t => (
                    <WorkoutCard
                      key={t.id}
                      treino={t}
                      isGestao={false}
                      onView={() => abrirVisualizador(t)}
                      onIniciar={() => abrirExecucao(t)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Solicitar treino */}
            <div className="space-y-6 bg-[#0a0e18] border border-white/5
              rounded-[28px] p-6 sm:p-10">
              <div>
                <h4 className="text-lg font-black uppercase italic text-white
                  leading-none mb-1">
                  Solicitar Treino
                </h4>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em]
                  text-white/20 italic">
                  Escolha o foco e envie para o seu personal
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FOCOS_LIST.map(f => {
                  const ativo = focosSelecionados.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFocosSelecionados(prev =>
                        prev.includes(f.id)
                          ? prev.filter(x => x !== f.id)
                          : [...prev, f.id]
                      )}
                      className={`p-4 rounded-[18px] border transition-all text-left
                        relative overflow-hidden
                        ${ativo
                          ? `${f.bg} ${f.border} shadow-lg`
                          : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                      <div className={`p-2 rounded-xl mb-2.5 inline-block
                        ${ativo ? "bg-black/20" : "bg-white/5"}`}>
                        <f.icon size={16} className={ativo ? f.cor : "text-white/20"} />
                      </div>
                      <h5 className={`text-xs font-black uppercase italic leading-tight
                        ${ativo ? f.cor : "text-white/50"}`}>
                        {f.label}
                      </h5>
                      <p className={`text-[8px] mt-1 leading-tight
                        ${ativo ? "text-white/40" : "text-white/15"}`}>
                        {f.descricao}
                      </p>
                      {ativo && (
                        <div className="absolute top-2.5 right-2.5">
                          <div className={`w-4 h-4 rounded-full flex items-center
                            justify-center ${f.bg} border ${f.border}`}>
                            <span className={`text-[8px] font-black ${f.cor}`}>✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={obsAluno}
                onChange={e => setObsAluno(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3
                  text-sm text-white/50 outline-none focus:border-sky-500/30
                  transition-all placeholder:text-white/15 resize-none"
                placeholder="Observações para o personal (lesões, restrições, preferências)..."
              />

              <AnimatePresence>
                {focosSelecionados.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    onClick={handleSolicitarTreino}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black
                      uppercase text-xs shadow-lg hover:bg-sky-500 transition-all
                      flex items-center justify-center gap-3">
                    SOLICITAR TREINO ({focosSelecionados.length} foco
                    {focosSelecionados.length > 1 ? "s" : ""})
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════
            GESTÃO — PROFISSIONAL
            ════════════════════════════════════════════════════ */}
        {view === "gestao" && isGestao && (
          <motion.div key="gestao"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8">

            {/* Solicitações pendentes */}
            {solicitacoesPendentes.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <p className="text-[9px] font-black uppercase tracking-[0.4em]
                    text-purple-400 italic">
                    Solicitações Pendentes — {solicitacoesPendentes.length}
                  </p>
                </div>
                <div className="space-y-3">
                  {solicitacoesPendentes.map(sol => (
                    <SolicitacaoCard
                      key={sol.id}
                      solicitacao={sol}
                      gerandoIA={gerandoIA}
                      onGerarIA={() => {
                        setSolAtiva(sol);
                        setView("ia");
                      }}
                      onMontarManual={() => {
                        setTreinoAtivo({
                          ...novoTreino(sol.foco),
                          titulo: `TREINO · ${sol.foco.toUpperCase()}`,
                          paraTodos: false,
                          paraAluno: sol.alunoId,
                          solicitacaoId: sol.id,
                        });
                        setView("editor");
                      }}
                      onDescartar={() => removerSolicitacao(sol.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Ações rápidas */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => abrirEditor()}
                className="flex items-center gap-4 p-5 bg-[#0a0e18] border border-white/5
                  rounded-[22px] hover:border-sky-500/30 transition-all group text-left">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20
                  flex items-center justify-center shrink-0 group-hover:bg-sky-500/20
                  transition-all">
                  <Plus size={20} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-black italic uppercase text-white">
                    Novo Treino
                  </p>
                  <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mt-0.5">
                    Criar do zero
                  </p>
                </div>
              </button>

              <button
                onClick={() => { setSolAtiva(null); setView("ia"); }}
                className="flex items-center gap-4 p-5 bg-[#0a0e18] border border-purple-500/20
                  rounded-[22px] hover:border-purple-500/40 transition-all group text-left">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20
                  flex items-center justify-center shrink-0 group-hover:bg-purple-500/20
                  transition-all">
                  <BrainCircuit size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-black italic uppercase text-white">
                    Assistente IA
                  </p>
                  <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mt-0.5">
                    Gerar sugestão base
                  </p>
                </div>
              </button>

              <input
                ref={importInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleImportarDocumento}
              />

              <button
                onClick={() => importInputRef.current?.click()}
                disabled={importandoDoc}
                className="flex items-center gap-4 p-5 bg-[#0a0e18] border border-emerald-500/20
                  rounded-[22px] hover:border-emerald-500/40 transition-all group text-left
                  disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20
                  flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20
                  transition-all">
                  {importandoDoc ? (
                    <Loader2 size={20} className="animate-spin text-emerald-400" />
                  ) : (
                    <UploadCloud size={20} className="text-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black italic uppercase text-white">
                    Importar Documento
                  </p>
                  <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mt-0.5">
                    PDF ou imagem
                  </p>
                </div>
              </button>
            </section>

            {erroImportacao && (
              <div className="flex items-center gap-3 rounded-[18px] border border-rose-500/20 bg-rose-500/8 p-4">
                <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                <p className="text-xs italic text-rose-300/80">{erroImportacao}</p>
              </div>
            )}

            {/* Biblioteca */}
            <section className="space-y-5">
              <p className="text-[9px] font-black uppercase tracking-[0.4em]
                text-white/20 italic px-1">
                Biblioteca — {treinos.length} treino{treinos.length !== 1 ? "s" : ""}
              </p>

              {/* Filtros */}
              {treinos.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-4 top-1/2
                      -translate-y-1/2 text-white/20" />
                    <input
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-xl
                        pl-10 pr-4 py-3 text-sm text-white/60 outline-none
                        focus:border-sky-500/30 transition-all placeholder:text-white/15"
                      placeholder="Buscar treino..."
                    />
                  </div>
                  <div className="relative">
                    <Filter size={14} className="absolute left-4 top-1/2
                      -translate-y-1/2 text-white/20" />
                    <select
                      value={filtroFoco}
                      onChange={e => setFiltroFoco(e.target.value as FocoTreino | "todos")}
                      className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-8
                        py-3 text-sm font-black uppercase text-white/60 outline-none
                        focus:border-sky-500/30 transition-all appearance-none">
                      <option value="todos">Todos os focos</option>
                      {FOCOS_LIST.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {treinosFiltrados.length === 0 ? (
                <div className="py-20 text-center opacity-20">
                  <Database size={36} className="mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {treinos.length === 0
                      ? "Nenhum treino criado ainda"
                      : "Nenhum resultado para essa busca"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {treinosFiltrados.map(t => (
                    <WorkoutCard
                      key={t.id}
                      treino={t}
                      isGestao
                      onView={() => abrirVisualizador(t)}
                      onEdit={() => abrirEditor(t)}
                      onDelete={() => removerTreino(t.id)}
                      onDuplicate={() => duplicarTreino(t)}
                      onPublish={() => publicarTreino(t.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════
            HISTÓRICO
            ════════════════════════════════════════════════════ */}
        {view === "historico" && (
          <motion.div key="historico"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4">

            <p className="text-[9px] font-black uppercase tracking-[0.4em]
              text-white/20 italic px-1">
              Histórico de Treinos — {historico.length} sessão
              {historico.length !== 1 ? "ões" : ""}
            </p>

            {historico.length === 0 ? (
              <div className="py-24 text-center opacity-20">
                <History size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Nenhum treino concluído ainda
                </p>
                <p className="text-[9px] text-white/30 mt-2">
                  Complete seu primeiro treino para ver o histórico
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map(h => (
                  <div key={h.id}
                    className="bg-[#0a0e18] border border-white/5 rounded-[20px]
                      p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10
                      border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black italic uppercase text-white truncate">
                        {h.treinoTitulo}
                      </p>
                      <p className="text-[9px] text-white/25 font-bold uppercase
                        tracking-widest mt-0.5">
                        {h.exerciciosConcluidos.length} exercícios ·{" "}
                        {new Date(h.concluidoEm).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[8px] font-black uppercase px-2 py-1
                        bg-emerald-500/10 border border-emerald-500/20
                        text-emerald-400 rounded-full">
                        Concluído
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Overlay IA global */}
      <AnimatePresence>{gerandoIA && <OverlayIA />}</AnimatePresence>

    </div>
  );
}
