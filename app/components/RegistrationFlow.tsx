"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Lock, Camera, MapPin, Hash, 
  ChevronRight, ArrowLeft, Check, Shield, 
  Calendar, Info, FileText, Trophy,
  Activity, Zap, Star, Briefcase,
  LayoutDashboard, Rocket, X, CheckCircle2, BrainCircuit, Utensils, 
  TrendingUp, Users, Target, BarChart3, Bell, UserSquare2,
  ShieldCheck, Globe, ZapOff, Cpu, Fingerprint
} from "lucide-react";

// --- DEFINIÇÃO DE TIPOS (FIM DO ANY) ---
interface RegistrationFormData {
  nomeCompleto: string;
  email: string;
  nickname: string;
  genero: string;
  cidadeEstado: string;
  objetivoPlataforma: string[];
  interesses: string[];
  [key: string]: string | string[] | number | boolean | undefined;
}

interface RegistrationProps {
  role: string;
  onBack: () => void;
  onComplete: (data: RegistrationFormData) => void;
}

export const RegistrationFlow = ({ role, onBack, onComplete }: RegistrationProps) => {
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [time, setTime] = useState("");
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    nomeCompleto: "",
    email: "",
    nickname: "",
    genero: "",
    cidadeEstado: "",
    objetivoPlataforma: [],
    interesses: [],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSteps = 5;

  // --- 🛡️ INFORMAÇÕES BLINDADAS (NUNCA ALTERAR) ---
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

  const updateField = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Dados de <span className="text-sky-500">Acesso</span></h2>
          <div className="space-y-4">
            <Input icon={<User />} placeholder="NOME COMPLETO" value={formData.nomeCompleto} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('nomeCompleto', e.target.value)} />
            <Input icon={<Mail />} placeholder="E-MAIL" type="email" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input icon={<Lock />} placeholder="SENHA" type="password" />
              <Input icon={<Check />} placeholder="CONFIRMAR SENHA" type="password" />
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Perfil <span className="text-sky-500">Pessoal</span></h2>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-sky-500/50 transition-all">
              <Camera className="w-8 h-8 text-white/20 mb-2" />
              <span className="text-[8px] font-black uppercase text-white/20 text-center px-4">Foto de Perfil</span>
            </div>
            <div className="flex-1 w-full space-y-4">
              <Input icon={<Hash />} placeholder="NICKNAME" value={formData.nickname} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('nickname', e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input icon={<Calendar />} placeholder="NASCIMENTO" type="date" />
                <Select icon={<User />} options={["Masculino", "Feminino", "Outro"]} onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField('genero', e.target.value)} />
              </div>
              <Input icon={<MapPin />} placeholder="CIDADE / ESTADO" onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('cidadeEstado', e.target.value)} />
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Matriz do <span className="text-sky-500">{role.toUpperCase()}</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {role === 'aluno' && (
              <>
                <Select icon={<Target />} options={["Objetivo: Hipertrofia", "Objetivo: Emagrecimento", "Objetivo: Performance"]} />
                <Select icon={<Trophy />} options={["Nível: Iniciante", "Nível: Intermediário", "Nível: Avançado"]} />
                <Input icon={<Activity />} placeholder="PESO (KG)" />
                <Input icon={<ArrowLeft className="rotate-90"/>} placeholder="ALTURA (CM)" />
                <textarea className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 h-24" placeholder="RESTRIÇÕES OU LESÕES?"></textarea>
              </>
            )}
            {role === 'personal' && (
              <>
                <Input icon={<Briefcase />} placeholder="NOME PROFISSIONAL" />
                <Input icon={<Star />} placeholder="ÁREA DE ATUAÇÃO" />
                <Input icon={<Shield />} placeholder="CREF" />
                <Select icon={<Globe />} options={["Atendimento: Online", "Atendimento: Presencial", "Atendimento: Híbrido"]} />
                <textarea className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 h-24" placeholder="MINI BIO PROFISSIONAL"></textarea>
              </>
            )}
            {role === 'nutri' && (
              <>
                <Input icon={<Briefcase />} placeholder="NOME PROFISSIONAL" />
                <Input icon={<Star />} placeholder="ÁREA DE ATUAÇÃO" />
                <Input icon={<Shield />} placeholder="CRN" />
                <Select icon={<Globe />} options={["Atendimento: Online", "Atendimento: Presencial", "Atendimento: Híbrido"]} />
                <textarea className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 h-24" placeholder="MINI BIO PROFISSIONAL"></textarea>
              </>
            )}
            {role === 'estagiario' && (
              <>
                <Input icon={<Briefcase />} placeholder="ÁREA DO ESTÁGIO" />
                <Input icon={<Globe />} placeholder="FACULDADE" />
                <Input icon={<Calendar />} placeholder="PERÍODO ATUAL" />
                <Input icon={<User />} placeholder="SUPERVISOR / LOCAL" />
                <textarea className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 h-24" placeholder="MINI APRESENTAÇÃO"></textarea>
              </>
            )}
            {role === 'influencer' && (
              <>
                <Input icon={<User />} placeholder="NOME DE CRIADOR" />
                <Input icon={<Star />} placeholder="NICHO PRINCIPAL" />
                <Input icon={<Globe />} placeholder="PLATAFORMAS" />
                <Input icon={<Users />} placeholder="QUANTIDADE DE SEGUIDORES" />
                <textarea className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 h-24" placeholder="MINI BIO / TIPO DE CONTEÚDO"></textarea>
              </>
            )}
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Foco & <span className="text-sky-500">Interesses</span></h2>
          <div className="space-y-4">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">O QUE DESEJA NO APP?</p>
            <div className="flex flex-wrap gap-2">
              {["Treinar", "Encontrar Alunos", "Captar Clientes", "Divulgar Trabalho", "Crescer Profissionalmente"].map(t => <Tag key={t} text={t} />)}
            </div>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-6">ESPECIALIDADES / INTERESSES</p>
            <div className="flex flex-wrap gap-2">
              {role === 'aluno' && ["Emagrecimento", "Hipertrofia", "Saúde", "Performance"].map(t => <Tag key={t} text={t} />)}
              {role === 'personal' && ["Hipertrofia", "Funcional", "Emagrecimento", "Idosos", "Atletas"].map(t => <Tag key={t} text={t} />)}
              {role === 'nutri' && ["Emagrecimento", "Esportiva", "Clínica", "Reeducação"].map(t => <Tag key={t} text={t} />)}
              {role === 'estagiario' && ["Musculação", "Atendimento", "Avaliação", "Acompanhamento"].map(t => <Tag key={t} text={t} />)}
              {role === 'influencer' && ["Fitness", "Lifestyle", "Motivação", "Dicas", "Receitas"].map(t => <Tag key={t} text={t} />)}
            </div>
          </div>
        </div>
      );
      case 5: return (
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Validação <span className="text-sky-500">Final</span></h2>
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <input type="checkbox" className="w-5 h-5 accent-sky-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Aceito os termos e política de privacidade</span>
              </div>
              <div className="flex items-center gap-4">
                <input type="checkbox" className="w-5 h-5 accent-sky-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Autorizo exibição pública no marketplace</span>
              </div>
            </div>
            {role !== 'aluno' && (
              <div className="w-full p-10 border-2 border-dashed border-white/10 rounded-4xl flex flex-col items-center justify-center gap-4 bg-white/2">
                <FileText className="w-10 h-10 text-sky-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center">Upload de Comprovante (CREF/CRN/Vínculo)</span>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] text-[#F8FAFC] flex flex-col items-center font-sans overflow-y-auto overflow-x-hidden scroll-smooth">
      
      <div className="fixed top-0 left-0 w-full z-100 pointer-events-none">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-3 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_15px_#0EA5E9]" />
             <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-sky-400">Ambiente de Testes • Versão Beta 1.0</span>
          </div>
          <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic">CONFIGURAÇÃO DE MATRIZ</span>
        </div>
      </div>

      <header className="w-full max-w-7xl px-6 md:px-12 py-16 md:py-24 flex justify-between items-center z-20 shrink-0">
        <button onClick={onBack} className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Abortar</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black tracking-widest opacity-60">{time}</span>
          <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Etapa {step}/{totalSteps}</span>
        </div>
      </header>

      <div className="w-full max-w-3xl px-6 mb-10">
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(step/totalSteps)*100}%` }} className="h-full bg-sky-500 shadow-[0_0_15px_#0EA5E9]" />
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl px-6 py-4 z-10">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="w-full flex flex-col md:flex-row gap-4 mt-12 mb-20">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all text-white">Voltar</button>
          )}
          <button 
            onClick={() => step === totalSteps ? onComplete(formData) : setStep(s => s + 1)}
            className="flex-2 py-6 md:py-8 bg-sky-500 text-[#010409] font-black text-xl md:text-2xl rounded-3xl md:rounded-4xl shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95"
          >
            {step === totalSteps ? "Concluir Sincronia" : "Continuar"}
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </main>

      <footer className="w-full max-w-7xl grid grid-cols-4 gap-4 md:gap-10 px-6 md:px-12 py-10 md:py-24 shrink-0 mt-auto border-t border-white/5">
        {[
          { id: "sobre", n: "Sobre", i: Info },
          { id: "funcionalidades", n: "Recursos", i: LayoutDashboard },
          { id: "como_funciona", n: "Sistema", i: Cpu },
          { id: "novidades", n: "Beta", i: Rocket }
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center gap-3 p-5 md:p-12 rounded-3xl border transition-all active:scale-95 ${activeTab === item.id ? 'bg-sky-500/20 border-sky-500/50' : 'bg-white/10 border-white/10'}`}>
            <item.i className={`w-6 h-6 md:w-10 md:h-10 ${activeTab === item.id ? 'text-sky-500' : 'text-white/70'}`} />
            <span className={`text-[8px] md:text-sm font-black uppercase tracking-[0.3em] ${activeTab === item.id ? 'text-white' : 'text-white/40'}`}>{item.n}</span>
          </button>
        ))}
      </footer>

      <AnimatePresence>
        {activeTab && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTab(null)} className="fixed inset-0 z-1000 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg md:max-w-5xl bg-[#020617] border border-white/10 rounded-4xl p-8 md:p-20 relative shadow-2xl flex flex-col items-center">
              <button onClick={() => setActiveTab(null)} className="absolute top-6 right-6 md:top-10 md:right-10 p-3 md:p-6 rounded-full bg-white/5 border-none cursor-pointer text-white/50 hover:text-white transition-colors"><X className="w-6 h-6 md:w-10 md:h-10" /></button>
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mb-10 w-full">
                <div className="p-4 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 scale-110 md:scale-125">{sections[activeTab as keyof typeof sections].icon}</div>
                <h2 className="text-3xl md:text-8xl font-black uppercase tracking-tighter italic text-center md:text-left">{sections[activeTab as keyof typeof sections].title}</h2>
              </div>
              <div className="max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar w-full text-white/80">{sections[activeTab as keyof typeof sections].content}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- COMPONENTES ATÔMICOS TIPADOS ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}
const Input = ({ icon, ...props }: InputProps) => (
  <div className="relative w-full group">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-500 transition-colors">{icon}</div>
    <input {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 transition-all text-white" />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon: React.ReactNode;
  options: string[];
}
const Select = ({ icon, options, ...props }: SelectProps) => (
  <div className="relative w-full group">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-500 transition-colors pointer-events-none">{icon}</div>
    <select {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xs font-bold uppercase tracking-widest outline-none focus:border-sky-500 appearance-none transition-all text-white">
      {options.map(o => <option key={o} value={o} className="bg-slate-950 text-white">{o}</option>)}
    </select>
  </div>
);

const Tag = ({ text }: { text: string }) => {
  const [active, setActive] = useState(false);
  return (
    <button onClick={() => setActive(!active)} className={`px-5 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-sky-500 border-sky-500 text-[#010307]' : 'bg-white/5 border-white/10 text-white/40'}`}>{text}</button>
  );
};