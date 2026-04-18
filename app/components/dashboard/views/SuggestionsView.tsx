"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bug,
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
  MessageSquarePlus,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface SuggestionsViewProps {
  onBack: () => void;
  currentUser: any;
}

interface BetaSuggestion {
  id: string;
  categoria: string;
  impacto: string;
  contexto: string;
  mensagem: string;
  dispositivo: string;
  createdAt: string;
  status: "enviada" | "local";
}

const STORAGE_KEY = "@ativora_beta_sugestoes";

const categories = [
  { id: "melhoria", label: "Melhoria", icon: Lightbulb },
  { id: "bug", label: "Problema", icon: Bug },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "ideia", label: "Nova ideia", icon: Sparkles },
];

const impacts = ["Baixo", "Médio", "Alto", "Urgente"];

const quickIdeas = [
  "A tela ficou difícil de usar no celular.",
  "Um botão importante poderia aparecer mais rápido.",
  "O texto da tela não explicou bem o próximo passo.",
  "Faltou confirmação antes de uma ação importante.",
  "Quero um atalho para uma função que uso todos os dias.",
];

const getDeviceLabel = () => {
  if (typeof window === "undefined") return "Desktop";
  const width = window.innerWidth;
  if (width < 640) return "Smartphone";
  if (width < 1024) return "Tablet";
  return "Desktop";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

export function SuggestionsView({ onBack, currentUser }: SuggestionsViewProps) {
  const [categoria, setCategoria] = useState("melhoria");
  const [impacto, setImpacto] = useState("Médio");
  const [contexto, setContexto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sent, setSent] = useState<BetaSuggestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [mobileTab, setMobileTab] = useState<"nova" | "histórico">("nova");
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState("Desktop");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSent(JSON.parse(stored));
    } catch {
      setSent([]);
    }
  }, []);

  useEffect(() => {
    const updateDevice = () => setDeviceLabel(getDeviceLabel());
    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  const selectedCategory = useMemo(
    () => categories.find(item => item.id === categoria) ?? categories[0],
    [categoria],
  );

  const canSend = mensagem.trim().length >= 12;

  const saveLocal = (items: BetaSuggestion[]) => {
    setSent(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
  };

  const submit = async () => {
    if (!canSend || saving) return;
    setSaving(true);
    setFeedback("");

    const item: BetaSuggestion = {
      id: crypto.randomUUID(),
      categoria,
      impacto,
      contexto: contexto.trim(),
      mensagem: mensagem.trim(),
      dispositivo: deviceLabel,
      createdAt: new Date().toISOString(),
      status: "local",
    };

    const optimisticItems = [item, ...sent];
    saveLocal(optimisticItems);

    try {
      const res = await fetch("/api/beta/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          userId: currentUser?.id,
          nickname: currentUser?.nickname,
        }),
      });
      const json = await res.json().catch(() => null);
      const updatedItem = {
        ...item,
        status: json?.stored ? "enviada" : "local",
      } as BetaSuggestion;
      saveLocal([updatedItem, ...optimisticItems.slice(1)]);
      setFeedback(
        json?.stored
          ? "Sugestão enviada para o beta."
          : "Sugestão salva localmente. O banco ainda não confirmou o registro.",
      );
    } catch {
      setFeedback("Sugestão salva localmente. Quando a API estiver disponível, ela poderá ser sincronizada.");
    } finally {
      setMensagem("");
      setContexto("");
      setSaving(false);
      setMobileTab("histórico");
    }
  };

  const ideasToShow = showAllIdeas ? quickIdeas : quickIdeas.slice(0, 3);
  const hasSuggestions = sent.length > 0;

  return (
    <motion.div
      key="suggestions-view"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl space-y-4 text-left sm:space-y-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-xl px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </button>

      <section className="rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <MessageSquarePlus size={12} />
              Feedback beta
            </div>
            <h1 className="mt-4 text-3xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              sugestões sem ruído
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Registre melhorias, bugs e ideias em um fluxo curto. No mobile, você alterna entre enviar e histórico.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Histórico</p>
              <p className="mt-1 text-xl font-black italic text-white">{sent.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Canal</p>
              <p className="mt-1 text-sm font-black text-white">Beta</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Dispositivo</p>
              <p className="mt-1 text-sm font-black text-white">{deviceLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("nova")}
          className={`min-h-11 rounded-xl border px-4 text-[9px] font-black uppercase tracking-widest transition ${
            mobileTab === "nova"
              ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          Nova sugestão
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("histórico")}
          className={`min-h-11 rounded-xl border px-4 text-[9px] font-black uppercase tracking-widest transition ${
            mobileTab === "histórico"
              ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          Histórico
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className={`${mobileTab === "nova" ? "block" : "hidden"} rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5 lg:block`}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500 p-2.5 text-black">
              <selectedCategory.icon size={17} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Nova sugestão</p>
              <p className="text-sm font-black text-white">{selectedCategory.label}</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Categoria</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map(item => {
                  const Icon = item.icon;
                  const active = categoria === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategoria(item.id)}
                      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-[9px] font-black uppercase tracking-wide transition ${
                        active
                          ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                          : "border-white/10 bg-black/20 text-white/45"
                      }`}
                    >
                      <Icon size={13} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Impacto</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {impacts.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setImpacto(item)}
                    className={`min-h-10 rounded-lg px-2 text-[8px] font-black uppercase tracking-wide transition ${
                      impacto === item
                        ? "bg-sky-500 text-black"
                        : "border border-white/10 bg-white/5 text-white/35"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                Onde isso aparece?
              </label>
              <input
                value={contexto}
                onChange={event => setContexto(event.target.value)}
                placeholder="Ex: Comunidades > nutrição"
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                O que você melhoraria?
              </label>
              <textarea
                value={mensagem}
                onChange={event => setMensagem(event.target.value)}
                placeholder="Explique o problema e o resultado esperado."
                className="mt-2 min-h-[150px] w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold text-white/30">{mensagem.trim().length}/12 mínimo</p>
                <p className="text-[10px] font-bold text-white/30">{deviceLabel}</p>
              </div>
            </div>

            <button
              type="button"
              disabled={!canSend || saving}
              onClick={submit}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Send size={14} />
              {saving ? "Registrando" : "Enviar sugestão"}
            </button>

            {feedback && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={15} />
                <p className="text-xs leading-relaxed text-emerald-200/80">{feedback}</p>
              </div>
            )}
          </div>
        </article>

        <aside className={`${mobileTab === "histórico" ? "block" : "hidden"} space-y-4 lg:block`}>
          <article className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Ideias rápidas</p>
              <button
                type="button"
                onClick={() => setShowAllIdeas(prev => !prev)}
                className="text-[9px] font-black uppercase tracking-widest text-sky-300"
              >
                {showAllIdeas ? "Ver menos" : "Ver mais"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ideasToShow.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMensagem(prev => (prev ? `${prev}\n${item}` : item));
                    setMobileTab("nova");
                  }}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-[10px] font-bold leading-relaxed text-white/45 transition hover:bg-white/10 hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Últimas sugestões</p>
            <div className="mt-3 space-y-2">
              {hasSuggestions ? (
                sent.slice(0, 8).map(item => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-sky-300">
                        {item.categoria}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/25">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">{item.mensagem}</p>
                    <p className="mt-2 text-[9px] font-bold text-white/25">
                      {item.contexto || "Sem contexto"} - {item.impacto} - {formatDate(item.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-center">
                  <MessageSquarePlus className="mx-auto text-white/20" size={24} />
                  <p className="mt-2 text-sm font-black text-white">Nenhuma sugestão ainda.</p>
                  <p className="mt-1 text-xs text-white/35">Use o painel Nova sugestão para registrar o primeiro ajuste.</p>
                </div>
              )}
            </div>
          </article>
        </aside>
      </section>
    </motion.div>
  );
}
