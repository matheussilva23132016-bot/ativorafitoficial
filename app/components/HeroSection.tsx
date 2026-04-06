"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, Zap, LayoutDashboard, Wifi, Signal, 
  Info, Rocket, X, CheckCircle2, BrainCircuit, 
  Utensils, TrendingUp, Users, Target, BarChart3, Bell, 
  UserSquare2, Cpu, Globe, ZapOff, Fingerprint, Activity, 
  ShieldCheck, Lock
} from "lucide-react";

interface HeroProps {
  onExplore: () => void;
}

export const HeroSection = ({ onExplore }: HeroProps) => {
  const [time, setTime] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    // Sincroniza que o sistema está ativo na sessão atual
    sessionStorage.setItem("ativora_carregado", "true");
    
    return () => clearInterval(timer);
  }, []);

  // --- 🛡️ CONTEÚDO BLINDADO (NUNCA ALTERAR) ---
  const sections = {
    sobre: {
      title: "Sobre nós",
      icon: <Info className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="space-y-6 md:space-y-10 w-full text-center md:text-left pb-10">
          <p className="text-sky-400 font-black text-xl md:text-4xl italic uppercase tracking-tighter leading-tight">AtivoraFit é a evolução definitiva do treino digital.</p>
          <div className="space-y-4 md:space-y-8">
            <p className="text-white/80 leading-relaxed text-sm md:text-xl font-medium">Nascemos para integrar tecnologia de ponta e performance humana. Somos um ecossistema que une alunos, nutricionistas e treinadores em uma infraestrutura única.</p>
            <p className="text-white font-bold text-sm md:text-xl border-l-4 border-sky-500 pl-6 italic uppercase tracking-wider">Nosso objetivo: Construir a maior rede global de evolução física através de dados e resultados reais.</p>
          </div>
        </div>
      )
    },
    funcionalidades: {
      title: "Recursos",
      icon: <LayoutDashboard className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-12 w-full">
          {[
            { i: <BrainCircuit />, t: "Treinos Inteligentes", d: "Planos adaptativos gerados por Inteligência Artificial conforme seu nível." },
            { i: <Utensils />, t: "Dieta Dinâmica", d: "Nutrição personalizada que se ajusta à sua rotina e queima calórica." },
            { i: <TrendingUp />, t: "Evolução Visual", d: "Histórico completo de medidas, peso e comparativo de fotos em tempo real." },
            { i: <Users />, t: "Conexão com Elite", d: "Acesso direto aos melhores personal trainers e nutricionistas do país." },
            { i: <Target />, t: "Metas de Foco", d: "Defina objetivos claros e receba caminhos precisos para atingi-los." },
            { i: <BarChart3 />, t: "Métricas Reais", d: "Gráficos avançados de força, resistência e composição corporal." },
            { i: <Bell />, t: "Alertas Ativos", d: "Lembretes inteligentes para você nunca perder o horário de treinar ou comer." },
            { i: <UserSquare2 />, t: "Prontuário Digital", d: "Centralize todos os seus dados de saúde e histórico físico em um só lugar." }
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-3 items-center text-center md:items-start md:text-left hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3"><span className="text-sky-400 scale-110">{f.i}</span><h4 className="text-sky-400 font-black text-xs md:text-xl uppercase tracking-widest">{f.t}</h4></div>
              <p className="text-white/40 text-[10px] md:text-base leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      )
    },
    como_funciona: {
      title: "Sistema OS",
      icon: <Cpu className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="space-y-6 md:space-y-10 pb-12 w-full">
          {[
            { i: <Fingerprint />, t: "01. Matriz de Identidade", d: "Mapeamos seu DNA de treino através de biometria e análise de rotina para criar um plano 100% exclusivo." },
            { i: <Globe />, t: "02. Shopping de Especialistas", d: "Conectamos você aos profissionais de elite. Escolha por avaliação, especialidade e gerencie tudo pelo app." },
            { i: <Zap />, t: "03. Protocolo de Performance", d: "Seu treino e dieta não são estáticos. Eles evoluem toda semana baseados no seu feedback e progresso real." },
            { i: <ZapOff />, t: "04. Sincronismo Híbrido", d: "Treine sem internet. O sistema funciona totalmente offline e sincroniza seus dados assim que detectar conexão." },
            { i: <ShieldCheck />, t: "05. Segurança e Transparência", d: "Transações protegidas, Score de Confiança para profissionais e política de reembolso garantida pela plataforma." }
          ].map((s, i) => (
            <div key={i} className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 rounded-4xl bg-white/2 border border-white/5 text-center md:text-left group hover:bg-white/5 transition-all">
              <div className="p-4 rounded-2xl bg-sky-500/10 text-sky-400 shadow-lg">{s.i}</div>
              <div><h4 className="text-white font-black text-sm md:text-2xl uppercase italic tracking-tight">{s.t}</h4><p className="text-white/40 text-[11px] md:text-lg mt-2 leading-relaxed">{s.d}</p></div>
            </div>
          ))}
        </div>
      )
    },
    novidades: {
      title: "Versão Beta",
      icon: <Rocket className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="space-y-8 md:space-y-12 pb-10 w-full text-center">
          <div className="p-8 md:p-14 rounded-4xl bg-white/3 border border-white/5">
            <h4 className="text-sky-400 font-black text-xs md:text-2xl uppercase mb-8 tracking-[0.3em] italic">Ativo na Versão 1.0</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {["Painel de Performance", "Onboarding Inteligente", "Treinos via IA", "Evolução por Fotos", "Comunidades Ativas", "Interface Mobile"].map(t => (
                <div key={t} className="flex items-center justify-center md:justify-start gap-4 text-xs md:text-xl font-bold text-white/70 uppercase italic tracking-tighter"><CheckCircle2 className="w-5 h-5 md:w-8 md:h-8 text-sky-500" /> {t}</div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] text-[#F8FAFC] overflow-y-auto overflow-x-hidden flex flex-col items-center justify-between font-sans scroll-smooth">
      
      {/* 1. MARCA D'ÁGUA BETA (FIXA) */}
      <div className="fixed top-0 left-0 w-full z-100 pointer-events-none">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-3 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_15px_#0EA5E9]" />
             <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-sky-400">Ambiente de Testes • Versão Beta 1.0</span>
          </div>
          <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">SALVADOR - BAHIA • SISTEMA DE EVOLUÇÃO GLOBAL</span>
        </div>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

      {/* PORTAL PRINCIPAL (BOOT REMOVIDO) */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="relative z-10 w-full flex flex-col items-center"
      >
        
        {/* HEADER: STATUS BAR */}
        <header className="w-full max-w-7xl px-6 md:px-12 py-16 md:py-24 flex justify-between items-center shrink-0">
           <div className="bg-white/5 px-6 py-4 rounded-full border border-white/10 flex items-center gap-5 shadow-xl">
              <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">{time}</span>
              <div className="w-px h-4 bg-white/20 hidden md:block" />
              <span className="hidden md:inline text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-sky-500 italic uppercase">SISTEMA ATIVO</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-sky-400"><Activity className="w-3.5 h-3.5 animate-pulse" /> SISTEMA ATIVO</div>
               <div className="hidden md:flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest"><Lock className="w-3.5 h-3.5" /> SEGURO</div>
               <Signal className="w-5 h-5 opacity-70" />
               <Wifi className="w-5 h-5 opacity-70" />
            </div>
        </header>

        {/* CONTEÚDO CENTRAL: HERO SLIDE */}
        <main className="w-full max-w-7xl px-6 flex flex-col items-center gap-10 md:gap-16 text-center py-10 md:py-20">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity }} className="relative w-32 h-32 md:w-64 md:h-64">
            <Image src="/logo.png" alt="AtivoraFit" fill className="object-contain drop-shadow-[0_0_40px_#0EA5E966]" priority />
          </motion.div>

          <div className="w-full">
            <h1 className="text-5xl md:text-[110px] font-black tracking-[-0.08em] leading-none uppercase italic text-center">ATIVORA<span className="text-sky-500">FIT</span></h1>
            <p className="text-white/30 md:text-white/50 text-[10px] md:text-3xl font-black uppercase tracking-[0.4em] mt-4 md:mt-8 text-center">A evolução na palma da sua mão</p>
          </div>

          <div className="w-full flex flex-col items-center gap-4 shrink-0">
            <button 
              onClick={onExplore} 
              className="group relative w-full max-w-[320px] md:max-w-md py-6 md:py-10 bg-sky-500 text-[#010409] font-black text-xl md:text-3xl rounded-3xl md:rounded-4xl shadow-2xl flex items-center justify-center gap-4 overflow-hidden cursor-pointer border-none active:scale-95 transition-all"
            >
              <span className="relative z-10 uppercase tracking-tighter">Explorar Plataforma</span>
              <ChevronRight className="w-6 h-6 md:w-10 md:h-10 group-hover:translate-x-2 transition-transform" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-40 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-35" />
            </button>
            <button className="w-full max-w-[320px] md:max-w-md py-5 border border-white/10 bg-white/5 text-white font-bold text-sm md:text-xl rounded-3xl md:rounded-4xl cursor-pointer active:scale-95 uppercase opacity-60">Já tenho conta</button>
          </div>
        </main>

        {/* FOOTER GLOBAL BLINDADO */}
        <footer className="w-full max-w-7xl grid grid-cols-4 gap-4 md:gap-10 px-6 md:px-12 py-10 md:py-24 shrink-0 mt-auto border-t border-white/5">
          {[
            { id: "sobre", n: "Sobre", i: Info },
            { id: "funcionalidades", n: "Recursos", i: LayoutDashboard },
            { id: "como_funciona", n: "Sistema", i: Cpu },
            { id: "novidades", n: "Beta", i: Rocket }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`flex flex-col items-center justify-center gap-3 md:gap-6 p-5 md:p-14 rounded-3xl md:rounded-[3rem] transition-all border active:scale-95 shadow-lg ${activeTab === item.id ? 'bg-sky-500/20 border-sky-500/50' : 'bg-white/10 md:bg-white/3 border-white/10 hover:border-white/20 hover:bg-white/15'}`}
            >
              <item.i className={`w-6 h-6 md:w-12 md:h-12 ${activeTab === item.id ? 'text-sky-500' : 'text-white/70'}`} />
              <span className={`text-[8px] md:text-sm font-black uppercase tracking-[0.3em] ${activeTab === item.id ? 'text-white' : 'text-white/40'}`}>{item.n}</span>
            </button>
          ))}
        </footer>
      </motion.div>

      {/* MODAIS (CONTEÚDO BLINDADO) */}
      <AnimatePresence>
        {activeTab && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTab(null)} className="fixed inset-0 z-1000 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg md:max-w-5xl bg-[#020617] border border-white/10 rounded-4xl p-8 md:p-20 relative shadow-2xl flex flex-col items-center">
              <button onClick={() => setActiveTab(null)} className="absolute top-6 right-6 md:top-10 md:right-10 p-3 md:p-6 rounded-full bg-white/5 border-none cursor-pointer text-white/50 hover:text-white transition-colors"><X className="w-6 h-6 md:w-10 md:h-10" /></button>
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mb-10 md:mb-16 w-full">
                <div className="p-4 md:p-10 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 scale-110 md:scale-125">{sections[activeTab as keyof typeof sections].icon}</div>
                <h2 className="text-3xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-center md:text-left">{sections[activeTab as keyof typeof sections].title}</h2>
              </div>
              <div className="max-h-[55vh] md:max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar w-full text-white/80">{sections[activeTab as keyof typeof sections].content}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.4); border-radius: 10px; }
      `}</style>
    </div>
  );
};