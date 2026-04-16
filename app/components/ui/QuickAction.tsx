"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Zap } from "lucide-react";

interface QuickActionProps {
  onClick: () => void;
  label?: string;
}

export const QuickAction = ({ onClick, label = "Iniciar Treino" }: QuickActionProps) => {
  return (
    <div className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 z-[100]">
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-3 bg-sky-500 text-black px-6 py-4 rounded-3xl font-black uppercase italic text-xs shadow-[0_20px_40px_rgba(14,165,233,0.4)] border-2 border-white/20 transition-all group"
      >
        <div className="bg-black/10 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
          <Zap size={18} fill="currentColor" />
        </div>
        <span className="tracking-widest">{label}</span>
      </motion.button>
    </div>
  );
};
