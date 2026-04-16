"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Lock, MapPin, Hash, 
  ChevronRight, ArrowLeft, Check, Calendar, Eye, EyeOff,
  Target, Trophy, Activity, Shield, Globe, Star, 
  Users, AlertCircle, Loader2
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

// --- CONFIGURAÇÕES DO CADASTRO ---
const RESERVED_NICKNAMES = ["admin", "suporte", "ativorafit", "root", "system"];

const INTERESSES_LIST = [
  "Hipertrofia", "Emagrecimento", "Saúde", "Performance", "Consultoria", 
  "Lifestyle", "Nutrição", "Flexibilidade", "Treino Funcional", "Atendimento Online"
];

const CIDADES_SUGESTOES = ["Salvador, BA", "São Paulo, SP", "Rio de Janeiro, RJ", "Brasília, DF", "Belo Horizonte, MG"];

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
  // Campos Técnicos Inicializados
  nivel: string;
  freq: string;
  peso: string;
  altura: string;
  registro: string;
  exp: string;
  modalidade: string;
  especialidade: string;
  seguidores: string;
  nicho: string;
  rede: string;
}

interface RegistrationProps {
  role: string;
  onBack: () => void;
  onComplete: (data: RegistrationFormData) => void;
}

export const RegistrationFlow = ({ role, onBack, onComplete }: RegistrationProps) => {
  const router = useRouter();
  const normalizedRole = role === "nutricionista" ? "nutri" : role;
  const isTrainerRole = normalizedRole === "personal" || normalizedRole === "instrutor";
  const isProfessionalRole = isTrainerRole || normalizedRole === "nutri";
  const registroLabel =
    normalizedRole === "personal"
      ? "Nº CREF"
      : normalizedRole === "instrutor"
        ? "Documento profissional do instrutor"
        : "Nº CRN";
  const registroError =
    normalizedRole === "personal"
      ? "Informe seu CREF"
      : normalizedRole === "instrutor"
        ? "Informe o documento profissional do instrutor"
        : "Informe seu CRN";
  const [step, setStep] = useState(1);
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    nomeCompleto: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    nickname: "",
    genero: "Masculino",
    dataNascimento: "",
    cidadeEstado: "",
    interesses: [],
    termos: false,
    privacidade: false,
    nivel: "Iniciante",
    freq: "3-5x por semana",
    peso: "",
    altura: "",
    registro: "",
    exp: "",
    modalidade: "Online",
    especialidade: "",
    seguidores: "",
    nicho: "",
    rede: "Instagram"
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
  const validateNickname = (nickname: string) => /^[a-z0-9_.]{3,30}$/.test(nickname);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (formData.nomeCompleto.trim().length < 3) newErrors.nomeCompleto = "Mínimo 3 caracteres";
      if (!validateEmail(formData.email)) newErrors.email = "E-mail inválido";
      if (!validatePassword(formData.senha)) newErrors.senha = "Senha fraca (8 carac, símbolo e maiúscula)";
      if (formData.senha !== formData.confirmarSenha) newErrors.confirmarSenha = "Senhas não conferem";
    }
    if (step === 2) {
      if (!validateNickname(formData.nickname)) newErrors.nickname = "Use 3 a 30 letras, números, ponto ou underline";
      if (RESERVED_NICKNAMES.includes(formData.nickname)) newErrors.nickname = "Nome reservado";
      if (!formData.dataNascimento) newErrors.dataNascimento = "Informe sua data de nascimento";
      if (!formData.cidadeEstado.trim()) newErrors.cidadeEstado = "Informe sua localização";
    }
    if (step === 3 && isProfessionalRole) {
      if (!formData.registro.trim()) newErrors.registro = registroError;
      if (!formData.especialidade.trim()) newErrors.especialidade = "Informe seu foco principal";
    }
    if (step === 3 && normalizedRole === "influencer") {
      if (!formData.nicho.trim()) newErrors.nicho = "Informe seu nicho";
      if (!formData.rede.trim()) newErrors.rede = "Informe sua rede principal";
    }
    if (step === 4 && formData.interesses.length === 0) newErrors.interesses = "Selecione ao menos um foco";
    if (step === 5) {
      if (!formData.termos) newErrors.termos = "Aceite os termos";
      if (!formData.privacidade) newErrors.privacidade = "Autorize o uso dos dados essenciais";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    if (name === "email" || name === "nickname") finalValue = value.replace(/\s+/g, '').toLowerCase();

    if (name === "cidadeEstado" && value.length >= 3) {
      setFilteredCities(CIDADES_SUGESTOES.filter(c => c.toLowerCase().includes(value.toLowerCase())));
    } else if (name === "cidadeEstado") {
      setFilteredCities([]);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setErrors({});

    try {
      // 1. Registro via API Prisma
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: normalizedRole })
      });
      
      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || "Não foi possível criar sua conta." });
        setLoading(false);
        return;
      }

      // 2. Login Automático via NextAuth
      const loginRes = await signIn("credentials", {
        identificador: formData.email,
        senha: formData.senha,
        redirect: false,
      });

      if (loginRes?.error) {
        toast.error("Atleta registrado, mas falha no acesso inicial: " + loginRes.error);
        router.push('/login');
        return;
      }
      
      toast.success("Conta criada. Bem-vindo ao AtivoraFit.");
      onComplete(formData);
      router.push('/dashboard');

    } catch (e) {
      setErrors({ general: "Sem sinal com o servidor. Verifique o banco de dados." });
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    const limit = (normalizedRole === 'aluno' || normalizedRole === 'influencer') ? 2 : 3;
    setFormData(prev => ({
      ...prev,
      interesses: prev.interesses.includes(tag) 
        ? prev.interesses.filter(t => t !== tag) 
        : prev.interesses.length < limit ? [...prev.interesses, tag] : prev.interesses
    }));
  };

  const totalSteps = 5;

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] text-[#F8FAFC] flex flex-col items-center font-sans overflow-y-auto scroll-smooth">
      
      {/* HEADER FIXO */}
      <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-3 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_15px_#0EA5E9]" />
             <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.5em] text-sky-400">AtivoraFit • Beta 1.0</span>
          </div>
        </div>
      </div>

      <header className="w-full max-w-7xl px-6 md:px-12 py-16 md:py-24 flex justify-between items-center z-20">
        <button onClick={onBack} className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
        <div className="text-right">
          <span className="text-[10px] font-black tracking-widest opacity-60 block">{time}</span>
          <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest italic">Etapa {step}/{totalSteps}</span>
        </div>
      </header>

      <div className="w-full max-w-3xl px-6 mb-12">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(step/totalSteps)*100}%` }} className="h-full bg-sky-500 shadow-[0_0_15px_#0EA5E9]" />
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl px-6 z-10 pb-20 text-left">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            
            {errors.general && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-rose-500/10 border border-rose-500/50 p-5 rounded-3xl mb-8 flex items-center gap-4">
                <AlertCircle className="text-rose-500 shrink-0" size={24} />
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest leading-tight">{errors.general}</span>
              </motion.div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">CRIE SUA <span className="text-sky-500">CONTA</span></h2>
                <div className="space-y-4">
                  <Input name="nomeCompleto" icon={<User />} placeholder="Nome Completo" error={errors.nomeCompleto} value={formData.nomeCompleto} onChange={handleInputChange} />
                  <Input name="email" icon={<Mail />} placeholder="E-mail" type="email" error={errors.email} value={formData.email} onChange={handleInputChange} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="senha" icon={<Lock />} placeholder="Senha" type={showPass ? "text" : "password"} error={errors.senha} value={formData.senha} onChange={handleInputChange} hasToggle isToggled={showPass} onToggle={() => setShowPass(!showPass)} />
                    <Input name="confirmarSenha" icon={<Check />} placeholder="Repetir Senha" type={showConfirmPass ? "text" : "password"} error={errors.confirmarSenha} value={formData.confirmarSenha} onChange={handleInputChange} hasToggle isToggled={showConfirmPass} onToggle={() => setShowConfirmPass(!showConfirmPass)} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">SEU <span className="text-sky-500">PERFIL</span></h2>
                <div className="space-y-4">
                  <Input name="nickname" icon={<Hash />} placeholder="Seu nickname (ex: matheus_pro)" error={errors.nickname} value={formData.nickname} onChange={handleInputChange} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="dataNascimento" icon={<Calendar />} type="date" error={errors.dataNascimento} value={formData.dataNascimento} onChange={handleInputChange} />
                    <Select name="genero" icon={<User />} options={["Masculino", "Feminino", "Outro"]} value={formData.genero} onChange={handleInputChange} />
                  </div>
                  <div className="relative">
                    <Input name="cidadeEstado" icon={<MapPin />} placeholder="Sua Cidade / Estado" error={errors.cidadeEstado} value={formData.cidadeEstado} onChange={handleInputChange} />
                    {filteredCities.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-[#0F172A] border border-white/10 rounded-2xl mt-2 overflow-hidden z-50 shadow-2xl">
                        {filteredCities.map(city => (
                          <button key={city} onClick={() => { setFormData(prev => ({ ...prev, cidadeEstado: city })); setFilteredCities([]); }} className="w-full text-left px-6 py-4 text-xs font-bold text-white/70 hover:bg-sky-500 hover:text-black transition-all border-b border-white/5 last:border-none">{city}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">PERFIL <span className="text-sky-500">TÉCNICO</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {normalizedRole === 'aluno' && (
                    <>
                      <Select name="nivel" icon={<Trophy />} value={formData.nivel} options={["Iniciante", "Intermediário", "Avançado", "Atleta"]} onChange={handleInputChange} />
                      <Select name="freq" icon={<Activity />} value={formData.freq} options={["1-2x por semana", "3-5x por semana", "Diário"]} onChange={handleInputChange} />
                      <Input name="peso" icon={<Activity />} type="number" placeholder="PESO ATUAL (KG)" value={formData.peso} onChange={handleInputChange} />
                      <Input name="altura" icon={<ArrowLeft className="rotate-90"/>} type="number" placeholder="ALTURA (CM)" value={formData.altura} onChange={handleInputChange} />
                    </>
                  )}
                  {isProfessionalRole && (
                    <>
                      <Input name="registro" icon={<Shield />} placeholder={registroLabel} error={errors.registro} value={formData.registro} onChange={handleInputChange} />
                      <Input name="exp" icon={<Trophy />} type="number" placeholder="ANOS DE EXPERIÊNCIA" value={formData.exp} onChange={handleInputChange} />
                      <Select name="modalidade" icon={<Globe />} value={formData.modalidade} options={["Online", "Presencial", "Híbrido"]} onChange={handleInputChange} />
                      <Input name="especialidade" icon={<Target />} placeholder={normalizedRole === "instrutor" ? "MODALIDADE / AULA PRINCIPAL" : "FOCO PRINCIPAL"} error={errors.especialidade} value={formData.especialidade} onChange={handleInputChange} />
                    </>
                  )}
                  {normalizedRole === 'influencer' && (
                    <>
                      <Input name="seguidores" icon={<Users />} type="number" placeholder="SEGUIDORES APROXIMADOS" value={formData.seguidores} onChange={handleInputChange} />
                      <Input name="nicho" icon={<Target />} placeholder="NICHO PRINCIPAL" error={errors.nicho} value={formData.nicho} onChange={handleInputChange} />
                      <Select name="rede" icon={<Globe />} value={formData.rede} options={["Instagram", "TikTok", "YouTube", "X/Twitter", "Outra"]} onChange={handleInputChange} />
                      <Input name="especialidade" icon={<Star />} placeholder="TIPO DE CONTEÚDO" value={formData.especialidade} onChange={handleInputChange} />
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">SEUS <span className="text-sky-500">OBJETIVOS</span></h2>
                <div className="flex flex-wrap gap-2">
                  {INTERESSES_LIST.map(t => <Tag key={t} text={t} active={formData.interesses.includes(t)} onClick={() => toggleTag(t)} />)}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">TERMOS & <span className="text-sky-500">SEGURANÇA</span></h2>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-[10px] text-white/50 space-y-4">
                  <p><strong className="text-white">1. OBJETO:</strong> Acesso ao AtivoraFit para treino, nutrição, social, comunidades e evolução pessoal.</p>
                  <p><strong className="text-white">2. DADOS:</strong> Uso de informações essenciais para cadastro, segurança, personalização e funcionamento do app.</p>
                </div>
                <div className="space-y-4">
                  <Checkbox name="termos" label="Aceito os Termos de Uso" checked={formData.termos} onChange={handleInputChange} error={errors.termos} />
                  <Checkbox name="privacidade" label="Autorizo o uso dos dados essenciais" checked={formData.privacidade} onChange={handleInputChange} error={errors.privacidade} />
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="w-full flex flex-col md:flex-row gap-4 mt-12">
          {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl font-black uppercase text-xs text-white hover:bg-white/10 transition-all italic">Anterior</button>}
          <button 
            onClick={step === totalSteps ? handleSubmit : () => validateStep() && setStep(s => s + 1)}
            disabled={loading}
            className="flex-2 py-6 md:py-8 bg-sky-500 text-[#010409] font-black text-xl md:text-2xl rounded-3xl md:rounded-4xl shadow-[0_0_20px_rgba(14,165,233,0.4)] flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={32} className="animate-spin" /> : step === totalSteps ? "CRIAR CONTA" : "PRÓXIMO PASSO"}
            {!loading && <ChevronRight className="w-6 h-6" />}
          </button>
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTES ATÔMICOS ---
const Input = ({ icon, error, hasToggle, isToggled, onToggle, ...props }: any) => (
  <div className="flex flex-col gap-2 w-full">
    <div className="relative group">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-500' : 'text-white/20 group-focus-within:text-sky-500'}`}>{icon}</div>
      <input {...props} className={`w-full bg-white/5 border rounded-2xl py-6 pl-14 pr-14 text-sm font-bold tracking-widest outline-none transition-all text-white ${error ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10 focus:border-sky-500'}`} />
      {hasToggle && (
        <button type="button" onClick={onToggle} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-sky-500 transition-colors">
          {isToggled ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
    {error && <span className="text-[9px] text-rose-500 font-black ml-4 uppercase italic">{error}</span>}
  </div>
);

const Select = ({ icon, options, ...props }: any) => (
  <div className="relative w-full group">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-500 transition-colors pointer-events-none">{icon}</div>
    <select {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-14 pr-6 text-sm font-bold tracking-widest outline-none focus:border-sky-500 appearance-none text-white cursor-pointer">
      {options.map((o: string) => <option key={o} value={o} className="bg-slate-950 text-white">{o}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, checked, onChange, name, error }: any) => (
  <label className="flex items-center gap-4 cursor-pointer group w-full">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="hidden" />
    <div className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-sky-500 border-sky-500 shadow-[0_0_10px_#0EA5E9]' : error ? 'border-rose-500' : 'border-white/10'}`}>{checked && <Check className="w-4 h-4 text-black stroke-[4]" />}</div>
    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${checked ? 'text-white' : 'text-white/40 group-hover:text-white/60'} italic`}>{label}</span>
  </label>
);

const Tag = ({ text, active, onClick }: { text: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} type="button" className={`px-5 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-sky-500 border-sky-500 text-[#010307] shadow-[0_0_10px_#0EA5E9]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'} italic`}>{text}</button>
);
