"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, Save, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CommunitySettingsPanelProps {
  communityId: string;
  currentUser: any;
  canEdit: boolean;
}

interface CommunityRule {
  id?: string;
  titulo: string;
  descricao: string;
  ordem: number;
  ativo: boolean | number;
  removido?: boolean;
}

const DEFAULT_SETTINGS = {
  entrada_por_solicitacao: 1,
  adm_pode_aprovar_membros: 1,
  adm_pode_criar_desafios: 1,
  adm_pode_avaliar_desafios: 1,
  adm_pode_editar_treinos: 0,
  adm_pode_editar_nutricao: 0,
  xp_treino_concluido: 10,
  xp_refeicao_dia_concluida: 0,
  ranking_fecha_dia: "domingo",
  ranking_fecha_hora: "23:59:00",
  timezone: "America/Sao_Paulo",
};

const TOGGLES = [
  ["entrada_por_solicitacao", "Entrada por solicitacao", "Ninguem entra automaticamente."],
  ["adm_pode_aprovar_membros", "ADM aprova membros", "Administradores podem liberar pedidos."],
  ["adm_pode_criar_desafios", "ADM cria desafios", "Permite missoes semanais por ADM."],
  ["adm_pode_avaliar_desafios", "ADM avalia entregas", "ADMs podem aprovar, reprovar ou pedir reenvio."],
  ["adm_pode_editar_treinos", "ADM edita treinos", "Libera gestao de treinos para ADM."],
  ["adm_pode_editar_nutricao", "ADM edita nutricao", "Libera gestao nutricional para ADM."],
] as const;

export function CommunitySettingsPanel({
  communityId,
  currentUser,
  canEdit,
}: CommunitySettingsPanelProps) {
  const [schemaReady, setSchemaReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [rules, setRules] = useState<CommunityRule[]>([]);
  const [newRule, setNewRule] = useState({ titulo: "", descricao: "" });

  const loadSettings = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/settings?requesterId=${currentUser.id}`,
      );
      const data = res.ok ? await res.json() : {};
      setSchemaReady(data.schemaReady !== false);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings ?? {}) });
      setRules((data.rules ?? []).map((rule: any, index: number) => ({
        ...rule,
        ordem: Number(rule.ordem ?? index + 1),
        ativo: Boolean(rule.ativo),
        removido: false,
      })));
    } catch {
      setSchemaReady(false);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateToggle = (key: string, value: boolean) => {
    setSettings((prev: any) => ({ ...prev, [key]: value ? 1 : 0 }));
  };

  const visibleRules = rules
    .map((rule, realIndex) => ({ rule, realIndex }))
    .filter(({ rule }) => Boolean(rule.ativo) && !rule.removido);

  const addRule = () => {
    if (!newRule.titulo.trim() || !newRule.descricao.trim()) {
      toast.warning("Preencha titulo e descricao da regra.");
      return;
    }

    setRules(prev => [
      ...prev,
      {
        titulo: newRule.titulo.trim(),
        descricao: newRule.descricao.trim(),
        ordem: visibleRules.length + 1,
        ativo: true,
        removido: false,
      },
    ]);
    setNewRule({ titulo: "", descricao: "" });
  };

  const removeRule = (visibleIndex: number) => {
    setRules(prev => {
      const visible = prev
        .map((rule, realIndex) => ({ rule, realIndex }))
        .filter(({ rule }) => Boolean(rule.ativo) && !rule.removido);
      const targetIndex = visible[visibleIndex]?.realIndex;
      if (targetIndex == null) return prev;

      return prev.map((rule, index) => {
        if (index !== targetIndex) return rule;
        return {
          ...rule,
          ativo: false,
          removido: true,
        };
      });
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: currentUser?.id,
          settings,
          rules,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar configuracoes");

      toast.success("Configuracoes da comunidade salvas.");
      await loadSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <RefreshCw className="animate-spin text-sky-500" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!schemaReady && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-amber-300" size={18} />
            <div>
              <p className="text-sm font-black text-amber-200">
                SQL complementar ainda nao aplicado
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/55">
                Regras e configuracoes granulares dependem das tabelas
                comunidade_regras e comunidade_configuracoes. O painel fica visivel,
                mas so salva depois que o SQL corrigido for aplicado no phpMyAdmin.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-black text-white">
            <Settings2 className="text-sky-400" size={20} />
            Controle da comunidade
          </h3>
          <p className="mt-1 text-xs text-white/30">
            Permissoes de ADM, entrada fechada, pontuacao e fechamento semanal.
          </p>
        </div>
        <button
          onClick={save}
          disabled={!canEdit || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-[10px] font-black uppercase text-black disabled:opacity-40"
        >
          {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
          Salvar
        </button>
      </div>

      {!canEdit && (
        <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/35">
          Apenas o Dono altera configuracoes globais. ADMs continuam gerenciando membros e operacoes permitidas.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase text-white/40">
            Permissoes operacionais
          </p>
          <div className="mt-4 space-y-2">
            {TOGGLES.map(([key, label, description]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 p-3"
              >
                <span>
                  <span className="block text-sm font-black text-white">{label}</span>
                  <span className="text-xs text-white/30">{description}</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  disabled={!canEdit}
                  onChange={event => updateToggle(key, event.target.checked)}
                  className="h-5 w-5 accent-sky-500"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase text-white/40">
            Pontos e ciclo semanal
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-white/30">
                XP por treino concluido
              </span>
              <input
                type="number"
                value={settings.xp_treino_concluido ?? 10}
                disabled={!canEdit}
                onChange={event => setSettings((prev: any) => ({
                  ...prev,
                  xp_treino_concluido: Number(event.target.value),
                }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-white/30">
                XP por dia de nutricao
              </span>
              <input
                type="number"
                value={settings.xp_refeicao_dia_concluida ?? 0}
                disabled={!canEdit}
                onChange={event => setSettings((prev: any) => ({
                  ...prev,
                  xp_refeicao_dia_concluida: Number(event.target.value),
                }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-white/30">
                Fechamento
              </span>
              <select
                value={settings.ranking_fecha_dia ?? "domingo"}
                disabled={!canEdit}
                onChange={event => setSettings((prev: any) => ({
                  ...prev,
                  ranking_fecha_dia: event.target.value,
                }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none"
              >
                <option value="domingo">Domingo</option>
                <option value="segunda">Segunda</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-white/30">
                Horario
              </span>
              <input
                type="time"
                value={(settings.ranking_fecha_hora ?? "23:59:00").slice(0, 5)}
                disabled={!canEdit}
                onChange={event => setSettings((prev: any) => ({
                  ...prev,
                  ranking_fecha_hora: `${event.target.value}:00`,
                }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">
              Regras da comunidade
            </p>
            <p className="mt-1 text-xs text-white/30">
              Regras aparecem como base do grupo fechado e ajudam a moderacao.
            </p>
          </div>
          <CheckCircle2 className="text-emerald-300" size={18} />
        </div>

        <div className="mt-4 space-y-2">
          {visibleRules.length === 0 ? (
            <p className="rounded-xl bg-black/20 p-4 text-sm text-white/35">
              Nenhuma regra cadastrada.
            </p>
          ) : visibleRules.map(({ rule }, index) => (
            <div key={rule.id ?? index} className="rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">
                    {index + 1}. {rule.titulo}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">{rule.descricao}</p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => removeRule(index)}
                    className="rounded-lg bg-rose-500/10 p-2 text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr_auto] gap-2">
            <input
              value={newRule.titulo}
              onChange={event => setNewRule(prev => ({ ...prev, titulo: event.target.value }))}
              placeholder="Titulo da regra"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/20"
            />
            <input
              value={newRule.descricao}
              onChange={event => setNewRule(prev => ({ ...prev, descricao: event.target.value }))}
              placeholder="Descricao objetiva"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/20"
            />
            <button
              onClick={addRule}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase text-white/60"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
