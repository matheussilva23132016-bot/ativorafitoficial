"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ClipboardList,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { FormDadosCorporais } from "../comunidades/nutricao/components/FormDadosCorporais";
import { EstimativaCorpo } from "../comunidades/nutricao/components/EstimativaCorpo";
import { FoodManualView } from "../comunidades/nutricao/components/FoodManualView";
import type { MedidasCorporais } from "../comunidades/nutricao/types";

interface NutritionViewProps {
  onBack: () => void;
  currentUser: any;
  onOpenCommunities?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

export function NutritionView({ onBack, currentUser, onOpenCommunities }: NutritionViewProps) {
  const [medidas, setMedidas] = useState<MedidasCorporais | null>(null);
  const [showManual, setShowManual] = useState(false);
  const role = String(currentUser?.role ?? "").toLowerCase();
  const isNutritionist = ["nutricionista", "nutri", "nutritionist"].includes(role);

  if (showManual) {
    return (
      <FoodManualView
        allowAccess={isNutritionist}
        onBack={() => setShowManual(false)}
        title="Manual de alimentos"
      />
    );
  }

  const funcionalidades = [
    {
      title: "Manual de alimentos",
      status: isNutritionist ? "Nutricionista" : "Restrito",
      desc: isNutritionist
        ? "Consulta A-Z com macros, objetivos, filtros e observações para montar cardápios com mais precisão."
        : "Acesso liberado apenas para contas cadastradas como nutricionista.",
      icon: BookOpen,
      enabled: isNutritionist,
      onClick: () => setShowManual(true),
    },
    {
      title: "AtivoraComunidades",
      status: "Disponível",
      desc: "Cardápios semanais publicados nas comunidades, pedidos à nutri, avaliação RFM e PDF offline.",
      icon: Users,
      enabled: true,
      onClick: onOpenCommunities,
    },
    {
      title: "Ativora Individual",
      status: "Em breve",
      desc: "Espaço reservado para cardápios particulares fora das comunidades.",
      icon: ClipboardList,
      enabled: false,
      onClick: undefined,
    },
  ];

  return (
    <motion.div
      key="nutrition-hub"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl space-y-6 text-left"
    >
      <motion.button
        variants={itemVariants}
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </motion.button>

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-sky-500/15 bg-[#06101D] p-5 sm:p-7 lg:p-8"
      >
        <div className="absolute right-[-40px] top-[-40px] hidden h-44 w-44 rounded-full border border-sky-500/10 lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <UtensilsCrossed size={12} />
              Nutrição
            </div>
            <h1 className="mt-5 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              Cardápios, medidas e <span className="text-sky-400">manual</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
              Abra cardápios vindos das comunidades, registre RFM/IMC/RCQ e, se for nutricionista, consulte o manual A-Z sem sair do app.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { label: "Avaliação", value: "RFM + IMC", icon: Scale },
              { label: "Publicação", value: "Comunidades", icon: Sparkles },
              { label: "Manual", value: isNutritionist ? "Liberado" : "Restrito", icon: ShieldCheck },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <item.icon className="text-sky-300" size={18} />
                <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/25">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.section variants={itemVariants} className="space-y-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Acessos de nutrição
            </p>
            <h2 className="mt-1 text-2xl font-black italic text-white">
              Escolha onde continuar
            </h2>
          </div>

          <div className="space-y-3">
            {funcionalidades.map(item => (
              <button
                key={item.title}
                type="button"
                disabled={!item.enabled}
                onClick={item.enabled ? item.onClick : undefined}
                className={`group w-full rounded-2xl border p-4 text-left transition-all ${
                  item.enabled
                    ? "border-sky-500/20 bg-sky-500/10 hover:border-sky-500/40 hover:bg-sky-500/20 active:scale-[0.99]"
                    : "cursor-not-allowed border-white/10 bg-white/5 opacity-55"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${item.enabled ? "bg-sky-500 text-black" : "bg-white/10 text-white/30"}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-white">{item.title}</h3>
                      <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                        item.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/30"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/40">{item.desc}</p>
                  </div>
                  {item.enabled ? (
                    <ArrowRight size={17} className="mt-1 shrink-0 text-sky-300 transition-transform group-hover:translate-x-1" />
                  ) : (
                    <Lock size={16} className="mt-1 shrink-0 text-white/20" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-5"
        >
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Avaliação rápida
            </p>
            <h2 className="mt-1 text-2xl font-black italic text-white">
              Estimativa RFM
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/35">
              Use peso, altura, cintura e quadril para estimar RFM, IMC, RCQ, massa gorda e massa magra. É apoio para acompanhamento online, não diagnóstico.
            </p>
          </div>

          <FormDadosCorporais
            alunoId={currentUser?.id ?? "aluno"}
            onChange={setMedidas}
            labelSalvar="Salvar avaliação"
          />

          {medidas && (
            <div className="mt-5">
              <EstimativaCorpo medidas={medidas} />
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
