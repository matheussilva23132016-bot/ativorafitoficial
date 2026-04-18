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
  const [mobileTab, setMobileTab] = useState<"ask" | "answer" | "topics">("ask");
  const [showAllExamples, setShowAllExamples] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const matches = useMemo(() => getHelpMatches(question), [question]);
  const suggestedTopics = useMemo(
    () => (question.trim() ? matches.slice(0, 8).map(match => match.topic) : helpTopics.slice(0, 12)),
    [matches, question],
  );
  const examplesToShow = useMemo(
    () => (showAllExamples ? examples : examples.slice(0, 4)),
    [showAllExamples],
  );
  const topicsToShow = useMemo(
    () => (showAllTopics ? suggestedTopics : suggestedTopics.slice(0, 6)),
    [showAllTopics, suggestedTopics],
  );

  useEffect(() => {
    if (!question.trim()) return;
    setActiveTopic(matches[0]?.topic ?? genericHelpTopic);
  }, [matches, question]);

  const ask = (value = question) => {
    const topic = getHelpMatches(value)[0]?.topic ?? genericHelpTopic;
    setActiveTopic(topic);
    setQuestion(value.trim() ? value : topic.title);
    setMobileTab("answer");
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
    setMobileTab("answer");
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

      <section className="overflow-hidden rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <HelpCircle size={12} />
              Ajuda guiada
            </div>
            <h1 className="mt-4 text-3xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              Ajuda rápida, clara e sem ruído
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Digite ou fale sua dúvida. A resposta identifica a area correta, entrega o passo a
              passo e abre a tela certa.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Tópicos</p>
              <p className="mt-1 text-lg font-black italic text-white">{helpTopics.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Entrada</p>
              <p className="mt-1 text-sm font-black text-white">Texto e voz</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Saida</p>
              <p className="mt-1 text-sm font-black text-white">Rota direta</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("ask")}
          className={`min-h-11 rounded-xl border px-3 text-[9px] font-black uppercase tracking-widest transition ${
            mobileTab === "ask"
              ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          Perguntar
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("answer")}
          className={`min-h-11 rounded-xl border px-3 text-[9px] font-black uppercase tracking-widest transition ${
            mobileTab === "answer"
              ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          Resposta
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("topics")}
          className={`min-h-11 rounded-xl border px-3 text-[9px] font-black uppercase tracking-widest transition ${
            mobileTab === "topics"
              ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/5 text-white/45"
          }`}
        >
          Tópicos
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <article
          className={`${mobileTab === "ask" ? "block" : "hidden"} rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5 lg:block`}
        >
          <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
            O que voc? quer fazer ou resolver?
          </label>
          <div className="mt-3 flex min-h-[54px] items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 transition-all focus-within:border-sky-500/45">
            <Search size={17} className="mt-4 shrink-0 text-sky-300/70" />
            <textarea
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ex: não acho a aba mensagens no celular"
              className="min-h-[96px] w-full resize-none bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/18"
            />
          </div>
          <p className="mt-2 text-[10px] font-bold text-white/30">
            A ajuda prioriza o caminho mais provavel e reduz etapas.
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

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/28">
                Atalhos de dúvida
              </p>
              <button
                type="button"
                onClick={() => setShowAllExamples(prev => !prev)}
                className="text-[9px] font-black uppercase tracking-widest text-sky-300"
              >
                {showAllExamples ? "Ver menos" : "Ver mais"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {examplesToShow.map(example => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setQuestion(example);
                    ask(example);
                  }}
                  className="rounded-xl bg-black/20 px-3 py-2 text-[10px] font-bold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </article>

        <aside
          className={`${mobileTab === "answer" ? "block" : "hidden"} rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5 lg:block`}
        >
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
              <div
                key={`${activeTopic.id}-${step}`}
                className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
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
              Painel, Social, mensagens, stories, Meu Perfil, Comunidades, treinos, nutrição, RFM,
              ranking, desafios, notificações, acesso, ajustes e sugestões.
            </p>
          </div>
        </aside>
      </section>

      <section className={`${mobileTab === "topics" ? "block" : "hidden"} lg:block`}>
        <article className="rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25">
              {question.trim() ? "Rotas encontradas" : "Mapa rápido do app"}
            </p>
            <button
              type="button"
              onClick={() => setShowAllTopics(prev => !prev)}
              className="text-[9px] font-black uppercase tracking-widest text-sky-300"
            >
              {showAllTopics ? "Ver menos" : "Ver mais"}
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topicsToShow.map(topic => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  setQuestion(topic.title);
                  setActiveTopic(topic);
                  setMobileTab("answer");
                }}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  activeTopic.id === topic.id
                    ? "border-sky-500/45 bg-sky-500/15"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.08]"
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
        </article>
      </section>
    </motion.div>
  );
}
