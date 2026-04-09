"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Grid, PlaySquare, Bookmark, ShieldCheck, 
  Settings, Save, X, Camera, Trash2, Lock, Globe, 
  UserPlus, UserCheck, Zap, Link as LinkIcon, Flame, Award,
  CheckCircle, Check, Clock, Trophy, Medal
} from "lucide-react";
import Image from "next/image";
import { UserProfileData } from "./AtivoraSocial";

interface PostItem { id: number; media_url: string; media_type: 'image' | 'video'; }
interface Solicitacao { id: number; username: string; avatar_url: string | null; }

// Mapeamento visual das conquistas
const BADGE_ICONS: Record<string, { icon: any, label: string, color: string, bg: string }> = {
  pioneiro: { icon: <Zap size={12} />, label: 'Pioneiro', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  constante: { icon: <Flame size={12} />, label: 'Imparável', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  monstro: { icon: <Trophy size={12} />, label: 'Monstro', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  viciado: { icon: <Medal size={12} />, label: 'Elite', color: 'text-amber-400', bg: 'bg-amber-400/10' }
};

interface SocialProfileProps {
  profileData: UserProfileData;
  onBack: () => void;
  startInEditMode?: boolean;
  onProfileUpdate: (data: UserProfileData) => void;
  isOwnProfile?: boolean; 
  onPrivacyToggle?: (isPrivate: boolean) => Promise<void>;
}

export const SocialProfile = ({ 
  profileData, 
  onBack, 
  startInEditMode, 
  onProfileUpdate,
  isOwnProfile: isOwnProfileProp,
  onPrivacyToggle
}: SocialProfileProps) => {
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [currentProfile, setCurrentProfile] = useState(profileData);
  const [editBio, setEditBio] = useState(profileData.bio);
  const [editDesc, setEditDesc] = useState(profileData.description);
  const [isPrivate, setIsPrivate] = useState(profileData.is_private || false);
  const [isSaving, setIsSaving] = useState(false);
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [conquistas, setConquistas] = useState<any[]>([]); // Estado das medalhas
  
  const [loggedUser, setLoggedUser] = useState<UserProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<'aceito' | 'pendente' | 'nenhum'>('nenhum');
  const [followersCount, setFollowersCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  const isOwnProfile = isOwnProfileProp ?? (loggedUser?.username === currentProfile.username);

  const levelInfo = useMemo(() => {
    const level = Math.floor(Math.sqrt((xp || 0) / 10)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * 10;
    const nextLevelXP = Math.pow(level, 2) * 10;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return { level, progress: Math.min(progress, 100) };
  }, [xp]);

  const fetchProfileData = useCallback(async () => {
    try {
      const [resPosts, resProfile, resConquistas] = await Promise.all([
        fetch(`/api/posts/listar?nickname=${profileData.username}`),
        fetch(`/api/perfil/buscar?username=${profileData.username}`),
        fetch(`/api/social/conquistas?username=${profileData.username}`) // Busca conquistas
      ]);

      if (resPosts.ok) setUserPosts(await resPosts.json());
      if (resConquistas.ok) setConquistas(await resConquistas.json());
      
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.streak) setStreak(data.streak);
        if (data.xp !== undefined) setXp(data.xp);
        if (data.followers !== undefined) setFollowersCount(data.followers);
        
        const status = data.follow_status || (data.is_following ? 'aceito' : 'nenhum');
        setFollowStatus(status);
        setIsFollowing(status === 'aceito');
        if (data.is_private !== undefined) setIsPrivate(data.is_private);
      }

      if (isOwnProfile) {
        const resSol = await fetch(`/api/social/solicitacoes?username=${profileData.username}`);
        if (resSol.ok) setSolicitacoes(await resSol.json());
      }
    } catch { console.error("Erro na sincronização da matriz."); }
  }, [profileData.username, isOwnProfile]);

  useEffect(() => {
    const saved = localStorage.getItem('@ativora_profile');
    if (saved) setLoggedUser(JSON.parse(saved));
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!loggedUser) return alert("⚠️ PROTOCOLO: Identifique-se para seguir!");
    try {
      const res = await fetch('/api/social/seguir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerNickname: loggedUser.username, followingNickname: currentProfile.username })
      });
      const data = await res.json();
      if (data.success) {
        setFollowStatus(data.status || 'nenhum');
        setIsFollowing(data.status === 'aceito');
        setFollowersCount(prev => data.status === 'aceito' ? prev + 1 : (data.following === false ? prev - 1 : prev));
      }
    } catch { alert("Falha na conexão com o núcleo social."); }
  };

  const handleDecisao = async (id: number, acao: 'aceitar' | 'recusar') => {
    try {
      const res = await fetch('/api/social/solicitacoes/decidir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acao })
      });
      if (res.ok) {
        setSolicitacoes(prev => prev.filter(s => s.id !== id));
        if (acao === 'aceitar') setFollowersCount(prev => prev + 1);
      }
    } catch { alert("Erro ao processar decisão na matriz."); }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const updatedData = { 
      ...currentProfile, 
      bio: editBio, 
      description: editDesc,
      is_private: isPrivate 
    };
    try {
      if (onPrivacyToggle && isPrivate !== profileData.is_private) {
          await onPrivacyToggle(isPrivate);
      }

      const res = await fetch('/api/perfil/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        setCurrentProfile(updatedData);
        onProfileUpdate(updatedData);
        setIsEditing(false);
      }
    } catch { alert("Erro ao gravar dados na matriz."); } finally { setIsSaving(false); }
  };

  const handleDeleteAccount = () => {
    const confirm1 = confirm("⚠️ ALERTA CRÍTICO: Você está prestes a excluir sua matriz de dados.");
    if (confirm1 && confirm("CONFIRMAÇÃO FINAL: Todos os dados serão apagados. Tem certeza?")) {
      localStorage.removeItem('@ativora_profile');
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto pb-20 px-2 lg:px-0 pt-4">
      
      <div className="flex items-center justify-between py-4 mb-4">
        <button onClick={onBack} className="text-white hover:text-sky-500 transition-colors p-2"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-2">
           <span className="font-black uppercase tracking-widest text-sm text-white">{currentProfile.username}</span>
           {(currentProfile.role === 'personal' || currentProfile.role === 'nutri') && (
             <CheckCircle size={14} className="text-sky-500 fill-sky-500/20" />
           )}
           {streak > 0 && (
             <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[10px] font-black text-orange-500">{streak}</span>
             </div>
           )}
        </div>
        {isOwnProfile ? (
          <button onClick={() => setIsEditing(!isEditing)} className={`${isEditing ? 'text-sky-500' : 'text-white'} hover:text-sky-500 transition-colors p-2`}>
            <Settings size={24} />
          </button>
        ) : <div className="w-10" />}
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {isOwnProfile && solicitacoes.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="mx-2 mb-6 p-4 bg-sky-500/5 border border-sky-500/20 rounded-3xl overflow-hidden"
            >
              <h4 className="text-[10px] font-black uppercase text-sky-500 italic mb-3 tracking-widest">Solicitações de Acesso ({solicitacoes.length})</h4>
              <div className="space-y-3">
                {solicitacoes.map((sol) => (
                  <div key={sol.id} className="flex items-center justify-between bg-black/20 p-2 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden relative">
                        {sol.avatar_url && <Image src={sol.avatar_url} alt="User" fill className="object-cover" unoptimized />}
                      </div>
                      <span className="text-xs font-bold text-white">@{sol.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDecisao(sol.id, 'aceitar')} className="p-2 bg-sky-500 text-black rounded-lg hover:scale-105 transition-all"><Check size={14} strokeWidth={3} /></button>
                      <button onClick={() => handleDecisao(sol.id, 'recusar')} className="p-2 bg-white/5 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-2">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                    <Award size={18} className="text-sky-500" />
                    <span className="text-xs font-black uppercase text-white italic">Nível {levelInfo.level}</span>
                </div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{(xp || 0)} XP ACUMULADO</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${levelInfo.progress}%` }} 
                    className="h-full bg-gradient-to-r from-sky-600 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]" 
                />
            </div>

            {/* ESTANTE DE CONQUISTAS (Badges) */}
            {conquistas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {conquistas.map((c) => {
                  const meta = BADGE_ICONS[c.tipo_badge];
                  if (!meta) return null;
                  return (
                    <div key={c.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                      <span className="text-[9px] font-black uppercase italic tracking-tighter">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div className="flex items-center gap-6 lg:gap-10 px-2">
          <div className="relative shrink-0">
            <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full p-1 ${currentProfile.role !== 'aluno' ? 'bg-gradient-to-tr from-sky-500 via-purple-500 to-sky-300 shadow-neon' : 'bg-white/10'}`}>
              <div className="w-full h-full rounded-full border-4 border-[#010307] bg-[#010307] overflow-hidden relative">
                {currentProfile.avatar ? (
                  <Image src={currentProfile.avatar} alt="Profile" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 font-black text-2xl uppercase">{currentProfile.username[0]}</div>
                )}
              </div>
            </div>
            {currentProfile.role !== 'aluno' && (
              <div className="absolute bottom-0 right-2 bg-sky-500 p-1.5 rounded-full text-black border-2 border-[#010307]">
                <ShieldCheck size={14} strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-around lg:justify-start lg:gap-12 text-center lg:text-left">
            <div><span className="block text-xl lg:text-2xl font-black text-white">{userPosts.length}</span><span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Posts</span></div>
            <div><span className="block text-xl lg:text-2xl font-black text-white">{followersCount}</span><span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Seguidores</span></div>
            <div><span className="block text-xl lg:text-2xl font-black text-white">0</span><span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Seguindo</span></div>
          </div>
        </div>

        {!isEditing && (
          <div className="px-2 space-y-4">
            <div className="text-left space-y-1">
              <h2 className="font-black text-white text-base lg:text-lg flex items-center gap-2">
                {currentProfile.username}
                <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full text-sky-500 uppercase italic font-bold">
                  {currentProfile.role === 'aluno' ? 'Atleta' : currentProfile.role}
                </span>
              </h2>
              <p className="text-white text-sm leading-relaxed">{currentProfile.bio}</p>
              <p className="text-white/40 text-xs italic">{currentProfile.description}</p>
              {currentProfile.role !== 'aluno' && (
                <div className="flex items-center gap-2 text-sky-500 pt-2 font-bold text-xs cursor-pointer hover:underline">
                  <LinkIcon size={14} /><span>ativorafit.online/expert/{currentProfile.username}</span>
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex gap-2">
                <button 
                  onClick={handleFollowToggle} 
                  className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 
                  ${followStatus === 'aceito' ? 'bg-white/5 border border-white/10 text-white/40' : 
                    followStatus === 'pendente' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' : 
                    'bg-sky-500 text-black shadow-neon'}`}
                >
                  {followStatus === 'aceito' ? <><UserCheck size={16}/> Seguindo</> : 
                   followStatus === 'pendente' ? <><Clock size={16}/> Solicitado</> : 
                   <><UserPlus size={16}/> Seguir Atleta</>}
                </button>
                
                {(currentProfile.role === 'personal' || currentProfile.role === 'nutri') && (
                  <button 
                    onClick={() => alert("Protocolo de Consultoria: Iniciando conexão...")}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-widest text-[10px] py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <Zap size={16} className="fill-current" /> Consultoria
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isEditing && isOwnProfile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-2 space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
            <h3 className="text-sky-500 font-black uppercase italic tracking-widest text-xs mb-4">Configurações da Matriz</h3>
            
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 mb-4">
              <div className="flex items-center gap-3">
                {isPrivate ? <Lock size={18} className="text-amber-500" /> : <Globe size={18} className="text-emerald-500" />}
                <span className="text-xs font-bold text-white uppercase">{isPrivate ? "Conta Privada" : "Conta Pública"}</span>
              </div>
              <button onClick={() => setIsPrivate(!isPrivate)} className={`w-10 h-5 rounded-full relative transition-colors ${isPrivate ? 'bg-sky-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isPrivate ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mb-1 block">Bio Curta</label>
              <input type="text" value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mb-1 block">Jornada Completa</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm h-24 resize-none outline-none focus:border-sky-500" />
            </div>
            
            <div className="pt-4 space-y-3">
              <button onClick={handleSaveProfile} className="w-full py-3 bg-sky-500 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-neon transition-transform active:scale-95">
                {isSaving ? "Gravando..." : <><Save size={16} /> Atualizar Matriz</>}
              </button>
              <button onClick={handleDeleteAccount} className="w-full py-3 bg-rose-500/10 text-rose-500 font-black uppercase text-[10px] rounded-xl border border-rose-500/20 flex items-center justify-center gap-2">
                <Trash2 size={16} /> Excluir Conta
              </button>
            </div>
          </motion.div>
        )}

        <div className="border-t border-white/10 mt-8">
          <div className="flex justify-around mb-4 text-white/30">
            <button className="flex-1 py-4 flex justify-center border-t border-sky-500 text-sky-500 transition-all"><Grid size={24} /></button>
            <button className="flex-1 py-4 flex justify-center hover:text-white transition-colors"><PlaySquare size={24} /></button>
            <button className="flex-1 py-4 flex justify-center hover:text-white transition-colors"><Bookmark size={24} /></button>
          </div>
          
          <div className="grid grid-cols-3 gap-1 lg:gap-2 px-1">
             {userPosts.length > 0 ? (
               userPosts.map((post) => (
                 <div key={post.id} className="aspect-square bg-white/5 relative overflow-hidden rounded-md group cursor-pointer border border-white/5">
                    {post.media_type === 'image' ? (
                      <Image src={post.media_url} alt="Post" fill className="object-cover group-hover:scale-110 transition-all duration-500" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/40">
                        <PlaySquare size={32} className="text-white/20 group-hover:text-sky-500 transition-colors" />
                      </div>
                    )}
                 </div>
               ))
             ) : (
               <div className="col-span-3 py-20 flex flex-col items-center text-center text-white/10">
                 <Camera size={32} className="mb-4" />
                 <h3 className="font-black text-xl italic uppercase">Sem registros</h3>
               </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};