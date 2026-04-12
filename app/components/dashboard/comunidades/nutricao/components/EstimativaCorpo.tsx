// app/components/dashboard/comunidades/nutricao/components/EstimativaCorpo.tsx
"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, Activity, Scale } from "lucide-react";
import type { MedidasCorporais } from "../types";
import {
  classificarIMC,
  classificarRCQ,
  classificarGordura,
  DISCLAIMER_COMPOSICAO,
} from "../utils";

interface Props {
  medidas: MedidasCorporais;
  /** Oculta o disclaimer (útil quando já está visível em outro lugar) */
  semDisclaimer?: boolean;
}

function BarraProgresso({
  valor, min, max, cor,
}: {
  valor: number; min: number; max: number; cor: string;
}) {
  const pct = Math.min(100, Math.max(0, ((valor - min) / (max - min)) * 100));
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
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
  icon: Icon, label, valor, unidade, classificacao, corClass, barraMin, barraMax,
}: {
  icon: any; label: string; valor: number; unidade: string;
  classificacao: string; corClass: string; barraMin: number; barraMax: number;
}) {
  const corBarra = corClass.replace("text-", "bg-");
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
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
        <span className="text-2xl font-black italic text-white leading-none">
          {valor.toFixed(1)}
        </span>
        <span className="text-[9px] font-black text-white/20 uppercase mb-0.5">
          {unidade}
        </span>
      </div>
      <BarraProgresso valor={valor} min={barraMin} max={barraMax} cor={corBarra} />
    </div>
  );
}

export function EstimativaCorpo({ medidas, semDisclaimer = false }: Props) {
  const {
    imc, rcq, gorduraEst, sexo,
    peso, altura, cintura, quadril,
    metodoCalculo,
  } = medidas;

  if (!imc || !rcq) return null;

  const imcClass = classificarIMC(imc);
  const rcqInfo  = classificarRCQ(rcq, sexo);
  const gordInfo = gorduraEst ? classificarGordura(gorduraEst, sexo) : null;

  const gordMin = sexo === "masculino" ? 3  : 10;
  const gordMax = sexo === "masculino" ? 35 : 45;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-widest
          text-white/30 flex items-center gap-2">
          <Activity size={12} className="text-sky-500" />
          Estimativa Corporal
        </h4>
        {metodoCalculo && (
          <span className="text-[7px] font-black uppercase tracking-widest
            text-white/15 bg-white/5 px-2 py-1 rounded-lg">
            Método: {metodoCalculo === "navy" ? "Navy" : "RCQ"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricaCard
          icon={Scale} label="IMC" valor={imc} unidade="kg/m²"
          classificacao={imcClass}
          corClass={
            imc < 18.5 ? "text-sky-400"
            : imc < 25  ? "text-emerald-500"
            : imc < 30  ? "text-amber-500"
            : "text-rose-500"
          }
          barraMin={15} barraMax={45}
        />
        <MetricaCard
          icon={TrendingUp} label="Cintura / Quadril" valor={rcq} unidade="RCQ"
          classificacao={rcqInfo.label} corClass={rcqInfo.cor}
          barraMin={sexo === "masculino" ? 0.7 : 0.6}
          barraMax={sexo === "masculino" ? 1.2 : 1.0}
        />
        {gorduraEst !== undefined && gordInfo && (
          <MetricaCard
            icon={Activity} label="Gordura Est." valor={gorduraEst} unidade="%"
            classificacao={gordInfo.label} corClass={gordInfo.cor}
            barraMin={gordMin} barraMax={gordMax}
          />
        )}
      </div>

      <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2">
        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
          Resumo
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
          {[
            { label: "Peso",    val: `${peso} kg`    },
            { label: "Altura",  val: `${altura} cm`  },
            { label: "Cintura", val: `${cintura} cm` },
            { label: "Quadril", val: `${quadril} cm` },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[7px] font-black uppercase tracking-widest text-white/15">
                {item.label}
              </p>
              <p className="text-xs font-black text-white/60 italic">{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {!semDisclaimer && (
        <div className="flex items-start gap-3 bg-amber-500/5 border
          border-amber-500/15 rounded-2xl p-4">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-500/70 italic leading-relaxed">
            {DISCLAIMER_COMPOSICAO}
          </p>
        </div>
      )}
    </motion.div>
  );
}
