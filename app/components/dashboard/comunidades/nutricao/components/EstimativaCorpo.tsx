"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Activity, Scale, TrendingUp } from "lucide-react";
import type { MedidasCorporais } from "../types";
import {
  classificarGordura,
  classificarIMC,
  classificarRCQ,
  DISCLAIMER_COMPOSICAO,
} from "../utils";

interface Props {
  medidas: MedidasCorporais;
  semDisclaimer?: boolean;
}

function BarraProgresso({
  valor,
  min,
  max,
  cor,
}: {
  valor: number;
  min: number;
  max: number;
  cor: string;
}) {
  const pct = Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${cor}`}
      />
    </div>
  );
}

function MetricaCard({
  icon: Icon,
  label,
  valor,
  unidade,
  classificacao,
  corClass,
  barraMin,
  barraMax,
}: {
  icon: any;
  label: string;
  valor: number;
  unidade: string;
  classificacao: string;
  corClass: string;
  barraMin: number;
  barraMax: number;
}) {
  const corBarra = corClass.replace("text-", "bg-");
  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className={corClass} />
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
            {label}
          </span>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest ${corClass}`}>
          {classificacao}
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-black italic leading-none text-white">
          {valor.toFixed(1)}
        </span>
        <span className="mb-0.5 text-[9px] font-black uppercase text-white/20">
          {unidade}
        </span>
      </div>
      <BarraProgresso valor={valor} min={barraMin} max={barraMax} cor={corBarra} />
    </div>
  );
}

export function EstimativaCorpo({ medidas, semDisclaimer = false }: Props) {
  const {
    imc,
    rcq,
    gorduraEst,
    sexo,
    peso,
    altura,
    cintura,
    quadril,
    metodoCalculo,
    massaGordaKg,
    massaMagraKg,
    recomendacaoCorporal,
  } = medidas;

  if (!imc || !gorduraEst) return null;

  const imcClass = classificarIMC(imc);
  const rcqInfo = rcq ? classificarRCQ(rcq, sexo) : null;
  const gordInfo = classificarGordura(gorduraEst, sexo);
  const massaGorda = massaGordaKg ?? parseFloat((peso * (gorduraEst / 100)).toFixed(1));
  const massaMagra = massaMagraKg ?? parseFloat(Math.max(0, peso - massaGorda).toFixed(1));
  const recomendacao = recomendacaoCorporal ?? (
    gorduraEst >= (sexo === "masculino" ? 25 : 32) || imc >= 30
      ? "Prioridade: déficit calórico controlado, alta ingestão proteica, fibras e acompanhamento semanal para reduzir gordura sem perder massa magra."
      : imc >= 25 || gorduraEst >= (sexo === "masculino" ? 20 : 27)
        ? "Prioridade: recomposição corporal com leve déficit ou manutenção, treino consistente e distribuição proteica ao longo do dia."
        : "Prioridade: ajustar calorias ao objetivo, manter boa ingestão proteica e acompanhar evolução semanal."
  );
  const gordMin = sexo === "masculino" ? 3 : 10;
  const gordMax = sexo === "masculino" ? 35 : 45;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30">
          <Activity size={12} className="text-sky-500" />
          Estimativa corporal
        </h4>
        {metodoCalculo && (
          <span className="rounded-lg bg-white/5 px-2 py-1 text-[7px] font-black uppercase tracking-widest text-white/15">
            Método: {metodoCalculo === "rfm" ? "RFM" : metodoCalculo === "navy" ? "Navy" : "RCQ"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricaCard
          icon={Scale}
          label="IMC"
          valor={imc}
          unidade="kg/m²"
          classificacao={imcClass}
          corClass={
            imc < 18.5 ? "text-sky-400"
              : imc < 25 ? "text-emerald-500"
                : imc < 30 ? "text-amber-500"
                  : "text-rose-500"
          }
          barraMin={15}
          barraMax={45}
        />
        <MetricaCard
          icon={Activity}
          label="Gordura RFM"
          valor={gorduraEst}
          unidade="%"
          classificacao={gordInfo.label}
          corClass={gordInfo.cor}
          barraMin={gordMin}
          barraMax={gordMax}
        />
        {rcq && rcqInfo ? (
          <MetricaCard
            icon={TrendingUp}
            label="Cintura / Quadril"
            valor={rcq}
            unidade="RCQ"
            classificacao={rcqInfo.label}
            corClass={rcqInfo.cor}
            barraMin={sexo === "masculino" ? 0.7 : 0.6}
            barraMax={sexo === "masculino" ? 1.2 : 1.0}
          />
        ) : (
          <div className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-sky-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
                Massa estimada
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-white/18">
                  Gorda
                </p>
                <p className="mt-1 text-xl font-black italic text-white">
                  {massaGorda.toFixed(1)}kg
                </p>
              </div>
              <div>
                <p className="text-[7px] font-black uppercase tracking-widest text-white/18">
                  Magra
                </p>
                <p className="mt-1 text-xl font-black italic text-white">
                  {massaMagra.toFixed(1)}kg
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-white/5 bg-white/3 p-4">
        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
          Resumo
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
          {[
            { label: "Peso", val: `${peso} kg` },
            { label: "Altura", val: `${altura} cm` },
            { label: "Cintura", val: `${cintura} cm` },
            quadril ? { label: "Quadril", val: `${quadril} cm` } : null,
            { label: "Massa gorda", val: `${massaGorda.toFixed(1)} kg` },
            { label: "Massa magra", val: `${massaMagra.toFixed(1)} kg` },
          ].filter(Boolean).map(item => (
            <div key={item!.label}>
              <p className="text-[7px] font-black uppercase tracking-widest text-white/15">
                {item!.label}
              </p>
              <p className="text-xs font-black italic text-white/60">{item!.val}</p>
            </div>
          ))}
        </div>
      </div>

      {recomendacao && (
        <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
          <p className="mb-1.5 text-[8px] font-black uppercase tracking-widest text-sky-300">
            O que isso indica
          </p>
          <p className="text-[10px] leading-relaxed text-white/45">
            {recomendacao}
          </p>
        </div>
      )}

      {!semDisclaimer && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[9px] italic leading-relaxed text-amber-500/70">
            {DISCLAIMER_COMPOSICAO}
          </p>
        </div>
      )}
    </motion.div>
  );
}
