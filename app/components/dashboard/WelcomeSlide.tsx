"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export const WelcomeSlide = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#010307]"
    >
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ duration: 4, repeat: Infinity }}
        className="relative w-32 h-32 md:w-48 md:h-48 mb-8 opacity-50"
      >
        <Image src="/logo.png" alt="Ativora" fill className="object-contain" priority />
      </motion.div>

      <h1 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter text-white text-center px-4">
        Bem Vindo(a) a <br/>
        <span className="text-sky-500">AtivoraFIT!</span>
      </h1>
      
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ delay: 1, duration: 1.5 }}
        className="h-1 bg-sky-500 mt-8 rounded-full shadow-[0_0_15px_#0EA5E9]"
      />
    </motion.div>
  );
};