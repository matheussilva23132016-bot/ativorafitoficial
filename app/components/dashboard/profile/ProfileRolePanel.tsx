"use client";

import React from "react";
import { Loader2, Save } from "lucide-react";
import { getRoleConfig } from "@/lib/profile/assessment";
import type { PerfilComplementar } from "@/lib/profile/types";
import { Field, inputClass, SectionTitle } from "./profileUi";

type Props = {
  profile: PerfilComplementar;
  onChange: (profile: PerfilComplementar) => void;
  onSave: () => void;
  saving: boolean;
};

export function ProfileRolePanel({ profile, onChange, onSave, saving }: Props) {
  const config = getRoleConfig(profile.role);
  const patch = (data: Partial<PerfilComplementar>) => onChange({ ...profile, ...data });
  const patchCargo = (key: string, value: string) =>
    patch({ dadosCargo: { ...profile.dadosCargo, [key]: value } });

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          eyebrow="Dados do cargo"
          title="Contexto do seu cargo"
          description="Preencha somente o que fizer sentido para sua função. Esses dados ajudam treinos, cardápios, permissões e atendimento dentro do app."
        />
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar perfil
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Field label="Objetivo principal">
          <input className={inputClass()} value={profile.objetivoPrincipal} onChange={e => patch({ objetivoPrincipal: e.target.value })} placeholder="Ex.: ganhar massa magra com constância" />
        </Field>
        <Field label="Nível atual">
          <select className={inputClass()} value={profile.nivel} onChange={e => patch({ nivel: e.target.value })}>
            <option value="">Selecionar</option>
            {["Iniciante", "Intermediário", "Avançado", "Profissional"].map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Frequência">
          <input className={inputClass()} value={profile.frequencia} onChange={e => patch({ frequencia: e.target.value })} placeholder="Ex.: 3 a 5 vezes por semana" />
        </Field>
        <Field label="Privacidade dos dados">
          <select className={inputClass()} value={profile.privacidadeDados} onChange={e => patch({ privacidadeDados: e.target.value as any })}>
            <option value="privado">Privado</option>
            <option value="profissionais">Visível para profissionais autorizados</option>
            <option value="comunidade">Visível em comunidades autorizadas</option>
          </select>
        </Field>
        <Field label="Restrições ou cuidados importantes">
          <textarea className={inputClass("min-h-24 resize-none")} value={profile.restricoes} onChange={e => patch({ restricoes: e.target.value })} placeholder="Lesões, dores, restrições alimentares ou observações importantes." />
        </Field>
        <Field label="Disponibilidade de rotina">
          <textarea className={inputClass("min-h-24 resize-none")} value={profile.disponibilidade} onChange={e => patch({ disponibilidade: e.target.value })} placeholder="Horários, dias e formato de acompanhamento." />
        </Field>
        <Field label="Preferências de treino">
          <textarea className={inputClass("min-h-24 resize-none")} value={profile.preferenciasTreino} onChange={e => patch({ preferenciasTreino: e.target.value })} placeholder="Equipamentos, locais, exercícios que prefere ou evita." />
        </Field>
        <Field label="Preferências de nutrição">
          <textarea className={inputClass("min-h-24 resize-none")} value={profile.preferenciasNutricao} onChange={e => patch({ preferenciasNutricao: e.target.value })} placeholder="Preferências alimentares, rotina e limitações." />
        </Field>
      </div>

      <div className="mt-7 border-t border-white/10 pt-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">{config.label}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {config.fields.map(field => (
            <Field key={field.key} label={field.label}>
              {field.type === "textarea" ? (
                <textarea
                  className={inputClass("min-h-24 resize-none")}
                  value={profile.dadosCargo[field.key] ?? ""}
                  onChange={e => patchCargo(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : field.type === "select" ? (
                <select
                  className={inputClass()}
                  value={profile.dadosCargo[field.key] ?? ""}
                  onChange={e => patchCargo(field.key, e.target.value)}
                >
                  <option value="">Selecionar</option>
                  {(field.options ?? []).map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input
                  className={inputClass()}
                  value={profile.dadosCargo[field.key] ?? ""}
                  onChange={e => patchCargo(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </Field>
          ))}
        </div>
      </div>
    </section>
  );
}
