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
      className={`relative flex min-h-[56px] min-w-[54px] flex-col items-center justify-center gap-1.5 transition-all ${active ? 'text-sky-400' : 'text-white/20 hover:text-white/40'}`}
    >
      <div className={`transition-all duration-300 ${active ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] scale-110' : ''}`}>
        {icon}
      </div>
      <span className={`max-w-[58px] text-center text-[8px] font-black uppercase leading-none tracking-wide transition-colors ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
      {active && (
        <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 bg-sky-400 rounded-full shadow-[0_0_5px_rgba(0,229,255,1)]" />
      )}
    </motion.button>
  );
};
