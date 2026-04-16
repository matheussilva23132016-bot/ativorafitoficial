"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const REACTIONS = [
  { id: "fire", emoji: "🔥", label: "Elite" },
  { id: "muscle", emoji: "💪", label: "Força" },
  { id: "target", emoji: "🎯", label: "Meta" },
  { id: "zap", emoji: "⚡", label: "Energia" },
  { id: "rocket", emoji: "🚀", label: "Evolução" },
];

interface ReactionPickerProps {
  onSelect: (id: string) => void;
  onClose: () => void;
}

export const ReactionPicker = ({ onSelect, onClose }: ReactionPickerProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="bg-[#0A0F1A] border border-white/10 rounded-full shadow-2xl p-1.5 flex gap-1 items-center"
      onMouseLeave={onClose}
    >
      {REACTIONS.map((r, i) => (
        <motion.button
          key={r.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => { onSelect(r.id); onClose(); }}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all group relative"
        >
          <span className="text-xl group-hover:scale-125 transition-transform">{r.emoji}</span>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-sky-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase italic">
            {r.label}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
};
