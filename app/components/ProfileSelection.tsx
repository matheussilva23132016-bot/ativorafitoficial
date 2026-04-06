"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Dumbbell, Apple, GraduationCap, 
  Star, ChevronRight, Signal, Wifi, Battery, 
  Sparkles, Check, ArrowLeft, Fingerprint, Activity,
  Cpu, Info, LayoutDashboard, Rocket, X, CheckCircle2,
  BrainCircuit, Utensils, TrendingUp, Users, Target, BarChart3, Bell, UserSquare2,
  ShieldCheck, Globe, Zap, ZapOff, Lock
} from "lucide-react";

interface ProfileProps {
  onBack: () => void;
  onSelectProfile: (role: string) => void; // Prop adicionada para controle de fluxo
}

export const ProfileSelection = ({ onBack, onSelectProfile }: ProfileProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 🛡️ INFORMAÇÕES BLINDADAS (NUNCA ALTERAR) ---
  const profiles = [
    { id: "aluno", title: "Aluno", icon: User, desc: "Performance máxima. Evolução inteligente." },
    { id: "personal", title: "Personal Trainer", icon: Dumbbell, desc: "Escale sua consultoria. Gerencie com elite." },
    { id: "nutri", title: "Nutricionista", icon: Apple, desc: "Planos dinâmicos. Monitoramento IA." },
    { id: "instrutor", title: "Instrutor", icon: GraduationCap, desc: "Autoridade técnica. Liderança no ecossistema." },
    { id: "influencer", title: "Influencer", icon: Star, desc: "Monetize seu lifestyle. Inspire o mundo." }
  ];

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
      
      {/* 1. MARCA D'ÁGUA BETA (ONIPRESENTE) */}
      <div className="fixed top-0 left-0 w-full z-100 pointer-events-none">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_15px_#0EA5E9]" />
             <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-sky-400">Ambiente de Testes • Versão Beta 1.0</span>
          </div>
          <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">ATIVORA OS • EVOLUÇÃO GLOBAL</span>
        </div>
      </div>

      {/* 2. HEADER: STATUS BAR */}
      <header className="w-full max-w-7xl px-6 md:px-12 py-16 md:py-20 flex justify-between items-center z-20 shrink-0">
        <button onClick={onBack} className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-center">Voltar</span>
        </button>
        
        <div className="flex items-center gap-6 opacity-60">
          <div className="hidden sm:flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-sky-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 italic">SISTEMA ATIVO</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold tracking-tighter">
            <span>{time}</span>
            <div className="flex gap-2.5">
              <Signal className="w-5 h-5"/>
              <Wifi className="w-5 h-5"/>
              <div className="md:hidden">
                <Battery className="w-5 h-5"/>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. CONTEÚDO CENTRAL */}
      <main className="w-full max-w-6xl px-6 flex flex-col items-center justify-center z-10 py-10 md:py-4">
        <div className="text-center mb-10 md:mb-14">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-4 mb-4">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.8em] text-sky-500 ml-4">Configuração de Perfil</span>
          </motion.div>
          <h1 className="text-5xl md:text-[80px] font-black uppercase tracking-[-0.06em] leading-none mb-6 italic">DEFINA SEU <span className="text-sky-500">PERFIL</span></h1>
          <p className="text-white/30 text-[10px] md:text-lg font-bold uppercase tracking-[0.5em] max-w-2xl mx-auto leading-relaxed">Sincronize sua identidade no ecossistema AtivoraFit</p>
        </div>

        {/* GRID DE PERFIS RECALIBRADO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 w-full mb-12">
          {profiles.map((p, index) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedId(p.id)}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative p-8 md:p-8 rounded-[2.5rem] border transition-all flex flex-col items-center text-center cursor-pointer group overflow-hidden
                ${selectedId === p.id 
                  ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_50px_rgba(14,165,233,0.1)]' 
                  : 'bg-white/10 md:bg-white/2 border-white/10 md:border-white/5 hover:border-white/20 hover:bg-white/15'}`}
            >
              <div className={`relative p-5 rounded-2xl mb-6 transition-all duration-500
                ${selectedId === p.id ? 'bg-sky-500 text-[#010307] shadow-lg' : 'bg-white/5 text-white/20 group-hover:text-sky-400'}`}>
                <p.icon className="w-8 h-8 md:w-9 md:h-9" />
              </div>
              <h3 className={`text-xl md:text-xl font-black uppercase italic tracking-tighter mb-2 transition-colors
                ${selectedId === p.id ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{p.title}</h3>
              <p className={`text-[10px] md:text-[10px] font-medium leading-relaxed uppercase tracking-widest transition-opacity
                ${selectedId === p.id ? 'text-white/80' : 'text-white/20 group-hover:text-white/50'}`}>{p.desc}</p>
              
              <div className={`absolute top-6 right-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                ${selectedId === p.id ? 'bg-sky-500 border-sky-500 scale-110 shadow-lg' : 'border-white/10 scale-90 opacity-0 group-hover:opacity-100'}`}>
                {selectedId === p.id && <Check className="w-3 h-3 text-[#010307] stroke-[4]" />}
              </div>
            </motion.button>
          ))}
        </div>

        {/* BOTÃO AVANÇAR: AGORA CONECTADO À NAVEGAÇÃO */}
        <div className="w-full flex flex-col items-center gap-6 mb-16">
          <button 
            disabled={!selectedId}
            onClick={() => selectedId && onSelectProfile(selectedId)} // Dispara a função com o ID do perfil
            className={`group relative w-full max-w-[320px] md:max-w-md py-6 md:py-8 bg-sky-500 text-[#010409] font-black text-xl md:text-2xl rounded-3xl md:rounded-4xl shadow-2xl flex items-center justify-center gap-4 overflow-hidden cursor-pointer border-none active:scale-95 transition-all
              ${!selectedId ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          >
            <span className="relative z-10 uppercase tracking-tighter">Avançar</span>
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-40 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-35" />
          </button>
          <div className="flex items-center gap-3 opacity-60"><Activity className="w-5 h-5 text-sky-500 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.5em]">Validando Identidade</span></div>
        </div>
      </main>

      {/* 4. FOOTER GLOBAL BLINDADO */}
      <footer className="w-full max-w-7xl grid grid-cols-4 gap-4 md:gap-8 px-6 md:px-12 py-10 md:py-20 shrink-0 mt-auto border-t border-white/5">
        {[
          { id: "sobre", n: "Sobre", i: Info },
          { id: "funcionalidades", n: "Recursos", i: LayoutDashboard },
          { id: "como_funciona", n: "Sistema", i: Cpu },
          { id: "novidades", n: "Beta", i: Rocket }
        ].map((item) => (
          <button 
            key={item.id} onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center justify-center gap-3 md:gap-6 p-5 md:p-12 rounded-3xl md:rounded-[3rem] transition-all cursor-pointer group border active:scale-95 shadow-lg
              ${activeTab === item.id 
                ? 'bg-sky-500/20 border-sky-500/50' 
                : 'bg-white/10 md:bg-white/3 border-white/10 hover:border-white/20 hover:bg-white/15'}`}
          >
            <item.i className={`w-6 h-6 md:w-10 md:h-10 transition-colors ${activeTab === item.id ? 'text-sky-500' : 'text-white/70 group-hover:text-white'}`} />
            <span className={`text-[8px] md:text-sm font-black uppercase tracking-[0.3em] transition-colors ${activeTab === item.id ? 'text-white' : 'text-white/40 group-hover:text-white/80'} text-center`}>{item.n}</span>
          </button>
        ))}
      </footer>

      {/* MODAIS */}
      <AnimatePresence>
        {activeTab && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTab(null)} className="fixed inset-0 z-1000 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg md:max-w-5xl bg-[#020617] border border-white/10 rounded-4xl md:rounded-[4rem] p-8 md:p-16 relative shadow-2xl flex flex-col items-center">
              <button onClick={() => setActiveTab(null)} className="absolute top-6 right-6 md:top-10 md:right-10 p-3 md:p-6 rounded-full bg-white/5 border-none cursor-pointer text-white/50 hover:text-white transition-colors"><X className="w-6 h-6 md:w-10 md:h-10" /></button>
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mb-10 md:mb-12 w-full">
                <div className="p-4 md:p-10 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 scale-110 md:scale-125">{sections[activeTab as keyof typeof sections].icon}</div>
                <h2 className="text-3xl md:text-8xl font-black uppercase tracking-tighter italic leading-none text-center md:text-left">{sections[activeTab as keyof typeof sections].title}</h2>
              </div>
              <div className="max-h-[55vh] md:max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar w-full text-white/80">{sections[activeTab as keyof typeof sections].content}</div>
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