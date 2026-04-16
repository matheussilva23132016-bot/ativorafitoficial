"use client";

import React, { useState, ChangeEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
} from "lucide-react";

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
  const [showPass, setShowPass] = useState(false);
  const [data, setData] = useState({
    email: "",
    code: "",
    password: "",
  });

  const handleAction = async () => {
    setError("");
    setLoading(true);

    try {
      if (step === 1) {
        const res = await enviarCodigo(data.email.trim().toLowerCase());
        if (res.success) setStep(2);
        else setError(res.error || "Não foi possível enviar o código.");
      } else if (step === 2) {
        const res = await validarCodigo(data.email.trim().toLowerCase(), data.code.trim());
        if (res.success) setStep(3);
        else setError(res.error || "Código inválido ou expirado.");
      } else if (step === 3) {
        const res = await redefinirSenha(data.email.trim().toLowerCase(), data.code.trim(), data.password);
        if (res.success) setStep(4);
        else setError(res.error || "Não foi possível atualizar a senha.");
      }
    } catch {
      setError("Não foi possível concluir a solicitação agora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh overflow-y-auto bg-[#010307] px-4 py-6 text-[#F8FAFC] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Login
        </Link>
      </div>

      <main className="mx-auto flex min-h-[calc(100dvh-92px)] w-full max-w-md items-center py-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-2xl sm:p-8 md:rounded-[2rem]"
        >
          <AnimatePresence mode="wait">
            {step < 4 ? (
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10">
                    {step === 1 && <Mail className="h-8 w-8 text-sky-400" />}
                    {step === 2 && <Key className="h-8 w-8 text-sky-400" />}
                    {step === 3 && <Lock className="h-8 w-8 text-sky-400" />}
                  </div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-sky-400">
                    Recuperação de acesso
                  </p>
                  <h1 className="text-4xl font-black uppercase italic leading-none tracking-[-0.05em]">
                    {step === 1 && <>Enviar <span className="text-sky-500">código</span></>}
                    {step === 2 && <>Validar <span className="text-sky-500">código</span></>}
                    {step === 3 && <>Nova <span className="text-sky-500">senha</span></>}
                  </h1>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-left">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                    <p className="text-xs font-black uppercase leading-relaxed tracking-[0.14em] text-rose-300">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {step === 1 && (
                    <Input
                      icon={<Mail className="h-5 w-5" />}
                      placeholder="E-mail cadastrado"
                      value={data.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setData({ ...data, email: e.target.value })}
                    />
                  )}

                  {step === 2 && (
                    <Input
                      icon={<Key className="h-5 w-5" />}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Código de 6 dígitos"
                      value={data.code}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setData({ ...data, code: e.target.value.replace(/\D/g, "") })}
                    />
                  )}

                  {step === 3 && (
                    <div className="relative">
                      <Input
                        icon={<Lock className="h-5 w-5" />}
                        type={showPass ? "text" : "password"}
                        placeholder="Nova senha forte"
                        value={data.password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setData({ ...data, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((current) => !current)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
                        aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAction}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-500 py-6 text-base font-black uppercase tracking-[0.08em] text-black shadow-[0_18px_36px_rgba(14,165,233,0.28)] transition hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Processando" : step === 3 ? "Atualizar senha" : "Continuar"}
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-sky-400" />
                <h2 className="text-3xl font-black uppercase italic tracking-[-0.04em] text-white">Senha alterada</h2>
                <p className="mx-auto mt-4 max-w-xs text-sm font-semibold text-white/45">Agora entre novamente usando sua nova senha.</p>
                <Link href="/login" className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-white/5 py-6 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10">
                  Ir para o login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
}

const Input = ({ icon, ...props }: InputProps) => (
  <div className="relative w-full text-left">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">{icon}</div>
    <input
      {...props}
      className="w-full rounded-2xl border border-white/10 bg-white/5 py-5 pl-14 pr-14 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500"
    />
  </div>
);
