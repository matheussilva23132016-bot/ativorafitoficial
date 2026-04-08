"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Grid, PlaySquare, Bookmark, ShieldCheck, 
  Settings, Save, X, Camera, Trash2, Lock, Globe, 
  UserPlus, UserCheck, Zap, Link as LinkIcon, Flame, Award
} from "lucide-react";
import Image from "next/image";
import { UserProfileData } from "./AtivoraSocial";

interface PostItem { id: number; media_url: string; media_type: 'image' | 'video'; }

interface SocialProfileProps {
  profileData: UserProfileData;
  onBack: () => void;
  startInEditMode?: boolean;
  onProfileUpdate: (data: UserProfileData) => void;
}

export const SocialProfile = ({ profileData, onBack, startInEditMode, onProfileUpdate }: SocialProfileProps) => {
  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [currentProfile, setCurrentProfile] = useState(profileData);
  const [editBio, setEditBio] = useState(profileData.bio);
  const [editDesc, setEditDesc] = useState(profileData.description);
  const [isSaving, setIsSaving] = useState(false);
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  
  const [loggedUser, setLoggedUser] = useState<UserProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  const isOwnProfile = loggedUser?.username === currentProfile.username;

  // --- LÓGICA DE NÍVEL (GAMIFICAÇÃO) ---
  const levelInfo = useMemo(() => {
    const level = Math.floor(Math.sqrt(xp / 10)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * 10;
    const nextLevelXP = Math.pow(level, 2) * 10;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return { level, progress: Math.min(progress, 100) };
  }, [xp]);

  const fetchProfileData = useCallback(async () => {
    try {
      const [resPosts, resProfile] = await Promise.all([
        fetch(`/api/posts/listar?nickname=${profileData.username}`),
        fetch(`/api/perfil/buscar?username=${profileData.username}`)
      ]);

      if (resPosts.ok) setUserPosts(await resPosts.json());
      if (resProfile.ok) {
        const data = await resProfile.json();
        if (data.streak) setStreak(data.streak);
        if (data.xp !== undefined) setXp(data.xp);
      }
    } catch { console.error("Erro na sincronização."); }
  }, [profileData.username]);

  useEffect(() => {
    const saved = localStorage.getItem('@ativora_profile');
    if (saved) setLoggedUser(JSON.parse(saved));
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!loggedUser) return alert("Identifique-se para seguir!");
    try {
      const res = await fetch('/api/social/seguir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seguidor: loggedUser.username, seguido: currentProfile.username })
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.following);
        setFollowersCount(prev => data.following ? prev + 1 : prev - 1);
      }
    } catch { alert("Erro de conexão."); }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const updatedData = { ...currentProfile, bio: editBio, description: editDesc };
    try {
      await fetch('/api/perfil/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      setCurrentProfile(updatedData);
      onProfileUpdate(updatedData);
      setIsEditing(false);
    } catch { alert("Erro ao salvar."); } finally { setIsSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto pb-20 px-2 lg:px-0 pt-4">
      
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-4">
        <button onClick={onBack} className="text-white hover:text-sky-500 transition-colors"><ArrowLeft size={24} /></button>
        <div className="flex items-center gap-2">
           <span className="font-black uppercase tracking-widest text-sm text-white">{currentProfile.username}</span>
           {streak > 0 && (
             <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-[10px] font-black text-orange-500">{streak}</span>
             </div>
           )}
        </div>
        {isOwnProfile && (
          <button onClick={() => setIsEditing(!isEditing)} className={`${isEditing ? 'text-sky-500' : 'text-white'} hover:text-sky-500 transition-colors`}><Settings size={24} /></button>
        )}
      </div>

      <div className="space-y-8">
        {/* Progress Bar de Nível */}
        <div className="px-2">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                    <Award size={18} className="text-sky-500" />
                    <span className="text-xs font-black uppercase text-white italic">Nível {levelInfo.level}</span>
                </div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{xp} XP TOTAL</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${levelInfo.progress}%` }} 
                    className="h-full bg-linear-to-r from-sky-600 to-sky-400 shadow-neon" 
                />
            </div>
        </div>

        <div className="flex items-center gap-6 lg:gap-10 px-2">
          <div className="relative shrink-0">
            <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full p-1 ${currentProfile.role !== 'aluno' ? 'bg-linear-to-tr from-sky-500 via-purple-500 to-sky-300 shadow-neon' : 'bg-white/10'}`}>
              <div className="w-full h-full rounded-full border-4 border-[#010307] bg-[#010307] overflow-hidden relative">
                {currentProfile.avatar && <Image src={currentProfile.avatar} alt="Profile" fill className="object-cover" unoptimized />}
              </div>
            </div>
            <div className="absolute bottom-0 right-2 bg-sky-500 p-1.5 rounded-full text-black border-2 border-[#010307]"><ShieldCheck size={14} strokeWidth={3} /></div>
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
                <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full text-sky-500 uppercase italic font-bold">{currentProfile.role}</span>
              </h2>
              <p className="text-white text-sm leading-relaxed">{currentProfile.bio}</p>
              <p className="text-white/40 text-xs italic">{currentProfile.description}</p>
              {currentProfile.role !== 'aluno' && (
                <div className="flex items-center gap-2 text-sky-500 pt-2 font-bold text-xs cursor-pointer hover:underline"><LinkIcon size={14} /><span>ativora.fit/expert/{currentProfile.username}</span></div>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex gap-2">
                <button onClick={handleFollowToggle} className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${isFollowing ? 'bg-white/5 border border-white/10 text-white/40' : 'bg-sky-500 text-black shadow-neon'}`}>
                  {isFollowing ? <><UserCheck size={16}/> Seguindo</> : <><UserPlus size={16}/> Seguir Atleta</>}
                </button>
                {(currentProfile.role === 'personal' || currentProfile.role === 'nutri') && (
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl border border-white/5 flex items-center justify-center gap-2">
                    <Zap size={16} className="text-amber-400 fill-amber-400" /> Consultoria
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isEditing && isOwnProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
            <div>
              <label className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mb-1 block">Bio Curta</label>
              <input type="text" value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mb-1 block">Jornada Completa</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm h-24 resize-none" />
            </div>
            <div className="pt-4 space-y-3">
              <button onClick={handleSaveProfile} className="w-full py-3 bg-sky-500 text-black font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-neon">{isSaving ? "Gravando..." : <><Save size={16} /> Salvar Perfil</>}</button>
              <button onClick={() => { localStorage.removeItem('@ativora_profile'); window.location.reload(); }} className="w-full py-3 bg-rose-500/10 text-rose-500 font-black uppercase text-[10px] rounded-xl border border-rose-500/20">Excluir Conta</button>
            </div>
          </motion.div>
        )}

        <div className="border-t border-white/10 mt-8">
          <div className="flex justify-around mb-4 text-white/30">
            <button className="flex-1 py-4 flex justify-center border-t border-sky-500 text-sky-500"><Grid size={24} /></button>
            <button className="flex-1 py-4 flex justify-center hover:text-white transition-colors"><PlaySquare size={24} /></button>
            <button className="flex-1 py-4 flex justify-center hover:text-white transition-colors"><Bookmark size={24} /></button>
          </div>
          <div className="grid grid-cols-3 gap-1 lg:gap-2 px-1">
             {userPosts.length > 0 ? (
               userPosts.map((post) => (
                 <div key={post.id} className="aspect-square bg-white/5 relative overflow-hidden rounded-md group">
                    {post.media_type === 'image' ? <Image src={post.media_url} alt="Post" fill className="object-cover group-hover:scale-110 transition-all duration-500" unoptimized /> : <div className="w-full h-full flex items-center justify-center bg-black/40"><PlaySquare size={32} className="text-white/20" /></div>}
                 </div>
               ))
             ) : (
               <div className="col-span-3 py-20 flex flex-col items-center text-center">
                 <Camera size={32} className="text-white/10 mb-4" />
                 <h3 className="text-white font-black text-xl">Sem registros</h3>
               </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};