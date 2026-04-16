"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface FunctionCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  code: string;
  bgImage: string;
  onClick: () => void;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

export const FunctionCard = ({ icon, title, desc, code, bgImage, onClick }: FunctionCardProps) => {
  return (
    <motion.button
      type="button"
      variants={itemVariants}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 40px -15px rgba(14, 165, 233, 0.25)",
      }}
      onClick={onClick}
      className="group relative h-60 w-full overflow-hidden rounded-[28px] border border-white/5 text-left transition-all duration-500 sm:h-64"
    >
      <Image
        src={bgImage}
        alt={title}
        fill
        className="object-cover grayscale brightness-[0.22] scale-105 transition-all duration-700 group-hover:scale-110 group-hover:brightness-[0.42] group-hover:grayscale-0"
        unoptimized
      />
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-transparent z-10" />

      <div className="relative z-20 flex h-full flex-col justify-between p-6 text-left sm:p-7">
        <div className="flex items-start justify-between">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all duration-300 group-hover:border-sky-500 group-hover:bg-sky-500 group-hover:text-black">
            {icon}
          </div>
          <span className="text-[9px] font-black text-white/20 italic tracking-widest transition-colors group-hover:text-sky-500/60">
            {code}
          </span>
        </div>

        <div className="text-left">
          <h4 className="mb-1 text-2xl font-black uppercase italic leading-none tracking-tighter text-white transition-transform group-hover:translate-x-1">
            {title}
          </h4>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 transition-colors group-hover:text-white/65">
            {desc}
          </p>
          <div className="mt-4 flex translate-x-[-12px] items-center gap-2 text-[10px] font-black uppercase italic text-sky-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Abrir <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </motion.button>
  );
};
