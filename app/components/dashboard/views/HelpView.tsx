"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  Compass,
  HelpCircle,
  Lightbulb,
  Mic,
  MicOff,
  MessageSquareText,
  Search,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  genericHelpTopic,
  getHelpMatches,
  helpTopics,
  type HelpTopic,
  type SocialRoute,
} from "./helpKnowledge";

interface HelpViewProps {
  onBack: () => void;
  onNavigate: (view: string, options?: { socialRoute?: SocialRoute }) => void;
}

const examples = [
  "Como mando mensagem no direct?",
  "Como peço cardápio na comunidade?",
  "Onde baixo o PDF do treino?",
  "Como apago meu comentário?",
  "Não acho uma aba no celular",
  "Como faço a avaliação RFM?",
];

export function HelpView({ onBack, onNavigate }: HelpViewProps) {
  const [question, setQuestion] = useState("");
  const [activeTopic, setActiveTopic] = useState<HelpTopic>(helpTopics[0] ?? genericHelpTopic);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  const matches = useMemo(() => getHelpMatches(question), [question]);
  const suggestedTopics = useMemo(
    () => (question.trim() ? matches.slice(0, 8).map(match => match.topic) : helpTopics.slice(0, 12)),
    [matches, question],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveTopic(matches[0]?.topic ?? genericHelpTopic);
    }, 160);

    return () => window.clearTimeout(timer);
  }, [matches]);

  const ask = (value = question) => {
    const topic = getHelpMatches(value)[0]?.topic ?? genericHelpTopic;
    setActiveTopic(topic);
    if (!value.trim()) setQuestion(topic.title);
  };

  const openTarget = (topic = activeTopic) => {
    onNavigate(topic.targetView, { socialRoute: topic.socialRoute });
  };

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceMessage("Seu navegador não liberou leitura por voz.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${activeTopic.answer} Passo a passo: ${activeTopic.steps.join(". ")}`,
    );
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    setVoiceMessage("Lendo a orientação em voz alta.");
  };

  const startVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage("Seu navegador não permite ditado por voz aqui. Você ainda pode digitar a dúvida.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    setVoiceMessage("Estou ouvindo sua dúvida.");

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setQuestion(transcript);
      ask(transcript);
    };
    recognition.onerror = () => {
      setVoiceMessage("Não consegui captar o áudio. Tente novamente ou digite a dúvida.");
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <motion.div
      key="help-view"
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

      <section className="overflow-hidden rounded-[28px] border border-sky-500/15 bg-[#06101D] p-5 sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <HelpCircle size={12} />
              Ajuda guiada
            </div>
            <h1 className="mt-5 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              Diga o que precisa, <span className="text-sky-400">eu te levo até lá</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/48">
              Digite ou fale sua dúvida. A Ajuda identifica a área do app, mostra o passo a passo e abre a tela certa quando houver rota disponível.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
              Atalhos de dúvida
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {examples.map(example => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setQuestion(example);
                    ask(example);
                  }}
                  className="rounded-xl bg-white/5 px-3 py-2 text-[10px] font-bold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
              O que você quer fazer ou resolver?
            </label>
            <div className="mt-3 flex min-h-[54px] items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 transition-all focus-within:border-sky-500/45">
              <Search size={17} className="shrink-0 text-sky-300/70" />
              <textarea
                value={question}
                onChange={event => setQuestion(event.target.value)}
                placeholder="Ex: não acho a aba mensagens no celular"
                className="min-h-[96px] w-full resize-none bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/18"
              />
            </div>
            <p className="mt-2 text-[10px] font-bold text-white/30">
              A resposta muda enquanto você digita. Se o caso for amplo, a Ajuda mostra o caminho mais provável e permite enviar uma sugestão.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => ask()}
                className="min-h-12 rounded-2xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition-all active:scale-[0.99]"
              >
                Responder
              </button>
              <button
                type="button"
                onClick={startVoice}
                className={`min-h-12 rounded-2xl border px-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                  listening
                    ? "border-rose-500/30 bg-rose-500/15 text-rose-300"
                    : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  {listening ? "Ouvindo" : "Falar"}
                </span>
              </button>
              <button
                type="button"
                onClick={speak}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/45 transition-all hover:text-white"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Volume2 size={14} />
                  Ouvir
                </span>
              </button>
            </div>
            {voiceMessage && (
              <p className="mt-3 text-[10px] font-bold text-sky-300/80">{voiceMessage}</p>
            )}
          </div>

          <div>
            <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-white/25">
              {question.trim() ? "Rotas encontradas" : "Mapa rápido do app"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedTopics.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setQuestion(topic.title);
                    setActiveTopic(topic);
                  }}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    activeTopic.id === topic.id
                      ? "border-sky-500/45 bg-sky-500/15"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-sky-300">
                    {topic.area}
                  </span>
                  <Lightbulb className="mt-3 text-sky-300" size={16} />
                  <p className="mt-2 text-sm font-black text-white">{topic.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{topic.hint}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="rounded-2xl border border-sky-500/15 bg-sky-500/8 p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-sky-300" />
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
                Resposta e rota
              </p>
            </div>
            <span className="mt-4 inline-flex rounded-full bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white/35">
              {activeTopic.area}
            </span>
            <h2 className="mt-3 text-2xl font-black italic text-white">{activeTopic.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/52">{activeTopic.answer}</p>
          </div>

          <div className="mt-4 grid gap-3">
            {activeTopic.steps.map((step, index) => (
              <div key={`${activeTopic.id}-${step}`} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-[10px] font-black text-black">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-white/54">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openTarget()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition-all active:scale-[0.99]"
            >
              <Compass size={14} />
              {activeTopic.targetLabel}
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("sugestoes")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/45 transition-all hover:text-white"
            >
              <MessageSquareText size={14} />
              Não resolveu?
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/28">
              Cobertura atual
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Painel, Social, mensagens, stories, Meu Perfil, Comunidades, treinos, nutrição, RFM, ranking, desafios, notificações, acesso, ajustes e sugestões.
            </p>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}
