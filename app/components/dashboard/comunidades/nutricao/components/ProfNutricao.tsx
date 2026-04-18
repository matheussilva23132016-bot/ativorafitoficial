"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, UtensilsCrossed, Users,
  Sparkles, Plus, Loader2, RefreshCw,
  AlertTriangle, ChevronRight, Search,
  BookOpen, Archive, Ruler,
  UserSearch, ChevronDown, Lock, X,
  UploadCloud,
} from "lucide-react";
import type { SolicitacaoCardapio, Cardapio, MedidasCorporais } from "../types";
import { DIAS_SEMANA, FOCOS_NUTRICAO } from "../constants";
import { novoCardapio, uid, now } from "../utils";
import { SolicitacaoCard    } from "./SolicitacaoCard";
import { CardapioEditor     } from "./CardapioEditor";
import { CardapioViewer     } from "./CardapioViewer";
import { FormDadosCorporais } from "./FormDadosCorporais";
import { EstimativaCorpo    } from "./EstimativaCorpo";
import { FoodManualView     } from "./FoodManualView";
import type { useNutricao } from "../hooks/useNutricao";
import { RequestMiniChat } from "../../shared/RequestMiniChat";
import { useRequestMiniChat } from "../../shared/useRequestMiniChat";

interface Props {
  currentUser:    any;
  communityId:    string;
  hook:           ReturnType<typeof useNutricao>;
  userTags:       string[];
}

type Aba = "solicitacoes" | "cardapios" | "editor" | "avaliacoes" | "manual";

export function ProfNutricao({ currentUser, communityId, hook, userTags }: Props) {
  const {
    solicitacoes,
    cardapios,
    solicitacoesPendentes,
    cardapiosPublicados,
    membros,
    gerandoIA,
    loadingSync,
    erro,
    sincronizar,
    atualizarStatusSolicitacao,
    salvarCardapio,
    publicarCardapio,
    removerCardapio,
    gerarComIA,
    salvarMedida,
  } = hook;

  // true para DONO, ADMIN, PERSONAL, NUTRI — podem ver/editar/gerar IA
  const podeGerenciar = userTags.some(t =>
    [
      "owner",  "admin",        "nutritionist", "trainer",
      "dono",   "adm",          "nutri",        "instrutor",
      "personal", "nutricionista",
    ].includes(t)
  );
  const podeUsarManual = userTags.some(t =>
    [
      "owner", "admin", "nutritionist",
      "dono", "adm", "nutri", "nutricionista",
    ].includes(t)
  ) || ["nutricionista", "nutri", "nutritionist"].includes(String(currentUser?.role ?? "").toLowerCase());


  const [aba,               setAba]               = useState<Aba>("solicitacoes");
  const [cardapioEdit,      setCardapioEdit]       = useState<Cardapio | null>(null);
  const [cardapioView,      setCardapioView]       = useState<Cardapio | null>(null);
  const [busca,             setBusca]              = useState("");
  const [filtroStatus,      setFiltroStatus]       = useState<string>("todos");
  const [solAtiva,          setSolAtiva]           = useState<SolicitacaoCardapio | null>(null);
  const [membroSelecionado, setMembroSelecionado]  = useState<{ id: string; nome: string } | null>(null);
  const [buscaMembro,       setBuscaMembro]        = useState("");
  const [medidasAoVivo,     setMedidasAoVivo]      = useState<MedidasCorporais | null>(null);
  const [dropdownAberto,    setDropdownAberto]     = useState(false);
  const [importandoDoc,     setImportandoDoc]       = useState(false);
  const [erroImportacao,    setErroImportacao]      = useState<string | null>(null);
  const importInputRef                              = useRef<HTMLInputElement | null>(null);
  const {
    activeRequestId: activeNutriChatId,
    chatEnabled: nutriChatEnabled,
    chatStatus: nutriChatStatus,
    chatLoading: nutriChatLoading,
    chatSending: nutriChatSending,
    chatError: nutriChatError,
    chatMessages: nutriChatMessages,
    openChat: openNutriChat,
    closeChat: closeNutriChat,
    refreshChat: refreshNutriChat,
    sendChatMessage: sendNutriChatMessage,
  } = useRequestMiniChat({
    communityId,
    requestScopePath: "nutrition/solicitacoes",
    userId: currentUser?.id ?? "",
    userName: currentUser?.name ?? currentUser?.full_name ?? currentUser?.nickname ?? "Equipe",
  });

  useEffect(() => { sincronizar(); }, [sincronizar]);

  useEffect(() => {
    if (aba !== "solicitacoes" && activeNutriChatId) {
      closeNutriChat();
    }
  }, [aba, activeNutriChatId, closeNutriChat]);

  const handleGerarIA = async (sol: SolicitacaoCardapio) => {
    if (!podeGerenciar) return;
    setSolAtiva(sol);
    const cardapio = await gerarComIA({ solicitacao: sol, communityId });
    setCardapioEdit(cardapio);
    setAba("editor");
  };

  const handleCriarManual = (sol: SolicitacaoCardapio) => {
    if (!podeGerenciar) return;
    const c = novoCardapio(communityId, sol.alunoId, sol.alunoNome);
    c.foco          = sol.foco;
    c.solicitacaoId = sol.id;
    setCardapioEdit(c);
    setSolAtiva(sol);
    setAba("editor");
  };

  const handleNovoLivre = () => {
    if (!podeGerenciar) return;
    const c = novoCardapio(communityId, "", "Aluno");
    setCardapioEdit(c);
    setSolAtiva(null);
    setAba("editor");
  };

  const normalizarTexto = (value: unknown) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const resolverFoco = (value: unknown) => {
    const texto = normalizarTexto(value);
    const match = FOCOS_NUTRICAO.find((foco) =>
      texto.includes(normalizarTexto(foco.id)) || texto.includes(normalizarTexto(foco.label))
    );
    return match?.id ?? "manutencao";
  };

  const resolverDia = (value: unknown) => {
    const original = String(value || "").trim();
    const texto = normalizarTexto(value);
    const match = DIAS_SEMANA.find((dia) => texto.includes(normalizarTexto(dia).slice(0, 3)));
    return match ?? (original || "Livre");
  };

  const montarCardapioImportado = (payload: any, warnings: string[] = []): Cardapio => {
    const alunoNome = String(payload?.alunoNome || "Aluno");
    const membro = membros.find((m) => normalizarTexto(m.nome) === normalizarTexto(alunoNome));
    const base = novoCardapio(communityId, membro?.id ?? "", membro?.nome ?? alunoNome);
    const diasImportados = (Array.isArray(payload?.dias) ? payload.dias : [])
      .map((dia: any) => ({
        dia: resolverDia(dia?.dia),
        refeicoes: (Array.isArray(dia?.refeicoes) ? dia.refeicoes : [])
          .map((ref: any) => ({
            id: uid(),
            nome: String(ref?.nome || "Refeicao"),
            horario: String(ref?.horario || "").slice(0, 5),
            alimentos: (Array.isArray(ref?.alimentos) ? ref.alimentos : [])
              .map((al: any) => ({
                id: uid(),
                nome: String(al?.nome || "").trim(),
                quantidade: String(al?.quantidade || ""),
                calorias: al?.calorias === null || al?.calorias === undefined || al?.calorias === "" ? undefined : Number(al.calorias),
                proteinas: al?.proteinas === null || al?.proteinas === undefined || al?.proteinas === "" ? undefined : Number(al.proteinas),
                carbos: al?.carbos === null || al?.carbos === undefined || al?.carbos === "" ? undefined : Number(al.carbos),
                gorduras: al?.gorduras === null || al?.gorduras === undefined || al?.gorduras === "" ? undefined : Number(al.gorduras),
              }))
              .filter((al: any) => al.nome),
            calorias: ref?.calorias === null || ref?.calorias === undefined ? undefined : Number(ref.calorias),
            obs: String(ref?.obs || ""),
            concluida: false,
          }))
          .filter((ref: any) => ref.alimentos.length > 0 || ref.obs),
      }))
      .filter((dia: any) => dia.refeicoes.length > 0);

    return {
      ...base,
      id: uid(),
      titulo: String(payload?.titulo || "Cardápio importado"),
      alunoNome: membro?.nome ?? alunoNome,
      alunoId: membro?.id ?? "",
      foco: resolverFoco(payload?.foco),
      semana: String(payload?.semana || ""),
      dias: diasImportados.length ? diasImportados : [],
      calorias_dia: payload?.calorias_dia === null || payload?.calorias_dia === undefined || payload?.calorias_dia === "" ? undefined : Number(payload.calorias_dia),
      proteinas_dia: payload?.proteinas_dia === null || payload?.proteinas_dia === undefined || payload?.proteinas_dia === "" ? undefined : Number(payload.proteinas_dia),
      obs: [payload?.obs, ...warnings].filter(Boolean).join("\n"),
      status: "draft",
      geradoPorIA: true,
      criadoEm: now(),
      atualizadoEm: now(),
    };
  };

  const handleImportarDocumento = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importandoDoc || !podeGerenciar) return;

    setImportandoDoc(true);
    setErroImportacao(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", "nutricao");
      form.append("userId", currentUser?.id ?? "");

      const response = await fetch(`/api/communities/${communityId}/document-import`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível ler o documento.");

      const cardapio = montarCardapioImportado(data.result?.nutricao, data.result?.warnings);
      setCardapioEdit(cardapio);
      setSolAtiva(null);
      setAba("editor");
    } catch (error: any) {
      setErroImportacao(error?.message || "Não foi possível importar o documento.");
    } finally {
      setImportandoDoc(false);
    }
  };

  const handleSave = async (c: Cardapio) => {
    if (!podeGerenciar) return;
    await salvarCardapio(c);
    setCardapioEdit(c);
  };

  const handlePublish = async (id: string, solicitacaoId?: string) => {
    if (!podeGerenciar) return;
    await publicarCardapio(id, solicitacaoId);
    setAba("cardapios");
    setCardapioEdit(null);
    setSolAtiva(null);
  };

  const cardapiosFiltrados = cardapios.filter(c => {
    const matchBusca =
      busca.trim() === "" ||
      c.alunoNome.toLowerCase().includes(busca.toLowerCase()) ||
      c.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const solicitacoesFiltradas = solicitacoes.filter(s => {
    const matchBusca =
      busca.trim() === "" ||
      s.alunoNome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const chatSolicitacaoAtiva =
    solicitacoes.find(solicitacao => solicitacao.id === activeNutriChatId) ?? null;

  const membrosFiltrados = membros.filter(m =>
    buscaMembro.trim() === "" ||
    m.nome.toLowerCase().includes(buscaMembro.toLowerCase())
  );

  const filtrosAtivos = busca.trim() !== "" || filtroStatus !== "todos";
  const itensVisiveis =
    aba === "solicitacoes"
      ? solicitacoesFiltradas.length
      : aba === "cardapios"
        ? cardapiosFiltrados.length
        : 0;

  if (loadingSync && solicitacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={28} className="animate-spin text-sky-500/40" />
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
          Carregando painel...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#050B14]
        border border-white/5 p-5 sm:p-6">
        <div className="absolute -top-8 -right-8 w-36 h-36
          bg-sky-500/8 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start
          justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest
              text-white/20 flex items-center gap-2">
              <UtensilsCrossed size={10} className="text-sky-500" />
              Painel Nutricional
            </p>
            <h2 className="text-2xl font-black italic uppercase text-white
              tracking-tighter leading-none">
              Gestão de{" "}
              <span className="text-sky-400">Cardápios</span>
            </h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                label: "Pendentes",
                val:   solicitacoesPendentes.length,
                cor:   solicitacoesPendentes.length > 0 ? "text-amber-400" : "text-white/20",
                bg:    solicitacoesPendentes.length > 0
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-white/3 border-white/5",
              },
              {
                label: "Publicados",
                val:   cardapiosPublicados.length,
                cor:   "text-emerald-400",
                bg:    "bg-emerald-500/8 border-emerald-500/15",
              },
              {
                label: "Total",
                val:   cardapios.length,
                cor:   "text-white/40",
                bg:    "bg-white/3 border-white/5",
              },
            ].map(s => (
              <div key={s.label}
                className={`flex flex-col items-center px-3 py-2
                  rounded-xl border ${s.bg}`}>
                <span className={`text-lg font-black italic ${s.cor}`}>
                  {s.val}
                </span>
                <span className="text-[7px] font-black uppercase
                  tracking-widest text-white/20">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Aviso de acesso restrito ──────────────────────────────── */}
      {!podeGerenciar && aba !== "avaliacoes" && (
        <div className="flex items-center gap-3 bg-amber-500/8
          border border-amber-500/15 rounded-[18px] p-4">
          <Lock size={13} className="text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-400/70 italic">
            Apenas <span className="font-black text-amber-400">
              Dono, Admin, Personal e Nutri
            </span> podem criar, editar ou gerar cardápios por IA.
          </p>
        </div>
      )}

      {podeUsarManual && aba !== "editor" && aba !== "manual" && (
        <button
          type="button"
          onClick={() => setAba("manual")}
          className="group w-full rounded-[20px] border border-emerald-500/18 bg-emerald-500/8 p-4 text-left transition-all hover:border-emerald-500/35 hover:bg-emerald-500/12"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-black">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-sm font-black italic uppercase tracking-tight text-white">
                  Manual de alimentos
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/35">
                  Consulte macros por porção, filtre por objetivo e use os alimentos no cardápio do aluno.
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="hidden text-emerald-300 transition-transform group-hover:translate-x-1 sm:block" />
          </div>
        </button>
      )}

      {/* ── Abas ─────────────────────────────────────────────────── */}
      {aba !== "editor" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(
              [
                {
                  id:    "solicitacoes" as Aba,
                  label: "Solicitações",
                  icon:  ClipboardList,
                  badge: solicitacoesPendentes.length as number,
                },
                {
                  id:    "cardapios" as Aba,
                  label: "Cardápios",
                  icon:  BookOpen,
                  badge: 0 as number,
                },
                {
                  id:    "avaliacoes" as Aba,
                  label: "Avaliações",
                  icon:  Ruler,
                  badge: 0 as number,
                },
                {
                  id:    "manual" as Aba,
                  label: "Manual",
                  icon:  BookOpen,
                  badge: 0 as number,
                },
              ] satisfies { id: Aba; label: string; icon: any; badge: number }[]
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setAba(tab.id);
                  setBusca("");
                  setFiltroStatus("todos");
                }}
                className={`relative flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4
                  rounded-xl text-[9px] font-black uppercase tracking-widest
                  transition-all
                  ${aba === tab.id
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/25 hover:text-white/50"
                  }`}
              >
                <tab.icon size={11} /> {tab.label}
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4
                    bg-amber-500 text-black rounded-full text-[7px]
                    font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Botão novo cardápio — só para quem pode gerenciar */}
          {aba !== "avaliacoes" && aba !== "manual" && podeGerenciar && (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
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
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10
                  border border-emerald-500/20 rounded-xl text-[9px] font-black
                  uppercase tracking-widest text-emerald-400
                  hover:bg-emerald-500/20 transition-all disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                {importandoDoc ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <UploadCloud size={11} />
                )}
                Importar PDF/Imagem
              </button>
              <button
                onClick={handleNovoLivre}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500/10
                  border border-sky-500/20 rounded-xl text-[9px] font-black
                  uppercase tracking-widest text-sky-400
                  hover:bg-sky-500/20 transition-all"
              >
                <Plus size={11} /> Novo cardápio
              </button>
            </div>
          )}
        </div>
      )}

      {aba !== "editor" && aba !== "avaliacoes" && aba !== "manual" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
            {itensVisiveis} registro(s) visível(is)
          </p>
          <div className="flex items-center gap-3">
            {filtrosAtivos && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setFiltroStatus("todos");
                }}
                className="text-[9px] font-black uppercase tracking-widest text-sky-300 transition hover:text-sky-200"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={sincronizar}
              className="text-[9px] font-black uppercase tracking-widest text-white/45 transition hover:text-white"
            >
              Atualizar
            </button>
          </div>
        </div>
      )}
      {/* ── Barra de busca ───────────────────────────────────────── */}
      {erroImportacao && aba !== "editor" && (
        <div className="flex items-center gap-3 bg-rose-500/8
          border border-rose-500/15 rounded-[18px] p-4">
          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400/70 italic flex-1">{erroImportacao}</p>
          <button
            onClick={() => setErroImportacao(null)}
            className="p-1.5 text-white/20 hover:text-white/50 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {aba !== "editor" && aba !== "avaliacoes" && aba !== "manual" && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2
              -translate-y-1/2 text-white/20 pointer-events-none" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por aluno ou título..."
              className="w-full bg-white/5 border border-white/5 rounded-xl
                pl-8 pr-4 py-2.5 text-xs text-white/60 outline-none
                focus:border-white/15 placeholder:text-white/15 transition-all"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5
              text-[10px] text-white/40 outline-none focus:border-white/15
              transition-all sm:w-auto"
          >
            <option value="todos">Todos</option>
            {aba === "solicitacoes" ? (
              <>
                <option value="pendente">Pendentes</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluídas</option>
                <option value="rejeitada">Rejeitadas</option>
              </>
            ) : (
              <>
                <option value="draft">Rascunho</option>
                <option value="published">Publicados</option>
                <option value="archived">Arquivados</option>
              </>
            )}
          </select>
          <button
            type="button"
            onClick={sincronizar}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/45 transition hover:text-white"
          >
            <RefreshCw size={11} />
            Atualizar
          </button>
        </div>
      )}

      {/* ── Erro ─────────────────────────────────────────────────── */}
      {erro && (
        <div className="flex items-center gap-3 bg-rose-500/8
          border border-rose-500/15 rounded-[18px] p-4">
          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400/70 italic flex-1">{erro}</p>
          <button
            onClick={sincronizar}
            className="p-1.5 text-white/20 hover:text-white/50 transition-all"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">

        {aba === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="min-w-0"
          >
            <FoodManualView
              allowAccess={podeUsarManual}
              embedded
              onBack={() => setAba("solicitacoes")}
              title="Manual de alimentos da comunidade"
            />
          </motion.div>
        )}

        {/* ── Aba: Solicitações ─────────────────────────────────── */}
        {aba === "solicitacoes" && (
          <motion.div
            key="solicitacoes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            className="space-y-3"
          >
            {solicitacoesFiltradas.length > 0 ? (
              solicitacoesFiltradas.map(sol => (
                <SolicitacaoCard
                  key={sol.id}
                  solicitacao={sol}
                  gerandoIA={gerandoIA && solAtiva?.id === sol.id}
                  onGerarIA={handleGerarIA}
                  onCriarManual={handleCriarManual}
                  onRejeitar={(id, obs) =>
                    atualizarStatusSolicitacao(id, "rejeitada", obs)
                  }
                  onAbrirChat={
                    podeGerenciar
                      ? (solicitacao) => {
                          if (solicitacao.status !== "concluida") return;
                          void openNutriChat(solicitacao.id);
                        }
                      : undefined
                  }
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center
                py-16 gap-4 bg-[#050B14] border border-white/5 rounded-[20px]">
                <ClipboardList size={28} className="text-white/8" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-black italic uppercase
                    text-white/20 tracking-tighter">
                    {busca || filtroStatus !== "todos"
                      ? "Nenhum resultado"
                      : "Nenhuma solicitação"}
                  </p>
                  <p className="text-[9px] text-white/15 italic">
                    {busca || filtroStatus !== "todos"
                      ? "Tente ajustar os filtros"
                      : "Quando alunos solicitarem cardápios, aparecerão aqui"}
                  </p>
                </div>
              </div>
            )}

            {activeNutriChatId && chatSolicitacaoAtiva && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeNutriChat}
                    className="text-[9px] font-black uppercase tracking-widest text-white/40 transition hover:text-white"
                  >
                    Fechar chat
                  </button>
                </div>
                {nutriChatError ? (
                  <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {nutriChatError}
                  </p>
                ) : null}

                <RequestMiniChat
                  title={`Mini chat • ${chatSolicitacaoAtiva.alunoNome}`}
                  subtitle="Canal rapido para ajustes do cardapio publicado."
                  currentUserId={currentUser?.id ?? ""}
                  enabled={nutriChatEnabled}
                  loading={nutriChatLoading}
                  sending={nutriChatSending}
                  messages={nutriChatMessages}
                  disabledReason={
                    nutriChatStatus && nutriChatStatus !== "concluida"
                      ? "Este mini chat sera liberado apos a conclusao da solicitacao."
                      : null
                  }
                  placeholder="Escreva um ajuste para o aluno..."
                  onSend={sendNutriChatMessage}
                  onRefresh={refreshNutriChat}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── Aba: Cardápios ────────────────────────────────────── */}
        {aba === "cardapios" && !cardapioView && (
          <motion.div
            key="cardapios"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            className="space-y-3"
          >
            {cardapiosFiltrados.length > 0 ? (
              cardapiosFiltrados.map(c => {
                const foco = FOCOS_NUTRICAO.find(f => f.id === c.foco);
                return (
                  <div key={c.id}
                    className="bg-[#050B14] border border-white/5
                      rounded-[20px] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[7px] font-black uppercase
                            tracking-widest px-2 py-0.5 rounded-lg border
                            ${c.status === "published"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : c.status === "draft"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : "bg-white/5 border-white/10 text-white/30"
                            }`}>
                            {c.status === "published" ? "Publicado"
                              : c.status === "draft" ? "Rascunho" : "Arquivado"}
                          </span>
                          {foco && (
                            <div className={`flex items-center gap-1 px-2
                              py-0.5 rounded-lg border ${foco.bg} ${foco.border}`}>
                              <foco.icon size={8} className={foco.cor} />
                              <span className={`text-[7px] font-black uppercase
                                tracking-widest ${foco.cor}`}>
                                {foco.label}
                              </span>
                            </div>
                          )}
                          {c.geradoPorIA && (
                            <span className="flex items-center gap-1
                              text-[7px] font-black text-sky-400/50">
                              <Sparkles size={8} /> IA
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-black italic uppercase
                          text-white tracking-tight truncate">
                          {c.titulo}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1
                            text-[8px] text-white/25">
                            <Users size={9} /> {c.alunoNome}
                          </span>
                          <span className="text-[8px] text-white/20">
                            Sem. {c.semana.split("-W")[1]}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => setCardapioView(c)}
                          className="flex items-center gap-1.5 px-3 py-2
                            bg-white/5 rounded-xl text-[8px] font-black
                            uppercase tracking-widest text-white/30
                            hover:text-white/60 transition-all"
                        >
                          Ver <ChevronRight size={10} />
                        </button>
                        {/* Editar — só para quem pode gerenciar */}
                        {podeGerenciar && (
                          <button
                            onClick={() => { setCardapioEdit(c); setAba("editor"); }}
                            className="flex items-center gap-1.5 px-3 py-2
                              bg-sky-500/10 border border-sky-500/20 rounded-xl
                              text-[8px] font-black uppercase tracking-widest
                              text-sky-400 hover:bg-sky-500/20 transition-all"
                          >
                            Editar
                          </button>
                        )}
                        {/* Arquivar — só para quem pode gerenciar */}
                        {podeGerenciar && c.status !== "archived" && (
                          <button
                            onClick={() => removerCardapio(c.id)}
                            className="flex items-center gap-1.5 px-3 py-2
                              bg-white/3 rounded-xl text-[8px] font-black
                              uppercase tracking-widest text-white/15
                              hover:text-rose-400 transition-all"
                          >
                            <Archive size={9} /> Arquivar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center
                py-16 gap-4 bg-[#050B14] border border-white/5 rounded-[20px]">
                <BookOpen size={28} className="text-white/8" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-black italic uppercase
                    text-white/20 tracking-tighter">
                    {busca || filtroStatus !== "todos"
                      ? "Nenhum resultado"
                      : "Nenhum cardápio criado"}
                  </p>
                  <p className="text-[9px] text-white/15 italic">
                    {busca || filtroStatus !== "todos"
                      ? "Tente ajustar os filtros"
                      : "Crie um novo cardápio ou responda uma solicitação"}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Viewer ───────────────────────────────────────────── */}
        {aba === "cardapios" && cardapioView && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            className="space-y-4"
          >
            <button
              onClick={() => setCardapioView(null)}
              className="flex items-center gap-2 text-[9px] font-black
                uppercase tracking-widest text-white/25
                hover:text-white/60 transition-colors"
            >
              ← Voltar aos cardápios
            </button>
            <CardapioViewer
              cardapio={cardapioView}
              onToggleConcluida={() => {}}
                pdfUrl={`/api/communities/${communityId}/offline-pdf?type=cardapio&userId=${encodeURIComponent(cardapioView.alunoId || currentUser?.id || "")}`}
            />
          </motion.div>
        )}

        {/* ── Editor — só acessível para quem pode gerenciar ───── */}
        {aba === "editor" && cardapioEdit && podeGerenciar && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setAba(solAtiva ? "solicitacoes" : "cardapios");
                  setCardapioEdit(null);
                }}
                className="text-[9px] font-black uppercase tracking-widest
                  text-white/25 hover:text-white/60 transition-colors"
              >
                ← {solAtiva ? "Solicitações" : "Cardápios"}
              </button>
              <span className="text-white/10">/</span>
              <span className="text-[9px] font-black uppercase tracking-widest
                text-white/40">
                {cardapioEdit.id ? "Editando" : "Novo cardápio"}
              </span>
              {solAtiva && (
                <>
                  <span className="text-white/10">/</span>
                  <span className="text-[9px] font-black uppercase
                    tracking-widest text-sky-400/60">
                    {solAtiva.alunoNome}
                  </span>
                </>
              )}
            </div>
            <CardapioEditor
              cardapio={cardapioEdit}
              gerandoIA={gerandoIA}
              onSave={handleSave}
              onPublish={handlePublish}
              onGerarIA={solAtiva ? () => handleGerarIA(solAtiva) : undefined}
              manualDisponivel={podeUsarManual}
              onCancel={() => {
                setAba(solAtiva ? "solicitacoes" : "cardapios");
                setCardapioEdit(null);
              }}
            />
          </motion.div>
        )}

        {/* ── Aba: Avaliações — qualquer cargo pode preencher ───── */}
        {aba === "avaliacoes" && (
          <motion.div
            key="avaliacoes"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            className="space-y-4"
          >
            <div className="bg-[#050B14] border border-white/5
              rounded-[22px] p-5 sm:p-7 space-y-6">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black italic uppercase text-white
                  tracking-tighter">
                  Avaliação <span className="text-sky-500">Corporal</span>
                </h3>
                <p className="text-[10px] text-white/25">
                  Selecione o membro e registre as medidas corporais.
                </p>
              </div>

              {/* Dropdown de membros */}
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest
                  text-white/30 flex items-center gap-1.5">
                  <UserSearch size={10} className="text-sky-500" />
                  Membro avaliado
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownAberto(v => !v)}
                    className={`w-full flex items-center justify-between gap-3
                      px-4 py-3 rounded-xl border text-left transition-all
                      ${membroSelecionado
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                        : "bg-white/5 border-white/5 text-white/30"
                      }`}
                  >
                    <span className="text-xs font-bold truncate">
                      {membroSelecionado?.nome ?? "Selecionar membro..."}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`shrink-0 transition-transform
                        ${dropdownAberto ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownAberto && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0,  scale: 1    }}
                        exit={{    opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 top-full mt-1 w-full
                          bg-[#0A1628] border border-white/10 rounded-xl
                          overflow-hidden shadow-2xl"
                      >
                        <div className="p-2 border-b border-white/5">
                          <div className="relative">
                            <Search size={10} className="absolute left-2.5
                              top-1/2 -translate-y-1/2 text-white/20
                              pointer-events-none" />
                            <input
                              autoFocus
                              value={buscaMembro}
                              onChange={e => setBuscaMembro(e.target.value)}
                              placeholder="Buscar membro..."
                              className="w-full bg-white/5 rounded-lg pl-7 pr-3
                                py-2 text-xs text-white/60 outline-none
                                placeholder:text-white/15"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {membrosFiltrados.length > 0 ? (
                            membrosFiltrados.map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setMembroSelecionado({ id: m.id, nome: m.nome });
                                  setMedidasAoVivo(null);
                                  setDropdownAberto(false);
                                  setBuscaMembro("");
                                }}
                                className={`w-full flex items-center gap-3
                                  px-4 py-3 text-left transition-colors
                                  hover:bg-white/5
                                  ${membroSelecionado?.id === m.id
                                    ? "bg-sky-500/10 text-sky-300"
                                    : "text-white/50"
                                  }`}
                              >
                                <div className="w-6 h-6 rounded-full
                                  bg-white/10 flex items-center justify-center
                                  shrink-0 text-[8px] font-black text-white/40">
                                  {m.nome.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold truncate">
                                  {m.nome}
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="text-center text-[9px] text-white/20
                              italic py-6">
                              Nenhum membro encontrado
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {membroSelecionado && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0, y: 8 }}
                    className="space-y-6"
                  >
                    <div className="h-px bg-white/5" />
                    <FormDadosCorporais
                      alunoId={membroSelecionado.id}
                      onChange={setMedidasAoVivo}
                      onSalvar={async (medidas) => {
                        await salvarMedida(medidas);
                        await sincronizar();
                      }}
                      labelSalvar={`Salvar avaliação de ${membroSelecionado.nome}`}
                    />
                    <AnimatePresence>
                      {medidasAoVivo && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{    opacity: 0, y: 8 }}
                        >
                          <EstimativaCorpo
                            medidas={medidasAoVivo}
                            semDisclaimer={false}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {!membroSelecionado && (
                <div className="flex flex-col items-center justify-center
                  py-10 gap-3 border border-dashed border-white/5 rounded-2xl">
                  <UserSearch size={24} className="text-white/10" />
                  <p className="text-[9px] text-white/20 italic">
                    Selecione um membro para registrar a avaliação
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
