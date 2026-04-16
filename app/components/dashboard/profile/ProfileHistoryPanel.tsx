"use client";

import React from "react";
import { CalendarDays, History, Plus, Trash2 } from "lucide-react";
import type { PerfilAvaliacao, PerfilUserSummary } from "@/lib/profile/types";
import { emptyAssessment, typeLabels } from "./profileHelpers";
import { labelClass, SectionTitle } from "./profileUi";

type Props = {
  assessments: PerfilAvaliacao[];
  setDraft: (assessment: PerfilAvaliacao) => void;
  setTab: (tab: "avaliacoes") => void;
  onDelete: (assessmentId?: string) => void;
  user: PerfilUserSummary | null;
};

export function ProfileHistoryPanel({ assessments, setDraft, setTab, onDelete, user }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle eyebrow="Histórico privado" title="Avaliações salvas" />
        <button
          type="button"
          onClick={() => { setDraft(emptyAssessment(user, "rapida")); setTab("avaliacoes"); }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black"
        >
          <Plus size={14} />
          Nova avaliação
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <History className="mx-auto text-white/15" size={34} />
          <p className="mt-4 text-sm text-white/45">Nenhuma avaliação registrada ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {assessments.map(item => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-white">{item.titulo}</p>
                    <span className={`rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                      item.status === "salvo" ? "bg-emerald-500/15 text-emerald-200" : "bg-amber-500/15 text-amber-200"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/35">
                    <CalendarDays size={12} />
                    {item.dataAvaliacao || "Sem data"} · {typeLabels[item.tipo]?.label}
                  </p>
                  {item.resultados.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.resultados.slice(0, 4).map(result => (
                        <span key={result.metodo} className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold text-white/60">
                          {result.metodo}: {result.valor}{result.unidade}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDraft(item); setTab("avaliacoes"); }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/55"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-200"
                    aria-label="Remover avaliação"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className={`${labelClass()} opacity-70`}>
        Protocolos avançados ficam registrados para revisão profissional; nesta fase, o app não calcula fórmulas de dobras sem validação.
      </p>
    </section>
  );
}
