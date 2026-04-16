// app/components/dashboard/comunidades/nutricao/components/AlunoNutricao.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed, ClipboardList, Clock,
  CheckCircle2, XCircle, Loader2, Plus,
  ChevronRight, RefreshCw, AlertTriangle,
  Ruler,
} from "lucide-react";
import type { DiaSemana } from "../types";
import { FOCOS_NUTRICAO } from "../constants";
import { CardapioViewer     } from "./CardapioViewer";
import { FormSolicitacao    } from "./FormSolicitacao";
import { FormDadosCorporais } from "./FormDadosCorporais";
import { EstimativaCorpo    } from "./EstimativaCorpo";
import type { useNutricao } from "../hooks/useNutricao";

interface Props {
  currentUser: any;
  communityId: string;
  hook:        ReturnType<typeof useNutricao>;
}

const STATUS_VISUAL = {
  pendente: {
    icon:   Clock,
    label:  "Aguardando profissional",
    desc:   "Sua solicitação foi recebida. O profissional irá montar seu cardápio em breve.",
    bg:     "bg-amber-500/8",
    border: "border-amber-500/15",
    cor:    "text-amber-400",
  },
  em_andamento: {
    icon:   Loader2,
    label:  "Em andamento",
    desc:   "O profissional está montando seu cardápio personalizado.",
    bg:     "bg-sky-500/8",
    border: "border-sky-500/15",
    cor:    "text-sky-400",
  },
  concluida: {
    icon:   CheckCircle2,
    label:  "Cardápio pronto",
    desc:   "Seu cardápio foi publicado. Acesse abaixo.",
    bg:     "bg-emerald-500/8",
    border: "border-emerald-500/15",
    cor:    "text-emerald-400",
  },
  rejeitada: {
    icon:   XCircle,
    label:  "Solicitação rejeitada",
    desc:   "O profissional não pôde atender esta solicitação.",
    bg:     "bg-rose-500/8",
    border: "border-rose-500/15",
    cor:    "text-rose-400",
  },
};

type Aba = "cardapio" | "solicitar" | "medidas";

export function AlunoNutricao({ currentUser, communityId, hook }: Props) {
  const {
    meuCardapio,
    minhaSolicitacao,
    ultimaMedida,
    loadingSync,
    erro,
    sincronizar,
    enviarSolicitacao,
    toggleRefeicaoConcluida,
    salvarMedida,
  } = hook;

  // ── Estado inicial: "medidas" para quem não tem cardápio/solicitação
  const [aba,           setAba]           = useState<Aba>("medidas");
  const [showForm,      setShowForm]      = useState(false);
  const [medidasAoVivo, setMedidasAoVivo] = useState<any>(null);
  const cardapioPdfUrl = `/api/communities/${communityId}/offline-pdf?type=cardapio&userId=${encodeURIComponent(currentUser?.id ?? "")}`;

  useEffect(() => { sincronizar(); }, [sincronizar]);

  useEffect(() => {
    if (meuCardapio) {
      setAba("cardapio");
      setShowForm(false);
    } else if (!minhaSolicitacao && aba !== "medidas") {
      setShowForm(true);
    }
  }, [meuCardapio, minhaSolicitacao]);

  const handleToggle = (dia: DiaSemana, refeicaoId: string) => {
    if (!meuCardapio) return;
    toggleRefeicaoConcluida(meuCardapio.id, dia, refeicaoId);
  };

  // ── Abas disponíveis conforme estado ─────────────────────────
  const abas = [
    meuCardapio
      ? { id: "cardapio"  as Aba, label: "Meu Cardápio",   icon: UtensilsCrossed }
      : null,
    meuCardapio || minhaSolicitacao
      ? { id: "solicitar" as Aba, label: "Solicitação",    icon: ClipboardList   }
      : null,
    { id: "medidas" as Aba, label: "Minhas Medidas", icon: Ruler },
  ].filter(Boolean) as { id: Aba; label: string; icon: any }[];

  // ── Loading / Erro ────────────────────────────────────────────
  if (loadingSync && !meuCardapio && !minhaSolicitacao) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={28} className="animate-spin text-sky-500/40" />
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
          Carregando nutrição...
        </p>
      </div>
    );
  }

  if (erro && !meuCardapio && !minhaSolicitacao) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertTriangle size={24} className="text-rose-500/50" />
        <p className="text-xs text-white/30 italic text-center max-w-xs">{erro}</p>
        <button
          onClick={sincronizar}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 rounded-xl
            text-[9px] font-black uppercase tracking-widest text-white/30
            hover:text-white/60 transition-all"
        >
          <RefreshCw size={11} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#050B14]
        border border-white/5 p-5 sm:p-6">
        <div className="absolute -top-8 -right-8 w-36 h-36
          bg-emerald-500/8 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest
              text-white/20 flex items-center gap-2">
              <UtensilsCrossed size={10} className="text-emerald-500" />
              Nutrição Personalizada
            </p>
            <h2 className="text-2xl font-black italic uppercase text-white
              tracking-tighter leading-none">
              Olá,{" "}
              <span className="text-emerald-400">
                {currentUser?.name?.split(" ")[0] ?? "Atleta"}
              </span>
            </h2>
            <p className="text-[10px] text-white/25 italic">
              {meuCardapio
                ? "Seu cardápio personalizado está disponível."
                : minhaSolicitacao
                  ? "Solicitação enviada. Aguardando seu cardápio."
                  : "Solicite seu cardápio personalizado abaixo."
              }
            </p>
          </div>

          {!minhaSolicitacao && !meuCardapio && (
            <button
              onClick={() => { setShowForm(true); setAba("solicitar"); }}
              className="shrink-0 flex w-full items-center justify-center gap-2 px-4 py-2.5 sm:w-auto
                bg-emerald-500 text-black rounded-xl text-[9px] font-black
                uppercase tracking-widest hover:bg-emerald-400
                active:scale-95 transition-all"
            >
              <Plus size={12} /> Solicitar
            </button>
          )}
        </div>
      </div>

      {/* ── Status da solicitação ────────────────────────────────── */}
      <AnimatePresence>
        {minhaSolicitacao && minhaSolicitacao.status !== "concluida" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
          >
            {(() => {
              const sv   = STATUS_VISUAL[minhaSolicitacao.status];
              const foco = FOCOS_NUTRICAO.find(f => f.id === minhaSolicitacao.foco);
              return (
                <div className={`rounded-[20px] border p-5 space-y-4
                  ${sv.bg} ${sv.border}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <sv.icon
                        size={18}
                        className={`${sv.cor} ${
                          minhaSolicitacao.status === "em_andamento"
                            ? "animate-spin" : ""
                        }`}
                      />
                      <div>
                        <p className={`text-sm font-black italic uppercase
                          tracking-tight ${sv.cor}`}>
                          {sv.label}
                        </p>
                        <p className="text-[9px] text-white/25 italic mt-0.5">
                          {sv.desc}
                        </p>
                      </div>
                    </div>
                    {foco && (
                      <div className={`shrink-0 flex items-center gap-1.5 px-2.5
                        py-1 rounded-xl border ${foco.bg} ${foco.border}`}>
                        <foco.icon size={10} className={foco.cor} />
                        <span className={`text-[7px] font-black uppercase
                          tracking-widest ${foco.cor}`}>
                          {foco.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      {
                        label: "Enviado em",
                        val:   new Date(minhaSolicitacao.criadoEm)
                          .toLocaleDateString("pt-BR"),
                      },
                      {
                        label: "Restrições",
                        val:   minhaSolicitacao.restricoes.length > 0
                          ? minhaSolicitacao.restricoes.join(", ")
                          : "Nenhuma",
                      },
                      {
                        label: "Medidas",
                        val:   minhaSolicitacao.medidas
                          ? `IMC ${minhaSolicitacao.medidas.imc?.toFixed(1) ?? "—"}`
                          : "Não informadas",
                      },
                    ].map(item => (
                      <div key={item.label}
                        className="bg-white/5 rounded-xl px-3 py-2.5">
                        <p className="text-[7px] font-black uppercase
                          tracking-widest text-white/20">
                          {item.label}
                        </p>
                        <p className="text-[10px] font-bold text-white/50
                          italic mt-0.5 line-clamp-1">
                          {item.val}
                        </p>
                      </div>
                    ))}
                  </div>

                  {minhaSolicitacao.status === "rejeitada"
                    && minhaSolicitacao.obs && (
                    <div className="flex items-start gap-2 bg-rose-500/5
                      border border-rose-500/10 rounded-xl p-3">
                      <AlertTriangle size={12}
                        className="text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-[9px] text-rose-400/70 italic">
                        {minhaSolicitacao.obs}
                      </p>
                    </div>
                  )}

                  {minhaSolicitacao.status === "rejeitada" && (
                    <button
                      onClick={() => { setShowForm(true); setAba("solicitar"); }}
                      className="flex items-center gap-2 text-[9px] font-black
                        uppercase tracking-widest text-white/30
                        hover:text-white/60 transition-colors"
                    >
                      <RefreshCw size={11} /> Enviar nova solicitação
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Abas — sempre visíveis (>= 1 item) ──────────────────── */}
      {abas.length >= 1 && (
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {abas.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                text-[9px] font-black uppercase tracking-widest transition-all
                ${aba === tab.id
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-white/25 hover:text-white/50"
                }`}
            >
              <tab.icon size={11} /> {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Conteúdo principal ──────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Cardápio */}
        {aba === "cardapio" && meuCardapio && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 8 }}
          >
            <CardapioViewer
              cardapio={meuCardapio}
              onToggleConcluida={handleToggle}
              pdfUrl={cardapioPdfUrl}
            />
          </motion.div>
        )}

        {/* Solicitação / Form */}
        {aba === "solicitar" && !meuCardapio && (
          <motion.div
            key="form-area"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 8 }}
          >
            {showForm ? (
              <div className="bg-[#050B14] border border-white/5
                rounded-[22px] p-5 sm:p-7">
                <FormSolicitacao
                  communityId={communityId}
                  alunoId={currentUser?.id ?? ""}
                  alunoNome={
                    currentUser?.name
                    ?? currentUser?.full_name
                    ?? "Aluno"
                  }
                  onEnviar={async input => {
                    await enviarSolicitacao({
                      ...input,
                      communityId,
                      alunoId:   currentUser?.id   ?? "",
                      alunoNome: currentUser?.name
                        ?? currentUser?.full_name ?? "Aluno",
                    });
                    setShowForm(false);
                  }}
                  onCancel={
                    minhaSolicitacao
                      ? () => setShowForm(false)
                      : undefined
                  }
                />
              </div>
            ) : !minhaSolicitacao ? (
              <div className="flex flex-col items-center justify-center
                py-16 gap-5 bg-[#050B14] border border-white/5
                rounded-[22px]">
                <div className="w-16 h-16 rounded-full bg-white/3
                  border border-white/5 flex items-center justify-center">
                  <UtensilsCrossed size={28} className="text-white/10" />
                </div>
                <div className="text-center space-y-1.5 max-w-xs">
                  <h3 className="text-lg font-black italic uppercase
                    text-white tracking-tighter">
                    Sem cardápio ainda
                  </h3>
                  <p className="text-[10px] text-white/25 italic leading-relaxed">
                    Solicite seu plano alimentar personalizado. Um profissional
                    irá montar com base no seu objetivo.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-6 py-3.5
                    bg-emerald-500 text-black rounded-2xl text-[10px]
                    font-black uppercase tracking-widest
                    hover:bg-emerald-400 active:scale-95 transition-all"
                >
                  <Plus size={13} /> Solicitar cardápio
                  <ChevronRight size={13} />
                </button>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* ── Minhas Medidas ───────────────────────────────────── */}
        {aba === "medidas" && (
          <motion.div
            key="medidas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 8 }}
            className="space-y-4"
          >
            <div className="bg-[#050B14] border border-white/5
              rounded-[22px] p-5 sm:p-7 space-y-6">

              <div className="space-y-0.5">
                <h3 className="text-lg font-black italic uppercase text-white
                  tracking-tighter">
                  Minhas <span className="text-emerald-500">Medidas</span>
                </h3>
                <p className="text-[10px] text-white/25">
                  Informe peso, altura e cintura para calcular a estimativa RFM e apoiar seu cardápio.
                </p>
              </div>

              <FormDadosCorporais
                alunoId={currentUser?.id ?? ""}
                inicial={ultimaMedida ?? undefined}
                onChange={setMedidasAoVivo}
                onSalvar={async (medidas) => {
                  await salvarMedida(medidas);
                  await sincronizar();
                }}
                labelSalvar="Salvar Minhas Medidas"
              />

              <AnimatePresence>
                {medidasAoVivo && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0, y: 8 }}
                  >
                    <EstimativaCorpo medidas={medidasAoVivo} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Última medida (rodapé) ───────────────────────────────── */}
      {ultimaMedida && aba !== "medidas" && (
        <div className="bg-white/3 border border-white/5 rounded-[18px] p-4
          flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[7px] font-black uppercase tracking-widest
              text-white/20">
              Última medida registrada
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { l: "Peso",    v: `${ultimaMedida.peso}kg` },
                { l: "IMC",     v: ultimaMedida.imc?.toFixed(1) ?? "—" },
                { l: "RFM", v: ultimaMedida.gorduraEst
                    ? `~${ultimaMedida.gorduraEst.toFixed(1)}%` : "—" },
              ].map(item => (
                <div key={item.l} className="flex items-center gap-1">
                  <span className="text-[7px] text-white/20 font-black
                    uppercase tracking-widest">
                    {item.l}:
                  </span>
                  <span className="text-[10px] font-black text-white/50 italic">
                    {item.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-[7px] text-white/15 font-bold">
              {new Date(ultimaMedida.data).toLocaleDateString("pt-BR")}
            </p>
            <button
              onClick={() => setAba("medidas")}
              className="text-[7px] font-black uppercase tracking-widest
                text-white/20 hover:text-emerald-400 transition-colors
                flex items-center gap-1"
            >
              Atualizar <ChevronRight size={9} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
