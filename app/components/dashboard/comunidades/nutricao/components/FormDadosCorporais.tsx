"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Calculator, HelpCircle, Loader2,
  Ruler, Save, Scale, Weight,
} from "lucide-react";
import type { SexoBio, MedidasCorporais } from "../types";
import { processarMedidas } from "../utils";

interface Props {
  alunoId: string;
  inicial?: Partial<MedidasCorporais>;
  onChange?: (medidas: MedidasCorporais) => void;
  onSalvar?: (medidas: MedidasCorporais) => Promise<void>;
  labelSalvar?: string;
}

type Campo = "peso" | "altura" | "cintura";

const CAMPOS: {
  key: Campo;
  label: string;
  unidade: string;
  min: number;
  max: number;
  placeholder: string;
  ajuda: string;
  icon: any;
}[] = [
  {
    key: "peso",
    label: "Peso atual",
    unidade: "kg",
    min: 30,
    max: 250,
    placeholder: "ex: 72",
    ajuda: "Use uma balança em chão firme, de preferência pela manhã.",
    icon: Weight,
  },
  {
    key: "altura",
    label: "Altura",
    unidade: "cm",
    min: 100,
    max: 230,
    placeholder: "ex: 170",
    ajuda: "Informe sua altura em centímetros, sem sapatos.",
    icon: Ruler,
  },
  {
    key: "cintura",
    label: "Cintura",
    unidade: "cm",
    min: 40,
    max: 200,
    placeholder: "ex: 82",
    ajuda: "Meça na altura do umbigo, com abdômen relaxado, sem prender a respiração.",
    icon: Activity,
  },
];

const formatFormula = (sexo: SexoBio) =>
  sexo === "masculino"
    ? "RFM = 64 - (20 x altura / cintura)"
    : "RFM = 76 - (20 x altura / cintura)";

export function FormDadosCorporais({
  alunoId,
  inicial,
  onChange,
  onSalvar,
  labelSalvar = "Salvar avaliação",
}: Props) {
  const [sexo, setSexo] = useState<SexoBio>(inicial?.sexo ?? "masculino");
  const [valores, setValores] = useState<Record<Campo, string>>({
    peso: String(inicial?.peso ?? ""),
    altura: String(inicial?.altura ?? ""),
    cintura: String(inicial?.cintura ?? ""),
  });
  const [dicaAberta, setDicaAberta] = useState<Campo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [medidasAtual, setMedidasAtual] = useState<MedidasCorporais | null>(null);

  const recalcular = (
    vals: Record<Campo, string>,
    sexoAtual: SexoBio,
  ): MedidasCorporais | null => {
    const peso = Number(vals.peso);
    const altura = Number(vals.altura);
    const cintura = Number(vals.cintura);

    if (peso > 0 && altura > 0 && cintura > 0) {
      return processarMedidas({
        alunoId,
        data: new Date().toISOString(),
        sexo: sexoAtual,
        peso,
        altura,
        cintura,
      });
    }

    return null;
  };

  const aplicarResultado = (resultado: MedidasCorporais | null) => {
    setMedidasAtual(resultado);
    if (resultado) onChange?.(resultado);
  };

  const handleChange = (key: Campo, raw: string) => {
    const next = { ...valores, [key]: raw };
    setValores(next);
    setSalvoOk(false);
    aplicarResultado(recalcular(next, sexo));
  };

  const handleSexo = (s: SexoBio) => {
    setSexo(s);
    setSalvoOk(false);
    aplicarResultado(recalcular(valores, s));
  };

  const handleSalvar = async () => {
    if (!medidasAtual || !onSalvar) return;
    setSalvando(true);
    try {
      await onSalvar(medidasAtual);
      setSalvoOk(true);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
        <div className="flex items-start gap-3">
          <Calculator size={18} className="mt-0.5 shrink-0 text-sky-400" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Avaliação rápida por RFM
            </p>
            <p className="text-[10px] leading-relaxed text-white/35">
              A estimativa usa a equação de Massa Gorda Relativa com sexo biológico, altura e cintura. O peso entra para estimar massa gorda e massa magra em kg.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-white/30">
          Sexo biológico <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["masculino", "feminino"] as SexoBio[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSexo(s)}
              className={`rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all
                ${sexo === s
                  ? "border-sky-500/40 bg-sky-500/15 text-sky-300"
                  : "border-white/5 bg-white/5 text-white/30 active:bg-white/10"}`}
            >
              {s === "masculino" ? "Masculino" : "Feminino"}
            </button>
          ))}
        </div>
        <p className="text-[8px] font-medium italic text-white/18">
          Fórmula usada: {formatFormula(sexo)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CAMPOS.map(campo => {
          const Icon = campo.icon;
          return (
            <div key={campo.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-white/30">
                  <Icon size={11} className="text-white/20" />
                  {campo.label}
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDicaAberta(dicaAberta === campo.key ? null : campo.key)}
                  className="text-white/15 transition-colors hover:text-sky-400"
                  aria-label={`Ajuda sobre ${campo.label}`}
                >
                  <HelpCircle size={11} />
                </button>
              </div>

              <AnimatePresence>
                {dicaAberta === campo.key && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-lg border border-sky-500/10 bg-sky-500/5 px-3 py-2 text-[9px] leading-relaxed text-sky-300/75"
                  >
                    {campo.ajuda}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={campo.min}
                  max={campo.max}
                  value={valores[campo.key]}
                  onChange={event => handleChange(campo.key, event.target.value)}
                  placeholder={campo.placeholder}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 pr-10 text-sm text-white/80 outline-none transition-all placeholder:text-white/15 focus:border-sky-500/45"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-white/20">
                  {campo.unidade}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {medidasAtual && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Gordura RFM", value: `${medidasAtual.gorduraEst?.toFixed(1)}%` },
            { label: "Massa gorda", value: `${medidasAtual.massaGordaKg?.toFixed(1)} kg` },
            { label: "Massa magra", value: `${medidasAtual.massaMagraKg?.toFixed(1)} kg` },
            { label: "IMC", value: medidasAtual.imc?.toFixed(1) ?? "-" },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[7px] font-black uppercase tracking-widest text-white/20">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-black italic text-white/70">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
        <Scale size={14} className="mt-0.5 shrink-0 text-amber-400" />
        <p className="text-[9px] leading-relaxed text-amber-300/75">
          Isso é uma estimativa de apoio para atendimento online, não diagnóstico. O profissional pode revisar e ajustar tudo antes de publicar o cardápio.
        </p>
      </div>

      {onSalvar && (
        <button
          type="button"
          onClick={handleSalvar}
          disabled={!medidasAtual || salvando}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all
            ${salvoOk
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "bg-sky-500 text-black active:scale-95 hover:bg-sky-400"}
            disabled:cursor-not-allowed disabled:opacity-30`}
        >
          {salvando
            ? <><Loader2 size={13} className="animate-spin" /> Salvando...</>
            : salvoOk
              ? "Avaliação salva"
              : <><Save size={13} /> {labelSalvar}</>}
        </button>
      )}
    </div>
  );
}
