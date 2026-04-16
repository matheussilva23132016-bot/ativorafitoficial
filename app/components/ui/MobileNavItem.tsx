"use client";

import React from "react";
import { motion } from "framer-motion";

interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export const MobileNavItem = ({ icon, label, active, onClick }: MobileNavItemProps) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`relative flex min-h-[54px] min-w-[58px] flex-1 flex-col items-center justify-center gap-1 transition-all ${active ? 'text-sky-400' : 'text-white/22 hover:text-white/40'}`}
    >
      <div className={`transition-all duration-300 ${active ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.45)] scale-105' : ''}`}>
        {icon}
      </div>
      <span className={`max-w-[60px] text-center text-[7px] font-black uppercase leading-none tracking-[0.12em] transition-colors ${active ? 'opacity-100' : 'opacity-45'}`}>{label}</span>
      {active && (
        <motion.div layoutId="nav-dot" className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(0,229,255,1)]" />
      )}
    </motion.button>
  );
};
