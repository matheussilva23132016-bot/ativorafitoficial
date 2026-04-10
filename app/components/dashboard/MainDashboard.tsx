"use client";

import React, { useState, useEffect } from "react";
import { AtivoraSocial } from "./social/AtivoraSocial";
import { HubComunidadesCard } from "./comunidades/HubComunidadesCard";
import { CommunityList } from "./comunidades/CommunityList";

import { 
  LayoutDashboard, Users, Target, TrendingUp, Settings, LogOut,
  Bell, Shield, ChevronRight, Activity, Utensils, Award, Flame, Beaker
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Image from "next/image";

// --- TIPAGENS ---
type ViewState = 'home' | 'social' | 'treinos' | 'metricas' | 'config' | 'comunidades';

interface UserData { 
  nickname: string; 
  id: string; 
  avatar: string; 
  role?: string;
  streak?: number;
}

interface INotification {
  id: string;
  title: string;
  message: string;
  type: 'treino' | 'social' | 'comunidade';
  targetId?: string;
  targetTab?: string;
  isRead: boolean;
}

const containerVariants: Variants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const itemVariants: Variants = { 
  hidden: { y: 20, opacity: 0 }, 
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } 
};

export default function MainDashboard() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [socialRoute, setSocialRoute] = useState<'feed' | 'profile'>('feed');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);

  // --- ESTADOS DE SISTEMA ---
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [deepLink, setDeepLink] = useState<{ communityId: string, tab: string } | null>(null);
  const [notifications, setNotifications] = useState<INotification[]>([
    { 
      id: '1', 
      title: '🎯 Novo Ciclo de Elite!', 
      message: 'Seu treinador publicou seu protocolo de 20 sessões.', 
      type: 'treino', 
      targetId: '1', 
      targetTab: 'treinos', 
      isRead: false 
    }
  ]);

  // --- SINCRONIZAÇÃO DE PERFIL ---
  useEffect(() => {
    const savedProfile = localStorage.getItem('@ativora_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setHasProfile(true);
      setUserProfile({
        nickname: parsed.username || "MATHEUS",
        id: parsed.id || "001",
        avatar: parsed.avatar || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100",
        role: parsed.role || "aluno",
        streak: parsed.streak || 0
      });
    } else {
      setHasProfile(false);
    }
  }, [currentView]);

  // --- LOGICA DE NOTIFICAÇÃO (DEEP LINKING) ---
  const handleNotificationClick = (notif: INotification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    if (notif.type === 'treino' && notif.targetId) {
      setDeepLink({ communityId: notif.targetId, tab: notif.targetTab || 'treinos' });
      setCurrentView('comunidades');
    }
    setShowNotifPanel(false);
  };

  const handleLogout = () => {
    if(window.confirm("Deseja desconectar da Matriz Ativora?")) {
      localStorage.removeItem('@ativora_profile');
      window.location.reload();
    }
  };

  const displayUser = userProfile || { 
    nickname: "GUEST", id: "---", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", role: "aluno", streak: 0 
  };
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col lg:flex-row h-dvh bg-[#010307] text-[#F8FAFC] overflow-hidden font-sans text-left">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden lg:flex w-24 xl:w-80 border-r border-white/5 bg-[#030508] flex-col p-8 z-50 shadow-2xl">
        <div className="mb-16 xl:px-4 cursor-pointer" onClick={() => setCurrentView('home')}>
          <span className="font-black italic text-3xl tracking-tighter block leading-none text-white">
            Ativora<span className="text-sky-500 shadow-neon">Fit</span>
          </span>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2.5 block italic leading-tight uppercase">Protocolo Matriz Ativora</span>
        </div>
        
        <nav className="flex-1 space-y-3.5">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Painel" code="01" active={currentView === 'home'} onClick={() => { setCurrentView('home'); setDeepLink(null); }} />
          <SidebarItem icon={<Users size={20}/>} label="Social" code="02" active={currentView === 'social'} onClick={() => setCurrentView('social')} />
          <SidebarItem icon={<Shield size={20}/>} label="Comunidades" code="03" active={currentView === 'comunidades'} onClick={() => { setCurrentView('comunidades'); setDeepLink(null); }} />
          <SidebarItem icon={<Target size={20}/>} label="Treinos" code="04" active={currentView === 'treinos'} onClick={() => setCurrentView('treinos')} />
          <SidebarItem icon={<TrendingUp size={20}/>} label="Evolução" code="05" active={currentView === 'metricas'} onClick={() => setCurrentView('metricas')} />
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-3.5 flex flex-col">
          <SidebarItem icon={<Settings size={20}/>} label="Ajustes" code="SET" active={currentView === 'config'} onClick={() => setCurrentView('config')} />
          <SidebarItem icon={<LogOut size={20}/>} label="Sair" code="EXIT" onClick={handleLogout} danger />
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#010307]">
        
        {/* --- HEADER --- */}
        <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 backdrop-blur-2xl z-40 bg-black/20">
          <div className="flex items-center gap-4">
             <div className="lg:hidden" onClick={() => setCurrentView('home')}>
                <span className="font-black italic text-xl text-white">Ativora<span className="text-sky-500">Fit</span></span>
             </div>
             <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 italic text-[10px] font-black uppercase text-white/40">
                <Shield size={14} className="text-sky-500 animate-pulse" /> Núcleo de Elite
             </div>
          </div>

          <div className="flex items-center gap-4">
            {/* NOTIFICAÇÕES */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className={`relative p-3 rounded-2xl border transition-all shadow-inner ${unreadCount > 0 ? 'bg-sky-500/10 border-sky-500/30 text-sky-500' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-sky-500 rounded-full shadow-neon animate-bounce" />}
              </button>

              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-16 right-0 w-80 bg-[#050B14] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden text-left">
                    <div className="p-5 border-b border-white/5 bg-white/2 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Central de Alertas</span>
                      {unreadCount > 0 && <span className="text-[8px] bg-sky-500 text-black px-2 py-0.5 rounded-full font-black uppercase">{unreadCount} NOVOS</span>}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.map(notif => (
                        <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-5 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all relative ${!notif.isRead ? 'bg-sky-500/5' : ''}`}>
                          {!notif.isRead && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-full" />}
                          <h4 className="text-xs font-black text-white uppercase italic">{notif.title}</h4>
                          <p className="text-[10px] text-white/40 mt-1">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl border-2 border-white/10 overflow-hidden relative shadow-2xl">
              <Image src={displayUser.avatar} alt="Perfil" fill className="object-cover" unoptimized />
            </div>
          </div>
        </header>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-14 pb-36 z-10 relative">
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <motion.div key="home" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={containerVariants} className="max-w-6xl mx-auto space-y-12">
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-fr">
                  
                  {/* CARD SOCIAL COM LÓGICA DE CONTA */}
                  <motion.section variants={itemVariants} className="relative group rounded-5xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-full min-h-87.5">
                    <div className="absolute inset-0 z-0">
                      <Image src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200" alt="Social" fill className="object-cover grayscale brightness-50 group-hover:scale-105 group-hover:brightness-75 transition-all duration-1000" unoptimized />
                      <div className="absolute inset-0 bg-linear-to-r from-black via-black/60 to-transparent z-10" />
                    </div>

                    <div className="relative z-20 p-8 lg:p-12 flex flex-col justify-center h-full text-left">
                      <div className="space-y-6 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-sky-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                          <Users size={12} fill="currentColor" /> Portal da Elite
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none text-white">
                          Ativora <span className="text-sky-500 shadow-neon">Social</span>
                        </h2>
                        <p className="text-white/80 font-bold text-lg italic leading-tight">Acompanhe treinos reais e a evolução da elite em tempo real.</p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                          {hasProfile ? (
                            <>
                              <button onClick={() => { setIsGuestMode(false); setCurrentView('social'); }} className="px-10 py-5 bg-sky-500 text-black font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-xl hover:scale-105 transition-all">Entrar</button>
                              <button onClick={() => { setIsGuestMode(false); setSocialRoute('profile'); setCurrentView('social'); }} className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl hover:bg-white/10 transition-all">Editar Perfil</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setIsGuestMode(false); setCurrentView('social'); }} className="px-10 py-5 bg-sky-500 text-black font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-xl hover:scale-105 transition-all">Criar Conta</button>
                              <button onClick={() => { setIsGuestMode(true); setCurrentView('social'); }} className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black uppercase italic tracking-widest text-[11px] rounded-2xl hover:bg-white/10 transition-all">Entrar sem conta</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.section>

                  {/* CARD COMUNIDADES */}
                  <motion.div variants={itemVariants} className="h-full min-h-87.5">
                    <HubComunidadesCard onClick={() => setCurrentView('comunidades')} />
                  </motion.div>
                </div>

                {/* GRID DE FUNÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FunctionCard icon={<Target className="text-sky-500" />} title="Protocolos" desc="Treinos" code="03" bgImage="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" onClick={() => setCurrentView('treinos')} />
                  <FunctionCard icon={<Utensils className="text-orange-500" />} title="Nutrição" desc="Dieta" code="NUT" bgImage="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" onClick={() => {}} />
                  <FunctionCard icon={<Activity className="text-green-500" />} title="Evolução" desc="Métricas" code="04" bgImage="https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=400" onClick={() => setCurrentView('metricas')} />
                  <FunctionCard icon={<Award className="text-yellow-500" />} title="Rank" desc="Global" code="RNK" bgImage="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400" onClick={() => {}} />
                </div>
              </motion.div>
            )}
            
            {currentView === 'social' && (
              <AtivoraSocial 
                onBack={() => { setCurrentView('home'); setSocialRoute('feed'); }} 
                isGuest={isGuestMode} 
                initialRoute={socialRoute} 
              />
            )}

            {currentView === 'comunidades' && (
              <motion.div key="comunidades" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                <div className="max-w-6xl mx-auto px-4 mb-4">
                  <button onClick={() => { setCurrentView('home'); setDeepLink(null); }} className="text-white/40 hover:text-sky-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">← Voltar</button>
                </div>
                <CommunityList currentUser={displayUser} initialDeepLink={deepLink} onClearDeepLink={() => setDeepLink(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* --- MOBILE NAV --- */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#030508]/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 z-50">
          <MobileNavItem icon={<LayoutDashboard size={22} />} label="Início" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
          <MobileNavItem icon={<Users size={22} />} label="Social" active={currentView === 'social'} onClick={() => setCurrentView('social')} />
          <div className="relative -top-6">
            <button onClick={() => setCurrentView('comunidades')} className="relative w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-black shadow-neon transition-transform active:scale-90"><Shield size={28} fill="currentColor" /></button>
          </div>
          <MobileNavItem icon={<TrendingUp size={22} />} label="Rank" active={currentView === 'metricas'} onClick={() => setCurrentView('metricas')} />
          <MobileNavItem icon={<Settings size={22} />} label="Ajustes" active={currentView === 'config'} onClick={() => setCurrentView('config')} />
        </nav>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .shadow-neon { filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.6)); }
      `}</style>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const FunctionCard = ({ icon, title, desc, code, bgImage, onClick }: any) => (
  <motion.div variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }} onClick={onClick} className="group relative h-64 rounded-4xl overflow-hidden border border-white/5 cursor-pointer shadow-xl transition-all duration-500">
    <Image src={bgImage} alt={title} fill className="object-cover grayscale brightness-[0.2] group-hover:brightness-[0.4] group-hover:grayscale-0 transition-all duration-700" unoptimized />
    <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent z-10" />
    <div className="relative z-20 p-8 h-full flex flex-col justify-between text-left">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 group-hover:bg-sky-500 group-hover:text-black transition-all">{icon}</div>
        <span className="text-[8px] font-black text-white/10 italic">{" // "}{code}</span>
      </div>
      <div>
        <h4 className="text-xl font-black uppercase italic tracking-tighter text-white mb-1 leading-none">{title}</h4>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">{desc}</p>
        <div className="mt-4 flex items-center gap-2 text-sky-500 text-[9px] font-black uppercase italic opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all">Acessar <ChevronRight size={12} /></div>
      </div>
    </div>
  </motion.div>
);

const SidebarItem = ({ icon, label, active, code, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${active ? 'bg-sky-500 text-black font-black border-sky-500 shadow-neon' : 'border-transparent text-white/30 hover:bg-white/3 hover:text-white'}`}>
    <div className="flex items-center gap-4 relative z-10">
      {icon}
      <span className="hidden xl:block uppercase italic text-xs tracking-widest font-black leading-none">{label}</span>
    </div>
    <span className={`hidden xl:block text-[8px] font-black opacity-40 italic relative z-10 ${active ? 'text-black' : ''}`}>{" // "}{code}</span>
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-sky-500 shadow-neon' : 'text-white/20'}`}>
    {icon}
    <span className="text-[8px] font-black uppercase tracking-widest italic">{label}</span>
  </button>
);