"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Bell,
  Dumbbell,
  LayoutDashboard,
  Megaphone,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import { CommunityPremiumDashboard } from "./CommunityPremiumDashboard";
import CommunityTreinos from "./treinos/CommunityTreinos";
import { CommunityNutricao } from "./nutricao/CommunityNutricao";
import { CommunityDesafios } from "./CommunityDesafios";
import { CommunityRanking } from "./CommunityRanking";
import { CommunityGestao } from "./CommunityGestao";
import { CommunityEvolution } from "./CommunityEvolution";
import { CommunityAvisos } from "./CommunityAvisos";
import { NotificationsPanel } from "./NotificationsPanel";
import { canDo, getHighestTag } from "@/lib/communities/permissions";
import type { CommunityTreinosProps } from "./treinos/types";
import {
  DEFAULT_COMMUNITY_COVER,
  resolveCommunityCover,
  type CommunityCoverSpec,
} from "./cover-utils";

type HubTab =
  | "geral"
  | "treinos"
  | "nutricao"
  | "desafios"
  | "ranking"
  | "evolucao"
  | "avisos"
  | "gestao";

interface CommunityHubProps {
  communityId: string;
  communityData: {
    id: string;
    name: string;
    description?: string;
    cover_url?: string | null;
    owner_id?: string;
    role?: string;
    userTags?: string[];
  } | null;
  currentUser: any;
  triggerXP: (amount: number) => void;
  onNotify?: (notif: any) => void;
  onBack: () => void;
  initialTab?: string;
}

const TABS: { id: HubTab; label: string; icon: React.ReactNode; minTag?: string }[] = [
  { id: "geral", label: "Resumo", icon: <LayoutDashboard size={16} /> },
  { id: "treinos", label: "Treinos", icon: <Dumbbell size={16} /> },
  { id: "nutricao", label: "Nutrição", icon: <UtensilsCrossed size={16} /> },
  { id: "desafios", label: "Desafios", icon: <Target size={16} /> },
  { id: "ranking", label: "Ranking", icon: <Trophy size={16} /> },
  { id: "avisos", label: "Avisos", icon: <Megaphone size={16} /> },
  { id: "evolucao", label: "Evolução", icon: <Activity size={16} /> },
  { id: "gestao", label: "Gestão", icon: <Settings2 size={16} />, minTag: "ADM" },
];

const normalizeTab = (tab?: string | null): HubTab => {
  if (tab === "home" || tab === "overview" || tab === "dashboard") return "geral";
  if (tab === "aviso_comunidade" || tab === "novo_anuncio" || tab === "announcements") return "avisos";
  return TABS.some(item => item.id === tab) ? (tab as HubTab) : "geral";
};

export function CommunityHub({
  communityId,
  communityData,
  currentUser,
  triggerXP,
  onNotify,
  onBack,
  initialTab,
}: CommunityHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>(() => normalizeTab(initialTab));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [resolvedData, setResolvedData] = useState(communityData);
  const safeInitialCover = useMemo(
    () => resolveCommunityCover(resolvedData?.cover_url),
    [resolvedData?.cover_url],
  );
  const [cover, setCover] = useState<CommunityCoverSpec>(safeInitialCover);

  useEffect(() => {
    if (!communityData?.name && communityId) {
      fetch(`/api/communities/${communityId}`)
        .then(response => response.json())
        .then(data => {
          if (data.community) {
            setResolvedData(prev => ({
              ...prev,
              ...data.community,
              name: data.community.name ?? data.community.nome ?? prev?.name ?? "",
            }));
          }
        })
        .catch(() => null);
      return;
    }

    setResolvedData(communityData);
  }, [communityId, communityData]);

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab, communityId]);

  useEffect(() => {
    setCover(safeInitialCover);
  }, [safeInitialCover]);

  const isOwner = String(resolvedData?.owner_id ?? "") === String(currentUser?.id ?? "");
  const userTags: string[] = useMemo(() => {
    const fromCommunity = Array.isArray(resolvedData?.userTags) ? resolvedData.userTags : [];
    const baseTags = fromCommunity.length > 0 ? fromCommunity : [resolvedData?.role ?? "Participante"];

    if (isOwner && !baseTags.includes("Dono")) {
      return ["Dono", ...baseTags.filter(tag => tag !== "Dono")];
    }
    return baseTags;
  }, [isOwner, resolvedData?.role, resolvedData?.userTags]);
  const highestTag = getHighestTag(userTags);
  const canManage = isOwner || canDo(userTags, "member:approve");
  const canDelete = isOwner || canDo(userTags, "community:delete");

  const treinoRole = ((): CommunityTreinosProps["userRole"] => {
    if (userTags.includes("Dono")) return "owner";
    if (userTags.includes("ADM")) return "admin";
    if (
      userTags.includes("Instrutor") ||
      userTags.includes("Personal") ||
      userTags.includes("Nutri") ||
      userTags.includes("Nutricionista")
    ) {
      return "instructor";
    }
    return "member";
  })();

  const visibleTabs = useMemo(() => {
    return TABS.filter(tab => {
      if (!tab.minTag) return true;
      return canManage;
    });
  }, [canManage]);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  const activeTabLabel = visibleTabs.find(tab => tab.id === activeTab)?.label ?? "Resumo";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-0 pb-6 pt-1 text-left sm:px-1 sm:space-y-4 sm:pt-2 sm:pb-8">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/45 transition-colors hover:text-white"
          >
            <Bell size={14} className="text-sky-400" />
            Alertas
          </button>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55">
            <ShieldCheck size={13} className="text-sky-400" />
            {highestTag}
          </div>
        </div>
      </section>

      <section className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-[#06101D] p-4 sm:min-h-[420px] sm:p-6">
        <div className="absolute inset-0">
          <Image
            src={cover.src}
            alt="Capa da comunidade"
            fill
            sizes="100vw"
            className="object-cover opacity-20"
            style={{ objectPosition: `${cover.positionX}% ${cover.positionY}%` }}
            onError={() => setCover(resolveCommunityCover(DEFAULT_COMMUNITY_COVER))}
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,3,7,0.28)_0%,rgba(1,3,7,0.85)_55%,rgba(1,3,7,1)_100%)]" />
        </div>

        <div className="relative flex h-full flex-col justify-end">
          <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Comunidade ativa</p>
          <h1 className="mt-3 break-words text-[1.9rem] font-black italic leading-none tracking-tighter text-white sm:text-4xl lg:text-5xl">
            {resolvedData?.name || "Comunidade"}
          </h1>
          <p className="mt-2.5 max-w-3xl break-words text-xs leading-relaxed text-white/45 sm:text-sm [overflow-wrap:anywhere]">
            {resolvedData?.description || "Treino, nutrição, desafios e avisos no mesmo fluxo."}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/55">
            Aba atual: {activeTabLabel}
          </div>
        </div>
      </section>

      <section className="sticky top-1 z-20 rounded-2xl border border-white/10 bg-[#0A1222]/92 p-1.5 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-stretch sm:gap-1.5 sm:overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-label={`Abrir aba ${tab.label}`}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`inline-flex w-full min-h-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[9px] font-black uppercase tracking-wide transition-all sm:min-h-11 sm:w-auto sm:flex-row sm:gap-2 sm:px-4 sm:tracking-widest ${
                 activeTab === tab.id
                   ? "bg-sky-500 text-black shadow-[0_0_18px_rgba(14,165,233,0.24)]"
                   : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "geral" && (
            <CommunityPremiumDashboard
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
              onNavigate={(tab: string) => setActiveTab(tab as HubTab)}
            />
          )}

          {activeTab === "treinos" && (
            <CommunityTreinos
              communityId={communityId}
              userId={currentUser?.id ?? ""}
              userRole={treinoRole}
              userName={currentUser?.nickname ?? currentUser?.full_name ?? "Usuário"}
            />
          )}

          {activeTab === "nutricao" && (
            <CommunityNutricao
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
            />
          )}

          {activeTab === "desafios" && (
            <CommunityDesafios
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
            />
          )}

          {activeTab === "ranking" && (
            <CommunityRanking communityId={communityId} currentUser={currentUser} />
          )}

          {activeTab === "evolucao" && (
            <CommunityEvolution
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
              onNotify={onNotify}
            />
          )}

          {activeTab === "avisos" && (
            <CommunityAvisos
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
              onNotify={onNotify}
            />
          )}

          {activeTab === "gestao" && canManage && (
            <CommunityGestao
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
              isOwner={isOwner}
              canDelete={canDelete}
              onNotify={onNotify}
              onGroupDeleted={onBack}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <NotificationsPanel
        currentUser={currentUser}
        communityId={communityId}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
