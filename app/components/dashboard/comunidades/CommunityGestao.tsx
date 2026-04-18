"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  UserX,
  Users,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { canDo } from "@/lib/communities/permissions";
import { CommunitySettingsPanel } from "./CommunitySettingsPanel";

interface Membro {
  membro_id: string;
  user_id: string;
  nickname: string;
  full_name: string;
  avatar_url: string | null;
  tags: string[];
  joined_at: string;
}

interface Solicitacao {
  id: string;
  user_id: string;
  nickname: string;
  full_name: string;
  avatar_url: string | null;
  mensagem: string | null;
  created_at: string;
}

interface CommunityGestaoProps {
  communityId: string;
  currentUser: any;
  userTags: string[];
  isOwner?: boolean;
  canDelete?: boolean;
  onNotify?: (n: any) => void;
  onGroupDeleted?: () => void;
}

type Section = "membros" | "solicitacoes" | "config";
type MemberFilter = "todos" | "lideranca" | "profissionais" | "participantes";

const TAGS_DISPONIVEIS = [
  "Participante",
  "Instrutor",
  "Personal",
  "Nutri",
  "Nutricionista",
  "ADM",
];

const CARGOS_DISPONIVEIS = [
  "Participante",
  "Instrutor",
  "Personal",
  "Nutri",
  "Nutricionista",
  "ADM",
];

const TAG_COLORS: Record<string, string> = {
  Dono: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  ADM: "border-purple-500/20 bg-purple-500/10 text-purple-300",
  Nutri: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  Nutricionista: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  Instrutor: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  Personal: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  Participante: "border-white/10 bg-white/5 text-white/45",
};

const TAG_ICONS: Record<string, React.ReactNode> = {
  Dono: <Crown size={10} />,
  ADM: <Shield size={10} />,
  Nutri: <Zap size={10} />,
  Nutricionista: <Zap size={10} />,
  Instrutor: <ShieldCheck size={10} />,
  Personal: <ShieldCheck size={10} />,
  Participante: <Users size={10} />,
};

const isValidUrl = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("http");

const hasLeadershipTag = (tags: string[]) => tags.includes("Dono") || tags.includes("ADM");
const hasProfessionalTag = (tags: string[]) =>
  tags.some(tag => ["Nutri", "Nutricionista", "Instrutor", "Personal"].includes(tag));

const getCargoPrincipal = (tags: string[]) => {
  if (tags.includes("Dono")) return "Dono";
  if (tags.includes("ADM")) return "ADM";
  if (tags.includes("Nutri")) return "Nutri";
  if (tags.includes("Nutricionista")) return "Nutricionista";
  if (tags.includes("Instrutor")) return "Instrutor";
  if (tags.includes("Personal")) return "Personal";
  return "Participante";
};

const rolePriority = (tags: string[]) => {
  if (tags.includes("Dono")) return 0;
  if (tags.includes("ADM")) return 1;
  if (hasProfessionalTag(tags)) return 2;
  return 3;
};

const displayName = (item: { nickname?: string; full_name?: string }) =>
  item.nickname || item.full_name || "Membro";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateShort = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

const INITIAL_VISIBLE_MEMBERS = 8;
const INITIAL_VISIBLE_REQUESTS = 4;

export function CommunityGestao({
  communityId,
  currentUser,
  userTags,
  isOwner = false,
  canDelete = false,
  onNotify,
  onGroupDeleted,
}: CommunityGestaoProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<Section>("membros");
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("todos");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tagMenuId, setTagMenuId] = useState<string | null>(null);
  const [cargoMenuId, setCargoMenuId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recusaAlvo, setRecusaAlvo] = useState<Solicitacao | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [removeAlvo, setRemoveAlvo] = useState<Membro | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleMembersCount, setVisibleMembersCount] = useState(INITIAL_VISIBLE_MEMBERS);
  const [visibleRequestsCount, setVisibleRequestsCount] = useState(INITIAL_VISIBLE_REQUESTS);

  const canApprove = canDo(userTags, "member:approve");
  const canRemove = canDo(userTags, "member:remove");
  const canTag = canDo(userTags, "tag:assign");
  const canSetRole = isOwner;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membrosRes, solicitacoesRes] = await Promise.all([
        fetch(`/api/communities/${communityId}/members`, { cache: "no-store" }),
        fetch(
          `/api/communities/${communityId}/requests?requesterId=${encodeURIComponent(currentUser?.id ?? "")}`,
          { cache: "no-store" },
        ),
      ]);

      const membrosData = membrosRes.ok ? await membrosRes.json() : {};
      const solicitacoesData = solicitacoesRes.ok ? await solicitacoesRes.json() : {};

      setMembros(Array.isArray(membrosData.members) ? membrosData.members : []);
      setSolicitacoes(Array.isArray(solicitacoesData.requests) ? solicitacoesData.requests : []);
    } catch {
      setMembros([]);
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const membrosOrdenados = useMemo(() => {
    return [...membros].sort((a, b) => {
      const priorityDiff = rolePriority(a.tags) - rolePriority(b.tags);
      if (priorityDiff !== 0) return priorityDiff;
      return displayName(a).localeCompare(displayName(b), "pt-BR");
    });
  }, [membros]);

  const membrosFiltrados = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return membrosOrdenados.filter(membro => {
      const bySearch =
        !normalized ||
        displayName(membro).toLowerCase().includes(normalized) ||
        membro.tags.join(" ").toLowerCase().includes(normalized);

      if (!bySearch) return false;

      if (memberFilter === "todos") return true;
      if (memberFilter === "lideranca") return hasLeadershipTag(membro.tags);
      if (memberFilter === "profissionais") return hasProfessionalTag(membro.tags);
      return !hasLeadershipTag(membro.tags) && !hasProfessionalTag(membro.tags);
    });
  }, [membrosOrdenados, searchQuery, memberFilter]);

  const membrosVisiveis = useMemo(
    () => membrosFiltrados.slice(0, visibleMembersCount),
    [membrosFiltrados, visibleMembersCount],
  );
  const solicitacoesVisiveis = useMemo(
    () => solicitacoes.slice(0, visibleRequestsCount),
    [solicitacoes, visibleRequestsCount],
  );
  const temMaisMembros = membrosFiltrados.length > visibleMembersCount;
  const temMaisSolicitacoes = solicitacoes.length > visibleRequestsCount;
  const filtrosAbertosNoMobile =
    showMobileFilters || searchQuery.trim().length > 0 || memberFilter !== "todos";

  const totalMembros = membros.length;
  const totalSolicitacoes = solicitacoes.length;
  const totalLideranca = membros.filter(m => hasLeadershipTag(m.tags)).length;
  const totalProfissionais = membros.filter(m => hasProfessionalTag(m.tags)).length;

  useEffect(() => {
    setVisibleMembersCount(INITIAL_VISIBLE_MEMBERS);
  }, [searchQuery, memberFilter, membros.length]);

  useEffect(() => {
    setVisibleRequestsCount(INITIAL_VISIBLE_REQUESTS);
  }, [solicitacoes.length]);

  const handleDeletarGrupo = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeletingGroup(true);
    try {
      const requesterId = currentUser?.id ?? null;
      const res = await fetch(`/api/communities/${communityId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao encerrar grupo");
      }

      onNotify?.({
        title: "Grupo encerrado",
        message: "A comunidade foi desativada com sucesso.",
        type: "social",
      });
      toast.success("Grupo encerrado com sucesso.");
      onGroupDeleted?.();
    } catch (err: any) {
      toast.error(`Erro ao encerrar grupo: ${err.message}`);
      setConfirmDelete(false);
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleAprovar = async (solicitacao: Solicitacao) => {
    setProcessingId(solicitacao.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitacaoId: solicitacao.id,
          acao: "aprovar",
          analisadoPor: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao aprovar");

      setSolicitacoes(current => current.filter(item => item.id !== solicitacao.id));
      setRecusaAlvo(null);
      setMotivoRecusa("");

      onNotify?.({
        title: "Solicitação aprovada",
        message: `${displayName(solicitacao)} entrou na comunidade.`,
        type: "social",
      });
      toast.success(`${displayName(solicitacao)} aprovado(a).`);
      await loadData();
    } catch (err: any) {
      toast.error(`Erro ao aprovar: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecusar = async (solicitacao: Solicitacao, motivo = "") => {
    setProcessingId(solicitacao.id);
    try {
      const res = await fetch(`/api/communities/${communityId}/requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitacaoId: solicitacao.id,
          acao: "recusar",
          motivo,
          analisadoPor: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao recusar");

      setSolicitacoes(current => current.filter(item => item.id !== solicitacao.id));
      setRecusaAlvo(null);
      setMotivoRecusa("");

      onNotify?.({
        title: "Solicitação recusada",
        message: `${displayName(solicitacao)} não entrou na comunidade.`,
        type: "social",
      });
      toast.info("Solicitação recusada.");
    } catch (err: any) {
      toast.error(`Erro ao recusar: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemover = async (membro: Membro) => {
    setProcessingId(membro.membro_id);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membroId: membro.membro_id,
          requesterId: currentUser?.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao remover");

      setMembros(current => current.filter(item => item.membro_id !== membro.membro_id));
      setRemoveAlvo(null);

      onNotify?.({
        title: "Membro removido",
        message: `${displayName(membro)} foi removido(a) da comunidade.`,
        type: "social",
      });
      toast.success(`${displayName(membro)} removido(a).`);
    } catch (err: any) {
      toast.error(`Erro ao remover: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAlterarTag = async (membro: Membro, novaTag: string) => {
    setTagMenuId(null);
    setCargoMenuId(null);

    const alreadyHas = membro.tags.includes(novaTag);
    if (novaTag === "Participante" && alreadyHas) {
      toast.info("Participante é a tag base de todo membro aprovado.");
      return;
    }

    setProcessingId(membro.membro_id);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membroId: membro.membro_id,
          tagNome: novaTag,
          acao: alreadyHas ? "remove" : "add",
          requesterId: currentUser?.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao atualizar tag");
      }

      setMembros(current =>
        current.map(item => {
          if (item.membro_id !== membro.membro_id) return item;

          const tagsAtualizadas = alreadyHas
            ? item.tags.filter(tag => tag !== novaTag)
            : Array.from(new Set([...item.tags, novaTag]));

          return {
            ...item,
            tags: tagsAtualizadas.length > 0 ? tagsAtualizadas : ["Participante"],
          };
        }),
      );

      onNotify?.({
        title: "Tag atualizada",
        message: alreadyHas
          ? `${displayName(membro)} perdeu a tag ${novaTag}.`
          : `${displayName(membro)} recebeu a tag ${novaTag}.`,
        type: "social",
      });
      toast.success(
        alreadyHas
          ? `Tag ${novaTag} removida de ${displayName(membro)}.`
          : `Tag ${novaTag} aplicada para ${displayName(membro)}.`,
      );
    } catch (err: any) {
      toast.error(`Erro ao atualizar tag: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDefinirCargo = async (membro: Membro, novoCargo: string) => {
    setTagMenuId(null);
    setCargoMenuId(null);

    if (!canSetRole) {
      toast.error("Somente o Dono pode definir cargos.");
      return;
    }

    if (membro.tags.includes("Dono")) {
      toast.info("O cargo do Dono não pode ser alterado.");
      return;
    }

    if (getCargoPrincipal(membro.tags) === novoCargo) {
      toast.info(`${displayName(membro)} já está como ${novoCargo}.`);
      return;
    }

    setProcessingId(membro.membro_id);
    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membroId: membro.membro_id,
          roleNome: novoCargo,
          acao: "set_role",
          requesterId: currentUser?.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao definir cargo");
      }

      const nextTags = Array.isArray(data?.tags) && data.tags.length > 0
        ? data.tags
        : novoCargo === "Participante"
          ? ["Participante"]
          : ["Participante", novoCargo];

      setMembros(current =>
        current.map(item =>
          item.membro_id === membro.membro_id
            ? {
                ...item,
                tags: nextTags,
              }
            : item,
        ),
      );

      onNotify?.({
        title: "Cargo atualizado",
        message: `${displayName(membro)} agora está como ${novoCargo}.`,
        type: "social",
      });
      toast.success(`Cargo de ${displayName(membro)} definido para ${novoCargo}.`);
    } catch (err: any) {
      toast.error(`Erro ao definir cargo: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      className="space-y-4 text-left sm:space-y-5"
      onClick={() => {
        setTagMenuId(null);
        setCargoMenuId(null);
      }}
    >
      <section className="rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
              Gestão da comunidade
            </p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Operação clara e objetiva
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Gerencie membros, solicitações e permissões com foco em agilidade no desktop e no
              smartphone.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white disabled:opacity-45 lg:w-auto"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: "Membros", value: totalMembros, icon: Users, tone: "text-sky-300" },
            {
              label: "Solicitações",
              value: totalSolicitacoes,
              icon: UserPlus,
              tone: "text-amber-300",
            },
            { label: "Liderança", value: totalLideranca, icon: ShieldCheck, tone: "text-purple-300" },
            {
              label: "Profissionais",
              value: totalProfissionais,
              icon: Zap,
              tone: "text-emerald-300",
            },
          ].map(card => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <card.icon size={16} className={card.tone} />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">
                {card.label}
              </p>
              <p className="mt-1 text-sm font-black text-white">{card.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {[
          { id: "membros" as Section, label: "Membros", count: totalMembros, icon: Users },
          {
            id: "solicitacoes" as Section,
            label: "Solicitações",
            count: totalSolicitacoes,
            icon: UserPlus,
          },
          { id: "config" as Section, label: "Configurações", count: 0, icon: Settings2 },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
              activeSection === tab.id
                ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {tab.count > 0 && <span className="text-white/45">{tab.count}</span>}
          </button>
        ))}
      </section>

      <AnimatePresence mode="wait">
        {activeSection === "membros" && (
          <motion.section
            key="membros"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Buscar por nome, @nick ou tag"
                className="min-h-11 w-full rounded-2xl border border-white/10 bg-[#050B14] py-2.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/40"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setShowMobileFilters(current => !current)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
              >
                <SlidersHorizontal size={12} />
                Filtros
                <ChevronDown
                  size={11}
                  className={`transition-transform ${filtrosAbertosNoMobile ? "rotate-180" : ""}`}
                />
              </button>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                {membrosFiltrados.length} no resultado
              </span>
            </div>

            <div
              className={`${filtrosAbertosNoMobile ? "grid" : "hidden"} grid-cols-2 gap-2 sm:flex sm:flex-wrap`}
            >
              {[
                { id: "todos" as MemberFilter, label: "Todos" },
                { id: "lideranca" as MemberFilter, label: "Liderança" },
                { id: "profissionais" as MemberFilter, label: "Profissionais" },
                { id: "participantes" as MemberFilter, label: "Participantes" },
              ].map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setMemberFilter(filter.id)}
                  className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition sm:px-4 ${
                    memberFilter === filter.id
                      ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                      : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[22px] border border-white/10 bg-[#050B14]">
                <RefreshCw size={22} className="animate-spin text-sky-400" />
              </div>
            ) : membrosFiltrados.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-[#050B14] p-8 text-center">
                <Users size={30} className="mx-auto text-white/20" />
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                  {searchQuery ? "Nenhum membro encontrado" : "Nenhum membro disponível"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {membrosVisiveis.map(membro => (
                  <article
                    key={membro.membro_id}
                    className="rounded-[20px] border border-white/10 bg-[#050B14] p-3 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          {isValidUrl(membro.avatar_url) ? (
                            <Image
                              src={membro.avatar_url}
                              alt={displayName(membro)}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-black text-white/35">
                              {displayName(membro)[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black text-white">{displayName(membro)}</h4>
                          <p className="mt-0.5 text-[10px] text-white/35">
                            Entrou em {formatDateShort(membro.joined_at)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {membro.tags.map(tag => (
                              <span
                                key={`${membro.membro_id}-${tag}`}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                                  TAG_COLORS[tag] ?? TAG_COLORS.Participante
                                }`}
                              >
                                {TAG_ICONS[tag]} {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end"
                        onClick={event => event.stopPropagation()}
                      >
                        {canSetRole && !membro.tags.includes("Dono") && (
                          <div className="relative flex-1 sm:flex-none">
                            <button
                              type="button"
                              onClick={() => {
                                setTagMenuId(null);
                                setCargoMenuId(current =>
                                  current === membro.membro_id ? null : membro.membro_id,
                                );
                              }}
                              disabled={processingId === membro.membro_id}
                              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500/15 disabled:opacity-45 sm:w-auto"
                            >
                              <Crown size={12} />
                              Cargo
                              <ChevronDown
                                size={11}
                                className={`transition-transform ${cargoMenuId === membro.membro_id ? "rotate-180" : ""}`}
                              />
                            </button>

                            <AnimatePresence>
                              {cargoMenuId === membro.membro_id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-3rem))] min-w-[190px] rounded-2xl border border-white/10 bg-[#0A1222] p-2 shadow-2xl"
                                >
                                  {CARGOS_DISPONIVEIS.map(cargo => (
                                    <button
                                      key={`${membro.membro_id}-cargo-${cargo}`}
                                      type="button"
                                      onClick={() => handleDefinirCargo(membro, cargo)}
                                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest transition ${
                                        getCargoPrincipal(membro.tags) === cargo
                                          ? "bg-sky-500/10 text-sky-300"
                                          : "text-white/50 hover:bg-white/5 hover:text-white"
                                      }`}
                                    >
                                      {TAG_ICONS[cargo]}
                                      {cargo}
                                      {getCargoPrincipal(membro.tags) === cargo && (
                                        <CheckCircle2 size={11} className="ml-auto text-sky-300" />
                                      )}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {canTag && !membro.tags.includes("Dono") && (
                          <div className="relative flex-1 sm:flex-none">
                            <button
                              type="button"
                              onClick={() => {
                                setCargoMenuId(null);
                                setTagMenuId(current =>
                                  current === membro.membro_id ? null : membro.membro_id,
                                );
                              }}
                              disabled={processingId === membro.membro_id}
                              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/50 transition hover:text-white disabled:opacity-45 sm:w-auto"
                            >
                              <ShieldCheck size={12} />
                              Tags
                              <ChevronDown
                                size={11}
                                className={`transition-transform ${tagMenuId === membro.membro_id ? "rotate-180" : ""}`}
                              />
                            </button>

                            <AnimatePresence>
                              {tagMenuId === membro.membro_id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-3rem))] min-w-[180px] rounded-2xl border border-white/10 bg-[#0A1222] p-2 shadow-2xl"
                                >
                                  {TAGS_DISPONIVEIS.map(tag => (
                                    <button
                                      key={`${membro.membro_id}-tag-${tag}`}
                                      type="button"
                                      onClick={() => handleAlterarTag(membro, tag)}
                                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest transition ${
                                        membro.tags.includes(tag)
                                          ? "bg-sky-500/10 text-sky-300"
                                          : "text-white/50 hover:bg-white/5 hover:text-white"
                                      }`}
                                    >
                                      {TAG_ICONS[tag]}
                                      {tag}
                                      {membro.tags.includes(tag) && (
                                        <CheckCircle2 size={11} className="ml-auto text-sky-300" />
                                      )}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {canRemove && !membro.tags.includes("Dono") && (
                          <button
                            type="button"
                            onClick={() => setRemoveAlvo(membro)}
                            disabled={processingId === membro.membro_id}
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500 hover:text-black disabled:opacity-45 sm:flex-none"
                          >
                            {processingId === membro.membro_id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <UserX size={12} />
                            )}
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}

                {temMaisMembros && (
                  <button
                    type="button"
                    onClick={() => setVisibleMembersCount(current => current + INITIAL_VISIBLE_MEMBERS)}
                    className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                  >
                    Mostrar mais membros
                  </button>
                )}
              </div>
            )}
          </motion.section>
        )}

        {activeSection === "solicitacoes" && (
          <motion.section
            key="solicitacoes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[22px] border border-white/10 bg-[#050B14]">
                <RefreshCw size={22} className="animate-spin text-sky-400" />
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-[#050B14] p-8 text-center">
                <Clock size={30} className="mx-auto text-white/20" />
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                  Nenhuma solicitação pendente
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {solicitacoesVisiveis.map(solicitacao => (
                  <article
                    key={solicitacao.id}
                    className="rounded-[20px] border border-white/10 bg-[#050B14] p-3 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          {isValidUrl(solicitacao.avatar_url) ? (
                            <Image
                              src={solicitacao.avatar_url}
                              alt={displayName(solicitacao)}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-black text-white/35">
                              {displayName(solicitacao)[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black text-white">
                            {displayName(solicitacao)}
                          </h4>
                          <p className="mt-0.5 text-[10px] text-white/35">
                            {formatDate(solicitacao.created_at)}
                          </p>
                          {solicitacao.mensagem && (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">
                              "{solicitacao.mensagem}"
                            </p>
                          )}
                        </div>
                      </div>

                      {canApprove ? (
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAprovar(solicitacao)}
                            disabled={processingId === solicitacao.id}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500 hover:text-black disabled:opacity-45"
                          >
                            {processingId === solicitacao.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                            Aprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMotivoRecusa("");
                              setRecusaAlvo(solicitacao);
                            }}
                            disabled={processingId === solicitacao.id}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500 hover:text-black disabled:opacity-45"
                          >
                            <X size={12} />
                            Recusar
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/45">
                          Sem permissão
                        </span>
                      )}
                    </div>
                  </article>
                ))}

                {temMaisSolicitacoes && (
                  <button
                    type="button"
                    onClick={() => setVisibleRequestsCount(current => current + INITIAL_VISIBLE_REQUESTS)}
                    className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                  >
                    Mostrar mais solicitações
                  </button>
                )}
              </div>
            )}

            {!canApprove && (
              <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                  <p className="text-[10px] leading-relaxed text-amber-100/80">
                    Você não tem permissão para aprovar ou recusar solicitações.
                  </p>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {activeSection === "config" && (
          <motion.section
            key="config"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <CommunitySettingsPanel
              communityId={communityId}
              currentUser={currentUser}
              canEdit={isOwner || userTags.includes("Dono")}
            />
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recusaAlvo && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1222] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-white">Recusar solicitação</p>
                  <p className="mt-1 text-xs text-white/35">
                    Informe um motivo opcional para {displayName(recusaAlvo)}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRecusaAlvo(null);
                    setMotivoRecusa("");
                  }}
                  className="rounded-xl bg-white/5 p-2 text-white/30 transition hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <textarea
                value={motivoRecusa}
                onChange={event => setMotivoRecusa(event.target.value)}
                placeholder="Ex.: vagas encerradas nesta turma."
                className="mt-4 h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-rose-500/40"
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecusaAlvo(null);
                    setMotivoRecusa("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase text-white/45 transition hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleRecusar(recusaAlvo, motivoRecusa.trim())}
                  disabled={processingId === recusaAlvo.id}
                  className="rounded-xl bg-rose-500 px-4 py-3 text-[10px] font-black uppercase text-black transition hover:bg-rose-400 disabled:opacity-45"
                >
                  {processingId === recusaAlvo.id ? "Recusando..." : "Recusar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removeAlvo && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#0A1222] p-5 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
                <div>
                  <p className="text-sm font-black uppercase text-rose-300">Remover membro</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">
                    {displayName(removeAlvo)} perderá acesso ao hub, treinos, nutrição e desafios
                    da comunidade.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRemoveAlvo(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black uppercase text-white/45 transition hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleRemover(removeAlvo)}
                  disabled={processingId === removeAlvo.membro_id}
                  className="rounded-xl bg-rose-500 px-4 py-3 text-[10px] font-black uppercase text-black transition hover:bg-rose-400 disabled:opacity-45"
                >
                  {processingId === removeAlvo.membro_id ? "Removendo..." : "Remover"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {canDelete && (
        <section className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 p-4 sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-300/80">
            Zona de perigo
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={handleDeletarGrupo}
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500 hover:text-black"
            >
              <Trash2 size={13} />
              Encerrar e excluir grupo
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase text-rose-300">Tem certeza absoluta?</p>
                <p className="mt-1 text-xs text-rose-100/70">
                  Esta ação é irreversível. A comunidade será encerrada permanentemente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeletarGrupo}
                  disabled={deletingGroup}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 text-[9px] font-black uppercase tracking-widest text-black transition hover:bg-rose-400 disabled:opacity-45"
                >
                  {deletingGroup ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Confirmar exclusão
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
