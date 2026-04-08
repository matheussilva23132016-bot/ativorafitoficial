"use client";

import React, { useState, useMemo, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Heart, MessageSquare, Share2, Verified, 
  Search, User, Compass, TrendingUp, Star, X, ImageIcon, Video, Bookmark,
  Shield, Activity, Beaker
} from "lucide-react";
import Image from "next/image";
import { UserProfileData } from "./AtivoraSocial";

type FeedTab = 'explorar' | 'tendencias' | 'destaque' | 'meu_perfil' | 'pesquisar';

interface AtivoraFeedProps {
  currentUser: UserProfileData;
  onViewProfile: () => void;
  onOpenMessages: () => void;
  isGuest?: boolean;
}

interface PostData {
  id: number;
  user: string;
  avatar: string | null;
  content: string;
  likes: number;
  isPro?: boolean;
  role?: 'aluno' | 'personal' | 'nutri' | 'estagiario' | 'influencer';
  is_verified?: boolean;
  category: 'normal' | 'tendencia' | 'destaque';
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
}

interface NavTabProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface APIPost {
  id: number;
  nickname: string;
  content: string;
  media_url: string;
  media_type: 'image' | 'video';
  likes: number;
  role?: 'aluno' | 'personal' | 'nutri' | 'estagiario' | 'influencer';
  is_verified?: boolean;
}

export const AtivoraFeed = ({ currentUser, onViewProfile, onOpenMessages, isGuest }: AtivoraFeedProps) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('explorar');
  const [postText, setPostText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [postMedia, setPostMedia] = useState<string | null>(null);
  const [postMediaType, setPostMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<PostData[]>([]);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/posts/listar');
      if (response.ok) {
        const data: APIPost[] = await response.json();
        const formattedPosts: PostData[] = data.map((p) => ({
          id: p.id,
          user: p.nickname,
          avatar: null,
          content: p.content,
          mediaUrl: p.media_url,
          mediaType: p.media_type,
          likes: p.likes || 0,
          role: p.role || 'aluno',
          is_verified: p.is_verified || false,
          category: 'normal'
        }));
        setPosts(formattedPosts);
      }
    } catch {
      console.error("Erro ao sincronizar feed.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (active) {
        await fetchPosts();
      }
    };
    loadData();
    return () => { active = false; };
  }, [fetchPosts]);

  // --- VALIDAÇÃO: LIMITE DE TEMPO DE VÍDEO (30s) ---
  const handleMediaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoElement.src);
          if (videoElement.duration > 30.5) {
            alert("A elite é objetiva! Vídeos devem ter no máximo 30 segundos.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            setPostMedia(reader.result as string);
            setPostMediaType('video');
          };
          reader.readAsDataURL(file);
        };
        videoElement.src = URL.createObjectURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPostMedia(reader.result as string);
          setPostMediaType('image');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // --- VALIDAÇÕES NO HANDLEPOST (ANTI-SPAM E QUALIDADE) ---
  const handlePost = async () => {
    if (!postText.trim() && !postMedia) return;

    // 1. QUALIDADE DE MÍDIA: Legenda técnica para Personal/Nutri
    const isProfessional = currentUser.role === 'personal' || currentUser.role === 'nutri';
    if (isProfessional && postText.trim().length < 50) {
      alert("Como autoridade técnica, sua legenda deve ter no mínimo 50 caracteres para educar a comunidade.");
      return;
    }

    const payload = { 
      username: currentUser.username, 
      content: postText, 
      mediaUrl: postMedia, 
      mediaType: postMediaType,
      role: currentUser.role // Enviado para o Back-end validar o Anti-Spam
    };

    try {
      const response = await fetch('/api/posts/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setPostText(""); setPostMedia(null); setPostMediaType(null);
        fetchPosts();
      } else {
        const errorData = await response.json();
        // 2. ANTI-SPAM: Trata o erro 429 ou erro de limite vindo do banco
        alert(errorData.error || "Erro ao publicar no banco de dados.");
      }
    } catch {
      alert("Falha crítica na conexão com o núcleo.");
    }
  };

  const filteredPosts = useMemo(() => {
    if (activeTab === 'tendencias') return posts.filter(p => p.likes > 10);
    if (activeTab === 'pesquisar' && searchQuery.trim() !== "") {
      return posts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.user.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return posts;
  }, [posts, activeTab, searchQuery]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 pt-4 px-2 lg:px-0">
      <div className="mb-4 text-left px-2">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
          Ativora<span className="text-sky-500 shadow-neon">Feed</span>
        </h1>
      </div>

      <nav className="sticky top-4 z-50 mb-6 bg-[#050B14]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-1.5 flex items-center justify-between shadow-2xl overflow-x-auto custom-scrollbar">
        <div className="flex items-center w-full min-w-max relative">
          <NavTab icon={<Compass size={16}/>} label="Explorar" active={activeTab === 'explorar'} onClick={() => { setActiveTab('explorar'); setSearchQuery(""); }} />
          <NavTab icon={<TrendingUp size={16}/>} label="Tendências" active={activeTab === 'tendencias'} onClick={() => { setActiveTab('tendencias'); setSearchQuery(""); }} />
          <NavTab icon={<Star size={16}/>} label="Destaque" active={activeTab === 'destaque'} onClick={() => { setActiveTab('destaque'); setSearchQuery(""); }} />
          <NavTab icon={<Search size={16}/>} label="Buscar" active={activeTab === 'pesquisar'} onClick={() => setActiveTab('pesquisar')} />
          <div className="mx-2 w-px h-6 bg-white/10 shrink-0" />
          <NavTab icon={<User size={16}/>} label="Perfil" active={activeTab === 'meu_perfil'} onClick={onViewProfile} />
        </div>
      </nav>

      <div className="space-y-6">
        {!isGuest && activeTab !== 'pesquisar' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-4 mx-2">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-black/40 overflow-hidden relative shrink-0 border border-white/10">
                {currentUser.avatar && <Image src={currentUser.avatar} alt="Me" fill className="object-cover" unoptimized />}
              </div>
              <div className="flex-1">
                <textarea 
                  value={postText} 
                  onChange={(e) => setPostText(e.target.value)} 
                  placeholder={`No que está pensando hoje, ${currentUser.username.split(' ')[0]}?`} 
                  className="w-full bg-transparent text-white font-medium text-base outline-none resize-none h-12 placeholder:text-white/30 pt-1" 
                />
              </div>
            </div>

            {postMedia && (
              <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                <button onClick={() => setPostMedia(null)} className="absolute top-2 right-2 z-10 bg-black/60 p-1.5 rounded-full text-white hover:bg-rose-500 transition-colors"><X size={16} /></button>
                {postMediaType === 'image' ? (
                  <Image src={postMedia} alt="Preview" width={800} height={500} unoptimized className="w-full h-auto max-h-125 object-cover" />
                ) : (
                  <video src={postMedia} controls className="w-full h-auto max-h-125 object-cover bg-black" />
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleMediaChange} className="hidden" accept="image/*,video/*" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/40 hover:text-sky-500 transition-colors rounded-xl hover:bg-white/5" title="Adicionar Foto">
                  <ImageIcon size={20} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/40 hover:text-sky-500 transition-colors rounded-xl hover:bg-white/5" title="Adicionar Vídeo">
                  <Video size={20} />
                </button>
              </div>
              <button onClick={handlePost} disabled={!postText.trim() && !postMedia} className="px-6 py-2 bg-sky-500 text-black font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg active:scale-95 disabled:opacity-50">Publicar</button>
            </div>
          </div>
        )}

        {filteredPosts.map((post) => <PostCard key={post.id} post={post} isGuest={isGuest} />)}
      </div>

      <button onClick={onOpenMessages} className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 p-4 bg-sky-500 text-black rounded-full shadow-2xl z-50 hover:scale-110 transition-transform active:scale-95">
        <MessageSquare size={24} fill="currentColor" />
      </button>
    </div>
  );
};

const NavTab = ({ icon, label, active, onClick }: NavTabProps) => (
  <button onClick={onClick} className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all z-10 ${active ? 'text-black' : 'text-white/50 hover:text-white'}`}>
    {active && <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-sky-500 rounded-2xl -z-10 shadow-neon" />}
    {icon} <span className="text-[10px] font-black uppercase tracking-widest leading-none">{label}</span>
  </button>
);

const PostCard = ({ post, isGuest }: { post: PostData, isGuest?: boolean }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'personal': return { color: 'text-amber-400', label: 'Personal Trainer', icon: <Shield size={12} fill="currentColor"/> };
      case 'nutri': return { color: 'text-emerald-400', label: 'Nutricionista', icon: <Activity size={12} /> };
      case 'influencer': return { color: 'text-purple-400', label: 'Influencer', icon: <Star size={12} fill="currentColor"/> };
      case 'estagiario': return { color: 'text-slate-400', label: 'Estagiário', icon: <Beaker size={12} /> };
      default: return { color: 'text-sky-500', label: 'Atleta', icon: <Verified size={12} /> };
    }
  };

  const badge = getRoleBadge(post.role || 'aluno');

  const handleInteraction = (type: string) => {
    if (isGuest) {
      alert(`Crie uma conta para ${type}!`);
      return;
    }
    if (type === 'curtir') setLiked(!liked);
    if (type === 'salvar') setSaved(!saved);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-transparent border-b border-white/10 pb-6 space-y-4 text-left mx-2">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full p-0.5 relative overflow-hidden ${post.role !== 'aluno' ? 'bg-linear-to-tr from-sky-500 to-purple-500' : 'bg-white/5'}`}>
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center relative overflow-hidden">
            {post.avatar ? (
              <Image src={post.avatar} alt={post.user} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-white font-black text-xs">{post.user[0]}</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-base">{post.user}</span>
            <span className={badge.color}>{badge.icon}</span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-tighter italic ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>
      <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
      {post.mediaUrl && (
        <div className="mt-4 rounded-3xl overflow-hidden border border-white/10 bg-black/40">
          {post.mediaType === 'image' ? (
            <Image src={post.mediaUrl} alt="Post" width={800} height={500} unoptimized className="w-full h-auto max-h-125 object-cover" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full h-auto max-h-125 object-cover bg-black" />
          )}
        </div>
      )}
      <div className="flex items-center gap-8 pt-2">
        <button onClick={() => handleInteraction('curtir')} className={`flex items-center gap-2 transition-colors ${liked ? 'text-rose-500' : 'text-white/40 hover:text-rose-500'}`}>
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
          <span className="text-sm font-bold">{liked ? post.likes + 1 : post.likes}</span>
        </button>
        <button onClick={() => handleInteraction('comentar')} className="text-white/40 hover:text-sky-500 transition-colors"><MessageSquare size={20} /></button>
        <button onClick={() => handleInteraction('compartilhar')} className="text-white/40 hover:text-sky-500 transition-colors"><Share2 size={20} /></button>
        <button onClick={() => handleInteraction('salvar')} className={`ml-auto transition-colors ${saved ? 'text-sky-500' : 'text-white/40 hover:text-sky-500'}`}>
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </motion.div>
  );
};