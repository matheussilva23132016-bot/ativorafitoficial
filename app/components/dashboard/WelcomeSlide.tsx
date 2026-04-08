"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export const WelcomeSlide = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.5 } }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#010307] overflow-hidden"
    >
      {/* OVERLAY DE TEXTURA (NOISE) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      
      {/* LOGO ANIMADA */}
      <motion.div 
        animate={{ 
          y: [0, -10, 0],
          filter: ["drop-shadow(0 0 0px #0EA5E900)", "drop-shadow(0 0 20px #0EA5E944)", "drop-shadow(0 0 0px #0EA5E900)"]
        }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-32 h-32 md:w-48 md:h-48 mb-10"
      >
        <Image 
          src="/logo.png" 
          alt="Ativora OS" 
          fill 
          className="object-contain opacity-80" 
          priority 
        />
      </motion.div>

      {/* TEXTO PRINCIPAL DE ELITE */}
      <div className="relative z-10 text-center space-y-4 px-6">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] md:text-xs font-black uppercase tracking-[0.8em] text-sky-500 italic mb-2"
        >
          Sincronizando Ecossistema
        </motion.p>
        
        <h1 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
          BEM-VINDO À <br/>
          <span className="text-sky-500 shadow-neon">ATIVORAFIT</span>
        </h1>
      </div>
      
      {/* BARRA DE CARREGAMENTO (PROGRESSO DA MATRIZ) */}
      <div className="relative mt-12 w-48 md:w-64 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ 
            delay: 0.5, 
            duration: 2, 
            ease: "easeInOut" 
          }}
          className="h-full bg-sky-500 shadow-neon"
        />
      </div>

      {/* STATUS DO SISTEMA */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 flex items-center gap-3"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white italic">
          Iniciando Protocolos de Performance
        </span>
      </motion.div>
    </motion.div>
  );
};