"use client";

import React, { useState, useEffect } from "react";
import { AtivoraSocial } from "./social/AtivoraSocial";
import { 
  LayoutDashboard, Users, Target, TrendingUp, 
  Settings, LogOut, Bell, Shield, Zap, ChevronRight,
  Activity, Utensils, Award, Beaker 
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Image from "next/image";

// --- INTERFACES ---
type ViewState = 'home' | 'social' | 'treinos' | 'metricas' | 'config';

interface UserData { nickname: string; id: string; avatar: string; }
interface SidebarItemProps { icon: React.ReactNode; label: string; active?: boolean; danger?: boolean; code: string; index: number; onClick: () => void; }
interface FunctionCardProps { icon: React.ReactNode; title: string; desc: string; code: string; bgImage: string; onClick: () => void; }
interface MobileNavItemProps { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; }

const containerVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } };

export const MainDashboard = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [socialRoute, setSocialRoute] = useState<'feed' | 'profile'>('feed');
  const [isSocialEditOpen, setIsSocialEditOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasProfile(!!localStorage.getItem('@ativora_profile'));
    }, 0);
    return () => clearTimeout(timer);
  }, [currentView]);

  const [user] = useState<UserData>({
    nickname: "MATHEUS", id: "001", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100"
  });

  const handleLogout = () => {
    if(window.confirm("Deseja desconectar e limpar os dados locais do AtivoraFit?")) {
      localStorage.removeItem('@ativora_profile');
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-dvh bg-[#010307] text-[#F8FAFC] overflow-hidden font-sans">
      
      {/* SIDEBAR ORIGINAL REESTABELECIDA */}
      <aside className="hidden lg:flex w-24 xl:w-80 border-r border-white/5 bg-[#030508] flex-col p-8 z-50 shadow-2xl">
        <div className="mb-16 xl:px-4 cursor-pointer" onClick={() => setCurrentView('home')}>
          <span className="font-black italic text-3xl tracking-tighter block leading-none text-white">
            Ativora<span className="text-sky-500 shadow-neon">Fit</span>
          </span>
          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-2.5 block italic leading-tight">
            A evolução na palma da sua mão!
          </span>
        </div>
        
        <nav className="flex-1 space-y-3.5">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Painel" code="01" index={1} active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <SidebarItem icon={<Users size={20}/>} label="Social" code="02" index={2} active={currentView === 'social'} onClick={() => setCurrentView('social')} />
          <SidebarItem icon={<Target size={20}/>} label="Treinos" code="03" index={3} active={currentView === 'treinos'} onClick={() => setCurrentView('treinos')} />
          <SidebarItem icon={<TrendingUp size={20}/>} label="Evolução" code="04" index={4} active={currentView === 'metricas'} onClick={() => setCurrentView('metricas')} />
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-3.5 flex flex-col">
          <SidebarItem icon={<Settings size={20}/>} label="Ajustes" code="SET" index={5} active={currentView === 'config'} onClick={() => setCurrentView('config')} />
          <SidebarItem icon={<LogOut size={20}/>} label="Sair" code="EXIT" index={6} onClick={handleLogout} danger />
          <div className="mt-6 px-4 py-4 rounded-3xl bg-sky-500/5 border border-sky-500/10 flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shadow-neon" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Laboratório Ativora v1.0.4</span>
             </div>
             <p className="text-[7px] font-medium text-white/20 uppercase leading-relaxed italic">Otimizações constantes para sua performance.</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#010307]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#0EA5E90A,transparent_60%)] pointer-events-none" />

        {/* HEADER ORIGINAL REESTABELECIDO */}
        <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 backdrop-blur-2xl z-40 bg-black/20">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex flex-col" onClick={() => setCurrentView('home')}>
              <span className="font-black italic text-xl tracking-tighter leading-none text-white">Ativora<span className="text-sky-500 shadow-neon">Fit</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 shadow-inner">
                  <Shield size={14} className="text-sky-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60 italic">Protocolo Ativora</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-md">
                 <Beaker size={12} className="text-sky-500" />
                 <div className="flex flex-col text-[8px] font-black text-sky-500 uppercase tracking-tighter leading-none italic">
                    <span>Acesso Antecipado</span>
                    <span className="text-[6px] opacity-40 mt-0.5 tracking-widest">Versão de Testes</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex flex-col items-end">
                <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest italic text-right shadow-neon">Núcleo de Performance</span>
                <span className="text-xs font-bold uppercase text-white/40 tracking-tighter italic">
                  {user.nickname} {" // "} #{user.id}
                </span>
            </div>
            <button className="relative p-3 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-sky-500 transition-all shadow-inner">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-sky-500 rounded-full shadow-neon" />
            </button>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl border-2 border-white/10 overflow-hidden relative shadow-2xl">
              <Image src={user.avatar} alt="Perfil" fill className="object-cover" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-14 pb-36 lg:pb-14 z-10 relative">
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <motion.div key="home" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={containerVariants} className="max-w-6xl mx-auto space-y-12">
                
                <motion.section variants={itemVariants} className="relative group rounded-5xl overflow-hidden border border-white/10 shadow-2xl">
                  <div className="absolute inset-0 z-0">
                    <Image src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200" alt="Ativora Social" fill className="object-cover grayscale brightness-50 group-hover:scale-105 group-hover:brightness-75 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-linear-to-r from-black via-black/40 to-transparent z-10" />
                  </div>

                  <div className="relative z-20 p-8 lg:p-20 flex flex-col justify-center min-h-100 lg:min-h-125">
                    <div className="space-y-6 max-w-2xl text-left">
                      <div className="inline-flex items-center gap-2 bg-sky-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <Users size={12} fill="currentColor" /> Portal da Elite
                      </div>
                      <h2 className="text-5xl lg:text-8xl font-black uppercase italic tracking-tighter leading-none text-white">
                        Ativora <span className="text-sky-500 shadow-neon">Social</span>
                      </h2>
                      <p className="text-white/80 font-bold text-lg lg:text-2xl italic leading-tight">
                        Acompanhe treinos reais, resultados da comunidade e a evolução da elite em tempo real. 
                      </p>
                      <div className="flex flex-wrap gap-4 pt-4">
                        {hasProfile ? (
                          <>
                            <button onClick={() => { setIsGuestMode(false); setSocialRoute('feed'); setCurrentView('social'); }} className="px-10 py-5 bg-sky-500 text-black font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all">
                              Entrar
                            </button>
                            <button onClick={() => { setIsGuestMode(false); setSocialRoute('profile'); setIsSocialEditOpen(true); setCurrentView('social'); }} className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl hover:bg-white/10 transition-all">
                              Editar Perfil
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setIsGuestMode(false); setCurrentView('social'); }} className="px-10 py-5 bg-sky-500 text-black font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all">
                              Criar Conta
                            </button>
                            <button onClick={() => { setIsGuestMode(true); setCurrentView('social'); }} className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl hover:bg-white/10 transition-all">
                              Entrar sem conta
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FunctionCard icon={<Target className="text-sky-500" />} title="Protocolos" desc="Treinos Personalizados" code="03" bgImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" onClick={() => setCurrentView('treinos')} />
                  <FunctionCard icon={<Utensils className="text-orange-500" />} title="Nutrição" desc="Plano Alimentar" code="NUT" bgImage="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" onClick={() => {}} />
                  <FunctionCard icon={<Activity className="text-green-500" />} title="Evolução" desc="Dados Biofísicos" code="04" bgImage="https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=400" onClick={() => setCurrentView('metricas')} />
                  <FunctionCard icon={<Award className="text-yellow-500" />} title="Rank Global" desc="Os Melhores do Rank" code="RANK" bgImage="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400" onClick={() => {}} />
                </div>
              </motion.div>
            )}
            
            {currentView === 'social' && (
              <AtivoraSocial 
                key="social" 
                onBack={() => { setCurrentView('home'); setSocialRoute('feed'); setIsSocialEditOpen(false); }} 
                initialRoute={socialRoute}
                openEditMode={isSocialEditOpen}
                isGuest={isGuestMode}
              />
            )}
          </AnimatePresence>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#030508]/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 z-50">
          <MobileNavItem icon={<LayoutDashboard size={22} />} label="Início" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <MobileNavItem icon={<Users size={22} />} label="Social" active={currentView === 'social'} onClick={() => setCurrentView('social')} />
          <div className="relative -top-6"><button className="relative w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-black shadow-2xl active:scale-90 transition-transform"><Zap size={28} fill="currentColor" /></button></div>
          <MobileNavItem icon={<TrendingUp size={22} />} label="Rank" active={false} onClick={() => {}} />
          <MobileNavItem icon={<Settings size={22} />} label="Ajustes" active={currentView === 'config'} onClick={() => setCurrentView('config')} />
        </nav>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.1); border-radius: 10px; }
        .shadow-neon { filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.6)); }
      `}</style>
    </div>
  );
};

// --- AUXILIARES ORIGINAIS COM COMENTÁRIOS FIX ---

const FunctionCard = ({ icon, title, desc, code, bgImage, onClick }: FunctionCardProps) => (
  <motion.div variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }} onClick={onClick} className="group relative h-64 rounded-4xl overflow-hidden border border-white/5 cursor-pointer shadow-xl transition-all duration-500">
    <Image src={bgImage} alt={title} fill className="object-cover grayscale brightness-[0.2] group-hover:brightness-[0.4] group-hover:grayscale-0 transition-all duration-700" />
    <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent z-10" />
    <div className="relative z-20 p-8 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 group-hover:bg-sky-500 group-hover:text-black transition-all">{icon}</div>
        <span className="text-[8px] font-black text-white/10 italic">{" // "}{code}</span>
      </div>
      <div className="text-left">
        <h4 className="text-xl font-black uppercase italic tracking-tighter text-white mb-1 leading-none">{title}</h4>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{desc}</p>
        <div className="mt-4 flex items-center gap-2 text-sky-500 text-[9px] font-black uppercase italic opacity-0 group-hover:opacity-100 transform -translate-x-2.5 group-hover:translate-x-0 transition-all">
          Acessar <ChevronRight size={12} />
        </div>
      </div>
    </div>
  </motion.div>
);

const SidebarItem = ({ icon, label, active, danger, code, index, onClick }: SidebarItemProps) => (
  <motion.button initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }} onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-[1.25rem] transition-all group relative overflow-hidden border ${active ? 'border-sky-500/30' : 'border-transparent'} ${active ? 'bg-sky-500 text-black shadow-xl shadow-sky-500/20 font-black' : danger ? 'text-rose-500 hover:bg-rose-500/10 font-bold' : 'text-white/30 hover:text-white hover:bg-white/3 font-bold'}`}>
    <div className="flex items-center gap-4 relative z-10">{icon}<span className="hidden xl:block uppercase italic text-xs tracking-widest leading-none">{label}</span></div>
    <span className={`hidden xl:block text-[8px] font-black opacity-40 italic relative z-10 ${active ? 'text-black' : ''}`}>{" // "}{code}</span>
    {active && <motion.div layoutId="activeNav" className="absolute inset-0 bg-sky-500 z-0" />}
  </motion.button>
);

const MobileNavItem = ({ icon, label, active, onClick }: MobileNavItemProps) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-sky-500 shadow-neon' : 'text-white/20'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);