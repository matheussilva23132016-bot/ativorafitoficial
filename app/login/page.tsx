"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

type LoginErrors = {
  identificador?: string;
  senha?: string;
  general?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identificador: "", senha: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: LoginErrors = {};
    const identificador = formData.identificador.trim();

    if (identificador.length < 3) {
      nextErrors.identificador = "Informe seu e-mail ou nickname.";
    }

    if (!formData.senha) {
      nextErrors.senha = "Informe sua senha.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await signIn("credentials", {
        identificador: formData.identificador.trim().toLowerCase(),
        senha: formData.senha,
        redirect: false,
      });

      if (res?.error) {
        setErrors({ general: res.error });
        toast.error(res.error);
        return;
      }

      toast.success("Login confirmado. Abrindo seu dashboard.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      const rawMessage = err?.message || "";
      const message = rawMessage.includes("Unexpected token")
        ? "O servidor retornou uma página de erro em vez da resposta de login. Verifique as variáveis do banco e reinicie a aplicação."
        : rawMessage || "Não foi possível entrar agora.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh overflow-y-auto bg-[#010307] px-4 py-6 text-[#F8FAFC] md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>

        <Link
          href="/cadastro"
          className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-sky-300 transition hover:bg-sky-500/20"
        >
          <UserPlus className="h-4 w-4" />
          Criar conta
        </Link>
      </div>

      <main className="mx-auto grid min-h-[calc(100dvh-92px)] w-full max-w-6xl items-center gap-8 py-8 lg:grid-cols-[1fr_460px] lg:py-10">
        <section className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-sky-500/30 bg-sky-500/10">
              <Activity className="h-10 w-10 text-sky-400" />
            </div>

            <h1 className="text-6xl font-black uppercase italic leading-none tracking-[-0.06em]">
              Entre no <span className="text-sky-500">AtivoraFit</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg font-semibold leading-relaxed text-white/50">
              Use o mesmo e-mail ou nickname do cadastro para abrir seu dashboard, comunidades, treinos e nutrição.
            </p>

            <div className="mt-10 grid max-w-xl gap-3">
              {[
                "E-mail ou nickname cadastrado.",
                "Senha criada no cadastro ou redefinida por código.",
                "Conta ativa na tabela ativora_users.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-400" />
                  <span className="text-sm font-bold text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl backdrop-blur-2xl sm:p-8 md:rounded-[2rem]"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 lg:hidden">
              <Activity className="h-8 w-8 text-sky-400" />
            </div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-sky-400">Login</p>
            <h2 className="text-4xl font-black uppercase italic leading-none tracking-[-0.05em] text-white">
              Acessar <span className="text-sky-500">conta</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-relaxed text-white/40">
              Entre para continuar de onde parou no painel.
            </p>
          </div>

          {errors.general && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-left">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <p className="text-xs font-black uppercase leading-relaxed tracking-[0.14em] text-rose-300">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-white/35">E-mail ou nickname</span>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20" />
                <input
                  autoComplete="username"
                  inputMode="email"
                  placeholder="exemplo@email.com ou seu_nick"
                  className={`w-full rounded-2xl border bg-white/5 py-5 pl-14 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500 ${
                    errors.identificador ? "border-rose-500/60" : "border-white/10"
                  }`}
                  value={formData.identificador}
                  onChange={(e) => setFormData({ ...formData, identificador: e.target.value.replace(/\s+/g, "").toLowerCase() })}
                />
              </div>
              {errors.identificador && <span className="mt-2 block text-[10px] font-bold uppercase text-rose-300">{errors.identificador}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-white/35">Senha</span>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20" />
                <input
                  autoComplete="current-password"
                  type={showPass ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className={`w-full rounded-2xl border bg-white/5 py-5 pl-14 pr-14 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500 ${
                    errors.senha ? "border-rose-500/60" : "border-white/10"
                  }`}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
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
              {errors.senha && <span className="mt-2 block text-[10px] font-bold uppercase text-rose-300">{errors.senha}</span>}
            </label>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/forgot-password" className="text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:text-sky-200">
                Esqueci minha senha
              </Link>
              <span className="text-xs font-semibold text-white/30">Sem conta? Cadastre-se no botão acima.</span>
            </div>

            <button
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-sky-500 py-6 text-base font-black uppercase tracking-[0.08em] text-black shadow-[0_18px_36px_rgba(14,165,233,0.28)] transition hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Activity className="h-5 w-5 animate-pulse" />
                  Entrando
                </>
              ) : (
                <>
                  Acessar dashboard
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </motion.section>
      </main>
    </div>
  );
}
