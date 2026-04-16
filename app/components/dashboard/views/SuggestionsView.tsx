"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bug,
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
  MessageSquarePlus,
  MousePointerClick,
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
  "O texto de uma tela não explicou bem o próximo passo.",
  "Faltou confirmação antes de uma ação importante.",
  "Quero um atalho para uma função que uso todos os dias.",
];

function getDeviceLabel() {
  if (typeof window === "undefined") return "Desktop";
  const width = window.innerWidth;
  if (width < 640) return "Smartphone";
  if (width < 1024) return "Tablet";
  return "Desktop";
}

export function SuggestionsView({ onBack, currentUser }: SuggestionsViewProps) {
  const [categoria, setCategoria] = useState("melhoria");
  const [impacto, setImpacto] = useState("Médio");
  const [contexto, setContexto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sent, setSent] = useState<BetaSuggestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSent(JSON.parse(stored));
    } catch {
      setSent([]);
    }
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
      dispositivo: getDeviceLabel(),
      createdAt: new Date().toISOString(),
      status: "local",
    };

    saveLocal([item, ...sent]);

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
      const updatedItem = { ...item, status: json?.stored ? "enviada" : "local" } as BetaSuggestion;
      saveLocal([updatedItem, ...sent]);
      setFeedback(json?.stored ? "Sugestão enviada para o beta." : "Sugestão salva localmente. O banco ainda não confirmou o registro.");
    } catch {
      setFeedback("Sugestão salva localmente. Quando a API estiver disponível, ela poderá ser sincronizada.");
    } finally {
      setMensagem("");
      setContexto("");
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="suggestions-view"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-7xl space-y-5 text-left"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-xl px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </button>

      <section className="rounded-[28px] border border-sky-500/15 bg-[#06101D] p-5 sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <MessageSquarePlus size={12} />
              Beta com feedback real
            </div>
            <h1 className="mt-5 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              O que você mudaria no <span className="text-sky-400">Ativora?</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
              Registre problemas, ideias e ajustes de usabilidade com tela, impacto e dispositivo. Quanto mais direto o relato, mais fácil corrigir na próxima versão.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Enviadas", value: sent.length },
              { label: "Canal", value: "Beta" },
              { label: "Dispositivo", value: getDeviceLabel() },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/25">
                  {item.label}
                </p>
                <p className="mt-2 truncate text-lg font-black italic text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Tipo da sugestão
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {categories.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategoria(item.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      categoria === item.id
                        ? "border-sky-500/45 bg-sky-500/15"
                        : "border-white/10 bg-black/20 text-white/45 hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon className="text-sky-300" size={17} />
                    <p className="mt-3 text-xs font-black uppercase tracking-widest text-white">
                      {item.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Impacto percebido
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {impacts.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setImpacto(item)}
                  className={`min-h-11 rounded-xl px-2 text-[8px] font-black uppercase tracking-wide transition-all ${
                    impacto === item
                      ? "bg-sky-500 text-black"
                      : "bg-white/5 text-white/35 hover:bg-white/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Comece por aqui
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickIdeas.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMensagem(prev => prev ? `${prev}\n${item}` : item)}
                  className="rounded-xl bg-black/20 px-3 py-2 text-left text-[10px] font-bold leading-relaxed text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500 p-3 text-black">
              <selectedCategory.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
                Nova sugestão
              </p>
              <h2 className="text-2xl font-black italic text-white">{selectedCategory.label}</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                Onde isso aparece?
              </label>
              <input
                value={contexto}
                onChange={event => setContexto(event.target.value)}
                placeholder="Ex: Comunidades > Nutrição, Direct, Guia de exercícios..."
                className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition-all placeholder:text-white/18 focus:border-sky-500/45"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                O que você melhoraria?
              </label>
              <textarea
                value={mensagem}
                onChange={event => setMensagem(event.target.value)}
                placeholder="Explique o que aconteceu, o que você esperava e como isso afetou seu uso."
                className="mt-2 min-h-[190px] w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white outline-none transition-all placeholder:text-white/18 focus:border-sky-500/45"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold text-white/25">
                  Mínimo de 12 caracteres. Atual: {mensagem.trim().length}
                </p>
                <p className="text-[10px] font-bold text-white/25">
                  {getDeviceLabel()}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!canSend || saving}
              onClick={submit}
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-black transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {saving ? <MousePointerClick size={15} /> : <Send size={15} />}
              {saving ? "Registrando" : "Enviar sugestão"}
            </button>

            {feedback && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/8 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} />
                <p className="text-xs leading-relaxed text-emerald-200/80">{feedback}</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
          Suas últimas sugestões
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sent.length > 0 ? sent.slice(0, 6).map(item => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-sky-300">
                  {item.categoria}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest text-white/25">
                  {item.status === "enviada" ? "enviada" : "local"}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/45">{item.mensagem}</p>
              <p className="mt-3 text-[9px] font-bold text-white/25">
                {item.contexto || "Sem contexto"} • {item.impacto}
              </p>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center md:col-span-2 xl:col-span-3">
              <MessageSquarePlus className="mx-auto text-white/20" size={26} />
              <p className="mt-3 text-sm font-black text-white">Nenhuma sugestão registrada nesta sessão.</p>
              <p className="mt-1 text-xs text-white/35">Quando você enviar algo, o histórico aparece aqui para conferência.</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
