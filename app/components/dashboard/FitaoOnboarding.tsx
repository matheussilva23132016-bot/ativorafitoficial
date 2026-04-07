"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  ChevronRight, User, 
  Activity, ShoppingBag, ShieldCheck, Menu 
} from "lucide-react";

const falasFitao = [
  "E aí, recruta! Eu sou o Fitão, a IA tática da AtivoraFit. Vou te guiar pelo seu novo QG.",
  "Aqui na esquerda, você acessa seu Ativora Profile. É a sua identidade militar no ecossistema.",
  "Na aba Direct, você contrata e se conecta com a elite dos profissionais.",
  "No Workout History, sua evolução de peso e medidas fica cravada no banco de dados.",
  "Tudo pronto? Clique em avançar e assuma o controle da sua matriz!"
];

export const FitaoOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [falaAtual, setFalaAtual] = useState(0);

  const nextFala = () => {
    if (falaAtual < falasFitao.length - 1) {
      setFalaAtual(falaAtual + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#010307] overflow-hidden"
    >
      
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND: HOLOGRAMA DO DASHBOARD (TUTORIAL GUIADO)          */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 z-0 flex w-full h-full pointer-events-none opacity-50">
        
        {/* DESKTOP SIDEBAR MOCK */}
        <aside className="hidden md:flex flex-col w-80 bg-white/5 border-r border-white/5 h-full p-6 transition-all duration-700">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center">
              <Activity className="text-sky-500 w-6 h-6" />
            </div>
            <h2 className="font-black italic uppercase tracking-tighter text-xl text-white leading-none">Ativora<span className="text-sky-500">FIT</span></h2>
          </div>
          <nav className="flex-1 space-y-3">
            <div className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${falaAtual === 1 ? 'bg-sky-500 text-black shadow-[0_0_30px_rgba(14,165,233,1)] scale-105 opacity-100' : 'text-white/30 bg-white/5'}`}>
              <User /> Identidade & Status
            </div>
            <div className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${falaAtual === 3 ? 'bg-sky-500 text-black shadow-[0_0_30px_rgba(14,165,233,1)] scale-105 opacity-100' : 'text-white/30 bg-white/5'}`}>
              <Activity /> Performance & Treino
            </div>
            <div className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${falaAtual === 2 ? 'bg-sky-500 text-black shadow-[0_0_30px_rgba(14,165,233,1)] scale-105 opacity-100' : 'text-white/30 bg-white/5'}`}>
              <ShoppingBag /> Ativora Direct
            </div>
            <div className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white/30 bg-white/5">
              <ShieldCheck /> Financeiro & Seguro
            </div>
          </nav>
        </aside>

        {/* MOBILE HEADER & MENU MOCK */}
        <div className="md:hidden flex-1 flex flex-col w-full transition-all duration-700">
          <header className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
             <h2 className="font-black italic uppercase tracking-tighter text-lg text-white">Ativora<span className="text-sky-500">FIT</span></h2>
             <Menu className="text-white/50" />
          </header>
          {/* Highlights Flutuantes no Mobile */}
          <div className="px-4 mt-6 space-y-3 relative z-10">
            <div className={`w-full flex items-center justify-center gap-4 px-5 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${falaAtual === 1 ? 'bg-sky-500 text-black shadow-[0_0_30px_rgba(14,165,233,1)] scale-105 opacity-100' : 'hidden'}`}>
              <User /> Identidade & Status
            </div>
            <div className={`w-full flex items-center justify-center gap-4 px-5 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${falaAtual === 2 ? 'bg-sky-500 text-black shadow-[0_0_30px_rgba(14,165,233,1)] scale-105 opacity-100' : 'hidden'}`}>
              <ShoppingBag /> Ativora Direct
            </div>
            <div className={`w-full flex items-center justify-center gap-4 px-5 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${falaAtual === 3 ? 'bg-sky-500 text-black shadow-[0_0_30px_rgba(14,165,233,1)] scale-105 opacity-100' : 'hidden'}`}>
              <Activity /> Performance & Treino
            </div>
          </div>
        </div>

      </div>
      {/* ------------------------------------------------------------- */}


      {/* ------------------------------------------------------------- */}
      {/* FOREGROUND: FITÃO & DIÁLOGO (O que o usuário foca)            */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center p-6 w-full max-w-5xl">
        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="relative w-64 h-64 md:w-96 md:h-96 shrink-0">
          <Image src="/3.png" alt="Fitão" fill className="object-contain drop-shadow-[0_0_30px_rgba(14,165,233,0.4)]" priority />
        </motion.div>

        <motion.div 
          key={falaAtual}
          initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }}
          className="relative bg-white/10 border border-white/20 p-6 md:p-10 rounded-3xl md:rounded-[3rem] max-w-xl mt-8 md:mt-0 md:-ml-8 backdrop-blur-2xl shadow-2xl"
        >

          <p className="text-lg md:text-2xl font-bold italic tracking-wide text-white leading-relaxed">
            &quot;{falasFitao[falaAtual]}&quot;
          </p>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
            <span className="text-[10px] text-white/60 font-black tracking-widest uppercase hidden md:inline-block">Sistema de IA Fitão</span>
            <button onClick={nextFala} className="flex items-center gap-2 bg-sky-500 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-colors active:scale-95 ml-auto">
              {falaAtual === falasFitao.length - 1 ? "Acessar Dashboard" : "Próximo Passo"}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
      {/* ------------------------------------------------------------- */}

    </motion.div>
  );
};