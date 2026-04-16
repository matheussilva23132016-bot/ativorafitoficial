"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Bell, CheckCircle2, ShieldCheck } from "lucide-react";

type WelcomeSlideProps = {
  userName?: string | null;
  role?: string | null;
};

const roleLabels: Record<string, string> = {
  aluno: "aluno",
  personal: "personal trainer",
  instrutor: "instrutor",
  nutri: "nutricionista",
  nutricionista: "nutricionista",
  influencer: "influenciador",
  adm: "administrador",
  admin: "administrador",
};

const getFirstName = (name?: string | null) => {
  const cleanName = name?.trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "bem-vindo";
};

const getRoleLabel = (role?: string | null) => {
  if (!role) return "perfil";
  return roleLabels[role.toLowerCase()] || "perfil";
};

export const WelcomeSlide = ({ userName, role }: WelcomeSlideProps) => {
  const firstName = getFirstName(userName);
  const roleLabel = getRoleLabel(role);

  const checkpoints = [
    { icon: CheckCircle2, label: "Conta validada" },
    { icon: ShieldCheck, label: "Sessão protegida" },
    { icon: Bell, label: "Avisos prontos" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.5 } }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#010307] px-5 py-8"
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        <motion.div
          animate={{
            y: [0, -8, 0],
            filter: [
              "drop-shadow(0 0 0px #0EA5E900)",
              "drop-shadow(0 0 22px #0EA5E955)",
              "drop-shadow(0 0 0px #0EA5E900)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-7 h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44"
        >
          <Image
            src="/logo.png"
            alt="AtivoraFit"
            fill
            className="object-contain opacity-90"
            priority
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3 text-[10px] font-black uppercase tracking-[0.45em] text-sky-400 sm:text-xs"
        >
          AtivoraFit pronto
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="max-w-4xl text-4xl font-black uppercase italic leading-[0.9] tracking-tighter text-white sm:text-6xl md:text-8xl"
        >
          Olá, <span className="text-sky-400">{firstName}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="mt-5 max-w-2xl text-sm font-semibold leading-relaxed text-white/70 sm:text-base md:text-lg"
        >
          Seu painel de {roleLabel} vai abrir com notificações e atalhos
          ajustados para a sua rotina no app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {checkpoints.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/75"
              >
                <Icon className="h-4 w-4 text-sky-400" />
                {item.label}
              </div>
            );
          })}
        </motion.div>

        <div className="mt-9 h-1 w-56 overflow-hidden rounded-full border border-white/10 bg-white/5 sm:w-72">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ delay: 0.55, duration: 1.8, ease: "easeInOut" }}
            className="h-full bg-sky-400 shadow-[0_0_24px_rgba(14,165,233,0.7)]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 1.2 }}
          className="mt-5 flex items-center gap-3"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/60 sm:text-[10px]">
            Abrindo dashboard
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};
