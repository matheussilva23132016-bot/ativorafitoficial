// app/components/dashboard/comunidades/nutricao/components/FormDadosCorporais.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ruler, Weight, ChevronDown, ChevronUp,
  HelpCircle, Save, Loader2,
} from "lucide-react";
import type { SexoBio, MedidasCorporais } from "../types";
import { processarMedidas } from "../utils";

// ── Props ─────────────────────────────────────────────────────────
interface Props {
  /** ID de quem está sendo avaliado (pode ser outro membro) */
  alunoId:       string;
  inicial?:      Partial<MedidasCorporais>;
  /** Chamado sempre que os campos obrigatórios estão válidos */
  onChange?:     (medidas: MedidasCorporais) => void;
  /**
   * Se fornecido, exibe botão "Salvar Avaliação" e chama esta função.
   * Qualquer cargo pode usar — a permissão é controlada pelo pai.
   */
  onSalvar?:     (medidas: MedidasCorporais) => Promise<void>;
  /** Texto customizável do botão salvar */
  labelSalvar?:  string;
}

// ── Dicas ─────────────────────────────────────────────────────────
const DICAS: Record<string, string> = {
  cintura: "Meça na parte mais estreita do abdômen, geralmente 2 cm acima do umbigo. Sem sugar a barriga.",
  quadril: "Meça na parte mais larga dos quadris e glúteos, com os pés juntos.",
  pescoco: "Meça logo abaixo da laringe (pomo de adão). Opcional, mas melhora a precisão.",
  peso:    "Use uma balança no chão firme, pela manhã, em jejum e sem sapatos.",
  altura:  "Encoste-se a uma parede, sem sapatos, com a cabeça ereta.",
};

type Campo = "peso" | "altura" | "cintura" | "quadril" | "pescoco";

const CAMPOS: {
  key:         Campo;
  label:       string;
  unidade:     string;
  min:         number;
  max:         number;
  obrigatorio: boolean;
  placeholder: string;
}[] = [
  { key: "peso",    label: "Peso",    unidade: "kg", min: 30,  max: 250, obrigatorio: true,  placeholder: "ex: 72"  },
  { key: "altura",  label: "Altura",  unidade: "cm", min: 100, max: 230, obrigatorio: true,  placeholder: "ex: 170" },
  { key: "cintura", label: "Cintura", unidade: "cm", min: 40,  max: 200, obrigatorio: true,  placeholder: "ex: 80"  },
  { key: "quadril", label: "Quadril", unidade: "cm", min: 50,  max: 200, obrigatorio: true,  placeholder: "ex: 98"  },
  { key: "pescoco", label: "Pescoço", unidade: "cm", min: 20,  max: 80,  obrigatorio: false, placeholder: "ex: 37"  },
];

// ── Componente ────────────────────────────────────────────────────
export function FormDadosCorporais({
  alunoId, inicial, onChange, onSalvar, labelSalvar = "Salvar Avaliação",
}: Props) {
  const [sexo,    setSexo]    = useState<SexoBio>(inicial?.sexo ?? "masculino");
  const [valores, setValores] = useState<Record<Campo, string>>({
    peso:    String(inicial?.peso    ?? ""),
    altura:  String(inicial?.altura  ?? ""),
    cintura: String(inicial?.cintura ?? ""),
    quadril: String(inicial?.quadril ?? ""),
    pescoco: String(inicial?.pescoco ?? ""),
  });
  const [dicaAberta,   setDicaAberta]   = useState<string | null>(null);
  const [avancado,     setAvancado]     = useState(false);
  const [salvando,     setSalvando]     = useState(false);
  const [salvoOk,      setSalvoOk]      = useState(false);
  const [medidasAtual, setMedidasAtual] = useState<MedidasCorporais | null>(null);

  // ── Recalcula medidas ─────────────────────────────────────────
  const recalcular = (
    vals: Record<Campo, string>,
    sexoAtual: SexoBio,
  ): MedidasCorporais | null => {
    const peso    = parseFloat(vals.peso);
    const altura  = parseFloat(vals.altura);
    const cintura = parseFloat(vals.cintura);
    const quadril = parseFloat(vals.quadril);
    const pescoco = parseFloat(vals.pescoco);

    if (
      !isNaN(peso)    && peso    > 0 &&
      !isNaN(altura)  && altura  > 0 &&
      !isNaN(cintura) && cintura > 0 &&
      !isNaN(quadril) && quadril > 0
    ) {
      return processarMedidas({
        alunoId,
        data:    new Date().toISOString(),
        sexo:    sexoAtual,
        peso,
        altura,
        cintura,
        quadril,
        pescoco: !isNaN(pescoco) && pescoco > 0 ? pescoco : undefined,
      });
    }
    return null;
  };

  const handleChange = (key: Campo, raw: string) => {
    const next = { ...valores, [key]: raw };
    setValores(next);
    setSalvoOk(false);
    const resultado = recalcular(next, sexo);
    setMedidasAtual(resultado);
    if (resultado) onChange?.(resultado);
  };

  const handleSexo = (s: SexoBio) => {
    setSexo(s);
    setSalvoOk(false);
    const resultado = recalcular(valores, s);
    setMedidasAtual(resultado);
    if (resultado) onChange?.(resultado);
  };

  // ── Salvar standalone ─────────────────────────────────────────
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

  // ── Input style ───────────────────────────────────────────────
  const inp = (obrigatorio: boolean, val: string) =>
    `w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-white/80
    outline-none transition-all placeholder:text-white/15
    ${val
      ? "border-white/15 focus:border-sky-500/50"
      : obrigatorio
        ? "border-white/5 focus:border-sky-500/40"
        : "border-white/5 focus:border-white/20"
    }`;

  return (
    <div className="space-y-5">

      {/* Sexo biológico */}
      <div className="space-y-2">
        <label className="text-[8px] font-black uppercase tracking-widest
          text-white/30">
          Sexo biológico
          <span className="text-rose-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["masculino", "feminino"] as SexoBio[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSexo(s)}
              className={`py-3 rounded-xl border text-[10px] font-black uppercase
                tracking-widest transition-all
                ${sexo === s
                  ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
                  : "bg-white/5 border-white/5 text-white/30 hover:border-white/15"
                }`}
            >
              {s === "masculino" ? "♂ Masculino" : "♀ Feminino"}
            </button>
          ))}
        </div>
        <p className="text-[8px] text-white/15 font-medium italic">
          Usado apenas para cálculo de estimativa corporal.
        </p>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-2 gap-3">
        {CAMPOS.filter(c => c.obrigatorio || avancado).map(campo => (
          <div key={campo.key} className="col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[8px] font-black uppercase tracking-widest
                text-white/30 flex items-center gap-1">
                {campo.label}
                {campo.obrigatorio
                  ? <span className="text-rose-500">*</span>
                  : <span className="text-white/15 normal-case font-medium text-[7px]">
                      (opcional)
                    </span>
                }
              </label>
              <button
                type="button"
                onClick={() =>
                  setDicaAberta(dicaAberta === campo.key ? null : campo.key)
                }
                className="text-white/15 hover:text-sky-400 transition-colors"
              >
                <HelpCircle size={11} />
              </button>
            </div>

            <AnimatePresence>
              {dicaAberta === campo.key && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0    }}
                  className="overflow-hidden mb-2"
                >
                  <p className="text-[9px] text-sky-400/70 italic bg-sky-500/5
                    border border-sky-500/10 rounded-lg px-3 py-2 leading-relaxed">
                    {DICAS[campo.key]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={valores[campo.key]}
                onChange={e => handleChange(campo.key, e.target.value)}
                min={campo.min}
                max={campo.max}
                placeholder={campo.placeholder}
                className={inp(campo.obrigatorio, valores[campo.key])}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2
                text-[9px] font-black text-white/20 uppercase">
                {campo.unidade}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle pescoço */}
      {!avancado ? (
        <button
          type="button"
          onClick={() => setAvancado(true)}
          className="flex items-center gap-2 text-[8px] font-black uppercase
            tracking-widest text-white/20 hover:text-sky-400 transition-colors"
        >
          <ChevronDown size={12} />
          Adicionar pescoço (melhora precisão)
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAvancado(false)}
          className="flex items-center gap-2 text-[8px] font-black uppercase
            tracking-widest text-white/20 hover:text-white/40 transition-colors"
        >
          <ChevronUp size={12} />
          Ocultar campo opcional
        </button>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <Ruler size={10} className="text-white/20" />
          <span className="text-[7px] text-white/15 font-black uppercase tracking-widest">
            Medidas em cm
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Weight size={10} className="text-white/20" />
          <span className="text-[7px] text-white/15 font-black uppercase tracking-widest">
            Peso em kg
          </span>
        </div>
      </div>

      {/* Botão salvar standalone — só aparece se onSalvar foi passado */}
      {onSalvar && (
        <button
          type="button"
          onClick={handleSalvar}
          disabled={!medidasAtual || salvando}
          className={`w-full flex items-center justify-center gap-2 py-3
            rounded-2xl text-[10px] font-black uppercase tracking-widest
            transition-all
            ${salvoOk
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-sky-500 text-black hover:bg-sky-400 active:scale-95"
            }
            disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {salvando
            ? <><Loader2 size={13} className="animate-spin" /> Salvando...</>
            : salvoOk
              ? <>✓ Avaliação salva</>
              : <><Save size={13} /> {labelSalvar}</>
          }
        </button>
      )}
    </div>
  );
}
