"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, ChevronRight, Activity, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identificador: "", senha: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("@ativora_token", data.token);
      localStorage.setItem("@ativora_user", JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010307] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[440px] bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="text-sky-500" size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter">Acessar <span className="text-sky-500">Conta</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input required placeholder="E-MAIL OU NICKNAME" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-sm font-bold text-white outline-none focus:border-sky-500" value={formData.identificador} onChange={e => setFormData({...formData, identificador: e.target.value.toLowerCase()})} />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input required type={showPass ? "text" : "password"} placeholder="SUA SENHA" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-12 text-sm font-bold text-white outline-none focus:border-sky-500" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>

          {error && <p className="text-[10px] text-red-500 font-black uppercase text-center">{error}</p>}

          <button disabled={loading} className="w-full py-6 bg-sky-500 text-black font-black uppercase rounded-2xl shadow-[0_15px_30px_rgba(14,165,233,0.3)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <>IDENTIFICAR <ChevronRight size={18} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}