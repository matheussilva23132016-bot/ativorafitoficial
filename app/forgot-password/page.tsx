"use client";

import React, { useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, Key, ChevronRight, 
  ArrowLeft, CheckCircle2 
} from "lucide-react";
import Link from "next/link";

// --- FUNÇÕES DE API ---
async function enviarCodigo(email: string) {
  const res = await fetch("/api/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

async function validarCodigo(email: string, code: string) {
  const res = await fetch("/api/verify-reset-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return res.json();
}

async function redefinirSenha(email: string, code: string, password: string) {
  const res = await fetch("/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, password }),
  });
  return res.json();
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [data, setData] = useState({
    email: "",
    code: "",
    password: ""
  });

  const handleAction = async () => {
    setError("");
    setLoading(true);
    
    try {
      if (step === 1) {
        const res = await enviarCodigo(data.email);
        if (res.success) setStep(2);
        else setError(res.error || "E-mail não encontrado.");
      } 
      else if (step === 2) {
        const res = await validarCodigo(data.email, data.code);
        if (res.success) setStep(3);
        else setError(res.error || "Código inválido ou expirado.");
      }
      else if (step === 3) {
        const res = await redefinirSenha(data.email, data.code, data.password);
        if (res.success) setStep(4);
        else setError(res.error || "Erro ao atualizar senha.");
      }
    } catch {
      setError("Falha na conexão com o sistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] text-[#F8FAFC] flex flex-col items-center justify-center font-sans overflow-hidden p-6">
      
      <div className="fixed top-0 left-0 w-full z-50">
        <div className="bg-sky-500/10 border-b border-sky-500/30 backdrop-blur-xl py-4 px-6 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400">Recuperação de Acesso</span>
          <span className="text-[9px] font-black text-white/20 italic">ATIVORA OS v1.0</span>
        </div>
      </div>

      <main className="w-full max-w-md z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[3rem] backdrop-blur-xl shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {step < 4 ? (
              <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className="text-center mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto mb-6">
                    {step === 1 && <Mail className="text-sky-500" />}
                    {step === 2 && <Key className="text-sky-500" />}
                    {step === 3 && <Lock className="text-sky-500" />}
                  </div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                    {step === 1 && "Esqueceu a "}
                    {step === 2 && "Validar "}
                    {step === 3 && "Nova "}
                    <span className="text-sky-500">
                      {step === 1 && "Senha?"}
                      {step === 2 && "Código"}
                      {step === 3 && "Senha"}
                    </span>
                  </h1>
                </div>

                <div className="space-y-4">
                  {step === 1 && (
                    <Input 
                      icon={<Mail size={18}/>} 
                      placeholder="SEU E-MAIL" 
                      value={data.email} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setData({...data, email: e.target.value})} 
                    />
                  )}
                  {step === 2 && (
                    <Input 
                      icon={<Key size={18}/>} 
                      placeholder="CÓDIGO DE 6 DÍGITOS" 
                      value={data.code} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setData({...data, code: e.target.value})} 
                    />
                  )}
                  {step === 3 && (
                    <Input 
                      icon={<Lock size={18}/>} 
                      type="password" 
                      placeholder="NOVA SENHA" 
                      value={data.password} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setData({...data, password: e.target.value})} 
                    />
                  )}
                  
                  {error && <p className="text-[10px] text-red-500 font-black uppercase text-center">{error}</p>}

                  <button 
                    onClick={handleAction} disabled={loading}
                    className="w-full py-6 bg-sky-500 text-black font-black rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? "PROCESSANDO..." : step === 3 ? "ATUALIZAR SENHA" : "CONTINUAR"}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-6">
                <CheckCircle2 size={60} className="text-sky-500 mx-auto mb-6 animate-bounce" />
                <h2 className="text-2xl font-black uppercase italic text-white">Senha Alterada!</h2>
                <Link href="/login" className="mt-8 inline-block w-full py-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all text-center">
                  Ir para o Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-8 text-center">
          <Link href="/login" className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Voltar ao Login
          </Link>
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTE DE INPUT TIPADO ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const Input = ({ icon, ...props }: InputProps) => (
  <div className="relative group w-full text-left">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-500 transition-colors">{icon}</div>
    <input {...props} className="w-full bg-[#010307] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold tracking-widest outline-none transition-all text-white focus:border-sky-500 placeholder:text-white/10" />
  </div>
);