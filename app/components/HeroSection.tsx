"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section className="relative min-h-dvh w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#020617]">
      
      {/* --- BACKGROUND DINÂMICO --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-linear-to-b from-[#0F172A] via-[#020617] to-[#020617]" />
        <div className="absolute top-[-10%] left-[-10%] w-150 h-150 bg-[#0EA5E9]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-150 h-150 bg-[#38BDF8]/5 rounded-full blur-[120px]" />
      </div>

      {/* --- CARD PRINCIPAL (GLASSMORPHISM) --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center shadow-2xl"
      >
        {/* Badge Superior */}
        <div className="mb-8 px-4 py-1.5 rounded-full border border-[#38BDF8]/20 bg-[#38BDF8]/5">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#38BDF8] uppercase">
            Plataforma Fitness Premium
          </span>
        </div>

        {/* LOGO */}
        <div className="relative w-20 h-20 md:w-28 md:h-28 mb-8 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
          <Image 
            src="/logo.png" 
            alt="AtivoraFit Logo" 
            fill
            className="object-contain"
            priority
          />
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-[#0EA5E9] blur-3xl rounded-full -z-10"
          />
        </div>

        {/* TEXTOS */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">
            Ativora<span className="text-[#0EA5E9]">Fit</span>
          </h1>
          <h2 className="text-xs md:text-sm font-bold text-[#38BDF8] tracking-[0.3em] uppercase mb-6">
            A evolução na palma da sua mão
          </h2>
          <p className="text-[#94A3B8] text-sm md:text-lg max-w-xl mx-auto leading-relaxed">
            A plataforma inteligente que une saúde, evolução física e experiência premium em um ecossistema moderno e responsivo.
          </p>
        </div>

        {/* BOTÕES CTA */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <button className="px-10 py-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-[#0EA5E9]/20 hover:scale-105 active:scale-95">
            Começar agora
          </button>
          <button className="px-10 py-4 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-sm">
            Já tenho conta
          </button>
        </div>

        {/* FEATURES GRID (RODAPÉ DO CARD) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {[
            { title: "Treinos", desc: "Planejamento e evolução" },
            { title: "Profissionais", desc: "Conexão Inteligente" },
            { title: "Experiência", desc: "Interface Responsiva" }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-center md:text-left">
              <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-[#94A3B8] text-[11px] uppercase tracking-wider">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* EFEITO DE PARTICULAS NO FUNDO */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#38BDF8 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
    </section>
  );
};