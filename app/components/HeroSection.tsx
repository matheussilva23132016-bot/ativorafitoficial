"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  ChevronRight, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Zap, 
  Activity // Ícone que estava faltando no import
} from "lucide-react";

/**
 * ATIVORAFIT - Portal de Boas-Vindas Elite
 * Estética: Spatial Design, Minimalismo Tecnológico, App Nativo.
 */
export const HeroSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Iniciando Protocolos");

  // Sequência de Boot Profissional (PT-BR)
  useEffect(() => {
    const sequence = [
      { t: "Iniciando Protocolos", d: 800 },
      { t: "Sincronizando Biometria", d: 1000 },
      { t: "Carregando Módulos de Performance", d: 1200 },
      { t: "Ativora System Online", d: 500 },
    ];

    let current = 0;
    const runSequence = () => {
      if (current < sequence.length) {
        setLoadingText(sequence[current].t);
        setTimeout(() => {
          current++;
          runSequence();
        }, sequence[current].d);
      } else {
        setIsLoading(false);
      }
    };

    runSequence();
  }, []);

  // --- CONFIGURAÇÃO DE ANIMAÇÕES (SISTEMA NATIVO) ---
  const portalVariants: Variants = {
    hidden: { opacity: 0, scale: 1.05, filter: "blur(20px)" },
    visible: { 
      opacity: 1, 
      scale: 1, 
      filter: "blur(0px)",
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.2, 
        duration: 1.2, 
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
      }
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 100, damping: 20 } 
    }
  };

  return (
    <div className="relative h-dvh w-full bg-[#020617] text-[#F8FAFC] overflow-hidden flex items-center justify-center font-sans selection:bg-[#0EA5E9]/40">
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          /* --- TELA DE BOOT (TECNOLÓGICA & MINIMALISTA) --- */
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(40px)" }}
            className="flex flex-col items-center z-50 px-6"
          >
            <motion.div
              animate={{ 
                opacity: [0.4, 1, 0.4], 
                scale: [0.95, 1, 0.95],
                filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
              className="relative w-24 h-24 mb-12"
            >
              <Image src="/logo.png" alt="AtivoraFit" fill className="object-contain" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 bg-[#0EA5E9] rounded-full"
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#0EA5E9] animate-pulse">
                {loadingText}
              </span>
            </div>
          </motion.div>
        ) : (
          /* --- PORTAL ATIVORAFIT (EXPERIÊNCIA DE ELITE) --- */
          <motion.div
            key="portal"
            variants={portalVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center"
          >
            {/* Atmosfera de Profundidade */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen bg-[radial-gradient(circle_at_center,#0EA5E906_0%,transparent_70%)]" />
              <div className="absolute inset-0 opacity-[0.03]" 
                   style={{ backgroundImage: `linear-gradient(#38BDF8 1px, transparent 1px), linear-gradient(90deg, #38BDF8 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
            </div>

            {/* Badge de Plataforma */}
            <motion.div variants={fadeInUp} className="mb-8 flex items-center gap-3 px-5 py-2 rounded-2xl border border-white/5 bg-white/2 backdrop-blur-3xl shadow-2xl">
              <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#0EA5E9]">Ecosystem Premium Global</span>
            </motion.div>

            {/* LOGO CENTRAL (PONTO FOCAL) */}
            <motion.div 
              variants={fadeInUp}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" as const }}
              className="relative w-32 h-32 md:w-44 md:h-44 mb-10"
            >
              <div className="absolute inset-0 bg-[#0EA5E9] blur-[80px] opacity-25 rounded-full" />
              <Image src="/logo.png" alt="AtivoraFit" fill className="object-contain drop-shadow-[0_0_40px_rgba(14,165,233,0.3)]" priority />
            </motion.div>

            {/* TEXTOS (ARQUITETURA DE MARCA) */}
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-[140px] font-black tracking-tighter leading-[0.8] mb-6">
              ATIVORA<span className="text-[#0EA5E9]">FIT</span>
            </motion.h1>

            <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 mb-16">
              <p className="text-[#94A3B8] text-sm md:text-2xl font-bold uppercase tracking-[0.4em]">
                A evolução na palma da sua mão
              </p>
              <div className="w-12 h-px bg-white/10" />
              <p className="text-[#64748B] text-xs md:text-sm max-w-lg leading-relaxed font-medium">
                Conectando usuários e profissionais em um ecossistema inteligente de alta performance e bem-estar.
              </p>
            </motion.div>

            {/* AÇÕES (NATIVE APP FEEL) */}
            <motion.div variants={fadeInUp} className="w-full flex flex-col items-center gap-5">
              <button className="group relative w-full max-w-md py-6 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black text-xl rounded-3xl transition-all shadow-[0_25px_60px_rgba(14,165,233,0.3)] flex items-center justify-center gap-3 overflow-hidden border-none cursor-pointer active:scale-95">
                <span className="relative z-10 uppercase tracking-tighter">Explorar Plataforma</span>
                <ChevronRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-2" />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </button>
              
              <button className="w-full max-w-md py-6 border border-white/5 bg-white/2 hover:bg-white/5 text-white font-bold text-lg rounded-3xl transition-all backdrop-blur-3xl cursor-pointer active:scale-95 uppercase tracking-widest text-[11px]">
                Já tenho conta
              </button>
            </motion.div>

            {/* NAVEGAÇÃO DE SISTEMA (TAB BAR) */}
            <motion.nav 
              variants={fadeInUp}
              className="mt-20 lg:mt-28 w-full flex justify-center gap-10 md:gap-24 border-t border-white/5 pt-12"
            >
              {[
                { n: "Treino", i: Zap },
                { n: "Nutrição", i: Cpu },
                { n: "Evolução", i: Activity },
                { n: "Mercado", i: Globe }
              ].map((item) => (
                <div key={item.n} className="flex flex-col items-center gap-3 group cursor-default">
                  <item.i className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0EA5E9] transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#94A3B8] group-hover:text-white transition-colors">
                    {item.n}
                  </span>
                </div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};