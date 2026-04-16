// app/components/dashboard/comunidades/CommunityHub.tsx
"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ShieldCheck,
  LayoutDashboard, Dumbbell, UtensilsCrossed,
  Target, Trophy, Settings2, Bell, Activity, Megaphone,
} from "lucide-react";
import Image from "next/image";
import { CommunityPremiumDashboard } from "./CommunityPremiumDashboard";
import CommunityTreinos       from "./treinos/CommunityTreinos";
import { CommunityNutricao }  from "./nutricao/CommunityNutricao";
import { CommunityDesafios }  from "./CommunityDesafios";
import { CommunityRanking }   from "./CommunityRanking";
import { CommunityGestao }    from "./CommunityGestao";
import { CommunityEvolution } from "./CommunityEvolution";
import { CommunityAvisos } from "./CommunityAvisos";
import { NotificationsPanel } from "./NotificationsPanel";
import { canDo, getHighestTag } from "@/lib/communities/permissions";
import type { CommunityTreinosProps } from "./treinos/types";

type HubTab = "geral" | "treinos" | "nutricao" | "desafios" | "ranking" | "evolucao" | "avisos" | "gestao";

interface CommunityHubProps {
  communityId:   string;
  communityData: {
    id:           string;
    name:         string;
    description?: string;
    cover_url?:   string | null;
    role?:        string;
    userTags?:    string[];
  } | null;
  currentUser: any;
  triggerXP:   (amount: number) => void;
  onNotify?:   (notif: any) => void;
  onBack:      () => void;
  initialTab?:  string;
}

const TABS: {
  id: HubTab; label: string; icon: React.ReactNode; minTag?: string
}[] = [
  { id: "geral",    label: "Geral",    icon: <LayoutDashboard size={18} /> },
  { id: "treinos",  label: "Treinos",  icon: <Dumbbell size={18} />        },
  { id: "nutricao", label: "Nutrição", icon: <UtensilsCrossed size={18} /> },
  { id: "desafios", label: "Desafios", icon: <Target size={18} />          },
  { id: "ranking",  label: "Ranking",  icon: <Trophy size={18} />          },
  { id: "avisos",   label: "Avisos",   icon: <Megaphone size={18} />       },
  { id: "evolucao", label: "Evolução", icon: <Activity size={18} />        },
  { id: "gestao",   label: "Gestão",   icon: <Settings2 size={18} />, minTag: "ADM" },
];

const normalizeTab = (tab?: string | null): HubTab => {
  if (tab === "home" || tab === "overview" || tab === "dashboard") return "geral";
  if (tab === "aviso_comunidade" || tab === "novo_anuncio" || tab === "announcements") return "avisos";
  return TABS.some(item => item.id === tab) ? (tab as HubTab) : "geral";
};

export function CommunityHub({
  communityId, communityData, currentUser, triggerXP, onNotify, onBack, initialTab,
}: CommunityHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>(() => normalizeTab(initialTab));
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // ── Garante que o nome nunca some: busca do banco se não veio ──
  const [resolvedData, setResolvedData] = useState(communityData);

  useEffect(() => {
    // Se communityData veio sem nome (bug 3), busca do banco
    if (!communityData?.name && communityId) {
      fetch(`/api/communities/${communityId}`)
        .then(r => r.json())
        .then(d => {
          if (d.community) {
            setResolvedData(prev => ({
              ...prev,
              ...d.community,
              // Normaliza nome: API salva como `nome`, frontend usa `name`
              name: d.community.name ?? d.community.nome ?? prev?.name ?? "",
            }));
          }
        })
        .catch(() => {});
    } else {
      setResolvedData(communityData);
    }
  }, [communityId, communityData]);

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab, communityId]);

  const userTags: string[] = resolvedData?.userTags ?? [resolvedData?.role ?? "Participante"];
  const highestTag = getHighestTag(userTags);
  const canManage  = canDo(userTags, "member:approve");
  const canDelete  = canDo(userTags, "community:delete");

  const treinoRole = ((): CommunityTreinosProps["userRole"] => {
    if (userTags.includes("Dono"))      return "owner";
    if (userTags.includes("ADM"))       return "admin";
    if (
      userTags.includes("Instrutor") ||
      userTags.includes("Personal") ||
      userTags.includes("Nutri") ||
      userTags.includes("Nutricionista")
    ) return "instructor";
    return "member";
  })();

  const visibleTabs = TABS.filter(t => {
    if (!t.minTag) return true;
    return canDo(userTags, "member:approve");
  });

  return (
    <div className="w-full max-w-6xl mx-auto pb-[190px] sm:pb-32 px-3 sm:px-4 text-left">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pt-4">
        <button
          onClick={onBack}
          className="text-[10px] font-black uppercase text-white/40 flex items-center gap-2 hover:text-white transition-all bg-white/5 px-3 py-2 rounded-xl"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white transition-all"
          >
            <Bell size={14} className="text-sky-500" />
            <span className="hidden sm:inline text-[9px] font-black uppercase">
              Alertas
            </span>
          </button>
          <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <ShieldCheck size={12} className="text-sky-500" />
            <span className="text-[9px] font-black text-white/60 uppercase">
              {highestTag}
            </span>
          </div>
        </div>
      </div>

      {/* Cover */}
      <div className="relative w-full h-44 sm:h-56 rounded-[28px] sm:rounded-[32px] overflow-hidden mb-7 sm:mb-8 ring-1 ring-white/10">
        <Image
          src={resolvedData?.cover_url || "/placeholder.jpg"}
          alt="Capa da comunidade"
          fill
          className="object-cover opacity-50"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#010307] to-transparent" />
        <div className="absolute bottom-5 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
          <h1 className="text-2xl sm:text-5xl font-black italic uppercase text-white tracking-tighter drop-shadow-2xl leading-none break-words">
            {resolvedData?.name || "..."}
          </h1>
          {resolvedData?.description && (
            <p className="text-white/40 text-xs font-medium mt-1 max-w-md line-clamp-1">
              {resolvedData.description}
            </p>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
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
              userName={
                currentUser?.nickname ?? currentUser?.full_name ?? "Usuário"
              }
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
              canDelete={canDelete}
              onNotify={onNotify}
              onGroupDeleted={onBack}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav inferior - desktop */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden sm:flex w-auto max-w-[calc(100vw-48px)] overflow-x-auto scrollbar-none bg-[#0A1222]/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl shadow-2xl items-center gap-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex flex-col items-center gap-1 px-3 sm:px-5 py-2.5 rounded-xl text-[8px] font-black uppercase transition-all
              ${activeTab === tab.id
                ? "bg-sky-500 text-black shadow-lg"
                : "text-white/30 hover:text-white/60"}`}
          >
            {tab.icon}
            <span className={activeTab === tab.id ? "block" : "hidden sm:block"}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Nav inferior - mobile */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden border-t border-white/10 bg-[#07111F]/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`min-h-[66px] rounded-xl px-1 py-2 text-[8px] font-black uppercase leading-[1.05] transition-all flex flex-col items-center justify-center gap-1.5 text-center
                ${activeTab === tab.id
                  ? "bg-sky-500 text-black shadow-lg"
                  : "bg-white/5 text-white/35 active:bg-white/10"}`}
            >
              {React.cloneElement(tab.icon as React.ReactElement, { size: 16 })}
              <span className="block max-w-full whitespace-normal break-words">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <NotificationsPanel
        currentUser={currentUser}
        communityId={communityId}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
