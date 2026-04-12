// app/components/dashboard/comunidades/CommunityHub.tsx
"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Users, ShieldCheck, Loader2,
  LayoutDashboard, Dumbbell, UtensilsCrossed,
  Target, Trophy, Settings2,
} from "lucide-react";
import Image from "next/image";
import { VisaoGeralAtivora } from "./VisaoGeralAtivora";
import CommunityTreinos from "./treinos/CommunityTreinos";
import { CommunityNutricao } from "./nutricao/CommunityNutricao";
import { CommunityDesafios } from "./CommunityDesafios";
import { CommunityRanking } from "./CommunityRanking";
import { canDo, getHighestTag } from "@/lib/communities/permissions";
import type { CommunityTreinosProps } from "./treinos/types";

type HubTab = "geral" | "treinos" | "nutricao" | "desafios" | "ranking" | "gestao";

interface CommunityHubProps {
  communityId: string;
  communityData: {
    id: string;
    name: string;
    description?: string;
    cover_url?: string | null;
    role?: string;
    userTags?: string[];
  } | null;
  currentUser: any;
  triggerXP: (amount: number) => void;
  onNotify?: (notif: any) => void;
  onBack: () => void;
}

const TABS: { id: HubTab; label: string; icon: React.ReactNode; minTag?: string }[] = [
  { id: "geral",    label: "Geral",    icon: <LayoutDashboard size={18} /> },
  { id: "treinos",  label: "Treinos",  icon: <Dumbbell size={18} />        },
  { id: "nutricao", label: "Nutrição", icon: <UtensilsCrossed size={18} /> },
  { id: "desafios", label: "Desafios", icon: <Target size={18} />          },
  { id: "ranking",  label: "Ranking",  icon: <Trophy size={18} />          },
  { id: "gestao",   label: "Gestão",   icon: <Settings2 size={18} />, minTag: "ADM" },
];

export function CommunityHub({
  communityId, communityData, currentUser, triggerXP, onNotify, onBack,
}: CommunityHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("geral");
  const [members, setMembers]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);

  const userTags: string[] = communityData?.userTags ?? [communityData?.role ?? "Participante"];
  const highestTag = getHighestTag(userTags);
  const canManage  = canDo(userTags, "member:approve");

  // ── Mapeia tag da comunidade → role do CommunityTreinos ────
  const treinoRole = ((): CommunityTreinosProps["userRole"] => {
    if (userTags.includes("Dono"))      return "owner";
    if (userTags.includes("ADM"))       return "admin";
    if (userTags.includes("Instrutor")) return "instructor";
    return "member";
  })();

  useEffect(() => {
    if (activeTab !== "gestao" || !canManage) return;
    setLoading(true);
    fetch(`/api/communities/${communityId}/members`)
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [activeTab, communityId, canManage]);

  const visibleTabs = TABS.filter(t => {
    if (!t.minTag) return true;
    return canDo(userTags, "member:approve");
  });

  return (
    <div className="w-full max-w-6xl mx-auto pb-32 px-3 sm:px-4 text-left">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="text-[10px] font-black uppercase text-white/40 flex items-center
            gap-2 hover:text-white transition-all bg-white/5 px-3 py-2 rounded-xl"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full
          border border-white/10">
          <ShieldCheck size={12} className="text-sky-500" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
            {highestTag}
          </span>
        </div>
      </div>

      {/* Cover */}
      <div className="relative w-full h-40 sm:h-56 rounded-4xl overflow-hidden mb-8
        ring-1 ring-white/10">
        <Image
          src={communityData?.cover_url || "/placeholder.jpg"}
          alt="Cover"
          fill
          className="object-cover opacity-50"
          unoptimized
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#010307] to-transparent" />
        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase text-white
            tracking-tighter drop-shadow-2xl leading-none">
            {communityData?.name}
          </h1>
          {communityData?.description && (
            <p className="text-white/40 text-xs font-medium mt-1 max-w-md line-clamp-1">
              {communityData.description}
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

          {/* ── GERAL ─────────────────────────────────────────── */}
          {activeTab === "geral" && (
            <VisaoGeralAtivora
              currentUser={currentUser}
              communityId={communityId}
              powerLevel={
                userTags.includes("Dono") ? 5
                : userTags.includes("ADM") ? 4
                : 1
              }
              workouts={[]}
              requests={[]}
              onNotify={onNotify}
              onNavigate={(tab: string) => setActiveTab(tab as HubTab)}
            />
          )}

          {/* ── TREINOS ───────────────────────────────────────── */}
          {activeTab === "treinos" && (
            <CommunityTreinos
              communityId={communityId}
              userId={currentUser?.id ?? ""}
              userRole={treinoRole}
              userName={
                currentUser?.nickname
                ?? currentUser?.full_name
                ?? "Usuário"
              }
            />
          )}

          {/* ── NUTRIÇÃO ──────────────────────────────────────── */}
          {activeTab === "nutricao" && (
            <CommunityNutricao
              currentUser={currentUser}
              userTags={userTags}
            />
          )}

          {/* ── DESAFIOS ──────────────────────────────────────── */}
          {activeTab === "desafios" && (
            <CommunityDesafios
              communityId={communityId}
              currentUser={currentUser}
              userTags={userTags}
            />
          )}

          {/* ── RANKING ───────────────────────────────────────── */}
          {activeTab === "ranking" && (
            <CommunityRanking currentUser={currentUser} />
          )}

          {/* ── GESTÃO ────────────────────────────────────────── */}
          {activeTab === "gestao" && canManage && (
            <div className="space-y-6">
              <h3 className="text-xl font-black uppercase text-white
                flex items-center gap-3">
                <Users className="text-sky-500" size={20} />
                Efetivo da Comunidade
              </h3>

              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="animate-spin text-sky-500" size={28} />
                </div>
              ) : (
                <div className="grid gap-3">
                  {members.map(m => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between p-4
                        bg-white/5 rounded-2xl border border-white/5"
                    >
                      <div>
                        <p className="text-xs font-black text-white uppercase">
                          {m.nickname || m.full_name}
                        </p>
                        <p className="text-[9px] text-white/20 uppercase font-black
                          tracking-widest mt-0.5">
                          {m.role}
                        </p>
                      </div>
                      {userTags.includes("Dono") && m.role !== "Dono" && (
                        <select className="bg-black/40 border border-white/10 rounded-lg
                          text-[9px] font-black p-2 text-white outline-none
                          hover:border-sky-500/40 transition-all">
                          <option value="Participante">Participante</option>
                          <option value="Instrutor">Instrutor</option>
                          <option value="Nutri">Nutri</option>
                          <option value="ADM">ADM</option>
                        </select>
                      )}
                    </div>
                  ))}

                  {members.length === 0 && (
                    <p className="text-white/20 text-[10px] font-black uppercase
                      tracking-widest text-center py-8">
                      Nenhum membro encontrado
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Nav inferior */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        bg-[#0A1222]/90 backdrop-blur-2xl border border-white/10 p-1.5
        rounded-2xl shadow-2xl flex items-center gap-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 sm:px-5 py-2.5
              rounded-xl text-[8px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id
                ? "bg-sky-500 text-black shadow-lg"
                : "text-white/30 hover:text-white/60"}`}
          >
            {tab.icon}
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
