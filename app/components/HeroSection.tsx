"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  ChevronRight, ShieldCheck, Zap, 
  Globe, Cpu, LayoutDashboard,
  UserCircle2, Wifi, Battery, Signal, Sparkles
} from "lucide-react";

export const HeroSection = () => {
  const [status, setStatus] = useState("loading"); 
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState("");

  // Relógio de Alta Precisão
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulação de Scan Biométrico e Boot
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setStatus("portal"), 1000);
          return 100;
        }
        return prev + 1.2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // --- ANIMAÇÕES DE ELITE ---
  const portalVariants: Variants = {
    hidden: { opacity: 0, scale: 1.1, filter: "blur(40px)" },
    visible: { 
      opacity: 1, scale: 1, filter: "blur(0px)",
      transition: { staggerChildren: 0.12, delayChildren: 0.4, duration: 1.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 60, filter: "blur(20px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 70, damping: 24 } }
  };

  return (
    <div className="relative h-dvh w-full bg-[#010307] text-[#F8FAFC] overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-[#0EA5E9]/40">
      
      {/* TEXTURA DE HARDWARE (GRÃO CINEMATOGRÁFICO) */}
      <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

      <AnimatePresence mode="wait">
        {status === "loading" ? (
          /* --- LOADING: ESCANEAMENTO BIOMÉTRICO --- */
          <motion.div 
            key="loader" 
            exit={{ opacity: 0, scale: 0.8, filter: "blur(60px)" }}
            className="flex flex-col items-center z-50"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-16">
              {/* Anel de Scan */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" fill="transparent" stroke="white" strokeWidth="1" className="opacity-5" />
                <motion.circle 
                  cx="64" cy="64" r="60" fill="transparent" stroke="#0EA5E9" strokeWidth="2"
                  strokeDasharray="377" initial={{ strokeDashoffset: 377 }} animate={{ strokeDashoffset: 377 - (377 * progress) / 100 }}
                  className="drop-shadow-[0_0_8px_#0EA5E9]"
                />
              </svg>
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1, 0.95] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative w-16 h-16"
              >
                <Image src="/logo.png" alt="Ativora OS" fill className="object-contain grayscale brightness-200" />
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-[1em] text-[#0EA5E9] ml-[1em]">
                {progress < 50 ? "Autenticando" : "Sincronizando"}
              </span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} animate={{ scaleY: [1, 2, 1], opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-[2px] h-3 bg-[#0EA5E9]" />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- PORTAL ATIVORAFIT (APP CONSOLE) --- */
          <motion.div
            key="portal"
            variants={portalVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 w-full h-full flex flex-col items-center justify-between"
          >
            {/* 1. STATUS BAR (DENSIDADE DE PIXEL PREMIUM) */}
            <header className="w-full max-w-[1920px] px-8 md:px-14 py-6 flex justify-between items-center pointer-events-none sticky top-0">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-bold tracking-tight">{time}</span>
                <div className="w-1 h-1 bg-sky-500 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-4 opacity-60 scale-90 md:scale-100">
                <Signal className="w-4 h-4 stroke-[2.5]" />
                <Wifi className="w-4 h-4 stroke-[2.5]" />
                <div className="flex items-center gap-1 border border-white/20 rounded-sm px-1 py-0.5">
                   <span className="text-[8px] font-black italic leading-none">100%</span>
                   <Battery className="w-4 h-4 stroke-[2.5] fill-white/20" />
                </div>
              </div>
            </header>

            {/* 2. CONTEÚDO HERO (PERFEITAMENTE CENTRALIZADO) */}
            <main className="flex-1 flex flex-col items-center justify-center w-full px-6 relative">
              
              {/* Atmosfera e Grid Dinâmico */}
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,#0EA5E906_0%,transparent_65%)]" />
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(#38BDF8 1px, transparent 1px)`, backgroundSize: 'clamp(60px, 10vw, 120px) 100px' }} />
              </div>

              {/* Badge de Verificação */}
              <motion.div variants={fadeInUp} className="mb-10 flex items-center gap-3 px-6 py-2 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
                <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#0EA5E9]">Ecossistema Global Elite</span>
              </motion.div>

              {/* Logo Central (Aura de Performance) */}
              <motion.div 
                variants={fadeInUp}
                animate={{ y: [0, -12, 0], scale: [1, 1.03, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-36 h-36 md:w-56 md:h-56 mb-12"
              >
                <div className="absolute inset-0 bg-[#0EA5E9] blur-[100px] md:blur-[150px] opacity-25 rounded-full" />
                <Image src="/logo.png" alt="AtivoraFit" fill className="object-contain drop-shadow-[0_0_50px_rgba(14,165,233,0.45)] z-10" priority />
              </motion.div>

              {/* Título Massivo */}
              <motion.h1 
                variants={fadeInUp} 
                className="text-[clamp(3.5rem,18vw,12rem)] font-black tracking-[-0.08em] leading-[0.7] mb-8 uppercase"
              >
                ATIVORA<span className="text-[#0EA5E9]">FIT</span>
              </motion.h1>

              {/* Slogan */}
              <motion.div variants={fadeInUp} className="flex flex-col items-center gap-8 mb-16">
                <div className="relative">
                  <p className="text-[#F8FAFC] text-sm md:text-3xl font-black uppercase tracking-[0.5em] px-4">
                    A evolução na palma da sua mão
                  </p>
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 1.5, duration: 1.5 }}
                    className="absolute -bottom-5 left-0 h-[1px] bg-linear-to-r from-transparent via-sky-500/50 to-transparent" 
                  />
                </div>
              </motion.div>

              {/* Botões de Ação */}
              <motion.div variants={fadeInUp} className="w-full flex flex-col items-center gap-5 md:gap-7">
                <button className="group relative w-full max-w-[360px] md:max-w-md py-6 md:py-8 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black text-xl rounded-[2.5rem] transition-all shadow-[0_30px_70px_-10px_rgba(14,165,233,0.5)] flex items-center justify-center gap-3 overflow-hidden border-none cursor-pointer active:scale-95">
                  <span className="relative z-10 uppercase tracking-tighter">Explorar Plataforma</span>
                  <ChevronRight className="w-6 h-6 relative z-10 transition-transform group-hover:translate-x-2" />
                  <motion.div 
                    initial={{ x: "-100%" }} animate={{ x: "200%" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-32 bg-linear-to-r from-transparent via-white/30 to-transparent skew-x-[38deg]"
                  />
                </button>
                
                <button className="w-full max-w-[360px] md:max-w-md py-6 md:py-8 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold text-lg rounded-[2.5rem] transition-all backdrop-blur-3xl cursor-pointer active:scale-95 uppercase tracking-[0.2em] text-[11px]">
                  Já tenho uma conta
                </button>
              </motion.div>
            </main>

            {/* 3. TAB BAR NATIVA (ILUSTRATIVA) */}
            <footer className="w-full max-w-6xl flex justify-center gap-12 md:gap-28 border-t border-white/[0.05] py-10 md:py-14 px-12 opacity-40 pointer-events-none">
              {[
                { n: "Treino", i: Zap },
                { n: "Painel", i: LayoutDashboard },
                { n: "Evolução", i: Globe },
                { n: "Perfil", i: UserCircle2 }
              ].map((item) => (
                <div key={item.n} className="flex flex-col items-center gap-3">
                  <item.i className="w-5 h-5 text-[#475569]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#475569]">
                    {item.n}
                  </span>
                </div>
              ))}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marca d'água técnica */}
      <div className="absolute bottom-4 w-full flex justify-center pointer-events-none opacity-[0.04]">
         <span className="text-[7px] font-black uppercase tracking-[2em]">Ativora OS 2026</span>
      </div>
    </div>
  );
};