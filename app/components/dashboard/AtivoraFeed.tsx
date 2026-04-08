"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  Heart, MessageSquare, Share2, Verified, Plus, 
  Flame, Search, User, Globe, Compass, BarChart3
} from "lucide-react";
import Image from "next/image";

// --- INTERFACES ---
interface FeedCardProps {
  type: "student" | "pro";
  user: string;
  rank?: string;
  avatar: string;
  content: string;
  image?: string;
  likes: string;
  tag?: string;
  hasStats?: boolean;
}

interface StoryItem {
  id: number;
  user: string;
  img: string;
  viral?: boolean;
  me?: boolean;
}

const STORIES: StoryItem[] = [
  { id: 1, user: "Você", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", me: true },
  { id: 2, user: "Leo Stronda", img: "https://images.unsplash.com/photo-1583454110551-21f2fa20ed3b?w=100", viral: true },
  { id: 3, user: "Dra. Ana", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100" },
  { id: 4, user: "BOPE Fit", img: "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=100" },
  { id: 5, user: "Cariani", img: "https://images.unsplash.com/photo-1517838276531-24c6530a6190?w=100" },
];

// --- ANIMAÇÕES CORRIGIDAS (Tipagem explícita para evitar Erro TS 2322) ---
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 20, 
      delay: 0.1 
    }
  }
};

const storyVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { 
      delay: i * 0.1, 
      type: "spring", 
      stiffness: 200, 
      damping: 15 
    }
  })
};

export const AtivoraFeed = () => {
  const [activeTab, setActiveTab] = useState("foryou");

  return (
    <div className="w-full max-w-2xl mx-auto space-y-12 pb-20">
      
      {/* 1. BRANDING & SEARCH HEADER */}
      <section className="space-y-8 px-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="flex flex-col">
            <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
              Ativora<span className="text-sky-500 shadow-neon">Feed</span>
            </h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em] mt-2 leading-none">
              Deep Intelligence Social Network
            </p>
          </motion.div>

          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="relative group flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-4 flex items-center text-white/10 group-focus-within:text-sky-500 transition-colors z-10">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="PROCURAR ATLETAS OU PROTOCOLOS..."
              className="w-full bg-[#05070A]/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[9px] font-black uppercase tracking-widest outline-none focus:border-sky-500/30 focus:bg-[#080A10] transition-all placeholder:text-white/10 shadow-inner z-0"
            />
            <div className="absolute inset-0 rounded-2xl bg-sky-500/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          </motion.div>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex gap-8">
            <FeedTab 
              label="Para Você" 
              active={activeTab === "foryou"} 
              onClick={() => setActiveTab("foryou")} 
              icon={<Globe size={14}/>} 
            />
            <FeedTab 
              label="Explorar" 
              active={activeTab === "explore"} 
              onClick={() => setActiveTab("explore")} 
              icon={<Compass size={14}/>} 
            />
          </div>
          <motion.button whileHover={{scale:1.05}} className="flex items-center gap-2.5 text-white/20 hover:text-sky-500 transition-all group pb-2">
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-sky-500/10 border border-white/5 shadow-inner">
              <User size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block italic">Minha Conta</span>
          </motion.button>
        </div>
      </section>

      {/* 3. ATIVORA STORIES */}
      <section className="px-2">
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
          {STORIES.map((story, i) => (
            <motion.div 
              key={story.id} 
              custom={i}
              initial="hidden"
              animate="visible"
              variants={storyVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group"
            >
              <div className={`relative w-20 h-20 rounded-4xl p-1 border-2 transition-all duration-300 ${story.viral ? 'border-sky-500 shadow-[0_0_25px_rgba(14,165,233,0.3)]' : 'border-white/10'}`}>
                {story.viral && <div className="absolute inset-0 rounded-4xl bg-sky-500/10 animate-pulse blur-xl" />}
                <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#05070A] border border-white/5 shadow-inner z-10">
                  <Image src={story.img} alt={story.user} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  {story.me && <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20"><Plus size={22} className="text-sky-500" /></div>}
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic group-hover:text-white transition-colors">{story.user}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. FEED DE PERFORMANCE (POSTS) */}
      <div className="space-y-12">
        <FeedCard 
          type="pro"
          user="Dr. Victor Hugo"
          avatar="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100"
          tag="Especialista em Performance"
          content="A base de um shape de elite não é o peso que você levanta, mas a contração que você gera. Qualidade sobre quantidade, sempre."
          likes="1.8k"
        />

        <FeedCard 
          type="student"
          user="Matheus"
          rank="Rank #1"
          avatar="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100"
          image="https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=800"
          content="A evolução é silenciosa, mas os resultados são ensurdecedores. O Método Saiyajin segue firme operando em 110%."
          likes="5.2k"
          hasStats
        />
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const FeedTab = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 pb-4 relative transition-all ${active ? 'text-sky-500' : 'text-white/20 hover:text-white/40'}`}>
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest italic">{label}</span>
    {active && <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full shadow-neon" />}
  </button>
);

const FeedCard = ({ type, user, rank, avatar, content, image, likes, tag, hasStats }: FeedCardProps) => (
  <motion.div 
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.3 }}
    variants={cardVariants}
    whileHover={{ y: -5, borderColor: "rgba(14,165,233,0.15)" }}
    className="relative bg-linear-to-b from-white/3 to-transparent border border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl group shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-colors duration-500"
  >
    <div className="p-8 md:p-12 z-10 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <motion.div whileHover={{scale:1.05}} className="relative w-16 h-16 rounded-3xl overflow-hidden border-2 border-sky-500/20 shadow-2xl shadow-sky-500/10 cursor-pointer">
            <Image src={avatar} alt={user} fill className="object-cover" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black uppercase italic text-xl md:text-2xl tracking-tighter text-white">{user}</h4>
              {type === "pro" && <Verified size={16} className="text-sky-500 fill-sky-500/10" />}
              {rank && <span className="text-[10px] bg-sky-500 text-black px-3 py-1 rounded-lg font-black italic shadow-lg">{rank}</span>}
            </div>
            <p className="text-[10px] text-sky-500/50 font-black uppercase tracking-[0.3em] mt-1.5">{tag || 'Alumni Elite'}</p>
          </div>
        </div>
      </div>

      <p className="text-lg md:text-xl text-white/80 leading-relaxed font-medium mb-10 italic tracking-tight">&quot;{content}&quot;</p>

      {image && (
        <div className="relative aspect-4/5 w-full rounded-[3rem] overflow-hidden border border-white/5 mb-10 shadow-inner group-hover:border-sky-500/20 transition-all duration-700">
          <Image src={image} alt="Feed content" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />
          {hasStats && (
            <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
              <Flame size={16} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white shadow-neon">Ativora Power Up</span>
            </div>
          )}
           <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-lg px-4 py-2 rounded-full border border-white/5">
                <BarChart3 size={14} className="text-sky-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Análise de IA: 98% de Eficiência</span>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/5 pt-10">
        <div className="flex items-center gap-8 md:gap-10">
          <button className="flex items-center gap-3.5 group/btn">
            <motion.div whileHover={{scale:1.1, backgroundColor:"rgba(225,29,72,0.1)"}} className="p-4 rounded-2xl bg-white/3 border border-white/5 shadow-inner transition-colors">
              <Heart size={22} className="text-white/20 group-hover/btn:text-rose-500 group-hover/btn:fill-rose-500 transition-colors" />
            </motion.div>
            <span className="text-xs font-black italic text-white/90">{likes}</span>
          </button>
          <button className="flex items-center gap-3.5 group/btn">
            <motion.div whileHover={{scale:1.1, backgroundColor:"rgba(14,165,233,0.1)"}} className="p-4 rounded-2xl bg-white/3 border border-white/5 shadow-inner transition-colors">
              <MessageSquare size={22} className="text-white/20 group-hover/btn:text-sky-500 transition-colors" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover/btn:opacity-100 transition-opacity">Operação</span>
          </button>
        </div>
        <motion.button whileHover={{scale:1.1, rotate:15}} className="p-4 text-white/20 hover:text-sky-500 transition-colors">
          <Share2 size={20} />
        </motion.button>
      </div>
    </div>
     <div className="absolute inset-0 bg-sky-500/5 blur-3xl rounded-[3.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
  </motion.div>
);