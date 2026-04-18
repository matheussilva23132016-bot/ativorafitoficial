"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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

type RoleTag =
  | "Dono"
  | "ADM"
  | "Instrutor"
  | "Personal"
  | "Nutri"
  | "Nutricionista"
  | "Participante";

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
  ["entrada_por_solicitacao", "Entrada por solicitação", "Ninguém entra automaticamente."],
  ["adm_pode_aprovar_membros", "ADM aprova membros", "Administradores podem liberar pedidos."],
  ["adm_pode_criar_desafios", "ADM cria desafios", "Permite missões semanais por ADM."],
  ["adm_pode_avaliar_desafios", "ADM avalia entregas", "ADMs podem aprovar, reprovar ou pedir reenvio."],
  ["adm_pode_editar_treinos", "ADM edita treinos", "Libera gestão de treinos para ADM."],
  ["adm_pode_editar_nutricao", "ADM edita nutrição", "Libera gestão nutricional para ADM."],
] as const;

const ROLE_ORDER: RoleTag[] = [
  "Dono",
  "ADM",
  "Instrutor",
  "Personal",
  "Nutri",
  "Nutricionista",
  "Participante",
];

const ROLE_TONE: Record<RoleTag, string> = {
  Dono: "text-amber-300",
  ADM: "text-purple-300",
  Instrutor: "text-sky-300",
  Personal: "text-sky-300",
  Nutri: "text-emerald-300",
  Nutricionista: "text-emerald-300",
  Participante: "text-white/70",
};

const PERMISSION_OPTIONS = [
  {
    key: "member:approve",
    label: "Aprovar entradas",
    description: "Aceita ou recusa pedidos de entrada no grupo.",
    defaults: ["Dono", "ADM"],
  },
  {
    key: "member:remove",
    label: "Remover membros",
    description: "Retira participantes da comunidade.",
    defaults: ["Dono", "ADM"],
  },
  {
    key: "tag:assign",
    label: "Gerenciar tags",
    description: "Atribui ou remove tags dos membros.",
    defaults: ["Dono", "ADM"],
  },
  {
    key: "treino:create",
    label: "Criar treinos",
    description: "Publica novos treinos para membros ou grupos.",
    defaults: ["Dono", "ADM", "Instrutor", "Personal"],
  },
  {
    key: "treino:manage",
    label: "Editar treinos",
    description: "Ajusta treinos já publicados.",
    defaults: ["Dono", "ADM", "Instrutor", "Personal"],
  },
  {
    key: "nutri:create",
    label: "Criar cardápio",
    description: "Monta novos cardápios e planos de nutrição.",
    defaults: ["Dono", "ADM", "Nutri", "Nutricionista", "Personal", "Instrutor"],
  },
  {
    key: "nutri:manage",
    label: "Editar cardápio",
    description: "Atualiza planos alimentares em andamento.",
    defaults: ["Dono", "ADM", "Nutri", "Nutricionista"],
  },
  {
    key: "desafio:create",
    label: "Criar desafios",
    description: "Publica desafios com metas e premiação.",
    defaults: ["Dono", "ADM"],
  },
  {
    key: "desafio:evaluate",
    label: "Avaliar desafios",
    description: "Aprova, reprova e atribui XP nas entregas.",
    defaults: ["Dono", "ADM"],
  },
  {
    key: "aviso:create",
    label: "Enviar avisos",
    description: "Publica comunicados para o grupo.",
    defaults: ["Dono", "ADM", "Nutri", "Nutricionista", "Instrutor", "Personal"],
  },
  {
    key: "document:import",
    label: "Importar documento",
    description: "Importa arquivos para treino e nutrição.",
    defaults: ["Dono", "ADM", "Nutri", "Nutricionista", "Instrutor", "Personal"],
  },
  {
    key: "post:pin",
    label: "Fixar conteúdo",
    description: "Destaca posts importantes no grupo.",
    defaults: ["Dono", "ADM"],
  },
  {
    key: "post:delete",
    label: "Remover conteúdo",
    description: "Remove posts e conteúdos indevidos.",
    defaults: ["Dono", "ADM"],
  },
] as const;

type PermissionKey = (typeof PERMISSION_OPTIONS)[number]["key"];
type PermissionMatrix = Record<RoleTag, Record<PermissionKey, boolean>>;

const createDefaultPermissions = (): PermissionMatrix => {
  const matrix = {} as PermissionMatrix;

  for (const role of ROLE_ORDER) {
    matrix[role] = {} as Record<PermissionKey, boolean>;
    for (const permission of PERMISSION_OPTIONS) {
      const allowedByDefault = (permission.defaults as readonly RoleTag[]).includes(role);
      matrix[role][permission.key] = role === "Dono" ? true : allowedByDefault;
    }
  }

  return matrix;
};

const normalizePermissions = (input: any): PermissionMatrix => {
  const base = createDefaultPermissions();
  if (!input || typeof input !== "object") return base;

  for (const role of ROLE_ORDER) {
    const roleData = input?.[role];
    if (!roleData || typeof roleData !== "object") continue;
    for (const permission of PERMISSION_OPTIONS) {
      if (permission.key in roleData) {
        base[role][permission.key] = role === "Dono" ? true : Boolean(roleData[permission.key]);
      }
    }
  }

  return base;
};

export function CommunitySettingsPanel({
  communityId,
  currentUser,
  canEdit,
}: CommunitySettingsPanelProps) {
  const [schemaReady, setSchemaReady] = useState(true);
  const [permissionsSchemaReady, setPermissionsSchemaReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [rules, setRules] = useState<CommunityRule[]>([]);
  const [permissions, setPermissions] = useState<PermissionMatrix>(createDefaultPermissions());
  const [openRole, setOpenRole] = useState<RoleTag | null>("ADM");
  const [newRule, setNewRule] = useState({ titulo: "", descricao: "" });

  const permissionKeys = useMemo(
    () => PERMISSION_OPTIONS.map(permission => permission.key),
    [],
  );

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
      setPermissionsSchemaReady(data.permissionsSchemaReady !== false);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings ?? {}) });
      setRules((data.rules ?? []).map((rule: any, index: number) => ({
        ...rule,
        ordem: Number(rule.ordem ?? index + 1),
        ativo: Boolean(rule.ativo),
        removido: false,
      })));
      setPermissions(normalizePermissions(data.permissions));
    } catch {
      setSchemaReady(false);
      setPermissionsSchemaReady(false);
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

  const updatePermission = (role: RoleTag, permission: PermissionKey, value: boolean) => {
    if (role === "Dono") return;
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value,
      },
    }));
  };

  const setRolePermissions = (role: RoleTag, value: boolean) => {
    if (role === "Dono") return;
    setPermissions(prev => {
      const next = { ...prev };
      next[role] = { ...next[role] };
      for (const key of permissionKeys) next[role][key] = value;
      return next;
    });
  };

  const visibleRules = rules
    .map((rule, realIndex) => ({ rule, realIndex }))
    .filter(({ rule }) => Boolean(rule.ativo) && !rule.removido);

  const addRule = () => {
    if (!newRule.titulo.trim() || !newRule.descricao.trim()) {
      toast.warning("Preencha título e descrição da regra.");
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
          permissions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar configurações");

      toast.success("Configurações da comunidade salvas.");
      await loadSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
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
                SQL complementar ainda não aplicado
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/55">
                Regras e configurações granulares dependem das tabelas
                comunidade_regras e comunidade_configuracoes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-black text-white">
            <Settings2 className="text-sky-400" size={20} />
            Controle da comunidade
          </h3>
          <p className="mt-1 text-xs text-white/30">
            Permissões, pontos, ciclo semanal e regras do grupo.
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
          Apenas o Dono altera configurações globais. ADMs continuam gerenciando o que já for permitido.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] font-black uppercase text-white/40">
            Permissões operacionais
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
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase text-white/30">
                XP por treino concluído
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
                XP por dia de nutrição
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
                Horário
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">
              Permissões por cargo
            </p>
            <p className="mt-1 text-xs text-white/30">
              Escolha o que cada cargo pode fazer. No celular, abra um cargo por vez.
            </p>
          </div>
          <ShieldCheck className="text-sky-300" size={18} />
        </div>

        {!permissionsSchemaReady && (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100/75">
            Permissões por cargo exigem a tabela <span className="font-black">comunidade_permissoes_tag</span>.
          </div>
        )}

        <div className="mt-4 space-y-2">
          {ROLE_ORDER.map(role => {
            const expanded = openRole === role;
            const isOwnerRole = role === "Dono";
            const allowedCount = permissionKeys.reduce((acc, key) => {
              return acc + (permissions[role][key] ? 1 : 0);
            }, 0);

            return (
              <article key={role} className="rounded-xl border border-white/10 bg-black/20 p-2 sm:p-3">
                <button
                  type="button"
                  onClick={() => setOpenRole(current => (current === role ? null : role))}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left"
                >
                  <div>
                    <p className={`text-xs font-black uppercase ${ROLE_TONE[role]}`}>
                      {role}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {allowedCount}/{permissionKeys.length} permissões ativas
                    </p>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-white/45 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {expanded && (
                  <div className="mt-3 space-y-3">
                    {isOwnerRole ? (
                      <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/85">
                        O cargo Dono mantém acesso total para evitar perda de controle da comunidade.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setRolePermissions(role, true)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/60 disabled:opacity-40"
                        >
                          Marcar tudo
                        </button>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setRolePermissions(role, false)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/60 disabled:opacity-40"
                        >
                          Limpar
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {PERMISSION_OPTIONS.map(permission => (
                        <label
                          key={`${role}-${permission.key}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[11px] font-black text-white">
                              {permission.label}
                            </span>
                            <span className="hidden text-[10px] leading-relaxed text-white/35 sm:block">
                              {permission.description}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(permissions[role][permission.key])}
                            disabled={!canEdit || isOwnerRole}
                            onChange={event => updatePermission(role, permission.key, event.target.checked)}
                            className="h-4 w-4 shrink-0 accent-sky-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40">
              Regras da comunidade
            </p>
            <p className="mt-1 text-xs text-white/30">
              Regras aparecem como base do grupo fechado e ajudam na moderação.
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
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[0.8fr_1.2fr_auto]">
            <input
              value={newRule.titulo}
              onChange={event => setNewRule(prev => ({ ...prev, titulo: event.target.value }))}
              placeholder="título da regra"
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/20"
            />
            <input
              value={newRule.descricao}
              onChange={event => setNewRule(prev => ({ ...prev, descricao: event.target.value }))}
              placeholder="descrição objetiva"
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
