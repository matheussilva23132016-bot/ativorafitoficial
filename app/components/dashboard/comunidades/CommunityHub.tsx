"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Dumbbell, UtensilsCrossed, Target, Trophy, Settings, Flame } from "lucide-react";
import Image from "next/image";

// IMPORTAÇÕES DOS MÓDULOS INTERNOS
import { CommunityTreinos } from "./CommunityTreinos";
import { CommunityNutricao } from "./CommunityNutricao";
import { CommunityDesafios } from "./CommunityDesafios";
import { CommunityRanking } from "./CommunityRanking";

// Definição estrita das abas para segurança de tipos
type HubTab = 'geral' | 'treinos' | 'nutricao' | 'desafios' | 'ranking';

interface CommunityHubProps {
  communityId: string;
  currentUser: any;
  defaultTab?: string; // Prop necessária para o Deep Linking
}

export function CommunityHub({ communityId, currentUser, defaultTab = 'geral' }: CommunityHubProps) {
  // Inicializa a aba com o valor vindo do Deep Link ou 'geral' por padrão
  const [activeTab, setActiveTab] = useState<HubTab>(defaultTab as HubTab);

  // Efeito para forçar a troca de aba caso o defaultTab mude (vindo de uma nova notificação)
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab as HubTab);
    }
  }, [defaultTab]);

  // Mock de dados da Comunidade
  const community = {
    name: "Método Shape Saiyajin",
    cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000",
    userTags: ["Participante", "Instrutor"], 
    xpSemanal: 120,
    posicaoRanking: 4
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral', icon: <LayoutDashboard size={16} /> },
    { id: 'treinos', label: 'Treinos', icon: <Dumbbell size={16} /> },
    { id: 'nutricao', label: 'Nutrição', icon: <UtensilsCrossed size={16} /> },
    { id: 'desafios', label: 'Desafios', icon: <Target size={16} /> },
    { id: 'ranking', label: 'Classificação', icon: <Trophy size={16} /> },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto pb-32 px-4 sm:px-6">
      
      {/* HEADER DA COMUNIDADE */}
      <div className="relative w-full h-48 sm:h-64 rounded-4xl sm:rounded-5xl overflow-hidden mb-6 shadow-2xl ring-1 ring-white/5">
        <Image src={community.cover} alt="Capa" fill className="object-cover opacity-50" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-[#010307] via-[#010307]/80 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="text-left">
            <div className="flex gap-2 mb-2">
              {community.userTags.map(tag => (
                <span key={tag} className={`px-2 py-1 text-[8px] font-black uppercase rounded-md tracking-widest ${tag === 'Nutri' || tag === 'Instrutor' ? 'bg-sky-500 text-black shadow-neon' : 'bg-white/10 text-white border border-white/20'}`}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">{community.name}</h1>
          </div>
          
          {community.userTags.includes("ADM") && (
            <button className="p-3 bg-white/5 backdrop-blur-md rounded-xl hover:bg-white/10 transition-colors border border-white/10">
              <Settings size={20} className="text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO INTERNA (TABS) */}
      <div className="sticky top-0 z-40 bg-[#010307]/90 backdrop-blur-xl border-b border-white/5 mb-8">
        <div className="flex items-center overflow-x-auto no-scrollbar gap-2 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HubTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 shadow-neon-soft' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO DINÂMICO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-linear-to-br from-[#050B14] to-[#0A1222] ring-1 ring-white/5 rounded-4xl p-8 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[60px] rounded-full" />
                   <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-8 italic">Seu Status na Matriz</h3>
                   
                   <div className="grid grid-cols-2 gap-6 text-center">
                     <div className="bg-white/3 border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/5">
                       <Flame size={28} className="text-rose-500 mx-auto mb-3" />
                       <span className="block text-3xl font-black text-white leading-none">{community.xpSemanal} <span className="text-xs text-white/20">XP</span></span>
                       <span className="text-[8px] font-black text-white/30 uppercase mt-2 tracking-widest">Acúmulo Semanal</span>
                     </div>
                     <div className="bg-sky-500/5 border border-sky-500/20 rounded-3xl p-6 transition-all hover:bg-sky-500/10">
                       <Trophy size={28} className="text-sky-400 mx-auto mb-3" />
                       <span className="block text-3xl font-black text-sky-400 leading-none">{community.posicaoRanking}º</span>
                       <span className="text-[8px] font-black text-sky-400/40 uppercase mt-2 tracking-widest">No Rank Elite</span>
                     </div>
                   </div>
                </div>

                <div 
                  onClick={() => setActiveTab('treinos')}
                  className="bg-[#050B14] border border-white/5 rounded-4xl p-8 shadow-xl flex items-center justify-between group cursor-pointer hover:border-sky-500/30 transition-all"
                >
                  <div className="text-left">
                    <span className="text-[9px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2 block italic">Ação Imediata</span>
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sessão Alpha Programada</h4>
                    <p className="text-xs text-white/30 font-bold uppercase mt-1 tracking-widest">Foco em Cadeia Posterior • 50m</p>
                  </div>
                  <div className="w-14 h-14 bg-sky-500 text-black rounded-2xl flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform">
                    <Dumbbell size={24} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#050B14] border border-white/5 rounded-4xl p-8 shadow-xl">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic"><Target size={14}/> Missões Diárias</h3>
                  <div className="space-y-4">
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:bg-white/5 transition-all">
                      <div className="text-left">
                        <h5 className="text-sm font-black text-white uppercase italic">Hidratação Máxima</h5>
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">+10 XP</span>
                      </div>
                      <button className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase rounded-xl hover:bg-sky-500 transition-all active:scale-90">Validar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TREINOS */}
          {activeTab === 'treinos' && (
            <CommunityTreinos 
              currentUser={currentUser} 
              userTags={community.userTags} 
              communityId={communityId}
            />
          )}

          {/* TAB: NUTRIÇÃO */}
          {activeTab === 'nutricao' && (
            <CommunityNutricao 
              currentUser={currentUser} 
              userTags={community.userTags} 
            />
          )}

          {/* TAB: DESAFIOS */}
          {activeTab === 'desafios' && (
            <CommunityDesafios 
              currentUser={currentUser} 
              userTags={community.userTags} 
            />
          )}

          {/* TAB: RANKING */}
          {activeTab === 'ranking' && (
            <CommunityRanking 
              currentUser={currentUser} 
            />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}