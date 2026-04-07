"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Lock, MapPin, Hash, 
  ChevronRight, ArrowLeft, Check, Calendar, 
  Cpu, Target, Trophy, Activity, Shield,
  Globe, Star, Briefcase, Users, FileText, Clock, BookOpen,
  Eye, EyeOff
} from "lucide-react";

// --- CONFIGURAÇÕES DE ELITE ---
const RESERVED_NICKNAMES = [
  "admin", "suporte", "ativorafit", "root", "system", "api", "app", 
  "dashboard", "login", "register", "user", "perfil", "settings", "config"
];

const INTERESSES_LIST = [
  "Hipertrofia", "Emagrecimento", "Saúde", "Performance", "Consultoria", 
  "Lifestyle", "Nutrição", "Flexibilidade", "Treino Funcional", "Atendimento Online",
  "Marketing Fitness", "Mentoria", "Presença Digital", "Reabilitação", "Avaliação Física"
];

const CIDADES_SUGESTOES = [
  "Salvador, BA", "São Paulo, SP", "Rio de Janeiro, RJ", "Brasília, DF", 
  "Belo Horizonte, MG", "Curitiba, PR", "Manaus, AM", "Recife, PE", 
  "Porto Alegre, RS", "Fortaleza, CE", "Goiânia, GO", "Belém, PA"
];

interface RegistrationFormData {
  nomeCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  nickname: string;
  genero: string;
  dataNascimento: string;
  cidadeEstado: string;
  interesses: string[];
  termos: boolean;
  privacidade: boolean;
  [key: string]: string | string[] | number | boolean | undefined;
}

interface RegistrationProps {
  role: string;
  onBack: () => void;
  onComplete: (data: RegistrationFormData) => void;
}

export const RegistrationFlow = ({ role, onBack, onComplete }: RegistrationProps) => {
  const [step, setStep] = useState(1);
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Estados para novas funcionalidades
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  const [formData, setFormData] = useState<RegistrationFormData>({
    nomeCompleto: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    nickname: "",
    genero: "",
    dataNascimento: "",
    cidadeEstado: "",
    interesses: [],
    termos: false,
    privacidade: false,
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const validatePassword = (pass: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(pass);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (formData.nomeCompleto.trim().length < 3) newErrors.nomeCompleto = "Mínimo 3 caracteres";
      if (!validateEmail(formData.email)) newErrors.email = "E-mail inválido";
      if (!validatePassword(formData.senha)) newErrors.senha = "Senha muito fraca";
      if (formData.senha !== formData.confirmarSenha) newErrors.confirmarSenha = "Senhas não conferem";
    }
    if (step === 2) {
      if (formData.nickname && (!/^[a-z0-9_.]+$/.test(formData.nickname) || formData.nickname.length < 3))
        newErrors.nickname = "Nickname inválido";
      if (RESERVED_NICKNAMES.includes(formData.nickname)) newErrors.nickname = "Nome reservado";
      if (!formData.dataNascimento || calculateAge(formData.dataNascimento) < 18) 
        newErrors.dataNascimento = "Apenas para 18+ anos";
      if (!formData.cidadeEstado.trim()) newErrors.cidadeEstado = "Campo obrigatório";
    }
    if (step === 4 && formData.interesses.length === 0) newErrors.interesses = "Selecione ao menos um foco";
    if (step === 5) {
      if (!formData.termos) newErrors.termos = "Aceite os termos";
      if (!formData.privacidade) newErrors.privacidade = "Aceite a política";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean = value;

    if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (name === "email" || name === "nickname") {
      finalValue = value.replace(/\s+/g, '').toLowerCase();
    }

    if (name === "cidadeEstado") {
      if (value.length >= 3) {
        const matches = CIDADES_SUGESTOES.filter(c => 
          c.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCities(matches);
      } else {
        setFilteredCities([]);
      }
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const toggleTag = (tag: string) => {
    const limit = (role === 'aluno' || role === 'influencer') ? 2 : 3;
    if (formData.interesses.includes(tag)) {
      setFormData(prev => ({ ...prev, interesses: prev.interesses.filter(t => t !== tag) }));
    } else if (formData.interesses.length < limit) {
      setFormData(prev => ({ ...prev, interesses: [...prev.interesses, tag] }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });
      if (res.ok) {
        onComplete(formData);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao sincronizar dados.");
      }
    } catch (e) {
      alert("Falha crítica na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 5;
  const tagLimit = (role === 'aluno' || role === 'influencer') ? 2 : 3;

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] text-[#F8FAFC] flex flex-col items-center font-sans overflow-y-auto scroll-smooth">
      
      <div className="fixed top-0 left-0 w-full z-100 pointer-events-none">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-3 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_15px_#0EA5E9]" />
             <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-sky-400">Ambiente de Testes • Versão Beta 1.0</span>
          </div>
          <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em] text-white/30 italic uppercase">Sincronização de Matriz</span>
        </div>
      </div>

      <header className="w-full max-w-7xl px-6 md:px-12 py-16 md:py-24 flex justify-between items-center z-20">
        <button onClick={onBack} className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
        <div className="text-right">
          <span className="text-[10px] font-black tracking-widest opacity-60 block">{time}</span>
          <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Passo {step}/{totalSteps}</span>
        </div>
      </header>

      <div className="w-full max-w-3xl px-6 mb-12">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(step/totalSteps)*100}%` }} className="h-full bg-sky-500 shadow-[0_0_15px_#0EA5E9]" />
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl px-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            
            {step === 1 && (
              <div className="space-y-6 text-center md:text-left">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">ACESSO AO <span className="text-sky-500">SISTEMA</span></h2>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Defina suas credenciais de entrada</p>
                <div className="space-y-4">
                  <Input name="nomeCompleto" icon={<User />} placeholder="Nome Completo" error={errors.nomeCompleto} value={formData.nomeCompleto} onChange={handleInputChange} />
                  <Input name="email" icon={<Mail />} placeholder="E-mail" type="email" error={errors.email} value={formData.email} onChange={handleInputChange} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      name="senha" 
                      icon={<Lock />} 
                      placeholder="Senha" 
                      type={showPass ? "text" : "password"} 
                      error={errors.senha} 
                      value={formData.senha} 
                      onChange={handleInputChange}
                      hasToggle
                      isToggled={showPass}
                      onToggle={() => setShowPass(!showPass)}
                    />
                    <Input 
                      name="confirmarSenha" 
                      icon={<Check />} 
                      placeholder="Repetir Senha" 
                      type={showConfirmPass ? "text" : "password"} 
                      error={errors.confirmarSenha} 
                      value={formData.confirmarSenha} 
                      onChange={handleInputChange}
                      hasToggle
                      isToggled={showConfirmPass}
                      onToggle={() => setShowConfirmPass(!showConfirmPass)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center md:text-left">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">IDENTIDADE <span className="text-sky-500">DIGITAL</span></h2>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Como sua marca pessoal será exibida</p>
                <div className="space-y-4">
                  <Input name="nickname" icon={<Hash />} placeholder="nickname" error={errors.nickname} value={formData.nickname} onChange={handleInputChange} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="dataNascimento" icon={<Calendar />} type="date" error={errors.dataNascimento} value={formData.dataNascimento} onChange={handleInputChange} />
                    <Select name="genero" icon={<User />} options={["Masculino", "Feminino", "Outro"]} value={formData.genero} onChange={handleInputChange} />
                  </div>
                  <div className="relative">
                    <Input name="cidadeEstado" icon={<MapPin />} placeholder="Cidade / Estado" error={errors.cidadeEstado} value={formData.cidadeEstado} onChange={handleInputChange} autoComplete="off" />
                    {filteredCities.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-[#0F172A] border border-white/10 rounded-2xl mt-2 overflow-hidden z-50 shadow-2xl">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, cidadeEstado: city }));
                              setFilteredCities([]);
                            }}
                            className="w-full text-left px-6 py-4 text-xs font-bold text-white/70 hover:bg-sky-500 hover:text-black transition-all border-b border-white/5 last:border-none"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Os demais steps permanecem os mesmos conforme solicitado */}
            {step === 3 && (
              <div className="space-y-6 text-center md:text-left">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">PERFIL <span className="text-sky-500">TÉCNICO</span></h2>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Sincronize sua rotina com o banco de dados</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {role === 'aluno' && (
                    <>
                      <Select name="nivel" icon={<Trophy />} options={["Nível: Iniciante", "Nível: Intermediário", "Nível: Avançado", "Nível: Atleta"]} onChange={handleInputChange} />
                      <Select name="freq" icon={<Clock />} options={["Frequência: 1-2x/sem", "Frequência: 3-5x/sem", "Frequência: Diária"]} onChange={handleInputChange} />
                      <Input name="peso" icon={<Activity />} placeholder="PESO (KG)" onChange={handleInputChange} />
                      <Input name="altura" icon={<ArrowLeft className="rotate-90"/>} placeholder="ALTURA (CM)" onChange={handleInputChange} />
                    </>
                  )}
                  {(role === 'personal' || role === 'nutri') && (
                    <>
                      <Input name="registro" icon={<Shield />} placeholder={role === 'personal' ? "CREF" : "CRN"} onChange={handleInputChange} />
                      <Input name="exp" icon={<Trophy />} placeholder="ANOS DE EXPERIÊNCIA" onChange={handleInputChange} />
                      <Select name="modalidade" icon={<Globe />} options={["Online", "Presencial", "Híbrido"]} onChange={handleInputChange} />
                      <Input name="especialidade" icon={<Target />} placeholder="ESPECIALIDADE FOCO" onChange={handleInputChange} />
                    </>
                  )}
                  {role === 'influencer' && (
                    <>
                      <Input name="seguidores" icon={<Users />} placeholder="QTD SEGUIDORES" onChange={handleInputChange} />
                      <Input name="nicho" icon={<Star />} placeholder="NICHO (EX: RECEITAS, TREINO)" onChange={handleInputChange} />
                      <Select name="rede" icon={<Globe />} options={["Instagram", "TikTok", "YouTube"]} onChange={handleInputChange} />
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">OBJETIVOS DE <span className="text-sky-500">PERFORMANCE</span></h2>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${formData.interesses.length === tagLimit ? 'bg-sky-500 text-black border-sky-500' : 'text-white/40 border-white/10'}`}>{formData.interesses.length}/{tagLimit}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESSES_LIST.map(t => <Tag key={t} text={t} active={formData.interesses.includes(t)} onClick={() => toggleTag(t)} />)}
                </div>
                {errors.interesses && <p className="text-[9px] text-red-500 font-black uppercase">{errors.interesses}</p>}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">TERMOS & <span className="text-sky-500">SEGURANÇA</span></h2>
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-3"><BookOpen className="w-4 h-4 text-sky-500" /><span className="text-[9px] font-black uppercase tracking-widest">Contrato Ativora OS</span></div>
                  <div className="p-6 max-h-40 overflow-y-auto custom-scrollbar text-[10px] text-white/50 leading-relaxed space-y-4 text-justify">
                    <p><strong className="text-white">1. OBJETO:</strong> O acesso à Matriz AtivoraFit é pessoal e intransferível.</p>
                    <p><strong className="text-white">2. DADOS:</strong> Você autoriza o processamento de métricas físicas para otimização de IA.</p>
                    <p><strong className="text-white">3. ÉTICA:</strong> Profissionais devem manter registro ativo (CREF/CRN) para atuar no ecossistema.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Checkbox name="termos" label="Confirmo a leitura e aceito os Termos" checked={formData.termos} onChange={handleInputChange} error={errors.termos} />
                  <Checkbox name="privacidade" label="Autorizo o processamento de dados" checked={formData.privacidade} onChange={handleInputChange} error={errors.privacidade} />
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="w-full flex flex-col md:flex-row gap-4 mt-12 mb-24">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black uppercase text-xs tracking-widest text-white hover:bg-white/10 transition-all">Voltar</button>}
          <button 
            onClick={step === totalSteps ? handleSubmit : () => validateStep() && setStep(s => s + 1)}
            disabled={loading}
            className="flex-2 py-6 md:py-8 bg-sky-500 text-[#010409] font-black text-xl md:text-2xl rounded-3xl md:rounded-4xl shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "SINCRONIZANDO..." : step === totalSteps ? "FINALIZAR MATRIZ" : "CONTINUAR"}
            {!loading && <ChevronRight className="w-6 h-6" />}
          </button>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

// --- COMPONENTES ATÔMICOS ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { 
  icon: React.ReactNode; 
  error?: string; 
  hasToggle?: boolean; 
  isToggled?: boolean; 
  onToggle?: () => void; 
}
const Input = ({ icon, error, hasToggle, isToggled, onToggle, ...props }: InputProps) => (
  <div className="flex flex-col gap-2 w-full text-left">
    <div className="relative group">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-500' : 'text-white/20 group-focus-within:text-sky-500'}`}>{icon}</div>
      <input 
        {...props} 
        className={`w-full bg-white/5 border rounded-2xl py-6 pl-14 pr-14 text-sm font-bold tracking-widest outline-none transition-all text-white ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-sky-500'}`} 
      />
      {hasToggle && (
        <button 
          type="button" 
          onClick={onToggle}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-sky-500 transition-colors"
        >
          {isToggled ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
    {error && <span className="text-[9px] text-red-500 font-black ml-4 uppercase tracking-widest">{error}</span>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { icon: React.ReactNode; options: string[]; }
const Select = ({ icon, options, ...props }: SelectProps) => (
  <div className="relative w-full group">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-500 transition-colors pointer-events-none">{icon}</div>
    <select {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-14 pr-6 text-sm font-bold tracking-widest outline-none focus:border-sky-500 appearance-none text-white">
      {options.map(o => <option key={o} value={o.split(':').pop()?.trim()} className="bg-slate-950 text-white">{o}</option>)}
    </select>
  </div>
);

interface CheckboxProps { label: string; checked: boolean; onChange: (e: ChangeEvent<HTMLInputElement>) => void; name: string; error?: string; }
const Checkbox = ({ label, checked, onChange, name, error }: CheckboxProps) => (
  <label className="flex items-center gap-4 cursor-pointer group w-full text-left">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
    <div className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-sky-500 border-sky-500' : error ? 'border-red-500' : 'border-white/10'}`}>{checked && <Check className="w-4 h-4 text-black stroke-4" />}</div>
    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${checked ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>{label}</span>
  </label>
);

const Tag = ({ text, active, onClick }: { text: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} type="button" className={`px-5 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-sky-500 border-sky-500 text-[#010307]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>{text}</button>
);