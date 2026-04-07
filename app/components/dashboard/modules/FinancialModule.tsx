"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { 
  Wallet, ShieldCheck, Lock, TrendingUp, 
  ArrowRightLeft, AlertCircle, FileText, 
  Download, ChevronRight, Scale
} from "lucide-react";

export const FinancialModule = () => {
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Financeiro & <span className="text-sky-500">Seguro</span></h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Gestão de receitas, pagamentos em custódia e proteção jurídica</p>
        </div>
        <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors shrink-0">
          <Download size={14} /> Relatório Geral
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={itemVars} className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-linear-to-br from-sky-500 to-blue-600 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_40px_rgba(14,165,233,0.2)]">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Wallet size={160} /></div>
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-black/70 mb-2">Saldo Disponível</h3>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#010307]"><span className="text-2xl mr-2">R$</span>4.250<span className="text-2xl">,00</span></h2>
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-black/10">
                <div className="bg-black/20 px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                  <Lock className="text-[#010307]" size={18} />
                  <div><span className="text-[8px] font-black uppercase tracking-widest text-black/60 block">Em Custódia (Escrow)</span><strong className="text-sm text-[#010307] font-black">R$ 1.150,00</strong></div>
                </div>
                <div className="bg-black/20 px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                  <TrendingUp className="text-[#010307]" size={18} />
                  <div><span className="text-[8px] font-black uppercase tracking-widest text-black/60 block">Ganhos Totais (Mês)</span><strong className="text-sm text-[#010307] font-black">R$ 5.400,00</strong></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><ArrowRightLeft className="text-sky-500" size={20} /><h3 className="text-xs font-black uppercase tracking-widest text-white">Histórico de Transações</h3></div>
              <button className="text-[9px] font-black uppercase tracking-widest text-sky-500 hover:text-sky-400">Ver Todas</button>
            </div>
            <div className="space-y-3">
              {[ { type: 'Consultoria Online', client: 'Carlos Silva', amount: '+ R$ 350,00', status: 'Liberado', date: 'Hoje, 10:30' }, { type: 'Plano Semestral', client: 'Ana Beatriz', amount: '+ R$ 800,00', status: 'Escrow', date: 'Ontem, 14:15' }, { type: 'Saque Plataforma', client: 'Conta Corrente', amount: '- R$ 1.500,00', status: 'Concluído', date: '04 ABR, 09:00' } ].map((tx, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#010307] border border-white/5 rounded-2xl gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount.startsWith('+') ? (tx.status.includes('Escrow') ? 'bg-yellow-500/10 text-yellow-500' : 'bg-emerald-500/10 text-emerald-500') : 'bg-white/10 text-white'}`}>
                      {tx.status.includes('Escrow') ? <Lock size={16} /> : <TrendingUp size={16} />}
                    </div>
                    <div><strong className="text-[10px] text-white uppercase font-black tracking-widest block">{tx.type}</strong><span className="text-[9px] text-white/40 font-bold tracking-widest">{tx.client} • {tx.date}</span></div>
                  </div>
                  <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between">
                    <strong className={`text-sm font-black ${tx.amount.startsWith('+') ? (tx.status.includes('Escrow') ? 'text-yellow-500' : 'text-emerald-500') : 'text-white'}`}>{tx.amount}</strong>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="space-y-6">
          <div className="bg-linear-to-b from-sky-500/10 to-[#010307] border border-sky-500/30 rounded-3xl p-6 relative overflow-hidden text-center">
            <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.3)]"><ShieldCheck className="text-sky-500 w-8 h-8" /></div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Seguro Profissional</h3>
            <p className="text-[10px] text-white/60 font-bold mb-4">Proteção jurídica e civil ativa para seus atendimentos na plataforma. Suas consultas estão resguardadas.</p>
            <span className="inline-block bg-sky-500 text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Apólice Ativa</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6"><Scale className="text-sky-500" size={20} /><h3 className="text-xs font-black uppercase tracking-widest text-white">Resolução & Disputas</h3></div>
            <div className="space-y-4">
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><AlertCircle className="text-red-500" size={14} /><span className="text-[10px] font-black uppercase tracking-widest text-red-500">Disputas Abertas (0)</span></div><ChevronRight size={14} className="text-white/20 group-hover:text-red-500" /></div>
                <p className="text-[9px] text-white/40 font-bold">Nenhum conflito relatado. Sua reputação está impecável.</p>
              </div>
              <div className="p-4 bg-[#010307] border border-white/5 rounded-2xl hover:border-white/20 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><FileText className="text-white/60" size={14} /><span className="text-[10px] font-black uppercase tracking-widest text-white">Central de Reembolsos</span></div><ChevronRight size={14} className="text-white/20 group-hover:text-white" /></div>
                <p className="text-[9px] text-white/40 font-bold">Gerencie pedidos de devolução dentro da política da plataforma.</p>
              </div>
            </div>
          </div>
          <button className="w-full bg-[#010307] border border-white/10 p-6 rounded-3xl flex items-center justify-between hover:border-sky-500 hover:text-sky-500 transition-colors group">
            <div className="flex items-center gap-4"><FileText className="text-white/40 group-hover:text-sky-500 transition-colors" size={24} /><div className="text-left"><strong className="text-[10px] font-black uppercase tracking-widest block text-white group-hover:text-sky-500">Documentos Fiscais</strong><span className="text-[8px] font-bold text-white/40">Notas e relatórios de impostos</span></div></div><ChevronRight size={18} className="text-white/20 group-hover:text-sky-500" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};