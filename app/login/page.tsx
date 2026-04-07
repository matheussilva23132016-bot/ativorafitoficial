"use client";

import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  User, Lock, Eye, EyeOff, 
  ChevronRight, Activity, ArrowLeft 
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    identificador: "",
    senha: ""
  });
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === "identificador" ? value.replace(/\s+/g, '').toLowerCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identificador || !formData.senha) {
      setError("Preencha todos os campos para prosseguir.");
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch (err) {
      setError("Falha na autenticação.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] text-[#F8FAFC] flex flex-col items-center justify-center font-sans overflow-hidden">
      
      {/* 1. MARCA D'ÁGUA BETA (FIXA NO TOPO) */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-4 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_15px_#0EA5E9]" />
             <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-sky-400">Ambiente de Testes • Versão Beta 1.0</span>
          </div>
          <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">SISTEMA DE ACESSO RESTRITO</span>
        </div>
      </div>

      {/* BOTÃO VOLTAR (POSICIONAMENTO AJUSTADO) */}
      <div className="absolute top-28 left-6 md:left-12 z-20">
        <Link href="/" className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white transition-all group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Início</span>
        </Link>
      </div>

      <main className="w-full max-w-[440px] px-6 z-10 relative mt-10">
        {/* EFEITO DE LUZ DE FUNDO */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 blur-[140px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="relative bg-white/2 border border-white/10 p-8 md:p-14 rounded-[3.5rem] backdrop-blur-2xl shadow-2xl"
        >
          
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-20 h-20 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.2)] mb-8">
              <Activity className="text-sky-500 w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none mb-4">
              Acessar <span className="text-sky-500 text-6xl block md:inline">Conta</span>
            </h1>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.25em] leading-relaxed">
              Identifique-se para entrar <br className="hidden md:block"/> na plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input 
                name="identificador" 
                icon={<User size={20} />} 
                placeholder="E-MAIL OU NICKNAME" 
                value={formData.identificador} 
                onChange={handleInputChange} 
              />
              
              <Input 
                name="senha" 
                icon={<Lock size={20} />} 
                placeholder="SUA SENHA" 
                type={showPass ? "text" : "password"} 
                value={formData.senha} 
                onChange={handleInputChange}
                hasToggle
                isToggled={showPass}
                onToggle={() => setShowPass(!showPass)}
              />
            </div>
            
            <div className="flex justify-end px-2">
              {/* CORREÇÃO: href alterado de "#" para "/forgot-password" */}
              <Link href="/forgot-password" className="text-[10px] text-white/40 font-black uppercase tracking-widest hover:text-sky-500 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            {error && (
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest text-center animate-shake">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-7 bg-sky-500 text-[#010409] font-black text-xl rounded-3xl shadow-[0_20px_40px_rgba(14,165,233,0.2)] flex items-center justify-center gap-4 transition-all hover:bg-sky-400 hover:scale-[1.02] active:scale-95 disabled:opacity-50 group"
            >
              <span className="uppercase tracking-tighter">
                {loading ? "Sincronizando..." : "Entrar agora"}
              </span>
              {!loading && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] block mb-4">
              Novo por aqui?
            </span>
            <Link 
              href="/cadastro" 
              className="inline-flex items-center gap-2 text-xs text-white font-black uppercase tracking-[0.15em] hover:text-sky-500 transition-all group"
            >
              Criar Minha Conta
              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                 <ChevronRight size={14} className="group-hover:text-sky-500" />
              </div>
            </Link>
          </div>

        </motion.div>
      </main>
    </div>
  );
}

// --- INPUT LAPIDADO ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { 
  icon: React.ReactNode; 
  hasToggle?: boolean; 
  isToggled?: boolean; 
  onToggle?: () => void; 
}

const Input = ({ icon, hasToggle, isToggled, onToggle, ...props }: InputProps) => (
  <div className="relative group w-full">
    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-sky-500 transition-colors pointer-events-none">
      {icon}
    </div>
    <input 
      {...props} 
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-6 pl-16 pr-14 text-sm font-bold tracking-[0.1em] outline-none transition-all text-white focus:border-sky-500/50 focus:bg-white/[0.06] placeholder:text-white/10 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em]" 
    />
    {hasToggle && (
      <button 
        type="button" 
        onClick={onToggle}
        className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 hover:text-sky-500 transition-colors p-1"
      >
        {isToggled ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    )}
  </div>
);