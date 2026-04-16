"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  // --- ÍCONES DE PERFIL ---
  User, Dumbbell, Apple, GraduationCap, Star, 
  // --- ÍCONES DE UI ---
  ChevronRight, ArrowLeft, X, Check, Sparkles, CheckCircle2,
  // --- ÍCONES DE STATUS ---
  Signal, Wifi, Battery, Activity, Fingerprint,
  // --- ÍCONES DE RECURSOS E SEÇÕES ---
  Info, LayoutDashboard, Cpu, Rocket, 
  Utensils, 
  Bell, UserSquare2, ShieldCheck, Globe, Zap, ZapOff
} from "lucide-react";

interface ProfileProps {
  onBack: () => void;
  onSelectProfile: (role: string) => void;
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

  const profiles = [
    { id: "aluno", title: "Aluno", icon: User, desc: "Receber treino, cardápio, desafios e registrar progresso." },
    { id: "personal", title: "Personal Trainer", icon: Dumbbell, desc: "Usar CREF, montar treinos e responder pedidos de alunos." },
    { id: "instrutor", title: "Instrutor", icon: GraduationCap, desc: "Usar documento próprio, organizar aulas, turmas e treinos." },
    { id: "nutri", title: "Nutricionista", icon: Apple, desc: "Usar CRN, criar cardápios e consultar alimentos por macro." },
    { id: "influencer", title: "Influencer", icon: Star, desc: "Informar nicho, rede principal e criar presença no social." }
  ];

  const sections = {
    sobre: {
      title: "Cadastro por perfil",
      icon: <Info className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="space-y-6 md:space-y-10 w-full text-center md:text-left pb-10">
          <p className="text-sky-400 font-black text-xl md:text-4xl italic uppercase tracking-tighter leading-tight">Escolha o tipo de conta antes de preencher seus dados.</p>
          <div className="space-y-4 md:space-y-8">
            <p className="text-white/80 leading-relaxed text-sm md:text-xl font-medium">Aluno informa dados pessoais e objetivos. Personal informa CREF. Instrutor informa documento profissional da modalidade. Nutricionista informa CRN. Influencer informa nicho e rede principal.</p>
            <p className="text-white font-bold text-sm md:text-xl border-l-4 border-sky-500 pl-6 italic uppercase tracking-wider">A próxima etapa muda conforme o perfil escolhido.</p>
          </div>
        </div>
      )
    },
    funcionalidades: {
      title: "O que muda",
      icon: <LayoutDashboard className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-12 w-full">
          {[
            { i: <UserSquare2 />, t: "Aluno", d: "Pede treino ou cardápio, marca conclusão, envia desafios e vê ranking." },
            { i: <Dumbbell />, t: "Personal Trainer", d: "Preenche CREF, cria treinos semanais e revisa pedidos de treino." },
            { i: <GraduationCap />, t: "Instrutor", d: "Preenche documento profissional, organiza aulas e acompanha execução." },
            { i: <Utensils />, t: "Nutricionista", d: "Preenche CRN, cria cardápio semanal e usa manual de alimentos." },
            { i: <Star />, t: "Influencer", d: "Preenche nicho, rede principal e usa perfil social para publicar." },
            { i: <Bell />, t: "Permissões", d: "Botões de criar, editar, aprovar e publicar aparecem conforme o perfil." }
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
      title: "Próximos passos",
      icon: <Cpu className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="space-y-6 md:space-y-10 pb-12 w-full">
          {[
            { i: <Fingerprint />, t: "01. Perfil", d: "Clique em Aluno, Personal, Instrutor, Nutricionista ou Influencer." },
            { i: <Globe />, t: "02. Conta", d: "Preencha nome, e-mail, senha, nickname, nascimento e cidade." },
            { i: <ShieldCheck />, t: "03. Documento", d: "Personal informa CREF, Instrutor informa documento próprio e Nutricionista informa CRN." },
            { i: <Zap />, t: "04. Objetivos", d: "Selecione os focos que aparecerão no painel e nas recomendações." },
            { i: <ZapOff />, t: "05. Entrada", d: "Ao finalizar, o app cria a conta e abre o dashboard." }
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
      title: "Status",
      icon: <Rocket className="w-6 h-6 text-sky-400" />,
      content: (
        <div className="space-y-8 md:space-y-12 pb-10 w-full text-center">
          <div className="p-8 md:p-14 rounded-4xl bg-white/3 border border-white/5">
            <h4 className="text-sky-400 font-black text-xs md:text-2xl uppercase mb-8 tracking-[0.3em] italic">Áreas disponíveis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {["Painel principal", "Ativora Social", "Comunidades", "Treinos e guia", "Nutrição e RFM", "Ajuda e sugestões"].map(t => (
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
      <header className="w-full max-w-7xl px-6 md:px-12 py-8 md:py-12 flex justify-between items-center z-20 shrink-0">
        <button onClick={onBack} className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-center">Voltar</span>
        </button>
        
        <div className="flex items-center gap-6 opacity-60">
          <div className="hidden sm:flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-sky-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 italic">Cadastro</span>
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

      <main className="w-full max-w-6xl px-6 flex flex-col items-center justify-center z-10 py-10 md:py-4">
        <div className="text-center mb-10 md:mb-14">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-4 mb-4">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.8em] text-sky-500 ml-4">Cadastro AtivoraFit</span>
          </motion.div>
          <h1 className="text-5xl md:text-[80px] font-black uppercase tracking-[-0.06em] leading-none mb-6 italic">DEFINA SEU <span className="text-sky-500">PERFIL</span></h1>
          <p className="text-white/30 text-[10px] md:text-lg font-bold uppercase tracking-[0.35em] max-w-2xl mx-auto leading-relaxed">Escolha a função que você vai usar no app; ela define os documentos pedidos e as áreas liberadas no painel.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5 w-full mb-6 max-h-[60vh] overflow-y-auto sm:max-h-full sm:overflow-visible sm:mb-8 custom-scrollbar pr-2 sm:pr-0">
          {profiles.map((p, index) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedId(p.id)}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] border transition-all flex flex-col items-center text-center cursor-pointer group overflow-hidden
                ${selectedId === p.id 
                  ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_50px_rgba(14,165,233,0.1)]' 
                  : 'bg-white/10 md:bg-white/2 border-white/10 md:border-white/5 hover:border-white/20 hover:bg-white/15'}`}
            >
              <div className={`relative p-3 md:p-5 rounded-2xl mb-3 md:mb-6 transition-all duration-500
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

        <div className="w-full flex flex-col items-center gap-6 mb-16">
          <button 
            disabled={!selectedId}
            onClick={() => selectedId && onSelectProfile(selectedId)} 
            className={`group relative w-full max-w-[320px] md:max-w-md py-6 md:py-8 bg-sky-500 text-[#010409] font-black text-xl md:text-2xl rounded-3xl md:rounded-4xl shadow-2xl flex items-center justify-center gap-4 overflow-hidden cursor-pointer border-none active:scale-95 transition-all
              ${!selectedId ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          >
            <span className="relative z-10 uppercase tracking-tighter">Avançar</span>
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-y-0 w-40 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-[-35deg]" />
          </button>
          <div className="flex items-center gap-3 opacity-60"><Activity className="w-5 h-5 text-sky-500 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.4em]">Campos por perfil</span></div>
        </div>
      </main>

      <footer className="w-full max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 px-6 md:px-12 py-10 md:py-20 shrink-0 mt-auto border-t border-white/5">
        {[
          { id: "sobre", n: "Sobre", i: Info },
          { id: "funcionalidades", n: "Perfis", i: LayoutDashboard },
          { id: "como_funciona", n: "Passos", i: Cpu },
          { id: "novidades", n: "Áreas", i: Rocket }
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

      <AnimatePresence>
        {activeTab && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTab(null)} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
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
