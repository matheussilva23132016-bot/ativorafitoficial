"use client";

import React, { useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Ruler,
  Save,
} from "lucide-react";
import { ADVANCED_PROTOCOLS, calculateAssessmentResults } from "@/lib/profile/assessment";
import type { PerfilAvaliacao, PerfilAvaliacaoMedida, PerfilAvaliacaoTipo } from "@/lib/profile/types";
import { emptyAssessment, PARQ_QUESTIONS, typeLabels } from "./profileHelpers";
import { Field, inputClass, labelClass } from "./profileUi";

type Props = {
  draft: PerfilAvaliacao;
  setDraft: React.Dispatch<React.SetStateAction<PerfilAvaliacao>>;
  onSave: (status: "rascunho" | "salvo") => void;
  saving: boolean;
  user: any;
};

const typeIcons: Record<PerfilAvaliacaoTipo, any> = {
  anamnese: ClipboardCheck,
  rapida: Activity,
  completa: Ruler,
  laudo: FileText,
};

export function ProfileAssessmentPanel({ draft, setDraft, onSave, saving, user }: Props) {
  const preview = useMemo(
    () => calculateAssessmentResults({
      medidas: draft.medidas,
      sexo: draft.sexo,
      dataNascimento: draft.dataNascimento,
      percentualGorduraInformado: draft.percentualGorduraInformado,
    }),
    [draft.medidas, draft.sexo, draft.dataNascimento, draft.percentualGorduraInformado],
  );

  const groupedMeasures = useMemo(() => {
    return preview.medidas.reduce<Record<string, PerfilAvaliacaoMedida[]>>((acc, item) => {
      acc[item.categoria] = [...(acc[item.categoria] ?? []), item];
      return acc;
    }, {});
  }, [preview.medidas]);

  const changeType = (tipo: PerfilAvaliacaoTipo) => {
    setDraft(prev => ({
      ...emptyAssessment(user, tipo),
      objetivo: prev.objetivo,
      sexo: prev.sexo,
      dataNascimento: prev.dataNascimento,
      dataAvaliacao: prev.dataAvaliacao,
    }));
  };

  const updateMeasure = (slug: string, key: "rodada1" | "rodada2" | "rodada3", value: string) => {
    setDraft(prev => ({
      ...prev,
      medidas: prev.medidas.map(item => item.slug === slug
        ? { ...item, [key]: value === "" ? null : Number(value) }
        : item),
    }));
  };

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        {(Object.keys(typeLabels) as PerfilAvaliacaoTipo[]).map(tipo => {
          const meta = typeLabels[tipo];
          const Icon = typeIcons[tipo];
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => changeType(tipo)}
              className={`rounded-lg border p-4 text-left transition ${
                draft.tipo === tipo
                  ? "border-sky-500/40 bg-sky-500/15"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <Icon size={18} className={draft.tipo === tipo ? "text-sky-300" : "text-white/35"} />
              <p className="mt-3 text-sm font-black text-white">{meta.label}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/35">{meta.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Título">
            <input className={inputClass()} value={draft.titulo} onChange={e => setDraft(p => ({ ...p, titulo: e.target.value }))} />
          </Field>
          <Field label="Data da avaliação">
            <input type="date" className={inputClass()} value={draft.dataAvaliacao} onChange={e => setDraft(p => ({ ...p, dataAvaliacao: e.target.value }))} />
          </Field>
          <Field label="Data de reavaliação">
            <input type="date" className={inputClass()} value={draft.dataReavaliacao ?? ""} onChange={e => setDraft(p => ({ ...p, dataReavaliacao: e.target.value }))} />
          </Field>
          <Field label="Sexo para cálculo">
            <select className={inputClass()} value={draft.sexo ?? "masculino"} onChange={e => setDraft(p => ({ ...p, sexo: e.target.value as any }))}>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </Field>
          <Field label="Nascimento">
            <input type="date" className={inputClass()} value={draft.dataNascimento ?? ""} onChange={e => setDraft(p => ({ ...p, dataNascimento: e.target.value }))} />
          </Field>
          <Field label="% gordura manual">
            <input type="number" min="0" step="0.1" className={inputClass()} value={draft.percentualGorduraInformado ?? ""} onChange={e => setDraft(p => ({ ...p, percentualGorduraInformado: e.target.value ? Number(e.target.value) : null }))} placeholder="Opcional" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Objetivo da avaliação">
            <textarea className={inputClass("min-h-24 resize-none")} value={draft.objetivo} onChange={e => setDraft(p => ({ ...p, objetivo: e.target.value }))} placeholder="O que você quer acompanhar nesta avaliação?" />
          </Field>
          <Field label="Observações">
            <textarea className={inputClass("min-h-24 resize-none")} value={draft.observacoes} onChange={e => setDraft(p => ({ ...p, observacoes: e.target.value }))} placeholder="Informações livres sobre o momento atual." />
          </Field>
        </div>

        {draft.tipo === "anamnese" && (
          <div className="mt-6 space-y-3">
            <p className={labelClass()}>PAR-Q</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {PARQ_QUESTIONS.map((question, index) => (
                <div key={question} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-relaxed text-white/70">{index + 1}. {question}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["Não", "Sim", "Prefiro revisar"].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDraft(p => ({ ...p, parq: { ...p.parq, [`q${index + 1}`]: option } }))}
                        className={`rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-widest ${
                          draft.parq[`q${index + 1}`] === option
                            ? "border-sky-500/40 bg-sky-500 text-black"
                            : "border-white/10 bg-white/5 text-white/35"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {draft.tipo === "laudo" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Field label="Protocolo usado">
              <select className={inputClass()} value={draft.protocolo} onChange={e => setDraft(p => ({ ...p, protocolo: e.target.value }))}>
                <option value="">Selecionar protocolo</option>
                {ADVANCED_PROTOCOLS.map(protocol => <option key={protocol} value={protocol}>{protocol}</option>)}
              </select>
            </Field>
            <Field label="Parecer final">
              <textarea className={inputClass("min-h-24 resize-none")} value={draft.parecerFinal} onChange={e => setDraft(p => ({ ...p, parecerFinal: e.target.value }))} placeholder="Recomendações, cuidados e próximos passos." />
            </Field>
          </div>
        )}

        {draft.tipo !== "anamnese" && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={labelClass()}>Medidas</p>
                <p className="mt-1 text-xs text-white/35">Use uma, duas ou três rodadas. A mediana e o erro são calculados automaticamente.</p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-amber-100">
                Estimativa de apoio
              </div>
            </div>

            {Object.entries(groupedMeasures).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">{category}</p>
                <div className="grid gap-3">
                  {items.map(measure => (
                    <div key={measure.slug} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[1.2fr_repeat(3,0.65fr)_0.8fr] md:items-center">
                      <div>
                        <p className="text-sm font-bold text-white">{measure.nome}</p>
                        <p className="text-[10px] text-white/30">{measure.unidade}</p>
                      </div>
                      {(["rodada1", "rodada2", "rodada3"] as const).map((roundKey, index) => (
                        <input
                          key={roundKey}
                          type="number"
                          step="0.1"
                          className={inputClass("py-2")}
                          value={measure[roundKey] ?? ""}
                          onChange={e => updateMeasure(measure.slug, roundKey, e.target.value)}
                          placeholder={`${index + 1}ª`}
                        />
                      ))}
                      <div className="rounded-lg bg-white/5 px-3 py-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Mediana</p>
                        <p className="text-sm font-black text-white">{measure.mediana ?? "-"}</p>
                        {measure.erroPercentual != null && (
                          <p className={`text-[9px] ${measure.erroPercentual <= 5 ? "text-emerald-300" : "text-amber-300"}`}>
                            {measure.erroPercentual}% · {measure.consistencia}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {preview.resultados.length > 0 && (
          <div className="mt-6 rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-200">Prévia dos cálculos seguros</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {preview.resultados.map(result => (
                <div key={result.metodo} className="rounded-lg bg-black/25 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{result.metodo}</p>
                  <p className="mt-1 text-xl font-black text-white">{result.valor}{result.unidade}</p>
                  <p className="mt-1 text-[10px] text-white/40">{result.classificacao}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onSave("rascunho")}
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={() => onSave("salvo")}
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            Salvar avaliação
          </button>
        </div>
      </div>
    </section>
  );
}
