"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UtensilsCrossed, Sparkles, Plus, AlertTriangle, Scale, Ruler, 
  CheckCircle2, Clock, ChevronRight, Activity, Brain
} from "lucide-react";

interface CommunityNutricaoProps {
  currentUser: any;
  userTags: string[];
}

export function CommunityNutricao({ currentUser, userTags }: CommunityNutricaoProps) {
  const [view, setView] = useState<'dashboard' | 'form_solicitacao'>('dashboard');
  
  // Verifica se o usuário é o profissional responsável
  const isNutri = userTags.includes('Nutri') || userTags.includes('ADM') || userTags.includes('Dono');

  // Mocks para ilustrar o estado do app
  const dietaAtual = { status: 'ativa', foco: 'Recomp Corporal', calorias: '2.400 kcal' };
  const solicitacoesPendentes = [
    { id: 1, aluno: "João Silva", foco: "Emagrecimento", data: "Hoje, 09:00" },
    { id: 2, aluno: "Ana Souza", foco: "Hipertrofia", data: "Ontem, 18:30" },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* HEADER DA ABA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Protocolo <span className="text-sky-500">Nutricional</span>
          </h2>
          <p className="text-xs text-white/40 font-medium mt-1">Gerencie seu combustível diário ou solicite um novo planejamento.</p>
        </div>

        {/* CONTROLES (Aluno vs Nutri) */}
        {!isNutri ? (
          <button 
            onClick={() => setView(view === 'dashboard' ? 'form_solicitacao' : 'dashboard')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon"
          >
            {view === 'dashboard' ? <><Plus size={14} /> Solicitar Protocolo</> : 'Voltar ao Painel'}
          </button>
        ) : (
          <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase rounded-full tracking-widest">
               Modo Profissional Ativo
             </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* =========================================
            VISÃO 1: FORMULÁRIO DE SOLICITAÇÃO (ALUNO)
            ========================================= */}
        {view === 'form_solicitacao' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-linear-to-br from-[#050B14] to-[#0A1222] border border-white/5 rounded-4xl p-6 sm:p-10 shadow-2xl"
          >
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
                  <Activity size={32} />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Atualização Biométrica</h3>
                <p className="text-xs text-white/40 mt-2">Preencha suas medidas atuais para que a IA e o seu Nutricionista possam recalcular o seu plano.</p>
              </div>

              {/* Formulário Simples de Medidas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Peso Atual (kg)</label>
                  <div className="relative">
                    <Scale size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="number" placeholder="Ex: 80.5" className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Altura (cm)</label>
                  <div className="relative">
                    <Ruler size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="number" placeholder="Ex: 175" className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Cintura (cm)</label>
                  <input type="number" placeholder="Linha do umbigo" className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Quadril (cm)</label>
                  <input type="number" placeholder="Parte mais larga" className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all" />
                </div>
              </div>

              {/* Foco Principal */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Objetivo Principal</label>
                <select className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-sky-500/50 transition-all appearance-none">
                  <option value="">Selecione o foco...</option>
                  <option value="emagrecimento">Secar (Definição Extrema)</option>
                  <option value="hipertrofia">Bulking (Construção Muscular)</option>
                  <option value="recomp">Recomposição Corporal</option>
                </select>
              </div>

              {/* DISCLAIMER DE SEGURANÇA E ÉTICA PROFISSIONAL */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-500/80 leading-relaxed font-medium">
                  <strong>Aviso Importante:</strong> As estimativas de gordura geradas por cintura e quadril são métodos de apoio matemático para o acompanhamento remoto. Elas <strong>não substituem</strong> um diagnóstico clínico ou exame de bioimpedância presencial. Todos os dados serão revisados pelo profissional responsável.
                </p>
              </div>

              <button 
                onClick={() => { alert('Solicitação enviada para a Nutricionista!'); setView('dashboard'); }}
                className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-neon active:scale-95 transition-all"
              >
                Enviar para Análise
              </button>
            </div>
          </motion.div>
        )}

        {/* =========================================
            VISÃO 2: DASHBOARD (MISTO ALUNO/NUTRI)
            ========================================= */}
        {view === 'dashboard' && (
          <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* Se for NUTRICIONISTA, mostra os pedidos pendentes */}
            {isNutri && (
              <div className="bg-[#050B14] border border-white/5 rounded-4xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                  <Clock size={18} className="text-sky-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Solicitações Pendentes</h3>
                </div>

                <div className="space-y-3">
                  {solicitacoesPendentes.map((req) => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                      <div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">{req.data}</span>
                        <h4 className="text-sm font-black uppercase italic text-white">{req.aluno}</h4>
                        <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mt-1">Foco: {req.foco}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                         <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-black transition-all">
                           <Brain size={12} /> Gerar Base (IA)
                         </button>
                         <button className="px-4 py-2 bg-white/5 text-white rounded-xl text-[9px] font-black uppercase hover:bg-white/10 transition-colors">
                           Revisar
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEU CARDÁPIO DE HOJE (Visível para o Aluno) */}
            <div className="bg-linear-to-br from-[#050B14] to-[#0A1222] border border-white/5 rounded-4xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 blur-[80px] rounded-full" />
              
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20">
                    <UtensilsCrossed size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest block mb-1">Status: Ativo</span>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">Minha Dieta Atual</h3>
                  </div>
                </div>
              </div>

              {/* Resumo Simplificado */}
              <div className="space-y-4 relative z-10">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-green-500/30 transition-colors cursor-pointer">
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-white group-hover:text-green-400 transition-colors">Café da Manhã</h4>
                    <p className="text-[11px] text-white/50 mt-1 font-medium">Ovos, Aveia, Whey Protein e Frutas Vermelhas</p>
                  </div>
                  <CheckCircle2 size={20} className="text-green-500" />
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-colors cursor-pointer">
                  <div>
                    <h4 className="text-sm font-black uppercase italic text-white">Almoço</h4>
                    <p className="text-[11px] text-white/50 mt-1 font-medium">Arroz Branco, Feijão, Frango Grelhado e Salada</p>
                  </div>
                  <ChevronRight size={16} className="text-white/20" />
                </div>
              </div>
              
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}