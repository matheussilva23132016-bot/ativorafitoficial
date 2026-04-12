// app/components/dashboard/comunidades/nutricao/NutricaoWrapper.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed, ChevronLeft,
  Sparkles, ShieldCheck, User,
} from "lucide-react";
import { CommunityNutricao } from "./CommunityNutricao";
import type { CommunityNutricaoProps } from "./types";

// ── Props estendidas ──────────────────────────────────────────────
interface WrapperProps extends CommunityNutricaoProps {
  onBack?: () => void;
}

// ── Componente ────────────────────────────────────────────────────
export function NutricaoWrapper({
  currentUser,
  userTags,
  onBack,
}: WrapperProps) {
  const [mounted,     setMounted]     = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Evita hydration mismatch
  useEffect(() => setMounted(true), []);

  // Header sticky com sombra ao rolar
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const isProfessional = userTags.some(t =>
    ["owner", "admin", "nutritionist", "trainer"].includes(t)
  );

  if (!mounted) return null;

  return (
    /*
     * Ocupa 100% da área disponível dentro da aba da comunidade.
     * Em mobile: flex-col, scroll vertical nativo.
     * Em desktop: altura limitada ao viewport disponível,
     *             scroll apenas no conteúdo interno.
     */
    <div className="flex flex-col w-full h-full min-h-0
      bg-[#010307] rounded-[24px] sm:rounded-[28px]
      overflow-hidden border border-white/5">

      {/* ── Header sticky ──────────────────────────────────────── */}
      <div className={`
        flex-none flex items-center justify-between gap-3
        px-4 sm:px-6 py-3.5 sm:py-4
        border-b transition-all duration-200
        ${scrolled
          ? "border-white/8 bg-[#010307]/95 backdrop-blur-xl"
          : "border-white/5 bg-transparent"
        }
      `}>
        {/* Esquerda — voltar + título */}
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="shrink-0 p-2 rounded-xl bg-white/5
                text-white/30 hover:text-white/70
                hover:bg-white/10 active:scale-90
                transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-xl
              bg-emerald-500/10 border border-emerald-500/20
              flex items-center justify-center">
              <UtensilsCrossed size={14} className="text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black italic
                uppercase text-white tracking-tighter leading-none
                truncate">
                Nutrição
              </h1>
              <p className="text-[8px] font-black uppercase tracking-widest
                text-white/20 leading-none mt-0.5 hidden sm:block">
                Plano alimentar personalizado
              </p>
            </div>
          </div>
        </div>

        {/* Direita — badge de role */}
        <div className="shrink-0 flex items-center gap-2">
          {isProfessional ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5
              bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <ShieldCheck size={11} className="text-sky-400" />
              <span className="text-[8px] font-black uppercase
                tracking-widest text-sky-400 hidden sm:block">
                Profissional
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5
              bg-white/5 border border-white/8 rounded-xl">
              <User size={11} className="text-white/30" />
              <span className="text-[8px] font-black uppercase
                tracking-widest text-white/30 hidden sm:block">
                Aluno
              </span>
            </div>
          )}

          {/* Badge IA */}
          <div className="flex items-center gap-1.5 px-3 py-1.5
            bg-violet-500/8 border border-violet-500/15 rounded-xl">
            <Sparkles size={11} className="text-violet-400" />
            <span className="text-[8px] font-black uppercase
              tracking-widest text-violet-400/70 hidden sm:block">
              IA Ativa
            </span>
          </div>
        </div>
      </div>

      {/* ── Área de scroll ─────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden
          overscroll-contain
          px-3 sm:px-5 lg:px-6
          py-4 sm:py-5
          scrollbar-thin scrollbar-track-transparent
          scrollbar-thumb-white/5 hover:scrollbar-thumb-white/10"
      >
        {/* Conteúdo centralizado em telas grandes */}
        <div className="w-full max-w-3xl mx-auto pb-6 sm:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={isProfessional ? "prof" : "aluno"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{    opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
            >
              <CommunityNutricao
                currentUser={currentUser}
                userTags={userTags}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
