"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Filter, ArrowLeft, X, UploadCloud, ShieldAlert } from "lucide-react";
import { CommunityCard } from "./CommunityCard";
import { motion, AnimatePresence } from "framer-motion";
import { CommunityHub } from "./CommunityHub"; 

interface CommunityListProps {
  currentUser: any;
  initialDeepLink?: { communityId: string, tab: string } | null;
  onClearDeepLink?: () => void;
}

export function CommunityList({ currentUser, initialDeepLink, onClearDeepLink }: CommunityListProps) {
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string | null>(null);
  
  // Controle dos Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joinModalData, setJoinModalData] = useState<{ id: string, name: string } | null>(null);

  const comunidades = [
    { id: '1', name: "Método Shape Saiyajin", description: "Foco em hipertrofia extrema com treinos de alta intensidade.", members: 1240, isMember: true, cover_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000" },
    { id: '2', name: "Protocolo 21 Dias", description: "Queima de gordura rápida e reeducação metabólica.", members: 850, isMember: false, cover_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000" }
  ];

  // ==========================================
  // 🔗 LÓGICA DE DEEP LINKING
  // ==========================================
  useEffect(() => {
    if (initialDeepLink) {
      // 1. Define a comunidade ativa
      setActiveCommunityId(initialDeepLink.communityId);
      
      // 2. Define a aba que deve abrir (passado para o Hub)
      setInitialTab(initialDeepLink.tab);
      
      // 3. Limpa o link no Hub pai para evitar re-navegação acidental
      if (onClearDeepLink) onClearDeepLink();
    }
  }, [initialDeepLink, onClearDeepLink]);

  // Renderiza o Hub se uma comunidade foi selecionada
  if (activeCommunityId) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="hub" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
          <div className="w-full max-w-6xl mx-auto p-4 mb-4 text-left">
            <button 
              onClick={() => { setActiveCommunityId(null); setInitialTab(null); }} 
              className="flex items-center gap-2 text-white/40 hover:text-sky-500 transition-colors text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Voltar para o Radar
            </button>
          </div>
          {/* Repassamos o initialTab para o Hub saber onde focar */}
          <CommunityHub 
            communityId={activeCommunityId} 
            currentUser={currentUser} 
            defaultTab={initialTab || 'feed'} 
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div key="list" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl mx-auto p-4 sm:p-8 pb-32">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 text-left">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">Comunidades <span className="text-sky-500">Elite</span></h1>
          <p className="text-sm text-white/30 font-medium uppercase tracking-[0.2em] mt-1">Selecione seu protocolo de atuação</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-sky-500 transition-all active:scale-95 shadow-neon-soft"
        >
          <Plus size={18} /> Criar Clã
        </button>
      </div>

      {/* BUSCA */}
      <div className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input type="text" placeholder="Buscar clã ou método..." className="w-full bg-[#050B14] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all" />
        </div>
        <button className="p-4 bg-[#050B14] border border-white/5 rounded-2xl text-white/40 hover:text-white transition-all"><Filter size={20} /></button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comunidades.map((com) => (
          <CommunityCard 
            key={com.id} 
            com={com} 
            onClick={() => { 
              if(com.isMember) { 
                setActiveCommunityId(com.id); 
              } else { 
                setJoinModalData({ id: com.id, name: com.name }); 
              } 
            }} 
          />
        ))}
      </div>

      {/* MODAL 1: CRIAR NOVA COMUNIDADE (Omitido para brevidade, mantenha o seu original) */}
      <AnimatePresence>
         {/* ... Seu código de Modal original aqui ... */}
      </AnimatePresence>

      {/* MODAL 2: SOLICITAR ACESSO (JOIN) */}
      <AnimatePresence>
        {joinModalData && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setJoinModalData(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#050B14] border border-white/10 rounded-4xl shadow-2xl z-110 overflow-hidden text-left">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#010307]">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Solicitar <span className="text-sky-500">Acesso</span></h3>
                <button onClick={() => setJoinModalData(null)} className="p-2 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3 bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl">
                  <ShieldAlert size={20} className="text-sky-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-sky-100/80 font-medium leading-relaxed">
                    Você está pedindo acesso à comunidade <strong className="text-sky-400 font-black italic uppercase">{joinModalData.name}</strong>. Esta é uma área restrita gerenciada por profissionais.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Sua mensagem para o Administrador</label>
                  <textarea placeholder="Ex: Sou aluno da consultoria, me aceita aí!" rows={3} className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-white/5 bg-[#010307]">
                <button onClick={() => { alert('Pedido de entrada enviado ao ADM!'); setJoinModalData(null); }} className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-neon active:scale-95 transition-all">
                  Enviar Solicitação
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}