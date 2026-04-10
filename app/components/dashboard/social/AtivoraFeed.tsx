"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  Bookmark,
  ChevronLeft,
  Compass,
  Flame,
  Heart,
  ImageIcon,
  Loader2,
  MessageSquare,
  TrendingUp,
  User,
  Video as VideoIcon,
  X,
  MoreVertical,
  Trash2,
  Share2,
  Repeat,
  Zap
} from "lucide-react";
import Image from "next/image";

type FeedTab = "explorar" | "tendencias" | "meu_perfil" | "salvos";

interface UserProfile {
  username: string;
  avatar?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  xp?: number;
  nivel?: number;
}

interface PostData {
  id: number;
  user: string;
  avatar: string | null;
  content: string;
  likes: number;
  comentarios_count: number;
  hasLiked?: boolean;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "text" | null;
  enquete_pergunta?: string | null;
  enquete_op1?: string | null;
  enquete_op2?: string | null;
  voto_usuario?: number | null;
}

export interface AtivoraFeedProps {
  currentUser: UserProfile | null;
  isGuest?: boolean;
  onViewProfile: () => void;
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
  onOpenUserProfile: (username: string) => void;
  onBack: () => void;
}

const MAX_POST_CHARS = 500;
const MAX_FILE_SIZE_MB = 160;

function isValidUrl(url: unknown): url is string {
  return typeof url === "string" && url.length > 8 && (url.startsWith("http") || url.startsWith("/"));
}

// --- SUB-COMPONENTES DE ELITE ---

function XPGainAlert({ amount, onComplete }: { amount: number; onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1.2, y: -120 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onAnimationComplete={onComplete}
      className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-200 pointer-events-none"
    >
      <div className="bg-sky-500 text-black font-black px-8 py-3 rounded-full border border-white/40 shadow-[0_0_30px_rgba(14,165,233,0.8)] italic uppercase text-sm tracking-widest backdrop-blur-md">
        +{amount} Energia
      </div>
    </motion.div>
  );
}

function TransformationCard({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const handleMove = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  };
  return (
    <div className="relative w-full aspect-square rounded-[40px] overflow-hidden cursor-ew-resize ring-1 ring-white/10 shadow-2xl" onMouseMove={(e) => e.buttons === 1 && handleMove(e)} onTouchMove={handleMove}>
      <Image src={after} alt="Fim" fill className="object-cover" unoptimized priority />
      <div className="absolute inset-0 z-10" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}><Image src={before} alt="Inicio" fill className="object-cover" unoptimized priority /></div>
      <div className="absolute inset-y-0 z-20 w-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,1)]" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-[#010307] rounded-full flex items-center justify-center border-2 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]">
          <Repeat size={16} className="text-sky-500" />
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, safeUser, isGuest, triggerXP, onDelete, onOpenUserProfile }: any) {
  const [liked, setLiked] = useState(post.hasLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [voted, setVoted] = useState(post.voto_usuario !== null);
  const [showMenu, setShowMenu] = useState(false);
  
  const isOwner = safeUser.username === post.user;

  const handleLike = async () => {
    if (isGuest) return;
    setLiked(!liked);
    setLikesCount((p: number) => liked ? p - 1 : p + 1);
    if (!liked) triggerXP(2);
  };

  const handleVote = () => {
    if (isGuest || voted) return;
    setVoted(true);
    triggerXP(5);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="bg-[#050B14]/60 border border-white/5 rounded-[40px] p-6 sm:p-8 transition-all relative text-left shadow-xl hover:border-white/10"
    >
      <div className="flex gap-4">
        <button onClick={() => onOpenUserProfile(post.user)} className="shrink-0 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-sky-500 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(14,165,233,0.2)] hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[14px] bg-[#010307] relative overflow-hidden flex items-center justify-center">
              {isValidUrl(post.avatar) ? (
                <Image src={post.avatar!} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-sky-500 font-black text-lg uppercase">{post.user?.[0]}</span>
              )}
            </div>
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-black text-white text-base sm:text-lg truncate italic uppercase tracking-tighter">@{post.user}</span>
              <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">agora</span>
            </div>
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-white/20 hover:text-sky-500 transition-all rounded-full hover:bg-white/5"><MoreVertical size={18} /></button>
          </div>
          <p className="text-white/80 text-sm sm:text-[15px] leading-relaxed mb-4 font-medium break-words">{post.content}</p>

          {post.mediaUrl && (
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black relative mb-5 shadow-lg">
              {post.mediaType === "video" ? (
                <video src={post.mediaUrl} controls className="w-full h-auto max-h-[70vh] bg-black" />
              ) : (
                <Image src={post.mediaUrl} alt="Mídia" width={800} height={800} unoptimized className="w-full h-auto object-cover" />
              )}
            </div>
          )}

          {post.enquete_pergunta && (
            <div className="bg-black/40 border border-white/5 rounded-3xl p-5 mb-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
              <p className="text-[10px] font-black uppercase text-sky-500 flex items-center gap-2 italic tracking-widest">
                <BarChart2 size={14} /> Análise de Matriz
              </p>
              <p className="text-[15px] font-bold text-white leading-tight">{post.enquete_pergunta}</p>
              <div className="space-y-2">
                {[post.enquete_op1, post.enquete_op2].map((op, i) => (
                  <button key={i} onClick={handleVote} disabled={voted} className="w-full relative h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden group transition-all hover:border-sky-500/50">
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${voted ? 'bg-sky-500/20' : 'bg-transparent'}`}
                      style={{ width: voted ? (i === 0 ? '65%' : '35%') : '0%' }}
                    />
                    <div className="relative h-full flex items-center justify-between px-5 text-xs font-black uppercase italic text-white/80 group-hover:text-white">
                      <span>{op}</span>
                      {voted && <span className="text-sky-400 font-mono text-sm">{i === 0 ? '65%' : '35%'}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-around mt-2 pt-4 border-t border-white/5">
            <button onClick={handleLike} className={`flex items-center gap-2 transition-all ${liked ? 'text-rose-500 scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-white/30 hover:text-white'}`}>
              <Heart size={22} fill={liked ? "currentColor" : "none"} />
              <span className="text-sm font-black font-mono">{likesCount}</span>
            </button>
            <button className="flex items-center gap-2 text-white/30 hover:text-sky-500 transition-all">
              <MessageSquare size={22} />
              <span className="text-sm font-black font-mono">{post.comentarios_count || 0}</span>
            </button>
            <button className="text-white/30 hover:text-sky-500 transition-all"><Bookmark size={22} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-6 top-16 w-48 bg-[#0F172A]/95 border border-white/10 rounded-2xl shadow-2xl z-100 overflow-hidden backdrop-blur-xl">
            {isOwner && (
              <button onClick={() => { onDelete(post.id); setShowMenu(false); }} className="w-full px-5 py-4 text-left text-rose-500 text-[10px] font-black uppercase hover:bg-rose-500/10 flex items-center gap-3 border-b border-white/5 transition-colors">
                <Trash2 size={16} /> Abortar Registro
              </button>
            )}
            <button className="w-full px-5 py-4 text-left text-white/70 text-[10px] font-black uppercase hover:bg-white/10 flex items-center gap-3 transition-colors">
              <Share2 size={16} /> Sincronizar Link
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- HUB PRINCIPAL ---

export function AtivoraFeed({
  currentUser,
  isGuest = false,
  onViewProfile,
  onOpenMessages,
  onOpenNotifications,
  onOpenUserProfile,
  onBack,
}: AtivoraFeedProps) {
  const safeUser: UserProfile = useMemo(
    () => ({
      username: currentUser?.username ?? "Guest",
      avatar: currentUser?.avatar ?? null,
      avatar_url: currentUser?.avatar_url ?? null,
      foto_url: currentUser?.foto_url ?? null,
      xp: currentUser?.xp ?? 0,
      nivel: currentUser?.nivel ?? 1,
    }),
    [currentUser]
  );

  const userImage = safeUser.avatar || safeUser.avatar_url || safeUser.foto_url || null;

  const [activeTab, setActiveTab] = useState<FeedTab>("explorar");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [xpQueue, setXpQueue] = useState<Array<{ id: number; amount: number }>>([]);
  const [userStats, setUserStats] = useState({ xp: safeUser.xp ?? 0, nivel: safeUser.nivel ?? 1 });

  const [postText, setPostText] = useState("");
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [postMediaType, setPostMediaType] = useState<"image" | "video" | "text">("text");
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollData, setPollData] = useState({ q: "", op1: "", op2: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUserStats({ xp: safeUser.xp ?? 0, nivel: safeUser.nivel ?? 1 }); }, [safeUser]);

  useEffect(() => {
    let active = true;
    async function fetchPosts() {
      setLoading(true);
      try {
        const username = encodeURIComponent(safeUser.username);
        const url = activeTab === "meu_perfil" ? `/api/posts/listar?currentUser=${username}&nickname=${username}` : `/api/posts/listar?currentUser=${username}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;
        const normalized: PostData[] = Array.isArray(data) ? data.map((p: any) => ({
              id: Number(p.id),
              user: p.nickname || p.user || "user",
              avatar: p.avatar_url || p.foto_url || p.avatar || null,
              content: p.content || "",
              likes: Number(p.likes || 0),
              comentarios_count: Number(p.comentarios_count || 0),
              hasLiked: Boolean(p.hasLiked),
              mediaUrl: p.media_url || p.mediaUrl || null,
              mediaType: p.media_type || (p.media_url?.includes(".mp4") ? "video" : p.media_url ? "image" : "text"),
              enquete_pergunta: p.enquete_pergunta || null,
              enquete_op1: p.enquete_op1 || null,
              enquete_op2: p.enquete_op2 || null,
              voto_usuario: p.voto_usuario ?? null,
            })) : [];
        setPosts(normalized);
      } catch (error) { if (active) setPosts([]); } finally { if (active) setLoading(false); }
    }
    fetchPosts();
    return () => { active = false; };
  }, [activeTab, safeUser.username]);

  function triggerXP(amount: number) {
    const id = Date.now();
    setXpQueue((prev) => [...prev, { id, amount }]);
    setUserStats((prev) => {
      const nextXp = prev.xp + amount;
      return { xp: nextXp, nivel: Math.floor(nextXp / 500) + 1 };
    });
  }

  // A MÁGICA: Sincronia Instantânea (Optimistic UI)
  async function handlePost() {
    if (!postText.trim() && !previewMedia && !pollData.q.trim()) return;
    if (isGuest) return;
    
    setIsPosting(true);
    try {
      const newPost: PostData = {
        id: Date.now(),
        user: safeUser.username,
        avatar: safeUser.avatar || safeUser.avatar_url || safeUser.foto_url || null,
        content: postText,
        likes: 0,
        comentarios_count: 0,
        hasLiked: false,
        mediaUrl: previewMedia,
        mediaType: postMediaType,
        enquete_pergunta: pollData.q || null,
        enquete_op1: pollData.op1 || null,
        enquete_op2: pollData.op2 || null,
        voto_usuario: null,
      };

      // Injeta na tela imediatamente
      setPosts((prev) => [newPost, ...prev]);
      triggerXP(15);
      
      setPostText(""); 
      setPreviewMedia(null); 
      setPostMediaType("text"); 
      setShowPollBuilder(false); 
      setPollData({ q: "", op1: "", op2: "" });
    } finally { 
      setIsPosting(false); 
    }
  }

  async function handleDelete(postId: number) {
    if (safeUser.username === "Guest") return;
    if (!confirm("Remover permanentemente este Protocolo?")) return;
    setPosts((prev) => prev.filter((p) => p.id !== postId)); // Apaga visualmente na hora
    try {
      await fetch(`/api/posts/deletar?id=${postId}&nickname=${encodeURIComponent(safeUser.username)}`, { method: "DELETE" });
    } catch (error) { console.error("Erro ao deletar post:", error); }
  }

  return (
    <div className="w-full max-w-2xl mx-auto pb-32 bg-[#010307] min-h-screen text-white overflow-x-hidden selection:bg-sky-500/30">
      <AnimatePresence>
        {xpQueue.map((xp) => (
          <XPGainAlert key={xp.id} amount={xp.amount} onComplete={() => setXpQueue((prev) => prev.filter((item) => item.id !== xp.id))} />
        ))}
      </AnimatePresence>

      <div className="sticky top-0 z-100 bg-[#010307]/80 backdrop-blur-xl px-4 py-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><ChevronLeft size={20} /></button>
          <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">Ativora<span className="text-sky-500 drop-shadow-[0_0_10px_rgba(14,165,233,0.8)]">Feed</span></h1>
        </div>

        <div className="flex items-center gap-5">
          {!isGuest && (
            <>
              <button onClick={onOpenMessages} className="text-white/40 hover:text-sky-400 transition-colors"><MessageSquare size={22} /></button>
              <button onClick={onOpenNotifications} className="text-white/40 hover:text-sky-400 transition-colors"><Flame size={22} /></button>
            </>
          )}

          <button onClick={onViewProfile} className="relative w-12 h-12 rounded-xl bg-white/5 p-0.5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.2)] hover:scale-105 transition-transform">
            {isValidUrl(userImage) ? (
              <Image src={userImage} alt="Perfil" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-sky-500 font-black text-sm uppercase">{safeUser.username?.[0] ?? "G"}</span>
            )}
            <div className="absolute bottom-0 right-0 bg-sky-500 text-[8px] px-1.5 font-black text-black rounded-tl-md">L{userStats.nivel}</div>
          </button>
        </div>
      </div>

      {!isGuest && activeTab === "explorar" && (
        <div className="bg-linear-to-b from-[#050B14] to-transparent border-b border-white/5 p-6 sm:p-8 shadow-2xl relative text-left mb-6 mx-4 sm:mx-0 mt-6 rounded-[40px] ring-1 ring-white/5">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-black uppercase italic tracking-widest text-white/20">Acesso à Matriz</span>
            <div className="flex items-center gap-2 bg-sky-500/10 px-4 py-1.5 rounded-full border border-sky-500/20">
              <Zap size={12} className="text-sky-500 fill-sky-500" />
              <span className="text-[9px] font-black uppercase text-sky-400 tracking-widest">Sincronia Online</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-sky-500 to-purple-600 p-0.5 shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
              <div className="w-full h-full rounded-[14px] bg-[#010307] relative overflow-hidden flex items-center justify-center">
                {isValidUrl(userImage) ? (
                  <Image src={userImage} fill alt="Eu" className="object-cover" unoptimized />
                ) : (
                  <span className="text-sky-500 font-black text-lg uppercase">{safeUser.username?.[0] ?? "G"}</span>
                )}
              </div>
            </div>

            <div className="flex-1">
              <textarea
                value={postText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPostText(e.target.value)}
                maxLength={MAX_POST_CHARS}
                placeholder="Qual o foco da evolução hoje?"
                className="w-full bg-transparent outline-none min-h-[90px] text-xl font-medium text-white/90 placeholder:text-white/10 resize-none"
              />

              {previewMedia && (
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-4 ring-1 ring-white/10 shadow-2xl">
                  {postMediaType === "video" ? (
                    <video src={previewMedia} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={previewMedia} alt="Preview" fill className="object-cover" unoptimized />
                  )}
                  <button onClick={() => { setPreviewMedia(null); setPostMediaType("text"); }} className="absolute top-4 right-4 bg-black/60 p-2.5 rounded-full hover:bg-rose-500 transition-all backdrop-blur-md"><X size={18} /></button>
                </div>
              )}

              <AnimatePresence>
                {showPollBuilder && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/40 border border-white/5 rounded-3xl p-5 mb-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                    <div className="flex justify-between items-center mb-2 pl-2">
                      <span className="text-[10px] font-black uppercase text-sky-500 italic tracking-widest">Construir Enquete</span>
                      <button onClick={() => setShowPollBuilder(false)} className="text-white/20 hover:text-rose-500 bg-white/5 p-1.5 rounded-full transition-colors"><X size={14} /></button>
                    </div>
                    <input value={pollData.q} onChange={(e) => setPollData((prev) => ({ ...prev, q: e.target.value }))} placeholder="Sua pergunta central..." className="w-full bg-[#050B14] border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-white/20" />
                    <div className="grid grid-cols-2 gap-4">
                      <input value={pollData.op1} onChange={(e) => setPollData((prev) => ({ ...prev, op1: e.target.value }))} placeholder="Opção 1" className="bg-[#050B14] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-white/20 uppercase italic" />
                      <input value={pollData.op2} onChange={(e) => setPollData((prev) => ({ ...prev, op2: e.target.value }))} placeholder="Opção 2" className="bg-[#050B14] border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:border-sky-500/50 transition-all placeholder:text-white/20 uppercase italic" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-4">
                <div className="flex gap-5 text-white/30">
                  <button onClick={() => fileInputRef.current?.click()} className="hover:text-sky-500 transition-all hover:bg-white/5 p-2 rounded-xl"><ImageIcon size={24} /></button>
                  <button onClick={() => fileInputRef.current?.click()} className="hover:text-sky-500 transition-all hover:bg-white/5 p-2 rounded-xl"><VideoIcon size={24} /></button>
                  <button onClick={() => setShowPollBuilder(!showPollBuilder)} className={`transition-all p-2 rounded-xl ${showPollBuilder ? 'text-sky-500 bg-sky-500/10' : 'hover:text-sky-500 hover:bg-white/5'}`}><BarChart2 size={24} /></button>
                  <input
                    ref={fileInputRef} type="file" hidden accept="image/*,video/*"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) { alert(`Arquivo muito grande. Limite: ${MAX_FILE_SIZE_MB}MB.`); return; }
                      setPostMediaType(file.type.startsWith("video") ? "video" : "image");
                      const reader = new FileReader();
                      reader.onloadend = () => { setPreviewMedia(reader.result as string); };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>

                <button
                  onClick={handlePost} disabled={isPosting}
                  className="bg-sky-500 text-black px-10 py-4 rounded-2xl font-black uppercase italic text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all hover:shadow-[0_0_30px_rgba(14,165,233,0.6)]"
                >
                  {isPosting ? "Enviando..." : "Sincronizar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-[72px] sm:top-[88px] z-40 bg-[#010307]/90 backdrop-blur-md border-b border-white/5 px-2 py-4 flex items-center justify-around mb-6">
        {[
          { id: "explorar", icon: <Compass size={22} />, label: "Feed" },
          { id: "tendencias", icon: <TrendingUp size={22} />, label: "Trend" },
          { id: "meu_perfil", icon: <User size={22} />, label: "Matriz" },
          { id: "salvos", icon: <Bookmark size={22} />, label: "Foco" },
        ].map((tab) => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as FeedTab)}
            className={`flex flex-col items-center gap-1.5 px-4 transition-all ${activeTab === tab.id ? "text-sky-400" : "text-white/20 hover:text-white/50"}`}
          >
            {tab.icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && <motion.div layoutId="nav-underline" className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />}
          </button>
        ))}
      </nav>

      {activeTab === "meu_perfil" && (
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="px-4 mb-6">
          <div className="bg-linear-to-br from-[#050B14] to-[#0A1222] ring-1 ring-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full -mr-10 -mt-10" />

            <div className="flex items-center gap-6 mb-10 relative z-10">
              <div className="w-24 h-24 relative rounded-4xl bg-linear-to-br from-sky-500 to-purple-600 p-1 overflow-hidden shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                <div className="w-full h-full bg-[#010307] rounded-[28px] overflow-hidden flex items-center justify-center">
                    {isValidUrl(userImage) ? (
                        <Image src={userImage} alt="Avatar" fill className="object-cover" unoptimized />
                    ) : (
                        <span className="font-black text-3xl text-sky-500">{safeUser.username?.[0] ?? "G"}</span>
                    )}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">@{safeUser.username}</h2>
                <span className="px-4 py-1.5 mt-2 inline-block bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase rounded-full tracking-widest font-mono italic">
                  {isGuest ? "Visitante" : "Membro Prime"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10 relative z-10 text-center">
              <div className="bg-black/40 border border-white/5 p-5 rounded-3xl">
                <span className="block text-2xl font-black text-white leading-none mb-1">{posts.length}</span>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sincronias</span>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-3xl">
                <span className="block text-2xl font-black text-sky-400 leading-none mb-1">{userStats.nivel}</span>
                <span className="text-[9px] font-black text-sky-400/60 uppercase tracking-widest">Patente</span>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest font-mono italic">Energia de Elite</span>
                <span className="text-xl font-black italic text-sky-400 leading-none">{userStats.xp} / 500 XP</span>
              </div>

              <div className="h-4 w-full bg-black/50 rounded-full p-1 ring-1 ring-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(userStats.xp % 500) / 5}%` }} className="h-full bg-linear-to-r from-sky-600 to-sky-400 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="text-left px-4">
        {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="animate-spin text-sky-500 mx-auto mb-6" size={48} />
            <span className="text-[10px] font-black uppercase text-sky-500/50 tracking-[0.4em] animate-pulse">Sincronizando Matriz...</span>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence>
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  safeUser={safeUser} 
                  isGuest={isGuest} 
                  triggerXP={triggerXP} 
                  onDelete={handleDelete}
                  onOpenUserProfile={onOpenUserProfile} 
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="opacity-20 font-black uppercase text-[10px] tracking-[0.5em] mb-8">Nenhum protocolo detectado</div>
            <TransformationCard before="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800" after="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800" />
            <p className="text-[9px] font-black uppercase italic text-white/30 tracking-widest mt-6">Padrão de Evolução Desbloqueado</p>
          </div>
        )}
      </div>
    </div>
  );
}