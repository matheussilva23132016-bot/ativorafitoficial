"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import {
  Activity, Ban, BarChart3, Bell, CheckCircle2, ChevronLeft, ClipboardList,
  Crown, Database, KeyRound, Loader2, Megaphone, Plus, RefreshCcw, Save,
  Search, Send, Settings, ShieldAlert, ShieldCheck, SlidersHorizontal,
  Trash2, UserCog, UserPlus, Users,
} from "lucide-react";

type BossAccess = {
  level: string;
  canCreateUsers: boolean;
  canBanUsers: boolean;
  canGrantAccess: boolean;
  canRunSql: boolean;
  canManageApp?: boolean;
  canModerateContent?: boolean;
  canSendBroadcast?: boolean;
  canViewAudit?: boolean;
};

type BossPanelViewProps = {
  onBack: () => void;
  currentUser: any;
  bossAccess: BossAccess | null;
};

type SqlExecutionResult = {
  success?: boolean;
  dryRun?: boolean;
  statements?: Array<{ index: number; sql: string }>;
  results?: Array<{
    index: number;
    type: "rows" | "result";
    rowCount: number;
    affectedRows?: number;
    insertId?: string;
    columns?: string[];
    rows?: Array<Record<string, unknown>>;
    truncated?: boolean;
  }>;
};

const roles = [
  { value: "aluno", label: "Aluno" },
  { value: "personal", label: "Personal" },
  { value: "instrutor", label: "Instrutor" },
  { value: "nutri", label: "Nutricionista" },
  { value: "influencer", label: "Influenciador" },
  { value: "adm", label: "ADM" },
];

const scopes = [
  { value: "app", label: "App inteiro" },
  { value: "social", label: "Ativora Social" },
  { value: "comunidades", label: "Comunidades" },
  { value: "treinos", label: "Treinos" },
  { value: "nutricao", label: "Nutrição" },
];

const tabs = [
  { id: "overview", label: "Central", icon: BarChart3 },
  { id: "users", label: "Usuários", icon: UserPlus },
  { id: "moderation", label: "Moderação", icon: ShieldAlert, permission: "canModerateContent" },
  { id: "broadcasts", label: "Avisos", icon: Megaphone, permission: "canSendBroadcast" },
  { id: "settings", label: "App", icon: Settings, permission: "canManageApp" },
  { id: "bans", label: "Bloqueios", icon: Ban, permission: "canBanUsers" },
  { id: "access", label: "Acessos", icon: KeyRound, permission: "canGrantAccess" },
  { id: "audit", label: "Auditoria", icon: ClipboardList, permission: "canViewAudit" },
  { id: "sql", label: "SQL", icon: Database, permission: "canRunSql" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const accessOptions = [
  ["canCreateUsers", "Criar e editar contas"],
  ["canBanUsers", "Banir e restringir"],
  ["canGrantAccess", "Conceder Boss"],
  ["canRunSql", "Executar SQL"],
  ["canManageApp", "Configurar app"],
  ["canModerateContent", "Moderar conteúdo"],
  ["canSendBroadcast", "Enviar avisos"],
  ["canViewAudit", "Ver auditoria"],
] as const;

export function BossPanelView({ onBack, currentUser, bossAccess }: BossPanelViewProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [query, setQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [accesses, setAccesses] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [moderation, setModeration] = useState<any>({ posts: [], suggestions: [], communities: [] });
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [settingsRows, setSettingsRows] = useState<any[]>([]);
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [createForm, setCreateForm] = useState({ fullName: "", email: "", nickname: "", password: "", role: "aluno" });
  const [banForm, setBanForm] = useState({ identifier: "", scope: "app", reason: "" });
  const [accessForm, setAccessForm] = useState({
    identifier: "", level: "admin", canCreateUsers: true, canBanUsers: true,
    canGrantAccess: false, canRunSql: false, canManageApp: false,
    canModerateContent: true, canSendBroadcast: false, canViewAudit: true,
  });
  const [broadcastForm, setBroadcastForm] = useState({ titulo: "", mensagem: "", audience: "all", roleTarget: "aluno", userTarget: "" });
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
  const [sqlText, setSqlText] = useState("");
  const [sqlDryRun, setSqlDryRun] = useState(true);
  const [sqlResult, setSqlResult] = useState<SqlExecutionResult | null>(null);

  const isOwner = bossAccess?.level === "owner";
  const can = (permission?: keyof BossAccess) => !permission || isOwner || Boolean(bossAccess?.[permission]);
  const visibleTabs = useMemo(
    () => tabs.filter((item) => can(("permission" in item ? item.permission : undefined) as keyof BossAccess | undefined)),
    [bossAccess],
  );

  const permissionSummary = useMemo(() => {
    if (!bossAccess) return "Acesso pendente";
    if (isOwner) return "Controle total";
    return [
      bossAccess.canCreateUsers ? "contas" : null,
      bossAccess.canBanUsers ? "bloqueios" : null,
      bossAccess.canModerateContent ? "moderação" : null,
      bossAccess.canSendBroadcast ? "avisos" : null,
      bossAccess.canManageApp ? "app" : null,
      bossAccess.canViewAudit ? "auditoria" : null,
      bossAccess.canRunSql ? "SQL" : null,
    ].filter(Boolean).join(", ") || "Somente leitura";
  }, [bossAccess, isOwner]);

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) setTab("overview");
  }, [tab, visibleTabs]);

  const apiJson = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Ação Boss não concluída.");
    return json;
  };

  const loadOverview = async () => setOverview(await apiJson("/api/boss/overview"));
  const loadUsers = async (value = query) => setUsers((await apiJson(`/api/boss/users?q=${encodeURIComponent(value)}`)).users || []);
  const loadBans = async () => { if (can("canBanUsers")) setBans((await apiJson("/api/boss/bans")).bans || []); };
  const loadAccesses = async () => { if (can("canGrantAccess")) setAccesses((await apiJson("/api/boss/access")).accesses || []); };
  const loadModeration = async () => { if (can("canModerateContent")) setModeration(await apiJson("/api/boss/moderation")); };
  const loadBroadcasts = async () => { if (can("canSendBroadcast")) setBroadcasts((await apiJson("/api/boss/broadcasts")).broadcasts || []); };
  const loadAudit = async (value = auditQuery) => { if (can("canViewAudit")) setAuditLogs((await apiJson(`/api/boss/audit?q=${encodeURIComponent(value)}`)).logs || []); };
  const loadSettings = async () => {
    if (!can("canManageApp")) return;
    const settings = (await apiJson("/api/boss/settings")).settings || [];
    setSettingsRows(settings);
    setSettingDrafts(Object.fromEntries(settings.map((setting: any) => [setting.setting_key, String(setting.setting_value ?? "")])));
  };

  const reload = async () => {
    setLoading(true);
    setFeedback("");
    try {
      await Promise.allSettled([loadOverview(), loadUsers(), loadBans(), loadAccesses(), loadModeration(), loadBroadcasts(), loadSettings(), loadAudit()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: () => Promise<string | void>, after?: () => Promise<void>) => {
    setLoading(true);
    setFeedback("");
    try {
      const message = await action();
      if (message) setFeedback(message);
      if (after) await after();
      await loadOverview();
    } catch (error: any) {
      setFeedback(error?.message || "Não foi possível concluir a ação.");
    } finally {
      setLoading(false);
    }
  };

  const submitCreateUser = async () => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/users", { method: "POST", body: JSON.stringify(createForm) });
      setCreateForm({ fullName: "", email: "", nickname: "", password: "", role: "aluno" });
      return `Conta @${json.user.nickname} criada com sucesso.`;
    }, loadUsers);
  };

  const patchUser = async (id: string, payload: Record<string, unknown>) => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/users", { method: "PATCH", body: JSON.stringify({ id, ...payload }) });
      if (payload.password) setPasswordDrafts((current) => ({ ...current, [id]: "" }));
      return json.message || "Usuário atualizado.";
    }, loadUsers);
  };

  const impersonateUser = async (target: any) => {
    setLoading(true);
    setFeedback("");
    try {
      const json = await apiJson("/api/boss/impersonate", {
        method: "POST",
        body: JSON.stringify({ targetUserId: target?.id }),
      });

      const loginResult = await signIn("boss-impersonate", {
        token: String(json?.token || ""),
        redirect: false,
      });

      if (loginResult?.error) {
        throw new Error(loginResult.error);
      }

      setFeedback(`Sessão trocada para @${target?.nickname || "usuario"}. Redirecionando...`);
      window.location.assign("/dashboard");
    } catch (error: any) {
      setFeedback(error?.message || "Não foi possível entrar com esta conta.");
    } finally {
      setLoading(false);
    }
  };

  const submitBan = async () => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/bans", { method: "POST", body: JSON.stringify(banForm) });
      setBanForm({ identifier: "", scope: "app", reason: "" });
      return json.message || "Restrição aplicada.";
    }, async () => { await Promise.allSettled([loadUsers(), loadBans()]); });
  };

  const revokeBan = async (id: string) => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/bans", { method: "PATCH", body: JSON.stringify({ id }) });
      return json.message || "Bloqueio revogado.";
    }, async () => { await Promise.allSettled([loadUsers(), loadBans()]); });
  };

  const submitAccess = async () => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/access", { method: "POST", body: JSON.stringify(accessForm) });
      setAccessForm({
        identifier: "", level: "admin", canCreateUsers: true, canBanUsers: true,
        canGrantAccess: false, canRunSql: false, canManageApp: false,
        canModerateContent: true, canSendBroadcast: false, canViewAudit: true,
      });
      return json.message || "Acesso atualizado.";
    }, loadAccesses);
  };

  const revokeAccess = async (id: string) => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/access", { method: "PATCH", body: JSON.stringify({ id }) });
      return json.message || "Acesso removido.";
    }, loadAccesses);
  };

  const submitBroadcast = async () => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/broadcasts", { method: "POST", body: JSON.stringify(broadcastForm) });
      setBroadcastForm({ titulo: "", mensagem: "", audience: "all", roleTarget: "aluno", userTarget: "" });
      return json.message || "Aviso enviado.";
    }, loadBroadcasts);
  };

  const saveSetting = async (key: string) => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/settings", { method: "PATCH", body: JSON.stringify({ key, value: settingDrafts[key] ?? "" }) });
      return json.message || "Configuração salva.";
    }, loadSettings);
  };

  const moderationAction = async (payload: Record<string, unknown>) => {
    await runAction(async () => {
      const json = await apiJson("/api/boss/moderation", { method: "PATCH", body: JSON.stringify(payload) });
      return json.message || "Moderação aplicada.";
    }, loadModeration);
  };

  const submitSql = async () => {
    setLoading(true);
    setFeedback("");
    setSqlResult(null);
    try {
      const json = await apiJson("/api/boss/sql", { method: "POST", body: JSON.stringify({ sql: sqlText, dryRun: sqlDryRun }) });
      setSqlResult(json);
      setFeedback(sqlDryRun ? "SQL validada. Desative o modo seguro para executar." : "SQL executada e auditada.");
      await Promise.allSettled([loadAudit(), loadOverview()]);
    } catch (error: any) {
      setFeedback(error?.message || "Não foi possível processar a SQL.");
    } finally {
      setLoading(false);
    }
  };

  const stats = overview?.stats || {};

  return (
    <motion.div
      key="boss-panel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-7xl max-w-full min-w-0 space-y-4 overflow-x-hidden text-left"
    >
      <button type="button" onClick={onBack} className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white">
        <ChevronLeft size={16} />
        Voltar ao painel
      </button>

      <section className="relative max-w-full overflow-hidden rounded-lg border border-sky-500/20 bg-[#050A12] p-4 sm:p-7 lg:p-8">
        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <Crown size={12} />
              Painel Boss
            </div>
            <h1 className="mt-4 text-[1.85rem] font-black italic leading-none tracking-tighter text-white sm:mt-5 sm:text-5xl">Centro de comando AtivoraFit.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">
              Controle contas, bloqueios, avisos, moderação, configurações, auditoria e ajustes técnicos do app em uma área protegida.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <BossMetric label="Usuário" value={`@${currentUser?.nickname || "boss"}`} icon={Users} />
            <BossMetric label="Nível" value={bossAccess?.level || "owner"} icon={Crown} />
            <BossMetric label="Permissões" value={permissionSummary} icon={ShieldCheck} />
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[270px_1fr]">
        <aside className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-2.5 sm:p-3">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-1">
            {visibleTabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex min-h-12 min-w-[124px] items-center justify-center gap-2 rounded-lg px-3 text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition sm:min-w-0 sm:text-[10px] sm:tracking-widest lg:justify-start ${
                    tab === item.id ? "bg-sky-500 text-black" : "bg-black/20 text-white/45 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={reload} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-[10px] font-black uppercase tracking-widest text-white/45 transition hover:text-white">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Atualizar
          </button>
        </aside>

        <section className="min-w-0 max-w-full overflow-x-hidden rounded-lg border border-white/10 bg-white/5 p-4 sm:p-5">
          {feedback && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
              <CheckCircle2 className="mt-0.5 shrink-0 text-sky-300" size={16} />
              <p className="text-xs leading-relaxed text-sky-100/80">{feedback}</p>
            </div>
          )}

          {tab === "overview" && (
            <div className="space-y-5">
              <SectionTitle icon={BarChart3} title="Central Boss" desc="Um retrato rápido do app para decidir onde agir primeiro." />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <BossMetric label="Usuários" value={stats.totalUsers || 0} icon={Users} tone="sky" />
                <BossMetric label="Ativos" value={stats.activeUsers || 0} icon={Activity} tone="emerald" />
                <BossMetric label="Novos 7 dias" value={stats.newUsers7d || 0} icon={UserPlus} tone="sky" />
                <BossMetric label="Comunidades" value={stats.totalCommunities || 0} icon={ShieldCheck} tone="amber" />
                <BossMetric label="Sugestões" value={stats.pendingSuggestions || 0} icon={Bell} tone="rose" />
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <RecentPanel title="Novas contas" items={overview?.recentUsers || []} empty="Sem contas recentes." />
                <RecentPanel title="Auditoria recente" items={overview?.recentAudit || []} empty="Sem eventos de auditoria." />
                <RecentPanel title="Sugestões beta" items={overview?.recentSuggestions || []} empty="Sem sugestões recentes." />
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="grid min-w-0 gap-5 xl:grid-cols-[0.82fr_1.18fr]">
              <div>
                <SectionTitle icon={UserPlus} title="Criar conta" desc="Cadastro interno para liberar acesso sem passar pela tela pública." />
                <div className="mt-5 grid gap-3">
                  <BossInput value={createForm.fullName} onChange={(value) => setCreateForm({ ...createForm, fullName: value })} placeholder="Nome completo" />
                  <BossInput value={createForm.email} onChange={(value) => setCreateForm({ ...createForm, email: value })} placeholder="E-mail" />
                  <BossInput value={createForm.nickname} onChange={(value) => setCreateForm({ ...createForm, nickname: value })} placeholder="Nickname" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <BossInput value={createForm.password} onChange={(value) => setCreateForm({ ...createForm, password: value })} placeholder="Senha inicial" type="password" />
                    <BossSelect value={createForm.role} onChange={(value) => setCreateForm({ ...createForm, role: value })} options={roles} />
                  </div>
                  <BossButton onClick={submitCreateUser} disabled={loading} icon={Plus}>Criar conta</BossButton>
                </div>
              </div>

              <div>
                <SectionTitle icon={UserCog} title="Gerenciar usuários" desc="Busque, altere perfil, bloqueie, reative ou redefina senha." />
                <div className="mt-3 flex items-center gap-2">
                  <BossInput value={query} onChange={setQuery} placeholder="Buscar nome, e-mail ou @" onEnter={() => loadUsers(query)} className="min-w-0 flex-1" />
                  <button type="button" onClick={() => loadUsers(query)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-black" aria-label="Buscar">
                    <Search size={17} />
                  </button>
                </div>
                <div className="mt-3 grid gap-3">
                  {users.length ? users.map((user) => (
                    <UserControlCard
                      key={user.id}
                      user={user}
                      passwordValue={passwordDrafts[user.id] || ""}
                      setPasswordValue={(value) => setPasswordDrafts((current) => ({ ...current, [user.id]: value }))}
                      onPatch={(payload) => patchUser(user.id, payload)}
                      onImpersonate={() => impersonateUser(user)}
                      loading={loading}
                    />
                  )) : <EmptyState text="Nenhum usuário encontrado." />}
                </div>
              </div>
            </div>
          )}

          {tab === "moderation" && (
            <div className="space-y-5">
              <SectionTitle icon={ShieldAlert} title="Moderação" desc="Acompanhe posts, sugestões beta e comunidades sem abrir o banco." />
              <div className="grid gap-4 xl:grid-cols-3">
                <ModerationColumn title="Posts recentes">
                  {moderation.posts?.length ? moderation.posts.map((post: any) => (
                    <div key={post.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <p className="text-sm font-black text-white">@{post.nickname}</p>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/50">{post.content || "Post sem texto."}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{post.media_type || "texto"} · {formatDate(post.criado_em)}</p>
                      <button type="button" onClick={() => moderationAction({ action: "delete_post", id: String(post.id) })} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 text-[10px] font-black uppercase tracking-widest text-white">
                        <Trash2 size={14} />
                        Remover post
                      </button>
                    </div>
                  )) : <EmptyState text="Nenhum post carregado." />}
                </ModerationColumn>

                <ModerationColumn title="Sugestões beta">
                  {moderation.suggestions?.length ? moderation.suggestions.map((item: any) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-black text-white">@{item.nickname || "usuário"}</p>
                        <StatusPill value={item.status} />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-white/50">{item.mensagem}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {["em_analise", "planejada", "resolvida", "recusada"].map((status) => (
                          <button key={status} type="button" onClick={() => moderationAction({ action: "update_suggestion", id: item.id, status })} className="min-h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[9px] font-black uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white">
                            {status.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  )) : <EmptyState text="Nenhuma sugestão beta." />}
                </ModerationColumn>

                <ModerationColumn title="Comunidades">
                  {moderation.communities?.length ? moderation.communities.map((community: any) => (
                    <div key={community.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <p className="text-sm font-black text-white">{community.nome}</p>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">{community.descricao || "Sem descrição."}</p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{community.status || "ativa"} · {community.total_membros || 0} membros</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {["ativa", "pausada", "encerrada"].map((status) => (
                          <button key={status} type="button" onClick={() => moderationAction({ action: "update_community_status", id: community.id, status })} className="min-h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[9px] font-black uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white">
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )) : <EmptyState text="Nenhuma comunidade carregada." />}
                </ModerationColumn>
              </div>
            </div>
          )}

          {tab === "broadcasts" && (
            <div className="grid min-w-0 gap-5 xl:grid-cols-[0.82fr_1.18fr]">
              <div>
                <SectionTitle icon={Megaphone} title="Aviso em massa" desc="Envie comunicados internos para todos, por perfil ou para um usuário específico." />
                <div className="mt-5 grid gap-3">
                  <BossInput value={broadcastForm.titulo} onChange={(value) => setBroadcastForm({ ...broadcastForm, titulo: value })} placeholder="Título do aviso" />
                  <textarea value={broadcastForm.mensagem} onChange={(event) => setBroadcastForm({ ...broadcastForm, mensagem: event.target.value })} placeholder="Mensagem que aparecerá na notificação do app" className="min-h-32 rounded-lg border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-sky-500/50" />
                  <BossSelect value={broadcastForm.audience} onChange={(value) => setBroadcastForm({ ...broadcastForm, audience: value })} options={[
                    { value: "all", label: "Todos os usuários ativos" },
                    { value: "role", label: "Somente um perfil" },
                    { value: "user", label: "Um usuário específico" },
                  ]} />
                  {broadcastForm.audience === "role" && <BossSelect value={broadcastForm.roleTarget} onChange={(value) => setBroadcastForm({ ...broadcastForm, roleTarget: value })} options={roles} />}
                  {broadcastForm.audience === "user" && <BossInput value={broadcastForm.userTarget} onChange={(value) => setBroadcastForm({ ...broadcastForm, userTarget: value })} placeholder="Nickname do usuário" />}
                  <BossButton onClick={submitBroadcast} disabled={loading} icon={Send}>Enviar aviso</BossButton>
                </div>
              </div>
              <ListPanel title="Últimos avisos">
                {broadcasts.length ? broadcasts.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-black text-white">{item.titulo}</p>
                      <span className="rounded-lg bg-sky-500/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-200">{item.delivered_count} entregas</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">{item.mensagem}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{item.audience} · {formatDate(item.created_at)}</p>
                  </div>
                )) : <EmptyState text="Nenhum aviso enviado." />}
              </ListPanel>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-5">
              <SectionTitle icon={Settings} title="Configurações do app" desc="Flags e textos controláveis pelo Boss. As próximas telas podem consumir esses valores sem novo SQL." />
              <div className="grid gap-3 lg:grid-cols-2">
                {settingsRows.length ? settingsRows.map((setting) => {
                  const value = settingDrafts[setting.setting_key] ?? "";
                  const isBoolean = setting.setting_type === "boolean";
                  return (
                    <div key={setting.setting_key} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white">{setting.label}</p>
                          <p className="mt-1 text-xs leading-relaxed text-white/40">{setting.description}</p>
                        </div>
                        <SlidersHorizontal className="shrink-0 text-sky-300" size={17} />
                      </div>
                      {isBoolean ? (
                        <label className="mt-4 flex min-h-12 items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-bold text-white/65">
                          {normalizeBool(value) ? "Ativo" : "Inativo"}
                          <input type="checkbox" checked={normalizeBool(value)} onChange={(event) => setSettingDrafts((current) => ({ ...current, [setting.setting_key]: event.target.checked ? "true" : "false" }))} className="h-4 w-4 accent-sky-500" />
                        </label>
                      ) : (
                        <textarea value={value} onChange={(event) => setSettingDrafts((current) => ({ ...current, [setting.setting_key]: event.target.value }))} className="mt-4 min-h-24 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-sky-500/50" />
                      )}
                      <BossButton onClick={() => saveSetting(setting.setting_key)} disabled={loading} icon={Save} variant="secondary" className="mt-3">Salvar</BossButton>
                    </div>
                  );
                }) : <EmptyState text="Nenhuma configuração carregada." />}
              </div>
            </div>
          )}

          {tab === "bans" && (
            <div className="grid min-w-0 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div>
                <SectionTitle icon={Ban} title="Bloqueios e restrições" desc="Bloqueie o app inteiro ou apenas módulos específicos." />
                <div className="mt-5 grid gap-3">
                  <BossInput value={banForm.identifier} onChange={(value) => setBanForm({ ...banForm, identifier: value })} placeholder="Nickname, e-mail ou ID" />
                  <BossSelect value={banForm.scope} onChange={(value) => setBanForm({ ...banForm, scope: value })} options={scopes} />
                  <textarea value={banForm.reason} onChange={(event) => setBanForm({ ...banForm, reason: event.target.value })} placeholder="Motivo interno" className="min-h-28 rounded-lg border border-white/10 bg-black/25 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-sky-500/50" />
                  <BossButton onClick={submitBan} disabled={loading} icon={Ban} variant="danger">Aplicar restrição</BossButton>
                </div>
              </div>
              <ListPanel title="Bloqueios recentes">
                {bans.length ? bans.map((ban) => (
                  <div key={ban.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">@{ban.target_nickname || ban.target_user_id}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">{ban.scope} · {ban.status}</p>
                      </div>
                      {ban.status === "active" && (
                        <button type="button" onClick={() => revokeBan(ban.id)} className="rounded-lg border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/55 hover:bg-white/10 hover:text-white">Revogar</button>
                      )}
                    </div>
                    {ban.reason && <p className="mt-3 text-xs leading-relaxed text-white/45">{ban.reason}</p>}
                  </div>
                )) : <EmptyState text="Nenhum bloqueio registrado." />}
              </ListPanel>
            </div>
          )}

          {tab === "access" && (
            <div className="grid min-w-0 gap-5 xl:grid-cols-[0.82fr_1.18fr]">
              <div>
                <SectionTitle icon={KeyRound} title="Acessos Boss" desc="Conceda poderes por pessoa, sem entregar controle total quando não precisa." />
                <div className="mt-5 grid gap-3">
                  <BossInput value={accessForm.identifier} onChange={(value) => setAccessForm({ ...accessForm, identifier: value })} placeholder="Nickname, e-mail ou ID" />
                  <BossSelect value={accessForm.level} onChange={(value) => setAccessForm({ ...accessForm, level: value })} options={[
                    { value: "admin", label: "Admin Boss" },
                    { value: "moderador", label: "Moderador" },
                    { value: "owner", label: "Owner" },
                  ]} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {accessOptions.map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-bold text-white/65">
                        {label}
                        <input type="checkbox" checked={Boolean((accessForm as any)[key])} onChange={(event) => setAccessForm({ ...accessForm, [key]: event.target.checked } as any)} className="h-4 w-4 accent-sky-500" />
                      </label>
                    ))}
                  </div>
                  <BossButton onClick={submitAccess} disabled={loading} icon={KeyRound}>Liberar acesso</BossButton>
                </div>
              </div>
              <ListPanel title="Pessoas com Boss">
                {accesses.length ? accesses.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">@{item.nickname}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">{item.nivel} · {item.active ? "ativo" : "removido"}</p>
                      </div>
                      {item.active ? (
                        <button type="button" onClick={() => revokeAccess(item.id)} className="rounded-lg border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/55 hover:bg-white/10 hover:text-white">Remover</button>
                      ) : null}
                    </div>
                    <p className="mt-3 break-words text-xs leading-relaxed text-white/45">
                      Contas: {yesNo(item.can_create_users)} · Bloqueios: {yesNo(item.can_ban_users)} · Acessos: {yesNo(item.can_grant_access)} · App: {yesNo(item.can_manage_app)} · Moderação: {yesNo(item.can_moderate_content)} · Avisos: {yesNo(item.can_send_broadcast)} · Auditoria: {yesNo(item.can_view_audit)} · SQL: {yesNo(item.can_run_sql)}
                    </p>
                  </div>
                )) : <EmptyState text="Nenhum acesso listado." />}
              </ListPanel>
            </div>
          )}

          {tab === "audit" && (
            <div className="space-y-5">
              <SectionTitle icon={ClipboardList} title="Auditoria" desc="Registro das ações sensíveis feitas pelo Boss." />
              <div className="flex items-center gap-2">
                <BossInput value={auditQuery} onChange={setAuditQuery} placeholder="Buscar ação, alvo ou responsável" onEnter={() => loadAudit(auditQuery)} className="min-w-0 flex-1" />
                <button type="button" onClick={() => loadAudit(auditQuery)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-black" aria-label="Buscar auditoria">
                  <Search size={17} />
                </button>
              </div>
              <div className="grid gap-3">
                {auditLogs.length ? auditLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-black text-white">{log.action}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">{formatDate(log.created_at)}</p>
                    </div>
                    <p className="mt-2 text-xs text-white/45">@{log.actor_nickname || "sistema"} {log.target_nickname ? `→ @${log.target_nickname}` : ""}</p>
                    {log.details_json && <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black/35 p-3 text-[11px] leading-relaxed text-white/45">{prettyJson(log.details_json)}</pre>}
                  </div>
                )) : <EmptyState text="Nenhum evento encontrado." />}
              </div>
            </div>
          )}

          {tab === "sql" && can("canRunSql") && (
            <div className="grid min-w-0 gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <div>
                <SectionTitle icon={Database} title="Console SQL Boss" desc="Valide e execute ajustes técnicos pelo painel. O modo seguro vem ligado." />
                <div className="mt-5 grid gap-3">
                  <textarea value={sqlText} onChange={(event) => setSqlText(event.target.value)} spellCheck={false} placeholder={"SELECT id, nickname, role FROM ativora_users LIMIT 10;\n\nUPDATE boss_app_settings SET setting_value = 'true' WHERE setting_key = 'beta_mode';"} className="min-h-[260px] rounded-lg border border-white/10 bg-black/35 p-4 font-mono text-xs leading-relaxed text-sky-50 outline-none placeholder:text-white/18 focus:border-sky-500/50" />
                  <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-bold text-white/65">
                    <span>
                      <span className="block text-white">Modo seguro</span>
                      <span className="mt-1 block text-xs font-medium leading-relaxed text-white/35">Valida a SQL sem alterar dados.</span>
                    </span>
                    <input type="checkbox" checked={sqlDryRun} onChange={(event) => setSqlDryRun(event.target.checked)} className="h-4 w-4 shrink-0 accent-sky-500" />
                  </label>
                  <BossButton onClick={submitSql} disabled={loading || !sqlText.trim()} icon={Database} variant={sqlDryRun ? "primary" : "success"}>{sqlDryRun ? "Validar SQL" : "Executar SQL"}</BossButton>
                </div>
                <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-xs font-bold leading-relaxed text-amber-100/80">DROP, TRUNCATE, GRANT, criação de usuário do banco e ações extremas seguem bloqueadas.</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white/45">Resultado</h3>
                <SqlResultPreview result={sqlResult} />
              </div>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

function BossMetric({ label, value, icon: Icon, tone = "sky" }: { label: string; value: any; icon: any; tone?: "sky" | "emerald" | "amber" | "rose" }) {
  const toneClass = { sky: "text-sky-300", emerald: "text-emerald-300", amber: "text-amber-300", rose: "text-rose-300" }[tone];
  const valueText = String(value ?? "");
  const compact = valueText.length > 22;
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <Icon className={toneClass} size={18} />
      <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/30">{label}</p>
      <p className={`mt-1 break-words font-black text-white ${compact ? "text-sm leading-relaxed sm:text-base" : "text-lg sm:text-xl"}`}>{valueText}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="text-sky-300" size={18} />
        <h2 className="text-xl font-black italic text-white sm:text-2xl">{title}</h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">{desc}</p>
    </div>
  );
}

function BossInput({ value, onChange, placeholder, type = "text", onEnter, className = "" }: { value: string; onChange: (value: string) => void; placeholder: string; type?: string; onEnter?: () => void; className?: string }) {
  return (
    <input
      value={value}
      type={type}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => { if (event.key === "Enter" && onEnter) onEnter(); }}
      placeholder={placeholder}
      className={`h-12 w-full min-w-0 rounded-lg border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-sky-500/50 ${className}`}
    />
  );
}

function BossSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-lg border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-sky-500/50">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function BossButton({ children, onClick, disabled, icon: Icon, variant = "primary", className = "" }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; icon: any; variant?: "primary" | "secondary" | "danger" | "success"; className?: string }) {
  const variantClass = {
    primary: "bg-sky-500 text-black",
    secondary: "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
    danger: "bg-rose-500 text-white",
    success: "bg-emerald-500 text-black",
  }[variant];
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-center text-[9px] font-black uppercase leading-tight tracking-wide whitespace-normal transition disabled:opacity-45 sm:text-[10px] sm:tracking-widest ${variantClass} ${className}`}>
      <Icon size={15} />
      {children}
    </button>
  );
}

function UserControlCard({ user, passwordValue, setPasswordValue, onPatch, onImpersonate, loading }: { user: any; passwordValue: string; setPasswordValue: (value: string) => void; onPatch: (payload: Record<string, unknown>) => void; onImpersonate: () => void; loading: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{user.full_name || "Usuário"}</p>
          <p className="mt-1 break-all text-xs text-white/40">@{user.nickname} · {user.email}</p>
        </div>
        <StatusPill value={user.account_status || "active"} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <BossSelect value={user.role || "aluno"} onChange={(role) => onPatch({ role })} options={roles} />
        <button type="button" disabled={loading} onClick={() => onPatch({ status: "active" })} className="min-h-12 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-[9px] font-black uppercase leading-tight tracking-wide text-emerald-200 disabled:opacity-40 sm:text-[10px] sm:tracking-widest">Ativar</button>
        <button type="button" disabled={loading} onClick={() => onPatch({ status: "banned" })} className="min-h-12 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 text-[9px] font-black uppercase leading-tight tracking-wide text-rose-200 disabled:opacity-40 sm:text-[10px] sm:tracking-widest">Bloquear</button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px]">
        <BossInput value={passwordValue} onChange={setPasswordValue} placeholder="Nova senha temporária" type="password" />
        <button type="button" disabled={loading || passwordValue.length < 8} onClick={() => onPatch({ password: passwordValue })} className="min-h-12 rounded-lg border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase leading-tight tracking-wide text-white/55 disabled:opacity-40 sm:text-[10px] sm:tracking-widest">Redefinir</button>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={onImpersonate}
        className="mt-3 min-h-11 w-full rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 text-[9px] font-black uppercase leading-tight tracking-wide text-sky-200 transition hover:bg-sky-500/20 disabled:opacity-45 sm:text-[10px] sm:tracking-widest"
      >
        Entrar como este usuário
      </button>
    </div>
  );
}

function ModerationColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-black uppercase tracking-widest text-white/45">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function ListPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-black uppercase tracking-widest text-white/45">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function RecentPanel({ title, items, empty }: { title: string; items: any[]; empty: string }) {
  return (
    <ListPanel title={title}>
      {items.length ? items.map((item) => (
        <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
          <p className="truncate text-sm font-black text-white">{item.full_name || item.action || item.categoria || item.nickname || "Registro"}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">{item.email || item.mensagem || item.target_nickname || item.role || "Sem detalhes."}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{formatDate(item.created_at)}</p>
        </div>
      )) : <EmptyState text={empty} />}
    </ListPanel>
  );
}

function StatusPill({ value }: { value: any }) {
  const status = String(value || "active").toLowerCase();
  const active = ["active", "ativo", "aprovado", "resolvida"].includes(status);
  const danger = ["banned", "banido", "recusada", "encerrada"].includes(status);
  return (
    <span className={`max-w-full break-words rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest ${active ? "bg-emerald-500/15 text-emerald-300" : danger ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-200"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function SqlResultPreview({ result }: { result: SqlExecutionResult | null }) {
  if (!result) {
    return (
      <div className="mt-3">
        <EmptyState text="O retorno da validação ou execução aparece aqui." />
      </div>
    );
  }

  if (result.dryRun) {
    return (
      <div className="mt-3 grid gap-3">
        {result.statements?.map((statement) => (
          <div key={statement.index} className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-200/70">Instrução {statement.index}</p>
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 font-mono text-xs leading-relaxed text-sky-50/80">{statement.sql}</pre>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-3">
      {result.results?.map((item) => (
        <div key={item.index} className="rounded-lg border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">Instrução {item.index}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {item.type === "rows" ? `${item.rowCount} linhas` : `${item.affectedRows || 0} alteradas`}
                {item.insertId ? ` · ID ${item.insertId}` : ""}
              </p>
            </div>
            {item.truncated && <span className="rounded-lg bg-amber-400/15 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-200">100 primeiras</span>}
          </div>
          {item.type === "rows" && item.rows?.length ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-white/5">
                  <tr>
                    {(item.columns || Object.keys(item.rows[0] || {})).map((column) => (
                      <th key={column} className="px-3 py-2 font-black uppercase tracking-widest text-white/35">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {item.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {(item.columns || Object.keys(row)).map((column) => (
                        <td key={column} className="max-w-[240px] truncate px-3 py-2 text-white/65">{formatSqlValue(row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs font-bold text-white/45">Comando executado sem linhas para exibir.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-center">
      <p className="text-sm font-bold text-white/35">{text}</p>
    </div>
  );
}

function normalizeBool(value: unknown) {
  return ["true", "1", "yes", "sim", "ativo"].includes(String(value || "").toLowerCase());
}

function yesNo(value: unknown) {
  return value === 1 || value === true ? "sim" : "não";
}

function formatDate(value: unknown) {
  if (!value) return "sem data";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatSqlValue(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
}
