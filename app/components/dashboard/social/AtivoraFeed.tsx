"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageSquare, Verified, 
  User, Compass, TrendingUp, X, ImageIcon, Video as VideoIcon, Bookmark,
  ArrowLeft, Plus, Trophy, Flame,
  Bell, Loader2, History, BarChart2, ShieldCheck, Send
} from "lucide-react";
import Image from "next/image";

// --- DEFINIÇÕES DE TIPO E INTERFACES ---
type FeedTab = 'explorar' | 'tendencias' | 'destaque' | 'meu_perfil' | 'pesquisar' | 'ranking' | 'tribunal' | 'salvos';

interface UserProfileWithXP {
  username: string;
  avatar?: string | null;
  role?: 'aluno' | 'personal' | 'nutri' | 'estagiario' | 'influencer';
  xp?: number;
  nivel?: number;
  streak?: number;
  is_verified?: boolean;
}

interface PostData {
  id: number;
  user: string;
  avatar: string | null;
  content: string;
  likes: number;
  hasLiked?: boolean; 
  isSaved?: boolean;
  role?: 'aluno' | 'personal' | 'nutri' | 'estagiario' | 'influencer';
  is_verified?: boolean;
  category: 'normal' | 'tendencia' | 'destaque';
  mediaUrl?: string | null;
  mediaUrlBefore?: string | null;
  mediaType?: 'image' | 'video' | null;
  streak?: number;
  enquete_pergunta?: string | null;
  enquete_op1?: string | null;
  enquete_op2?: string | null;
  votos_op1?: number;
  votos_op2?: number;
  voto_usuario?: number | null;
  comentarios_count?: number;
}

interface CommentData {
  id: number;
  nickname: string;
  avatar_url: string | null;
  conteudo: string;
  created_at: string;
}

interface XPGainItem {
  id: number;
  amount: number;
}

interface AtivoraFeedProps {
  currentUser: UserProfileWithXP;
  onViewProfile: () => void;
  onOpenUserProfile: (n: string) => void;
  onBack?: () => void;
  isGuest?: boolean;
}

// --- SUB-COMPONENTES (ORDEM DE SEGURANÇA TS) ---

const XPGainAlert = ({ amount, onComplete }: { amount: number; onComplete: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.3 }}
    animate={{ opacity: 1, y: -150, scale: 1.5 }}
    exit={{ opacity: 0, scale: 2 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    onAnimationComplete={onComplete}
    className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-999 pointer-events-none"
  >
    <div className="flex flex-col items-center">
      <div className="bg-sky-500 text-black font-black px-6 py-2 rounded-full shadow-[0_0_40px_rgba(14,165,233,0.6)] flex items-center gap-2 border-2 border-white/20">
        <Plus size={18} strokeWidth={4} />
        <span className="text-2xl italic uppercase tracking-tighter">{amount} XP</span>
      </div>
      <span className="text-[10px] text-sky-400 font-black uppercase mt-3 tracking-[0.4em] drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]">
        Protocolo Sincronizado
      </span>
    </div>
  </motion.div>
);

const PollCard = ({ post, onVote, isGuest }: { post: PostData; onVote: (opt: number) => void; isGuest?: boolean }) => {
  const v1 = post.votos_op1 || 0;
  const v2 = post.votos_op2 || 0;
  const total = v1 + v2;
  const perc1 = total > 0 ? Math.round((v1 / total) * 100) : 0;
  const perc2 = total > 0 ? Math.round((v2 / total) * 100) : 0;
  const jaVotou = post.voto_usuario !== null;

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 my-2">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 size={14} className="text-sky-500" />
        <h4 className="text-sm font-bold text-white italic">{post.enquete_pergunta}</h4>
      </div>
      <div className="space-y-2">
        {[1, 2].map((opt) => {
          const label = opt === 1 ? post.enquete_op1 : post.enquete_op2;
          const perc = opt === 1 ? perc1 : perc2;
          const isVoted = post.voto_usuario === opt;
          return (
            <button
              key={opt}
              disabled={jaVotou || isGuest}
              onClick={() => onVote(opt)}
              className={`relative w-full h-11 rounded-xl bg-black/40 overflow-hidden border transition-all ${isVoted ? 'border-sky-500/50' : 'border-white/5'}`}
            >
              {jaVotou && (
                <motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} className={`absolute inset-y-0 left-0 ${isVoted ? 'bg-sky-500/20' : 'bg-white/5'}`} />
              )}
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className={`text-xs font-bold ${isVoted ? 'text-sky-400' : 'text-white/70'}`}>{label}</span>
                {jaVotou && <span className="text-[10px] font-black text-white/40">{perc}%</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TransformationCard = ({ before, after }: { before: string; after: string }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-ew-resize select-none border border-white/10"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <Image src={after} alt="Depois" fill className="object-cover" unoptimized />
      <div className="absolute inset-0 z-10" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
        <Image src={before} alt="Antes" fill className="object-cover" unoptimized />
      </div>
      <div className="absolute inset-y-0 z-20 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-sky-500">
          <div className="flex gap-0.5"><div className="w-0.5 h-3 bg-sky-500" /><div className="w-0.5 h-3 bg-sky-500" /></div>
        </div>
      </div>
    </div>
  );
};

const NavTab = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${active ? 'text-black font-black' : 'text-white/40'}`}>
    {active && <motion.div layoutId="activeTabPill" className="absolute inset-0 bg-sky-500 rounded-2xl -z-10 shadow-neon" />}
    {icon} <span className="text-[9px] uppercase tracking-widest hidden sm:block">{label}</span>
  </button>
);

const PostCard = ({ post, currentUser, onOpenProfile, onVote, onXPGain, onOpenComments, isGuest }: { post: PostData; currentUser: UserProfileWithXP; onOpenProfile: (n: string) => void; onVote: any; onXPGain: any; onOpenComments: (id: number) => void; isGuest?: boolean }) => {
  const [liked, setLiked] = useState(post.hasLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = async () => {
    if (isGuest) return;
    const res = await fetch('/api/posts/curtir', { method: 'POST', body: JSON.stringify({ postId: post.id, username: currentUser.username }) });
    if (res.ok) {
      const data = await res.json();
      if (data.liked) onXPGain(2);
      setLiked(data.liked); 
      setLikesCount((prev: number) => data.liked ? prev + 1 : prev - 1);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 pb-6 pt-4 text-left">
      <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => onOpenProfile(post.user)}>
        <div className="w-10 h-10 rounded-full bg-white/5 relative overflow-hidden border border-white/5">
           {post.avatar ? <Image src={post.avatar} alt={post.user} fill className="object-cover" unoptimized /> : <span className="absolute inset-0 flex items-center justify-center text-xs font-black">{post.user[0]}</span>}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-white text-sm">@{post.user}</span>
            {post.is_verified && <ShieldCheck size={14} className="text-sky-500" />}
            {(post.streak ?? 0) > 0 && <Flame size={12} className="text-orange-500" />}
          </div>
          <span className={`text-[7px] font-black uppercase italic text-sky-500`}>{post.role || 'Atleta'}</span>
        </div>
      </div>

      <div className="text-white/90 text-sm leading-relaxed mb-4">{post.content}</div>

      {post.enquete_pergunta && <PollCard post={post} onVote={(opt) => onVote(post.id, opt)} isGuest={isGuest} />}

      {post.mediaUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40">
          {post.mediaUrlBefore ? (
            <TransformationCard before={post.mediaUrlBefore} after={post.mediaUrl} />
          ) : post.mediaType === 'video' ? (
            <video src={post.mediaUrl} controls className="w-full h-auto max-h-[70vh] bg-black" />
          ) : (
            <Image src={post.mediaUrl} alt="Post" width={800} height={500} unoptimized className="w-full h-auto max-h-[70vh] object-cover" />
          )}
        </div>
      )}

      <div className="flex items-center gap-6 mt-4">
        <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-rose-500' : 'text-white/30'}`}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          <span className="text-xs font-bold">{likesCount}</span>
        </button>
        <button onClick={() => onOpenComments(post.id)} className="flex items-center gap-1.5 text-white/30 hover:text-sky-500 transition-colors">
          <MessageSquare size={18} />
          <span className="text-xs font-bold">{post.comentarios_count || 0}</span>
        </button>
        <button className="text-white/20"><Bookmark size={18} /></button>
      </div>
    </motion.div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export function AtivoraFeed(props: AtivoraFeedProps) {
  const { currentUser, onViewProfile, onOpenUserProfile, onBack, isGuest } = props;

  const [activeTab, setActiveTab] = useState<FeedTab>('explorar');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [xpQueue, setXpQueue] = useState<XPGainItem[]>([]);

  // Estados dos Comentários (M17)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [commentsList, setCommentsList] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const triggerXP = (amount: number) => {
    const id = Date.now();
    setXpQueue((prevQueue: XPGainItem[]) => [...prevQueue, { id, amount }]);
  };

  const [postText, setPostText] = useState("");
  const [isTransformationMode, setIsTransformationMode] = useState(false);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollData, setPollData] = useState({ question: '', op1: '', op2: '' });
  const [postMedia, setPostMedia] = useState<string | null>(null);
  const [postMediaType, setPostMediaType] = useState<'image' | 'video' | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postMediaBefore, setPostMediaBefore] = useState<string | null>(null);
  const [postFileBefore, setPostFileBefore] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileBeforeInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (pageNum: number = 1, shouldAppend: boolean = false) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'salvos' 
        ? `/api/posts/listar_salvos?nickname=${currentUser.username}&page=${pageNum}` 
        : `/api/posts/listar?page=${pageNum}&currentUser=${currentUser.username}`;

      const resPosts = await fetch(endpoint);
      if (resPosts.ok) {
        const data = await resPosts.json();
        const formatted: PostData[] = data.map((p: any) => ({
          ...p,
          user: p.nickname,
          content: p.content || p.conteudo || "",
          hasLiked: p.has_liked || false,
          isSaved: p.is_saved || false,
          mediaUrl: p.media_url,
          mediaUrlBefore: p.media_url_before,
          mediaType: p.media_type || 'image',
          category: 'normal',
          comentarios_count: p.comentarios_count || 0
        }));
        if (data.length < 10) setHasMore(false);
        setPosts((prevPosts: PostData[]) => shouldAppend ? [...prevPosts, ...formatted] : formatted);
      }
    } finally { 
      setLoading(false); 
    }
  }, [currentUser.username, activeTab]);

  useEffect(() => {
    setPosts([]); setPage(1); setHasMore(true);
    fetchData(1, false);
  }, [activeTab, fetchData]);

  // Lógica de Comentários (M17)
  const fetchComments = async (postId: number) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/comentarios/listar?postId=${postId}`);
      if (res.ok) setCommentsList(await res.json());
    } finally { setLoadingComments(false); }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !activeCommentsPostId) return;
    try {
      const res = await fetch('/api/posts/comentarios/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: activeCommentsPostId, nickname: currentUser.username, conteudo: commentText })
      });
      if (res.ok) {
        triggerXP(3); // Dopamina por comentar
        setCommentText("");
        fetchComments(activeCommentsPostId);
      }
    } catch {}
  };

  const handlePost = async () => {
    if (!postText.trim() && !postFile && !isPollMode) return;
    setIsPosting(true);
    try {
      let finalUrl = null; let finalBeforeUrl = null;
      if (postFile) {
        const f = new FormData(); f.append("file", postFile);
        const r = await fetch('/api/upload', { method: 'POST', body: f });
        finalUrl = (await r.json()).url;
      }
      if (isTransformationMode && postFileBefore) {
        const f2 = new FormData(); f2.append("file", postFileBefore);
        const r2 = await fetch('/api/upload', { method: 'POST', body: f2 });
        finalBeforeUrl = (await r2.json()).url;
      }
      const response = await fetch('/api/posts/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nickname: currentUser.username, content: postText, 
          media_url: finalUrl, media_url_before: finalBeforeUrl,
          media_type: postMediaType || 'image', role: currentUser.role,
          enquete_pergunta: isPollMode ? pollData.question : null,
          enquete_op1: isPollMode ? pollData.op1 : null,
          enquete_op2: isPollMode ? pollData.op2 : null,
        }),
      });
      if (response.ok) {
        triggerXP(isTransformationMode ? 50 : 10);
        setPostText(""); setPostMedia(null); setPostFile(null); setPostMediaBefore(null); setPostFileBefore(null); 
        setIsTransformationMode(false); setIsPollMode(false); setPollData({question:'', op1:'', op2:''});
        fetchData(1, false);
      }
    } finally { setIsPosting(false); }
  };

  const handleVote = async (postId: number, opcao: number) => {
    const res = await fetch('/api/social/enquetes/votar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, nickname: currentUser.username, opcao })
    });
    if (res.ok) {
      triggerXP(5);
      setPosts((prevPosts: PostData[]) => prevPosts.map(p => p.id === postId ? {
        ...p,
        voto_usuario: opcao,
        votos_op1: opcao === 1 ? (p.votos_op1 || 0) + 1 : p.votos_op1,
        votos_op2: opcao === 2 ? (p.votos_op2 || 0) + 1 : p.votos_op2
      } : p));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-28 pt-2 px-0 bg-[#010307] min-h-screen text-left relative overflow-x-hidden">
      <AnimatePresence>
        {xpQueue.map((xp) => (
          <XPGainAlert key={xp.id} amount={xp.amount} onComplete={() => setXpQueue((q: XPGainItem[]) => q.filter((i) => i.id !== xp.id))} />
        ))}
      </AnimatePresence>

      {/* MODAL DE COMENTÁRIOS (M17) */}
      <AnimatePresence>
        {activeCommentsPostId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveCommentsPostId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-[#050B14] z-[101] rounded-t-[32px] border-t border-white/10 flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2">Protocolo de Voz</h3>
                <button onClick={() => setActiveCommentsPostId(null)} className="p-2 text-white/20 hover:text-white"><X size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {loadingComments ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-sky-500" /></div>
                ) : commentsList.length > 0 ? (
                  commentsList.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-white/5 relative overflow-hidden border border-white/10 shrink-0">
                         {c.avatar_url && <Image src={c.avatar_url} alt={c.nickname} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black text-sky-500 uppercase tracking-tighter">@{c.nickname}</span>
                        <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none">{c.conteudo}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-20 italic text-sm">Nenhum registro de voz ainda...</div>
                )}
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2 items-center">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} placeholder="Digite sua frequência..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white outline-none focus:border-sky-500/50 transition-all" />
                <button onClick={handleSendComment} className="p-3 bg-sky-500 text-black rounded-full active:scale-90 transition-all"><Send size={18} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-50 bg-[#010307]/80 backdrop-blur-md mb-2 flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="p-2 -ml-2 text-white/50"><ArrowLeft size={20} /></button>}
          <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">Ativora<span className="text-sky-500 shadow-neon">Feed</span></h1>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onViewProfile} className="p-2 text-white/40 hover:text-sky-500 transition-colors"><User size={22} /></button>
        </div>
      </div>

      {!isGuest && ['explorar', 'tendencias'].includes(activeTab) && (
        <div className="bg-white/5 border-y sm:border border-white/10 sm:rounded-3xl p-4 sm:p-5 flex flex-col gap-4 mx-0 sm:mx-4 mb-6 shadow-xl relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Novo Registro</span>
            <div className="flex gap-2">
              <button onClick={() => { setIsTransformationMode(!isTransformationMode); setIsPollMode(false); }} className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border transition-all ${isTransformationMode ? 'bg-sky-500 text-black border-sky-500 shadow-neon' : 'bg-white/5 text-white/40 border-white/10'}`}>
                {isTransformationMode ? '🚀 Evolução' : '✨ Evolução?'}
              </button>
              <button onClick={() => { setIsPollMode(!isPollMode); setIsTransformationMode(false); }} className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border transition-all ${isPollMode ? 'bg-purple-500 text-white border-purple-500' : 'bg-white/5 text-white/40 border-white/10'}`}>
                📊 Enquete
              </button>
            </div>
          </div>

          {!isPollMode ? (
            <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="O que está focando hoje?" className="w-full bg-transparent text-white font-medium text-sm sm:text-base outline-none h-12 pt-2" />
          ) : (
            <div className="space-y-2 mt-2">
               <input type="text" placeholder="Pergunta da enquete..." value={pollData.question} onChange={e => setPollData({...pollData, question: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
               <div className="flex gap-2">
                 <input type="text" placeholder="Opção 1" value={pollData.op1} onChange={e => setPollData({...pollData, op1: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
                 <input type="text" placeholder="Opção 2" value={pollData.op2} onChange={e => setPollData({...pollData, op2: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" />
               </div>
            </div>
          )}

          {postMedia && (
             <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 mt-2">
               {postMediaType === 'video' ? <video src={postMedia} className="w-full h-full object-cover" /> : <Image src={postMedia} alt="Preview" fill className="object-cover" unoptimized />}
               <button onClick={() => { setPostMedia(null); setPostFile(null); }} className="absolute top-1 right-1 bg-black/60 rounded-full p-1"><X size={12} /></button>
             </div>
          )}

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex gap-1">
              <input type="file" ref={fileInputRef} onChange={(e) => { 
                const file = e.target.files?.[0]; 
                if(file){ setPostFile(file); setPostMediaType(file.type.startsWith('video/') ? 'video' : 'image'); const r = new FileReader(); r.onloadend = () => setPostMedia(r.result as string); r.readAsDataURL(file); } 
              }} className="hidden" accept="image/*,video/*" />
              <input type="file" ref={fileBeforeInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file){ setPostFileBefore(file); const r = new FileReader(); r.onloadend = () => setPostMediaBefore(r.result as string); r.readAsDataURL(file); } }} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/30 hover:text-sky-500"><ImageIcon size={20}/></button>
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/30 hover:text-sky-500"><VideoIcon size={20}/></button>
              {isTransformationMode && <button onClick={() => fileBeforeInputRef.current?.click()} className="p-2 text-amber-500/50 hover:text-amber-500"><History size={20}/></button>}
            </div>
            <button onClick={handlePost} disabled={isPosting} className="px-8 py-2 bg-sky-500 text-black font-black uppercase text-[10px] rounded-full active:scale-95 flex items-center gap-2">
              {isPosting ? <Loader2 size={14} className="animate-spin" /> : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      <nav className="sticky top-14 z-40 mb-6 bg-[#050B14]/90 backdrop-blur-xl border-y sm:border border-white/5 sm:rounded-3xl p-1.5 flex items-center shadow-2xl overflow-x-auto no-scrollbar mx-0 sm:mx-4">
        <NavTab icon={<Compass size={16}/>} label="Explorar" active={activeTab === 'explorar'} onClick={() => setActiveTab('explorar')} />
        <NavTab icon={<TrendingUp size={16}/>} label="Vibes" active={activeTab === 'tendencias'} onClick={() => setActiveTab('tendencias')} />
        <NavTab icon={<Bookmark size={16}/>} label="Salvos" active={activeTab === 'salvos'} onClick={() => setActiveTab('salvos')} />
        <NavTab icon={<Trophy size={16}/>} label="Matriz" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
      </nav>

      <div className="space-y-4 px-4 pb-20">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            currentUser={currentUser} 
            onOpenProfile={onOpenUserProfile} 
            onVote={handleVote} 
            onXPGain={triggerXP} 
            onOpenComments={(id) => { setActiveCommentsPostId(id); fetchComments(id); }}
            isGuest={isGuest} 
          />
        ))}
      </div>
    </div>
  );
}