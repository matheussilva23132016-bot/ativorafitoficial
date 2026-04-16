"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatusWidgetProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export const StatusWidget = ({ label, value, subValue, icon, trend }: StatusWidgetProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/2 border border-white/5 rounded-3xl p-5 flex items-center gap-4 group hover:bg-white/5 transition-all cursor-default"
    >
      <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-500 group-hover:bg-sky-500 group-hover:text-black transition-all">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic mb-1 group-hover:text-white/40 transition-colors">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h5 className="text-xl font-black text-white italic tracking-tighter">
            {value}
          </h5>
          {subValue && (
            <span className="text-[10px] font-bold text-sky-500/50 uppercase italic">
              {subValue}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
