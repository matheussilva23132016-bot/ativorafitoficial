"use client";

import React, { useState } from "react";
import { User, Activity, ShoppingBag, ShieldCheck, Settings, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Importação Completa dos 5 Módulos da Matriz
import { ProfileModule } from './modules/ProfileModule';
import { TrainingModule } from './modules/TrainingModule';
import { MarketplaceModule } from './modules/MarketplaceModule';
import { FinancialModule } from './modules/FinancialModule';
import { SystemModule } from './modules/SystemModule';

// Módulos baseados na sua arquitetura
const MODULES = [
  { id: 'perfil', icon: <User />, title: 'Identidade & Status' },
  { id: 'treino', icon: <Activity />, title: 'Performance & Treino' },
  { id: 'marketplace', icon: <ShoppingBag />, title: 'Ativora Direct' },
  { id: 'financeiro', icon: <ShieldCheck />, title: 'Financeiro & Seguro' },
  { id: 'sistema', icon: <Settings />, title: 'Configurações OS' },
];

export const DashboardLayout = () => {
  const [activeModule, setActiveModule] = useState('perfil');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full bg-[#010307] text-white overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-80 bg-white/2 border-r border-white/5 h-full p-6">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.2)]">
             <Activity className="text-sky-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black italic uppercase tracking-tighter text-xl leading-none">Ativora<span className="text-sky-500">FIT</span></h2>
            <span className="text-[8px] text-sky-400 font-black uppercase tracking-[0.3em]">Painel de Controle</span>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] ${
                activeModule === mod.id 
                ? 'bg-sky-500 text-black shadow-[0_0_20px_rgba(14,165,233,0.3)]' 
                : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              {mod.icon}
              {mod.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* HEADER & MENU MOBILE */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="md:hidden flex items-center justify-between p-6 border-b border-white/5 bg-white/2 backdrop-blur-md z-30">
          <h2 className="font-black italic uppercase tracking-tighter text-lg">Ativora<span className="text-sky-500">FIT</span></h2>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-white/5 rounded-lg border border-white/10 text-white">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* DROPDOWN MENU MOBILE */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-[80px] left-0 w-full bg-[#010307] border-b border-white/10 z-20 p-4 space-y-2 md:hidden"
            >
              {MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => { setActiveModule(mod.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] ${
                    activeModule === mod.id ? 'bg-sky-500 text-black' : 'text-white/50 bg-white/5'
                  }`}
                >
                  {mod.icon}
                  {mod.title}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 relative z-0">
          <div className="max-w-6xl mx-auto">
            {/* RENDERIZAÇÃO CONDICIONAL DOS MÓDULOS */}
            {activeModule === 'perfil' && <ProfileModule />}
            
            {activeModule === 'treino' && <TrainingModule />}
            
            {activeModule === 'marketplace' && <MarketplaceModule />}

            {activeModule === 'financeiro' && <FinancialModule />}

            {activeModule === 'sistema' && <SystemModule />}
          </div>
        </main>
      </div>
    </div>
  );
};