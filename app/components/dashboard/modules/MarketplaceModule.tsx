"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  Search, MapPin, Star, Bookmark, 
  Zap, Briefcase, ChevronRight, 
  Filter, ShieldCheck, Award, User 
} from "lucide-react";

export const MarketplaceModule = () => {
  const [activeTab, setActiveTab] = useState<'explorar' | 'pedidos'>('explorar');

  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
            Ativora <span className="text-sky-500">Direct</span>
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">
            Marketplace de alta performance, radar de serviços e contratações
          </p>
        </div>
        <div className="flex bg-[#010307] border border-white/10 rounded-full p-1 shrink-0">
          <button 
            onClick={() => setActiveTab('explorar')} 
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'explorar' ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            Explorar Elite
          </button>
          <button 
            onClick={() => setActiveTab('pedidos')} 
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'pedidos' ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            Meus Requests
          </button>
        </div>
      </div>

      {activeTab === 'explorar' ? (
        <div className="space-y-6">
          <motion.div variants={itemVars} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-500 transition-colors w-5 h-5" />
              <input 
                type="text" 
                placeholder="BUSCAR PROFISSIONAIS OU ESPECIALIDADES..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-xs font-bold uppercase tracking-widest outline-none transition-all text-white focus:border-sky-500" 
              />
            </div>
            <button className="bg-white/5 border border-white/10 px-6 py-5 rounded-2xl flex items-center justify-center gap-2 hover:border-sky-500 hover:text-sky-500 transition-colors">
              <Filter className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
            </button>
            <button className="bg-sky-500/10 border border-sky-500/30 px-6 py-5 rounded-2xl flex items-center justify-center gap-2 text-sky-400 hover:bg-sky-500/20 transition-colors">
              <MapPin className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Radar Local</span>
            </button>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <motion.div variants={itemVars} className="xl:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Award className="text-sky-500" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Featured Pros</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[ 
                  { nome: 'Carlos Mendes', tipo: 'Personal Trainer', rating: '4.9', area: 'Hipertrofia', local: 'Híbrido' }, 
                  { nome: 'Sarah Costa', tipo: 'Nutricionista', rating: '5.0', area: 'Emagrecimento', local: 'Online' } 
                ].map((pro, i) => (
                  <div key={i} className="bg-[#010307] border border-white/5 rounded-2xl p-5 hover:border-sky-500/50 transition-all group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 rounded-bl-full z-0"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                          <User size={20} className="text-white/40" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tighter text-white flex items-center gap-1">
                            {pro.nome} <ShieldCheck size={12} className="text-sky-500" />
                          </h4>
                          <span className="text-[9px] text-white/40 font-black uppercase tracking-widest block">{pro.tipo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10">
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black">{pro.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                      <span className="text-[8px] border border-white/10 px-2 py-1 rounded text-white/60 font-black uppercase">{pro.area}</span>
                      <span className="text-[8px] border border-sky-500/30 bg-sky-500/10 text-sky-400 px-2 py-1 rounded font-black uppercase">{pro.local}</span>
                    </div>
                    <button className="w-full py-3 bg-white/5 group-hover:bg-sky-500 group-hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors relative z-10">
                      Ver Portfólio
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVars} className="space-y-6">
              <div className="bg-sky-500 text-black rounded-3xl p-6 shadow-[0_0_30px_rgba(14,165,233,0.15)] relative overflow-hidden">
                <Zap className="absolute -right-5 -top-5 w-32 h-32 opacity-10" />
                <h3 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  Client Match Score <Zap size={14} className="fill-black" />
                </h3>
                <p className="text-[10px] font-bold opacity-80 leading-relaxed mb-4">
                  O algoritmo mapeou profissionais com 98% de compatibilidade.
                </p>
                <button className="w-full bg-black text-sky-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">
                  Ver Matches
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bookmark className="text-sky-500" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Sua Tropa (Salvos)</h3>
                </div>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#010307] border border-white/5 rounded-2xl hover:border-white/20 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-full" />
                        <div>
                          <strong className="text-[10px] font-black uppercase tracking-widest text-white block">Dr. Rafael</strong>
                          <span className="text-[8px] font-bold text-white/40 uppercase">Nutrição Esp.</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  ))}
                  <button className="w-full mt-2 text-sky-500 text-[9px] font-black uppercase tracking-widest hover:underline">
                    Ver Todos
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <motion.div variants={itemVars} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 text-center">
          <div className="w-20 h-20 bg-sky-500/10 border border-sky-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="text-sky-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Central de <span className="text-sky-500">Requests</span></h2>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest max-w-md mx-auto mb-8">
            Abra uma solicitação de serviço detalhada. A elite fará propostas baseadas no seu objetivo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="bg-sky-500 text-black px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-colors shadow-[0_0_20px_rgba(14,165,233,0.3)]">
              + Criar Novo Request
            </button>
            <button className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors">
              Histórico
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};