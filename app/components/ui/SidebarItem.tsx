"use client";

import React from "react";
import { motion } from "framer-motion";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  code: string;
  onClick: () => void;
  danger?: boolean;
}

export const SidebarItem = ({ icon, label, active, code, onClick, danger }: SidebarItemProps) => {
  return (
    <button 
      onClick={onClick} 
      className={`relative w-full flex items-center justify-between p-4 rounded-2xl transition-all border group
        ${active 
          ? 'bg-sky-500/10 text-sky-500 font-black border-sky-500/20 shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
          : danger 
            ? 'border-rose-500/10 text-rose-500 hover:bg-rose-500/10'
            : 'border-transparent text-white/30 hover:bg-white/5 hover:text-white'}`}
    >
      {/* Indicador Lateral Animado */}
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute -left-1 w-1.5 h-6 bg-sky-500 rounded-full shadow-neon"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      <div className="flex items-center gap-4 relative z-10 text-left">
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        <span className="hidden xl:block uppercase italic text-[11px] tracking-[0.2em] font-black leading-none">{label}</span>
      </div>
      <span className={`hidden xl:block text-[8px] font-black opacity-30 italic relative z-10 ${active ? 'text-sky-500' : ''}`}>
        {" // "}{code}
      </span>
    </button>
  );
};
