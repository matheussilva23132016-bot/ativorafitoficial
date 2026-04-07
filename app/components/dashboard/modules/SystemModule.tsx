"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Bell, Plane, WifiOff, Download, Database, Smartphone, Zap } from "lucide-react";

export const SystemModule = () => {
  const [vacationMode, setVacationMode] = useState(false);
  const [offlineMode] = useState(true);
  const [notifications, setNotifications] = useState({ treino: true, metas: true, oportunidades: true });

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
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Configurações <span className="text-sky-500">OS</span></h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Controle de dados, notificações inteligentes e modo offline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <motion.div variants={itemVars} className="xl:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6"><Bell className="text-sky-500" size={20} /><h3 className="text-xs font-black uppercase tracking-widest text-white">Smart Notifications</h3></div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer bg-[#010307] p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
              <div><span className="text-[10px] font-black uppercase text-white block">Treino Pendente</span><span className="text-[8px] font-bold text-white/40 uppercase">Alertas de treinos não realizados</span></div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${notifications.treino ? 'bg-sky-500' : 'bg-white/10'}`} onClick={() => setNotifications({...notifications, treino: !notifications.treino})}>
                <motion.div className="w-4 h-4 bg-white rounded-full absolute top-0.5" animate={{ left: notifications.treino ? '22px' : '2px' }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer bg-[#010307] p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all">
              <div><span className="text-[10px] font-black uppercase text-white block">Meta Próxima</span><span className="text-[8px] font-bold text-white/40 uppercase">Avisos quando estiver perto de bater recordes</span></div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${notifications.metas ? 'bg-sky-500' : 'bg-white/10'}`} onClick={() => setNotifications({...notifications, metas: !notifications.metas})}>
                <motion.div className="w-4 h-4 bg-white rounded-full absolute top-0.5" animate={{ left: notifications.metas ? '22px' : '2px' }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
              </div>
            </label>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className={`rounded-3xl p-6 relative overflow-hidden transition-all duration-500 ${vacationMode ? 'bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'bg-white/5 border border-white/10 text-white'}`}>
          <Plane className={`absolute -right-5 -bottom-5 w-40 h-40 opacity-10 ${vacationMode ? 'text-black' : 'text-white'}`} />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><Plane size={20} className={vacationMode ? 'text-black' : 'text-sky-500'} /><h3 className="text-xs font-black uppercase tracking-widest">Vacation Mode</h3></div>
              <p className={`text-[10px] font-bold mb-6 ${vacationMode ? 'text-black/70' : 'text-white/40'}`}>Pause atendimentos sem perder rank.</p>
            </div>
            <label className="flex items-center justify-between cursor-pointer bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-black/5">
              <span className="text-[10px] font-black uppercase tracking-widest">Modo Férias</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${vacationMode ? 'bg-black' : 'bg-white/10'}`} onClick={() => setVacationMode(!vacationMode)}>
                <motion.div className="w-4 h-4 bg-white rounded-full absolute top-0.5" animate={{ left: vacationMode ? '22px' : '2px' }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
              </div>
            </label>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-linear-to-br from-sky-500/10 to-[#010307] border border-sky-500/20 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><WifiOff className="text-sky-500" size={20} /><h3 className="text-xs font-black uppercase tracking-widest text-white">Offline Mode</h3></div>
            {offlineMode && <span className="bg-sky-500 text-black px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10}/> Ativo</span>}
          </div>
          <p className="text-[10px] font-bold text-white/50 mb-6">Treinos em cache. Sincroniza quando reconectar.</p>
          <div className="bg-[#010307] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3"><Smartphone size={16} className="text-white/40" /><div><span className="text-[9px] font-black uppercase tracking-widest block text-white">Armazenamento Local</span><span className="text-[8px] font-bold text-sky-500 uppercase">24.5 MB utilizados</span></div></div>
            <button className="text-[8px] font-black uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded hover:bg-white/10 transition-colors">Limpar</button>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="md:col-span-2 bg-[#010307] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between group hover:border-sky-500/50 transition-colors">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-sky-500/10 transition-colors"><Database className="text-white/40 group-hover:text-sky-500 transition-colors" size={24} /></div>
            <div><h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Data Export</h3><p className="text-[9px] font-bold text-white/40 max-w-sm">Baixe um relatório completo do seu histórico.</p></div>
          </div>
          <button className="w-full sm:w-auto shrink-0 bg-sky-500 text-black px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-400 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)]"><Download size={14} /> Exportar Relatório PDF</button>
        </motion.div>
      </div>
    </motion.div>
  );
};