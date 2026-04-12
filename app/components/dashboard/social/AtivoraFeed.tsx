"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2, Bookmark, ChevronLeft, Compass, Heart, ImageIcon, Loader2,
  MessageSquare, TrendingUp, User, Video as VideoIcon, X, MoreVertical,
  Trash2, Share2, Repeat, Zap, Send, MapPin, Music2, Bell,
  FileText, Gift, AtSign, Hash, Search, UserPlus, UserCheck, Eye,
  Flag, VolumeX, Copy, Radio, Star, TrendingDown, Filter,
  PlusCircle, CheckCircle2, Users, Globe, Lock, Edit3,
} from "lucide-react";
import Image from "next/image";
import { can } from "@/lib/permissions";

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════════════════
type FeedTab        = "explorar" | "tendencias" | "meu_perfil" | "salvos" | "seguindo";
type MediaType      = "image" | "video" | "gif" | "audio" | "document" | "text";
type ReactionType   = "like" | "love" | "haha" | "wow" | "angry" | "strong";
type PostVisibility = "public" | "followers" | "private";

interface UserProfile {
  username: string;
  avatar?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  role?: string;
  xp?: number;
  nivel?: number;
  bio?: string | null;
  followers?: number;
  following?: number;
  is_verified?: boolean;
}

interface StoryData {
  id: number;
  user: string;
  avatar: string | null;
  mediaUrl: string;
  mediaType: "image" | "video";
  seen: boolean;
}

interface PostData {
  id: number;
  user: string;
  avatar: string | null;
  role?: string;
  is_verified?: boolean;
  content: string;
  likes: number;
  comentarios_count: number;
  hasLiked?: boolean;
  userReaction?: ReactionType | null;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  mediaUrls?: string[];
  location?: string | null;
  tagged?: string[];
  hashtags?: string[];
  enquete_pergunta?: string | null;
  enquete_op1?: string | null;
  enquete_op2?: string | null;
  enquete_op3?: string | null;
  enquete_op4?: string | null;
  voto_usuario?: number | null;
  reposts?: number;
  views?: number;
  timestamp?: string;
  visibility?: PostVisibility;
  isRepost?: boolean;
  originalPost?: Omit<PostData, "isRepost" | "originalPost"> | null;
  isPinned?: boolean;
  isSponsored?: boolean;
  sponsorLabel?: string | null;
  reactions?: Record<ReactionType, number>;
}

interface CommentData {
  id: number;
  postId: number;
  nickname: string;
  avatar_url: string | null;
  conteudo: string;
  likes?: number;
  hasLiked?: boolean;
  timestamp?: string;
  replies?: CommentData[];
}

interface TrendingTopic {
  tag: string;
  posts: number;
  trend: "up" | "down" | "stable";
}

interface NotificationData {
  id: number;
  type: "like" | "comment" | "follow" | "mention" | "repost" | "achievement";
  user: string;
  avatar: string | null;
  message: string;
  timestamp: string;
  read: boolean;
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

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════════════════════════
const MAX_POST_CHARS     = 500;
const MAX_FILE_SIZE_MB   = 160;
const MAX_CAROUSEL_ITEMS = 10;
const MAX_POLL_OPTIONS   = 4;

const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "like",   emoji: "👍", label: "Força",    color: "text-sky-400"    },
  { type: "love",   emoji: "❤️", label: "Dedicação", color: "text-rose-400"  },
  { type: "haha",   emoji: "😂", label: "Haha",     color: "text-yellow-400" },
  { type: "wow",    emoji: "😮", label: "Absurdo",  color: "text-purple-400" },
  { type: "angry",  emoji: "😤", label: "Raiva",    color: "text-orange-400" },
  { type: "strong", emoji: "💪", label: "Evolução", color: "text-green-400"  },
];

const TRENDING_FITNESS: TrendingTopic[] = [
  { tag: "ProtocoloElite",  posts: 4821, trend: "up"     },
  { tag: "HipertrofiaMax",  posts: 3204, trend: "up"     },
  { tag: "CutSeason2026",   posts: 2891, trend: "stable" },
  { tag: "NaturalOrNot",    posts: 2103, trend: "up"     },
  { tag: "MacrosMaster",    posts: 1876, trend: "down"   },
  { tag: "AtivoraElite",    posts: 1654, trend: "up"     },
  { tag: "DeadliftRecord",  posts: 1201, trend: "stable" },
  { tag: "NutriProtocolo",  posts: 987,  trend: "up"     },
];

const FILTROS_FEED = ["Todos", "Treinos", "Nutrição", "Resultados", "Enquetes", "Transformações"];

const ROLE_LABEL: Record<string, string> = {
  aluno:      "Atleta",
  personal:   "Personal",
  nutri:      "Nutricionista",
  instrutor:  "Instrutor",
  influencer: "Influencer",
  guest:      "Visitante",
};

const isValidUrl = (url: unknown): url is string =>
  typeof url === "string" && url.length > 8 &&
  (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:"));

const timeAgo = (ts?: string): string => {
  if (!ts) return "agora";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

// ══════════════════════════════════════════════════════════════════════════════
// XP ALERT
// ══════════════════════════════════════════════════════════════════════════════
function XPGainAlert({ amount, onComplete }: { amount: number; onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 40 }}
      animate={{ opacity: 1, scale: 1.15, y: -100 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 380 }}
      onAnimationComplete={onComplete}
      className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none"
    >
      <div className="bg-sky-500 text-black font-black px-7 py-2.5 rounded-full border border-white/30 italic uppercase text-xs tracking-widest">
        +{amount} ENERGIA VITAL
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRANSFORMATION CARD
// ══════════════════════════════════════════════════════════════════════════════
function TransformationCard({ before, after }: { before: string; after: string }) {
  const [sliderPos, setSliderPos] = useState(50);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const el = e.currentTarget as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setSliderPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div
      className="relative w-full aspect-square rounded-[28px] overflow-hidden cursor-ew-resize ring-1 ring-white/10 shadow-2xl select-none"
      onMouseMove={e => e.buttons === 1 && handleMove(e)}
      onTouchMove={handleMove}
    >
      <Image src={after} alt="Depois" fill className="object-cover" unoptimized />
      <div className="absolute inset-0 z-10" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
        <Image src={before} alt="Antes" fill className="object-cover" unoptimized />
      </div>
      <div
        className="absolute inset-y-0 z-20 w-0.5 bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,1)]"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-[#010307] rounded-full flex items-center justify-center border-2 border-sky-500">
          <Repeat size={14} className="text-sky-500" />
        </div>
      </div>
      <span className="absolute top-3 left-3 bg-black/70 text-white/60 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">ANTES</span>
      <span className="absolute top-3 right-3 bg-black/70 text-white/60 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">DEPOIS</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MEDIA CAROUSEL
// ══════════════════════════════════════════════════════════════════════════════
function MediaCarousel({ urls, type }: { urls: string[]; type: MediaType }) {
  const [idx, setIdx] = useState(0);
  if (!urls.length) return null;
  return (
    <div className="relative mb-4">
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg">
        {type === "video"
          ? <video src={urls[idx]} controls className="w-full h-auto max-h-[60vh]" />
          : <Image src={urls[idx]} alt="" width={800} height={800} className="w-full h-auto object-cover max-h-[60vh]" unoptimized />
        }
      </div>
      {urls.length > 1 && (
        <>
          <div className="flex justify-center gap-1.5 mt-2">
            {urls.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-300 ${i === idx ? "w-5 h-1.5 bg-sky-500" : "w-1.5 h-1.5 bg-white/20"}`} />
            ))}
          </div>
          {idx > 0 && (
            <button onClick={() => setIdx(i => i - 1)}
              className="absolute left-2 top-[45%] -translate-y-1/2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-sky-500/80 transition-all font-bold text-lg">
              ‹
            </button>
          )}
          {idx < urls.length - 1 && (
            <button onClick={() => setIdx(i => i + 1)}
              className="absolute right-2 top-[45%] -translate-y-1/2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-sky-500/80 transition-all font-bold text-lg">
              ›
            </button>
          )}
          <span className="absolute top-2 right-2 bg-black/70 text-white/60 text-[10px] font-black px-2 py-0.5 rounded-full">
            {idx + 1}/{urls.length}
          </span>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STORY RING
// ══════════════════════════════════════════════════════════════════════════════
function StoryRing({ story, onClick }: { story: StoryData; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 group">
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-[2px] transition-transform group-hover:scale-105
        ${story.seen ? "bg-white/10" : "bg-gradient-to-br from-sky-500 via-purple-500 to-orange-400"}`}>
        <div className="w-full h-full rounded-[13px] bg-[#010307] overflow-hidden">
          {isValidUrl(story.avatar)
            ? <img src={story.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-white/5">
                <span className="text-sky-500 font-black text-sm">{story.user[0].toUpperCase()}</span>
              </div>
          }
        </div>
      </div>
      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest truncate w-14 sm:w-16 text-center">
        {story.user}
      </span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STORY VIEWER
// ══════════════════════════════════════════════════════════════════════════════
function StoryViewer({
  stories, startIdx, onClose,
}: {
  stories: StoryData[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx]         = useState(startIdx);
  const [progress, setProgress] = useState(0);
  const story = stories[idx];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (idx < stories.length - 1) setIdx(i => i + 1);
          else onClose();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [idx, stories.length, onClose]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-xs sm:max-w-sm h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Barras de progresso */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-100"
                style={{ width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }} />
            </div>
          ))}
        </div>
        {/* Header */}
        <div className="absolute top-7 left-3 right-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10">
              {isValidUrl(story.avatar) && <img src={story.avatar} alt="" className="w-full h-full object-cover" />}
            </div>
            <span className="text-white font-black text-xs uppercase tracking-wide">@{story.user}</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white bg-black/40 rounded-full p-1">
            <X size={17} />
          </button>
        </div>
        {/* Mídia */}
        <div className="w-full h-full rounded-2xl overflow-hidden">
          <Image src={story.mediaUrl} alt="" fill className="object-cover" unoptimized />
        </div>
        {/* Áreas de nav */}
        <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer"
          onClick={() => idx > 0 ? setIdx(i => i - 1) : onClose()} />
        <div className="absolute inset-y-0 right-0 w-1/3 cursor-pointer"
          onClick={() => idx < stories.length - 1 ? setIdx(i => i + 1) : onClose()} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REACTION PICKER
// ══════════════════════════════════════════════════════════════════════════════
function ReactionPicker({ onSelect }: { onSelect: (r: ReactionType) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      className="absolute bottom-9 left-0 z-[200] bg-[#0F172A] border border-white/10 rounded-2xl px-3 py-2 flex gap-2 shadow-2xl backdrop-blur-xl"
    >
      {REACTIONS.map(r => (
        <button key={r.type} onClick={() => onSelect(r.type)}
          className="flex flex-col items-center gap-0.5 hover:scale-125 transition-transform active:scale-110"
          title={r.label}>
          <span className="text-xl leading-none">{r.emoji}</span>
          <span className={`text-[7px] font-black uppercase ${r.color}`}>{r.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// POST CARD
// ══════════════════════════════════════════════════════════════════════════════
function PostCard({
  post, safeUser, isGuest, triggerXP,
  onDelete, onOpenUserProfile, onOpenComments,
  onRepost, followedUsers, onFollow,
}: {
  post: PostData;
  safeUser: UserProfile;
  isGuest: boolean;
  triggerXP: (n: number) => void;
  onDelete: (id: number) => void;
  onOpenUserProfile: (u: string) => void;
  onOpenComments: (id: number) => void;
  onRepost: (p: PostData, mode: "repost" | "quote") => void;
  followedUsers: string[];
  onFollow: (u: string) => void;
}) {
  const [reaction, setReaction]           = useState<ReactionType | null>(post.userReaction ?? null);
  const [reactCount, setReactCount]       = useState(post.likes);
  const [showReactions, setShowReactions] = useState(false);
  const [voted, setVoted]                 = useState(post.voto_usuario != null);
  const [saved, setSaved]                 = useState(false);
  const [reposted, setReposted]           = useState(false);
  const [repostCount, setRepostCount]     = useState(post.reposts ?? 0);
  const [showMenu, setShowMenu]           = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);

  const isOwner     = safeUser.username === post.user;
  const isFollowing = followedUsers.includes(post.user);
  const mediaUrls   = post.mediaUrls?.length ? post.mediaUrls : post.mediaUrl ? [post.mediaUrl] : [];
  const currentReactionEmoji = reaction ? REACTIONS.find(r => r.type === reaction)?.emoji : null;

  const handleReaction = (r: ReactionType) => {
    if (isGuest) return;
    if (reaction === r) {
      setReaction(null);
      setReactCount(p => p - 1);
    } else {
      if (!reaction) setReactCount(p => p + 1);
      setReaction(r);
      triggerXP(2);
    }
    setShowReactions(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-[#050B14]/70 border rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 relative text-left shadow-lg transition-colors
        ${post.isPinned ? "border-sky-500/30" : "border-white/5 hover:border-white/10"}`}
    >
      {/* Badges */}
      {(post.isPinned || post.isSponsored || post.isRepost) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {post.isPinned    && <span className="text-[8px] font-black uppercase text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={8} /> Fixado</span>}
          {post.isSponsored && <span className="text-[8px] font-black uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Gift size={8} /> {post.sponsorLabel ?? "Patrocinado"}</span>}
          {post.isRepost    && <span className="text-[8px] font-black uppercase text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Repeat size={8} /> Repostado por @{post.user}</span>}
        </div>
      )}

      {/* Post original citado */}
      {post.isRepost && post.originalPost && (
        <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-white/5 overflow-hidden shrink-0">
              {isValidUrl(post.originalPost.avatar) && <img src={post.originalPost.avatar} alt="" className="w-full h-full object-cover" />}
            </div>
            <span className="text-white/40 text-[10px] font-black uppercase">@{post.originalPost.user}</span>
          </div>
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{post.originalPost.content}</p>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <button onClick={() => onOpenUserProfile(post.user)} className="shrink-0 pt-0.5">
          <div className={`w-11 h-11 rounded-xl p-[2px] transition-transform hover:scale-105
            ${post.is_verified
              ? "bg-gradient-to-br from-sky-400 via-purple-500 to-orange-400"
              : "bg-gradient-to-br from-sky-500 to-purple-600"}`}>
            <div className="w-full h-full rounded-[10px] bg-[#010307] relative overflow-hidden flex items-center justify-center">
              {isValidUrl(post.avatar)
                ? <Image src={post.avatar} alt="" fill className="object-cover" unoptimized />
                : <span className="text-sky-500 font-black text-sm">{post.user?.[0]?.toUpperCase()}</span>
              }
            </div>
          </div>
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <button onClick={() => onOpenUserProfile(post.user)}
                className="font-black text-white text-sm italic uppercase tracking-tighter hover:text-sky-400 transition-colors leading-none">
                @{post.user}
              </button>
              {post.is_verified && <CheckCircle2 size={12} className="text-sky-400 shrink-0" />}
              {post.role && (
                <span className="text-[8px] font-black uppercase text-white/25 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                  {ROLE_LABEL[post.role] ?? post.role}
                </span>
              )}
              {post.location && (
                <span className="flex items-center gap-0.5 text-white/20 text-[9px] font-bold">
                  <MapPin size={8} />{post.location}
                </span>
              )}
              <span className="text-white/20 text-[9px] font-bold">{timeAgo(post.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!isOwner && !isGuest && (
                <button onClick={() => onFollow(post.user)}
                  className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-lg transition-all
                    ${isFollowing
                      ? "text-sky-400 bg-sky-500/10 border border-sky-500/20"
                      : "text-white/25 hover:text-sky-400 bg-white/5 border border-white/10"}`}>
                  {isFollowing ? <UserCheck size={11} /> : <UserPlus size={11} />}
                  <span className="hidden sm:inline">{isFollowing ? "Seguindo" : "Seguir"}</span>
                </button>
              )}
              <button onClick={() => setShowMenu(!showMenu)} className="text-white/20 hover:text-sky-500 transition-colors p-1">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Menções */}
          {(post.tagged?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {post.tagged!.map(t => (
                <span key={t} className="text-sky-400/50 text-[10px] font-bold hover:text-sky-400 cursor-pointer transition-colors">@{t}</span>
              ))}
            </div>
          )}

          {/* Texto */}
          <p className="text-white/75 text-sm leading-relaxed mb-3 font-medium break-words">{post.content}</p>

          {/* Hashtags */}
          {(post.hashtags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.hashtags!.map(h => (
                <span key={h} className="text-sky-500/50 text-[10px] font-black hover:text-sky-400 cursor-pointer transition-colors">#{h}</span>
              ))}
            </div>
          )}

          {/* Mídia */}
          {mediaUrls.length > 0 && post.mediaType !== "audio" && post.mediaType !== "document" && (
            <MediaCarousel urls={mediaUrls} type={post.mediaType ?? "image"} />
          )}
          {post.mediaType === "audio" && post.mediaUrl && (
            <div className="mb-4 bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <Music2 size={16} className="text-sky-400 shrink-0" />
              <audio src={post.mediaUrl} controls className="flex-1 h-8" />
            </div>
          )}
          {post.mediaType === "document" && post.mediaUrl && (
            <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer"
              className="mb-4 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3 hover:border-sky-500/40 transition-all group">
              <FileText size={16} className="text-sky-400 shrink-0" />
              <span className="text-white/50 text-xs font-bold group-hover:text-sky-400 transition-colors truncate">
                {post.mediaUrl.split("/").pop()}
              </span>
            </a>
          )}

          {/* Enquete */}
          {post.enquete_pergunta && (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4 space-y-2.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-sky-500" />
              <p className="text-[9px] font-black uppercase text-sky-500 flex items-center gap-1.5 italic tracking-widest pl-2">
                <BarChart2 size={12} /> Enquete · {voted ? "Encerrada" : "Vote agora"}
              </p>
              <p className="text-sm font-bold text-white leading-snug pl-2">{post.enquete_pergunta}</p>
              <div className="space-y-1.5">
                {[post.enquete_op1, post.enquete_op2, post.enquete_op3, post.enquete_op4]
                  .filter(Boolean)
                  .map((op, i) => {
                    const pct = [52, 28, 12, 8][i];
                    return (
                      <button key={i}
                        onClick={() => { if (!voted && !isGuest) { setVoted(true); triggerXP(5); } }}
                        disabled={voted}
                        className="w-full relative h-11 rounded-xl bg-white/5 border border-white/10 overflow-hidden transition-all hover:border-sky-500/30 text-left">
                        <div className="absolute inset-y-0 left-0 bg-sky-500/20 transition-all duration-700 ease-out"
                          style={{ width: voted ? `${pct}%` : "0%" }} />
                        <div className="relative h-full flex items-center justify-between px-4 text-xs font-black uppercase italic text-white/70">
                          <span>{op}</span>
                          {voted && <span className="text-sky-400 font-mono text-[10px]">{pct}%</span>}
                        </div>
                      </button>
                    );
                  })}
              </div>
              {voted && <p className="text-white/15 text-[9px] font-bold uppercase tracking-widest pl-2">Encerrada</p>}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
            {/* Reação */}
            <div className="relative">
              <button
                onMouseEnter={() => !isGuest && setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                onClick={() => !isGuest && handleReaction("like")}
                className={`flex items-center gap-1.5 transition-all ${reaction ? "scale-110" : "text-white/25 hover:text-rose-400"}`}
              >
                {currentReactionEmoji
                  ? <span className="text-base leading-none">{currentReactionEmoji}</span>
                  : <Heart size={19} fill={reaction ? "currentColor" : "none"} className={reaction ? "text-rose-500" : ""} />
                }
                <span className="text-xs font-black font-mono">{reactCount}</span>
              </button>
              <AnimatePresence>
                {showReactions && !isGuest && (
                  <div onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
                    <ReactionPicker onSelect={handleReaction} />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Comentário */}
            <button onClick={() => onOpenComments(post.id)} className="flex items-center gap-1.5 text-white/25 hover:text-sky-500 transition-all">
              <MessageSquare size={19} />
              <span className="text-xs font-black font-mono">{post.comentarios_count || 0}</span>
            </button>

            {/* Repost */}
            <div className="relative">
              <button onClick={() => !isGuest && setShowRepostMenu(!showRepostMenu)}
                className={`flex items-center gap-1.5 transition-all ${reposted ? "text-green-400" : "text-white/25 hover:text-green-400"}`}>
                <Repeat size={18} />
                <span className="text-xs font-black font-mono">{repostCount}</span>
              </button>
              <AnimatePresence>
                {showRepostMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute bottom-8 left-0 w-40 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setReposted(!reposted);
                        setRepostCount(p => reposted ? p - 1 : p + 1);
                        if (!reposted) triggerXP(3);
                        setShowRepostMenu(false);
                        onRepost(post, "repost");
                      }}
                      className="w-full px-4 py-3 text-left text-green-400 text-[10px] font-black uppercase hover:bg-green-500/10 flex items-center gap-2 border-b border-white/5">
                      <Repeat size={13} /> Repostar
                    </button>
                    <button
                      onClick={() => { setShowRepostMenu(false); onRepost(post, "quote"); }}
                      className="w-full px-4 py-3 text-left text-white/60 text-[10px] font-black uppercase hover:bg-white/10 flex items-center gap-2">
                      <Edit3 size={13} /> Citar Post
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Salvar */}
            <button
              onClick={() => { if (!isGuest) { setSaved(!saved); if (!saved) triggerXP(2); } }}
              className={`transition-all ${saved ? "text-sky-400" : "text-white/25 hover:text-sky-400"}`}>
              <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
            </button>

            {/* Compartilhar */}
            <button className="text-white/25 hover:text-white/50 transition-all">
              <Share2 size={17} />
            </button>
          </div>

          {/* Views */}
          {post.views != null && post.views > 0 && (
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <Eye size={10} className="text-white/15" />
              <span className="text-white/15 text-[9px] font-bold">{post.views.toLocaleString()} visualizações</span>
            </div>
          )}
        </div>
      </div>

      {/* Menu contextual */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute right-4 top-14 w-48 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {isOwner ? (
              <>
                <button onClick={() => { onDelete(post.id); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-rose-500 text-[10px] font-black uppercase hover:bg-rose-500/10 flex items-center gap-2.5 border-b border-white/5">
                  <Trash2 size={13} /> Deletar Post
                </button>
                <button className="w-full px-4 py-3 text-left text-white/60 text-[10px] font-black uppercase hover:bg-white/10 flex items-center gap-2.5 border-b border-white/5">
                  <Star size={13} /> {post.isPinned ? "Desafixar" : "Fixar no Perfil"}
                </button>
              </>
            ) : (
              <>
                <button className="w-full px-4 py-3 text-left text-white/60 text-[10px] font-black uppercase hover:bg-white/10 flex items-center gap-2.5 border-b border-white/5">
                  <VolumeX size={13} /> Silenciar @{post.user}
                </button>
                <button className="w-full px-4 py-3 text-left text-rose-400 text-[10px] font-black uppercase hover:bg-rose-500/10 flex items-center gap-2.5 border-b border-white/5">
                  <Flag size={13} /> Reportar
                </button>
              </>
            )}
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowMenu(false); }}
              className="w-full px-4 py-3 text-left text-white/60 text-[10px] font-black uppercase hover:bg-white/10 flex items-center gap-2.5 border-b border-white/5">
              <Copy size={13} /> Copiar Link
            </button>
            <button className="w-full px-4 py-3 text-left text-white/60 text-[10px] font-black uppercase hover:bg-white/10 flex items-center gap-2.5">
              <Share2 size={13} /> Compartilhar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMENT CARD
// ══════════════════════════════════════════════════════════════════════════════
function CommentCard({
  comment, safeUser, onReply,
}: {
  comment: CommentData;
  safeUser: UserProfile;
  onReply: (nick: string) => void;
}) {
  const [liked, setLiked] = useState(comment.hasLiked ?? false);
  const [likes, setLikes] = useState(comment.likes ?? 0);

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-white/5 shrink-0 overflow-hidden border border-white/10 p-0.5">
        <div className="w-full h-full rounded-[9px] bg-[#010307] flex items-center justify-center overflow-hidden">
          {isValidUrl(comment.avatar_url)
            ? <img src={comment.avatar_url} className="w-full h-full object-cover" alt="" />
            : <span className="text-[9px] font-black text-sky-500">{comment.nickname[0]?.toUpperCase()}</span>
          }
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-black uppercase text-white/80 italic">@{comment.nickname}</span>
            {comment.nickname === safeUser.username && (
              <span className="text-[7px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-black uppercase">Você</span>
            )}
            <span className="text-white/20 text-[9px]">{timeAgo(comment.timestamp)}</span>
          </div>
          <p className="text-xs text-white/55 leading-relaxed font-medium">{comment.conteudo}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={() => { setLiked(!liked); setLikes(p => liked ? p - 1 : p + 1); }}
            className={`flex items-center gap-1 text-[9px] font-black transition-all ${liked ? "text-rose-400" : "text-white/20 hover:text-rose-400"}`}>
            <Heart size={10} fill={liked ? "currentColor" : "none"} /> {likes}
          </button>
          <button
            onClick={() => onReply(comment.nickname)}
            className="text-[9px] font-black text-white/20 hover:text-sky-400 transition-colors uppercase tracking-widest">
            Responder
          </button>
        </div>
        {comment.replies?.map(reply => (
          <div key={reply.id} className="mt-2 ml-3">
            <CommentCard comment={reply} safeUser={safeUser} onReply={onReply} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export function AtivoraFeed({
  currentUser, isGuest = false, onViewProfile, onOpenMessages,
  onOpenNotifications, onOpenUserProfile, onBack,
}: AtivoraFeedProps) {

  const safeUser: UserProfile = useMemo(() => ({
    username:    currentUser?.username    ?? "Visitante",
    avatar:      currentUser?.avatar      ?? currentUser?.avatar_url ?? currentUser?.foto_url ?? null,
    role:        currentUser?.role        ?? (isGuest ? "guest" : "aluno"),
    xp:          currentUser?.xp          ?? 0,
    nivel:       currentUser?.nivel        ?? 1,
    bio:         currentUser?.bio          ?? null,
    followers:   currentUser?.followers    ?? 0,
    following:   currentUser?.following    ?? 0,
    is_verified: currentUser?.is_verified  ?? false,
  }), [currentUser, isGuest]);

  // Permissões
  const R            = safeUser.role ?? "guest";
  const canPost        = can(R, "feed:post");
  const canComment     = can(R, "feed:comment");
  const canUploadMedia = can(R, "feed:upload_media");
  const canUploadVideo = can(R, "feed:upload_video");
  const canUploadAudio = can(R, "feed:upload_audio");
  const canUploadDoc   = can(R, "feed:upload_document");
  const canPoll        = can(R, "feed:poll");
  const canGif         = can(R, "feed:gif");
  const canLocation    = can(R, "feed:location");
  const canMention     = can(R, "feed:mention");
  const canSponsored   = can(R, "feed:post_sponsored");
  const canStory       = can(R, "feed:story");
  const canRepost      = can(R, "feed:repost");
  const canSearch      = can(R, "feed:search");
  const canFollow      = can(R, "social:follow");
  const canHashtag     = can(R, "feed:hashtag");

  // Estados
  const [activeTab, setActiveTab]         = useState<FeedTab>("explorar");
  const [activeFiltro, setActiveFiltro]   = useState("Todos");
  const [posts, setPosts]                 = useState<PostData[]>([]);
  const [loading, setLoading]             = useState(false);
  const [isPosting, setIsPosting]         = useState(false);
  const [xpQueue, setXpQueue]             = useState<{ id: number; amount: number }[]>([]);
  const [userStats, setUserStats]         = useState({ xp: safeUser.xp ?? 0, nivel: safeUser.nivel ?? 1 });
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);

  // Stories
  const [stories, setStories]               = useState<StoryData[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

  // Pesquisa
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<PostData[]>([]);
  const [searchTab, setSearchTab]         = useState<"posts" | "users" | "tags">("posts");

  // Notificações
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifications, setNotifications]   = useState<NotificationData[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Comentários
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [commentsList, setCommentsList]             = useState<CommentData[]>([]);
  const [localCommentsStore, setLocalCommentsStore] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments]       = useState(false);
  const [commentText, setCommentText]               = useState("");
  const [replyingTo, setReplyingTo]                 = useState<string | null>(null);
  const [commentSort, setCommentSort]               = useState<"recent" | "top">("recent");

  // Composer
  const [postText, setPostText]               = useState("");
  const [previewMedias, setPreviewMedias]     = useState<{ url: string; type: MediaType }[]>([]);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollOptions, setPollOptions]         = useState(["", ""]);
  const [pollQuestion, setPollQuestion]       = useState("");
  const [location, setLocation]               = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [mentionText, setMentionText]         = useState("");
  const [showMentionInput, setShowMentionInput] = useState(false);
  const [hashtagText, setHashtagText]         = useState("");
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [sponsoredLabel, setSponsoredLabel]   = useState("");
  const [showSponsoredInput, setShowSponsoredInput] = useState(false);
  const [postVisibility, setPostVisibility]   = useState<PostVisibility>("public");
  const [quotePost, setQuotePost]             = useState<PostData | null>(null);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const videoInputRef  = useRef<HTMLInputElement>(null);
  const audioInputRef  = useRef<HTMLInputElement>(null);
  const docInputRef    = useRef<HTMLInputElement>(null);
  const gifInputRef    = useRef<HTMLInputElement>(null);
  const composerRef    = useRef<HTMLTextAreaElement>(null);

  const triggerXP = useCallback((amount: number) => {
    const id = Date.now() + Math.random();
    setXpQueue(prev => [...prev, { id, amount }]);
    setUserStats(prev => ({ xp: prev.xp + amount, nivel: Math.floor((prev.xp + amount) / 500) + 1 }));
  }, []);

  // Fetch posts — não roda em abas que não precisam
  const fetchPosts = useCallback(async () => {
    if (activeTab === "salvos" || activeTab === "tendencias") return;
    setLoading(true);
    try {
      const url = `/api/posts/listar?currentUser=${encodeURIComponent(safeUser.username)}`
        + (activeTab === "meu_perfil" ? `&nickname=${encodeURIComponent(safeUser.username)}` : "")
        + (activeTab === "seguindo"   ? `&following=true` : "");
      const res  = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [activeTab, safeUser.username]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Pesquisa reativa
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(posts.filter(p =>
      p.content.toLowerCase().includes(q) ||
      p.user.toLowerCase().includes(q) ||
      p.hashtags?.some(h => h.toLowerCase().includes(q))
    ));
  }, [searchQuery, posts]);

  const handleFollow = useCallback((username: string) => {
    if (!canFollow || isGuest) return;
    setFollowedUsers(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
    triggerXP(5);
  }, [canFollow, isGuest, triggerXP]);

  const handleRepost = useCallback((post: PostData, mode: "repost" | "quote") => {
    if (!canRepost || isGuest) return;
    if (mode === "repost") {
      setPosts(prev => [{
        ...post,
        id: Date.now(),
        user: safeUser.username,
        avatar: (safeUser.avatar as string | null) ?? null,
        isRepost: true,
        originalPost: post,
        content: "",
        likes: 0,
        comentarios_count: 0,
        reposts: 0,
        views: 0,
        timestamp: new Date().toISOString(),
      }, ...prev]);
      triggerXP(3);
    } else {
      setQuotePost(post);
      setActiveTab("explorar");
      setTimeout(() => {
        composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        composerRef.current?.focus();
      }, 150);
    }
  }, [canRepost, isGuest, safeUser, triggerXP]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, forcedType?: MediaType) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.slice(0, MAX_CAROUSEL_ITEMS - previewMedias.length).forEach(file => {
      if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) return;
      let type: MediaType = forcedType ?? "image";
      if (!forcedType) {
        if (file.type.startsWith("video"))      type = "video";
        else if (file.type.startsWith("audio")) type = "audio";
        else if (file.type === "image/gif")     type = "gif";
        else if (file.type.startsWith("image")) type = "image";
        else                                    type = "document";
      }
      if (type === "document") {
        setPreviewMedias(prev => [...prev, { url: URL.createObjectURL(file), type }]);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreviewMedias(prev => [...prev, { url: reader.result as string, type }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [previewMedias.length]);

  const handlePost = async () => {
    if (!postText.trim() && previewMedias.length === 0 && !pollQuestion.trim()) return;
    if (!canPost) return;
    setIsPosting(true);
    try {
      const newPost: PostData = {
        id: Date.now(),
        user: safeUser.username,
        avatar: (safeUser.avatar as string | null) ?? null,
        role: safeUser.role,
        is_verified: safeUser.is_verified,
        content: postText,
        likes: 0, comentarios_count: 0, hasLiked: false,
        mediaUrl:  previewMedias[0]?.url ?? null,
        mediaUrls: previewMedias.map(m => m.url),
        mediaType: previewMedias[0]?.type ?? "text",
        location:  location || null,
        tagged:    mentionText ? mentionText.split(",").map(s => s.trim().replace(/^@/, "")).filter(Boolean) : [],
        hashtags:  hashtagText ? hashtagText.split(",").map(s => s.trim().replace(/^#/, "")).filter(Boolean) : [],
        enquete_pergunta: pollQuestion || null,
        enquete_op1: pollOptions[0] || null,
        enquete_op2: pollOptions[1] || null,
        enquete_op3: pollOptions[2] || null,
        enquete_op4: pollOptions[3] || null,
        reposts: 0, views: 0,
        timestamp: new Date().toISOString(),
        visibility: postVisibility,
        isSponsored: !!sponsoredLabel,
        sponsorLabel: sponsoredLabel || null,
        isRepost: !!quotePost,
        originalPost: quotePost ?? null,
      };
      setPosts(prev => [newPost, ...prev]);
      triggerXP(15);
      // Reset completo
      setPostText(""); setPreviewMedias([]); setShowPollBuilder(false);
      setPollQuestion(""); setPollOptions(["", ""]);
      setLocation(""); setShowLocationInput(false);
      setMentionText(""); setShowMentionInput(false);
      setHashtagText(""); setShowHashtagInput(false);
      setSponsoredLabel(""); setShowSponsoredInput(false);
      setQuotePost(null);
    } finally { setIsPosting(false); }
  };

  const handleOpenComments = async (postId: number) => {
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/comentarios/listar?postId=${postId}`);
      const serverComments: CommentData[] = res.ok ? await res.json() : [];
      const local = localCommentsStore.filter(c => c.postId === postId);
      setCommentsList([...serverComments, ...local]);
    } catch {
      setCommentsList(localCommentsStore.filter(c => c.postId === postId));
    } finally { setLoadingComments(false); }
  };

  const submitComment = () => {
    if (!commentText.trim() || !canComment || !activeCommentsPostId) return;
    const newComment: CommentData = {
      id: Date.now(),
      postId: activeCommentsPostId,
      nickname: safeUser.username,
      avatar_url: (safeUser.avatar as string | null) ?? null,
      conteudo: replyingTo ? `@${replyingTo} ${commentText}` : commentText,
      likes: 0, hasLiked: false,
      timestamp: new Date().toISOString(),
    };
    setCommentsList(prev => [...prev, newComment]);
    setLocalCommentsStore(prev => [...prev, newComment]);
    setPosts(prev => prev.map(p =>
      p.id === activeCommentsPostId ? { ...p, comentarios_count: p.comentarios_count + 1 } : p
    ));
    triggerXP(5);
    setCommentText("");
    setReplyingTo(null);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  return (
    <div className="w-full max-w-2xl mx-auto pb-24 bg-[#010307] min-h-screen text-white relative selection:bg-sky-500/30">

      {/* ── STORY VIEWER ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeStoryIdx !== null && (
          <StoryViewer
            stories={stories}
            startIdx={activeStoryIdx}
            onClose={() => {
              setStories(prev => prev.map((s, i) => i === activeStoryIdx ? { ...s, seen: true } : s));
              setActiveStoryIdx(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL PESQUISA ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-[300] bg-[#010307]/98 backdrop-blur-md flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="w-full max-w-lg mx-auto flex flex-col h-full px-4 pt-4 pb-6"
            >
              {/* Barra */}
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-sky-500/40 transition-all">
                  <Search size={15} className="text-white/30 shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar treinos, atletas, #tags..."
                    className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/20"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-white/20 hover:text-white/50 transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="text-white/40 hover:text-white transition-colors font-black text-xs uppercase tracking-widest shrink-0"
                >
                  Cancelar
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-white/5 rounded-2xl p-1 shrink-0">
                {(["posts", "users", "tags"] as const).map(t => (
                  <button key={t} onClick={() => setSearchTab(t)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${searchTab === t ? "bg-sky-500 text-black" : "text-white/30 hover:text-white/60"}`}>
                    {t === "posts" ? "Posts" : t === "users" ? "Atletas" : "Hashtags"}
                  </button>
                ))}
              </div>

              {/* Resultados */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {!searchQuery.trim() ? (
                  <div className="space-y-2">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-3 px-1">Em alta agora</p>
                    {TRENDING_FITNESS.slice(0, 6).map(t => (
                      <button key={t.tag} onClick={() => setSearchQuery(t.tag)}
                        className="w-full flex items-center justify-between bg-white/3 border border-white/5 rounded-2xl px-4 py-3 hover:border-sky-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <Hash size={13} className="text-sky-500/50" />
                          <span className="text-white/60 font-black text-sm group-hover:text-sky-400 transition-colors">{t.tag}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/25 text-[10px] font-bold">{t.posts.toLocaleString()} posts</span>
                          {t.trend === "up"     && <TrendingUp   size={11} className="text-green-400" />}
                          {t.trend === "down"   && <TrendingDown size={11} className="text-rose-400"  />}
                          {t.trend === "stable" && <Radio        size={11} className="text-white/20"  />}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(post => (
                    <div key={post.id}
                      className="bg-white/3 border border-white/5 rounded-2xl px-4 py-3 hover:border-sky-500/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sky-400 text-[10px] font-black uppercase">@{post.user}</span>
                        {post.role && <span className="text-white/20 text-[9px] font-bold">{ROLE_LABEL[post.role] ?? post.role}</span>}
                        <span className="text-white/20 text-[9px]">{timeAgo(post.timestamp)}</span>
                      </div>
                      <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{post.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <Search size={32} className="mx-auto mb-4 text-white/10" />
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                      Nenhum resultado para "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAINEL DE NOTIFICAÇÕES ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotifPanel && (
          <div className="fixed inset-0 z-[300] flex justify-end" onClick={() => setShowNotifPanel(false)}>
            <motion.div
              initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs sm:max-w-sm h-full bg-[#050B14] border-l border-white/10 flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase text-white italic tracking-tight">Notificações</h3>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">{unreadCount} não lidas</p>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[9px] font-black uppercase text-sky-400 hover:text-sky-300 tracking-widest transition-colors">
                      Limpar
                    </button>
                  )}
                  <button onClick={() => setShowNotifPanel(false)} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <Bell size={32} className="mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sem notificações</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id}
                      onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                      className={`flex items-start gap-3 px-4 py-3.5 border-b border-white/5 transition-all hover:bg-white/3 cursor-pointer
                        ${!notif.read ? "bg-sky-500/5" : ""}`}>
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/5">
                          {isValidUrl(notif.avatar) && <img src={notif.avatar} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]
                          ${notif.type === "like"        ? "bg-rose-500"   :
                            notif.type === "comment"     ? "bg-sky-500"    :
                            notif.type === "follow"      ? "bg-green-500"  :
                            notif.type === "mention"     ? "bg-purple-500" :
                            notif.type === "repost"      ? "bg-yellow-500" :
                                                           "bg-orange-500"}`}>
                          {notif.type === "like"    ? "❤️" :
                           notif.type === "comment" ? "💬" :
                           notif.type === "follow"  ? "👤" :
                           notif.type === "mention" ? "@"  :
                           notif.type === "repost"  ? "🔁" : "🏆"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/60 text-xs leading-relaxed">
                          <span className="font-black text-white/90">@{notif.user}</span> {notif.message}
                        </p>
                        <span className="text-white/20 text-[9px] font-bold">{timeAgo(notif.timestamp)}</span>
                      </div>
                      {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL COMENTÁRIOS ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeCommentsPostId !== null && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
              className="w-full sm:max-w-lg bg-[#050B14] border border-white/10 rounded-t-[28px] sm:rounded-[28px] flex flex-col max-h-[88vh] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase text-sky-500 italic tracking-tight">Comentários</h3>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{commentsList.length} respostas</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCommentSort(s => s === "recent" ? "top" : "recent")}
                    className="flex items-center gap-1 text-[9px] font-black uppercase text-white/25 hover:text-sky-400 transition-colors bg-white/5 px-2.5 py-1.5 rounded-xl">
                    <Filter size={9} /> {commentSort === "recent" ? "Recentes" : "Top"}
                  </button>
                  <button
                    onClick={() => { setActiveCommentsPostId(null); setCommentText(""); setReplyingTo(null); }}
                    className="p-1.5 bg-white/5 rounded-full hover:bg-rose-500/80 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                {loadingComments ? (
                  <div className="py-16 text-center">
                    <Loader2 className="animate-spin text-sky-500 mx-auto" size={28} />
                    <p className="text-[9px] font-black uppercase text-white/10 mt-3 tracking-widest animate-pulse">Carregando...</p>
                  </div>
                ) : commentsList.length > 0 ? (
                  [...commentsList]
                    .sort((a, b) =>
                      commentSort === "top"
                        ? (b.likes ?? 0) - (a.likes ?? 0)
                        : new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
                    )
                    .map(c => (
                      <CommentCard key={c.id} comment={c} safeUser={safeUser} onReply={nick => setReplyingTo(nick)} />
                    ))
                ) : (
                  <div className="py-16 text-center opacity-20">
                    <MessageSquare size={28} className="mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Seja o primeiro a comentar</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-4 py-4 bg-[#050B14] border-t border-white/5 shrink-0">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-sky-400 font-black">↩ @{replyingTo}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-white/20 hover:text-rose-400 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                )}
                {canComment ? (
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                      {isValidUrl(safeUser.avatar)
                        ? <img src={safeUser.avatar as string} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sky-500 text-xs font-black">{safeUser.username[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                      placeholder={replyingTo ? `Responder @${replyingTo}...` : "Adicione um comentário..."}
                      className="flex-1 bg-white/5 border border-white/10 outline-none rounded-2xl px-4 py-2.5 text-sm text-white focus:border-sky-500/40 transition-all placeholder:text-white/20"
                    />
                    <button
                      onClick={submitComment}
                      disabled={!commentText.trim()}
                      className="w-10 h-10 bg-sky-500 disabled:opacity-30 text-black rounded-xl flex items-center justify-center active:scale-90 transition-all shrink-0">
                      <Send size={15} />
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-[10px] font-black uppercase text-white/20 tracking-widest py-1 italic">
                    Faça login para comentar
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* XP Alerts */}
      <AnimatePresence>
        {xpQueue.map(xp => (
          <XPGainAlert key={xp.id} amount={xp.amount} onComplete={() => setXpQueue(q => q.filter(i => i.id !== xp.id))} />
        ))}
      </AnimatePresence>

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-[100] bg-[#010307]/95 backdrop-blur-xl px-3 sm:px-5 py-3 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="text-white/30 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
            <ChevronLeft size={19} />
          </button>
          <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
            Ativora<span className="text-sky-500">Feed</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {canSearch && (
            <button onClick={() => setShowSearch(true)} className="text-white/30 hover:text-sky-400 transition-colors bg-white/5 p-2 rounded-full">
              <Search size={18} />
            </button>
          )}
          {!isGuest && (
            <button onClick={() => setShowNotifPanel(true)} className="relative text-white/30 hover:text-sky-400 transition-colors bg-white/5 p-2 rounded-full">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sky-500 text-black text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}
          {!isGuest && (
            <button onClick={onOpenMessages} className="text-white/30 hover:text-sky-400 transition-colors bg-white/5 p-2 rounded-full">
              <MessageSquare size={18} />
            </button>
          )}
          <button
            onClick={onViewProfile}
            className="relative w-9 h-9 rounded-xl bg-white/5 p-0.5 ring-1 ring-white/10 overflow-hidden hover:scale-105 transition-transform flex items-center justify-center">
            {isValidUrl(safeUser.avatar)
              ? <Image src={safeUser.avatar} fill alt="" className="object-cover" unoptimized />
              : <span className="text-sky-500 font-black text-sm">{safeUser.username[0]?.toUpperCase()}</span>
            }
            <div className="absolute bottom-0 right-0 bg-sky-500 text-[7px] px-1 font-black text-black rounded-tl-md leading-tight">
              L{userStats.nivel}
            </div>
          </button>
        </div>
      </div>

      {/* ── STORIES ───────────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-5 pt-4 pb-3 border-b border-white/5">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
          {canStory && !isGuest && (
            <button className="flex flex-col items-center gap-1.5 shrink-0 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-sky-500/40 transition-all">
                <PlusCircle size={18} className="text-white/25 group-hover:text-sky-400 transition-colors" />
              </div>
              <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Story</span>
            </button>
          )}
          {stories.map((story, i) => (
            <StoryRing key={story.id} story={story} onClick={() => setActiveStoryIdx(i)} />
          ))}
          {stories.length === 0 && !canStory && (
            <p className="text-white/10 text-[9px] font-black uppercase tracking-widest self-center py-2">
              Nenhum story disponível
            </p>
          )}
        </div>
      </div>

      {/* ── COMPOSER ──────────────────────────────────────────────────────────── */}
      {canPost && activeTab === "explorar" && (
        <div className="mx-3 sm:mx-0 mt-4 mb-3 bg-[#050B14]/80 border border-white/5 rounded-[22px] sm:rounded-[26px] p-4 sm:p-6 shadow-xl">

          {/* Topo */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase italic tracking-widest text-white/15">Novo Post</span>
            <div className="flex items-center gap-2">
              <select
                value={postVisibility}
                onChange={e => setPostVisibility(e.target.value as PostVisibility)}
                className="appearance-none bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl outline-none cursor-pointer hover:border-sky-500/30 transition-all"
              >
                <option value="public">🌐 Público</option>
                <option value="followers">👥 Seguidores</option>
                <option value="private">🔒 Privado</option>
              </select>
              <div className="flex items-center gap-1 bg-sky-500/10 px-2.5 py-1.5 rounded-full border border-sky-500/20">
                <Zap size={10} className="text-sky-500 fill-sky-500" />
                <span className="text-[8px] font-black uppercase text-sky-400 tracking-widest italic">Online</span>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={composerRef}
            value={postText}
            onChange={e => setPostText(e.target.value)}
            maxLength={MAX_POST_CHARS}
            placeholder="Qual foi a quebra de limite de hoje?"
            className="w-full bg-transparent outline-none min-h-[72px] text-base sm:text-lg font-medium text-white/85 placeholder:text-white/10 resize-none"
          />
          <div className="text-right text-white/15 text-[9px] font-bold mb-2">{postText.length}/{MAX_POST_CHARS}</div>

          {/* Quote post */}
          {quotePost && (
            <div className="bg-black/30 border border-white/10 rounded-xl p-3 mb-3 relative">
              <button onClick={() => setQuotePost(null)} className="absolute top-2 right-2 text-white/20 hover:text-rose-400 transition-colors">
                <X size={13} />
              </button>
              <span className="text-sky-400/50 text-[9px] font-black uppercase block mb-1">@{quotePost.user}</span>
              <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{quotePost.content}</p>
            </div>
          )}

          {/* Preview mídias */}
          {previewMedias.length > 0 && (
            <div className={`grid gap-2 mb-3 ${previewMedias.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {previewMedias.map((m, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-square">
                  {m.type === "video"
                    ? <video src={m.url} className="w-full h-full object-cover" />
                    : m.type === "audio"
                      ? <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white/5 p-3">
                          <Music2 size={20} className="text-sky-400" />
                          <audio src={m.url} controls className="w-full" />
                        </div>
                      : m.type === "document"
                        ? <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-white/5">
                            <FileText size={20} className="text-sky-400" />
                            <span className="text-white/30 text-[9px] font-bold px-2 text-center truncate">Documento</span>
                          </div>
                        : <img src={m.url} alt="" className="w-full h-full object-cover" />
                  }
                  <button
                    onClick={() => setPreviewMedias(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1.5 right-1.5 bg-black/70 p-1 rounded-full hover:bg-rose-500 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {previewMedias.length < MAX_CAROUSEL_ITEMS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 hover:border-sky-500/40 hover:text-sky-400 transition-all text-2xl">
                  +
                </button>
              )}
            </div>
          )}

          {/* Extras animados */}
          <AnimatePresence>
            {showLocationInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                <div className="flex items-center gap-2.5 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5">
                  <MapPin size={13} className="text-sky-400 shrink-0" />
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Localização..."
                    className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/20" />
                  <button onClick={() => { setShowLocationInput(false); setLocation(""); }} className="text-white/20 hover:text-rose-400 transition-colors"><X size={13} /></button>
                </div>
              </motion.div>
            )}
            {showMentionInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                <div className="flex items-center gap-2.5 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5">
                  <AtSign size={13} className="text-sky-400 shrink-0" />
                  <input value={mentionText} onChange={e => setMentionText(e.target.value)} placeholder="atleta1, atleta2..."
                    className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/20" />
                  <button onClick={() => { setShowMentionInput(false); setMentionText(""); }} className="text-white/20 hover:text-rose-400 transition-colors"><X size={13} /></button>
                </div>
              </motion.div>
            )}
            {showHashtagInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                <div className="flex items-center gap-2.5 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5">
                  <Hash size={13} className="text-sky-400 shrink-0" />
                  <input value={hashtagText} onChange={e => setHashtagText(e.target.value)} placeholder="hipertrofia, cut, treino..."
                    className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/20" />
                  <button onClick={() => { setShowHashtagInput(false); setHashtagText(""); }} className="text-white/20 hover:text-rose-400 transition-colors"><X size={13} /></button>
                </div>
              </motion.div>
            )}
            {canSponsored && showSponsoredInput && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                <div className="flex items-center gap-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2.5">
                  <Gift size={13} className="text-orange-400 shrink-0" />
                  <input value={sponsoredLabel} onChange={e => setSponsoredLabel(e.target.value)} placeholder="Nome do patrocinador..."
                    className="flex-1 bg-transparent text-white text-sm font-bold outline-none placeholder:text-white/20" />
                  <button onClick={() => { setShowSponsoredInput(false); setSponsoredLabel(""); }} className="text-white/20 hover:text-rose-400 transition-colors"><X size={13} /></button>
                </div>
              </motion.div>
            )}
            {showPollBuilder && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2.5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-sky-500" />
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-[9px] font-black uppercase text-sky-500 italic tracking-widest">Enquete</span>
                    <button onClick={() => setShowPollBuilder(false)} className="text-white/20 hover:text-rose-500 transition-colors"><X size={13} /></button>
                  </div>
                  <input
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="Pergunta da enquete..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-sky-500/40 transition-all placeholder:text-white/20"
                  />
                  <div className="space-y-1.5">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                          placeholder={`Opção ${i + 1}`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500/40 transition-all placeholder:text-white/20 uppercase italic"
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} className="text-white/20 hover:text-rose-400 transition-colors">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < MAX_POLL_OPTIONS && (
                    <button
                      onClick={() => setPollOptions(prev => [...prev, ""])}
                      className="flex items-center gap-1.5 text-sky-400/50 hover:text-sky-400 text-[9px] font-black uppercase tracking-widest transition-colors">
                      <PlusCircle size={13} /> Adicionar opção
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar */}
          <div className="flex justify-between items-center pt-3 border-t border-white/5 gap-2 flex-wrap">
            <div className="flex gap-0.5 text-white/25 flex-wrap items-center">
              {canUploadMedia && (
                <button onClick={() => fileInputRef.current?.click()} title="Foto"
                  className="p-2 rounded-xl hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                  <ImageIcon size={18} />
                </button>
              )}
              {canUploadVideo && (
                <button onClick={() => videoInputRef.current?.click()} title="Vídeo"
                  className="p-2 rounded-xl hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                  <VideoIcon size={18} />
                </button>
              )}
              {canGif && (
                <button onClick={() => gifInputRef.current?.click()} title="GIF"
                  className="text-[9px] font-black border border-white/15 rounded-lg px-1.5 py-1 mx-1 hover:border-sky-400 hover:text-sky-400 transition-all">
                  GIF
                </button>
              )}
              {canUploadAudio && (
                <button onClick={() => audioInputRef.current?.click()} title="Áudio"
                  className="p-2 rounded-xl hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                  <Music2 size={18} />
                </button>
              )}
              {canUploadDoc && (
                <button onClick={() => docInputRef.current?.click()} title="Documento"
                  className="p-2 rounded-xl hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                  <FileText size={18} />
                </button>
              )}
              {canPoll && (
                <button onClick={() => setShowPollBuilder(!showPollBuilder)} title="Enquete"
                  className={`p-2 rounded-xl transition-all ${showPollBuilder ? "text-sky-500 bg-sky-500/10" : "hover:text-sky-500 hover:bg-sky-500/10"}`}>
                  <BarChart2 size={18} />
                </button>
              )}
              {canLocation && (
                <button onClick={() => setShowLocationInput(!showLocationInput)} title="Localização"
                  className={`p-2 rounded-xl transition-all ${showLocationInput ? "text-sky-500 bg-sky-500/10" : "hover:text-sky-500 hover:bg-sky-500/10"}`}>
                  <MapPin size={18} />
                </button>
              )}
              {canMention && (
                <button onClick={() => setShowMentionInput(!showMentionInput)} title="Mencionar"
                  className={`p-2 rounded-xl transition-all ${showMentionInput ? "text-sky-500 bg-sky-500/10" : "hover:text-sky-500 hover:bg-sky-500/10"}`}>
                  <AtSign size={18} />
                </button>
              )}
              {canHashtag && (
                <button onClick={() => setShowHashtagInput(!showHashtagInput)} title="Hashtag"
                  className={`p-2 rounded-xl transition-all ${showHashtagInput ? "text-sky-500 bg-sky-500/10" : "hover:text-sky-500 hover:bg-sky-500/10"}`}>
                  <Hash size={18} />
                </button>
              )}
              {canSponsored && (
                <button onClick={() => setShowSponsoredInput(!showSponsoredInput)} title="Patrocinado"
                  className={`p-2 rounded-xl transition-all ${showSponsoredInput ? "text-orange-400 bg-orange-500/10" : "hover:text-orange-400 hover:bg-orange-500/10"}`}>
                  <Gift size={18} />
                </button>
              )}
            </div>

            <button
              onClick={handlePost}
              disabled={isPosting || (!postText.trim() && previewMedias.length === 0 && !pollQuestion.trim())}
              className="bg-sky-500 text-black px-6 py-2.5 rounded-xl font-black uppercase italic text-xs tracking-widest shadow-[0_0_16px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 disabled:opacity-30 transition-all flex items-center gap-1.5 shrink-0"
            >
              {isPosting ? <Loader2 size={13} className="animate-spin" /> : <><Zap size={13} /> Publicar</>}
            </button>
          </div>

          {/* File inputs ocultos */}
          <input ref={fileInputRef}  type="file" hidden multiple accept="image/*"              onChange={e => handleFileChange(e, "image")} />
          <input ref={videoInputRef} type="file" hidden multiple accept="video/*"              onChange={e => handleFileChange(e, "video")} />
          <input ref={audioInputRef} type="file" hidden multiple accept="audio/*"              onChange={e => handleFileChange(e, "audio")} />
          <input ref={docInputRef}   type="file" hidden multiple accept=".pdf,.doc,.docx,.txt" onChange={e => handleFileChange(e, "document")} />
          <input ref={gifInputRef}   type="file" hidden multiple accept="image/gif"            onChange={e => handleFileChange(e, "gif")} />
        </div>
      )}

      {/* ── NAVEGAÇÃO ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-[56px] z-40 bg-[#010307]/95 backdrop-blur-md border-b border-white/5 px-1 py-2.5 flex items-center justify-around">
        {([
          { id: "explorar",   icon: <Compass size={19} />,    label: "Radar"   },
          { id: "seguindo",   icon: <Users size={19} />,      label: "Rede"    },
          { id: "tendencias", icon: <TrendingUp size={19} />, label: "Elite"   },
          { id: "meu_perfil", icon: <User size={19} />,       label: "Matriz"  },
          { id: "salvos",     icon: <Bookmark size={19} />,   label: "Salvos"  },
        ] as { id: FeedTab; icon: React.ReactNode; label: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-2 sm:px-4 py-1 transition-all rounded-xl
              ${activeTab === tab.id ? "text-sky-400" : "text-white/20 hover:text-white/50"}`}>
            {tab.icon}
            <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.9)]" />
            )}
          </button>
        ))}
      </nav>

      {/* ── ABA TENDÊNCIAS ────────────────────────────────────────────────────── */}
      {activeTab === "tendencias" && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-3 sm:px-4 py-4 space-y-2.5">
          <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1 mb-3">Em alta · AtivoraFeed</p>
          {TRENDING_FITNESS.map((t, i) => (
            <button key={t.tag}
              onClick={() => { setSearchQuery(t.tag); setShowSearch(true); }}
              className="w-full flex items-center justify-between bg-[#050B14]/70 border border-white/5 rounded-2xl px-5 py-3.5 hover:border-sky-500/25 transition-all group">
              <div className="flex items-center gap-3.5">
                <span className="text-white/15 font-black text-base w-5 text-right tabular-nums">{i + 1}</span>
                <div className="text-left">
                  <p className="text-white/80 font-black text-sm group-hover:text-sky-400 transition-colors">#{t.tag}</p>
                  <p className="text-white/25 text-[10px] font-bold">{t.posts.toLocaleString()} posts</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {t.trend === "up"     && <TrendingUp   size={14} className="text-green-400" />}
                {t.trend === "down"   && <TrendingDown size={14} className="text-rose-400"  />}
                {t.trend === "stable" && <Radio        size={14} className="text-white/15"  />}
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {/* ── ABA PERFIL ────────────────────────────────────────────────────────── */}
      {activeTab === "meu_perfil" && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-3 sm:px-4 py-4">
          <div className="bg-gradient-to-br from-[#050B14] to-[#0A1222] ring-1 ring-white/10 rounded-[24px] p-5 sm:p-7 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Avatar + info */}
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div
                className="rounded-[20px] bg-gradient-to-br from-sky-500 to-purple-600 p-[2px] overflow-hidden shrink-0"
                style={{ width: 72, height: 72 }}
              >
                <div className="w-full h-full bg-[#010307] rounded-[18px] overflow-hidden flex items-center justify-center">
                  {isValidUrl(safeUser.avatar)
                    ? <Image src={safeUser.avatar} alt="Avatar" fill className="object-cover" unoptimized />
                    : <span className="font-black text-2xl text-sky-500">{safeUser.username[0]?.toUpperCase()}</span>
                  }
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter leading-none">
                    @{safeUser.username}
                  </h2>
                  {safeUser.is_verified && <CheckCircle2 size={16} className="text-sky-400 shrink-0" />}
                </div>
                <span className="inline-block bg-white/5 border border-white/10 text-white/35 text-[8px] font-black uppercase rounded-full px-2.5 py-1 tracking-widest mt-1.5">
                  {ROLE_LABEL[safeUser.role ?? "aluno"] ?? safeUser.role}
                </span>
                {safeUser.bio && (
                  <p className="text-white/35 text-xs mt-1.5 leading-relaxed line-clamp-2">{safeUser.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 relative z-10 text-center">
              <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
                <span className="block text-xl font-black text-white leading-none mb-1">{posts.length}</span>
                <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Posts</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
                <span className="block text-xl font-black text-white leading-none mb-1">
                  {(safeUser.followers ?? 0).toLocaleString()}
                </span>
                <span className="text-[8px] font-black text-white/25 uppercase tracking-widest">Seguidores</span>
              </div>
              <div className="bg-sky-500/10 border border-sky-500/20 p-3.5 rounded-2xl">
                <span className="block text-xl font-black text-sky-400 leading-none mb-1">{userStats.nivel}</span>
                <span className="text-[8px] font-black text-sky-400/50 uppercase tracking-widest">Nível</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-white/25 tracking-widest italic">Energia Vital</span>
                <span className="text-base font-black italic text-sky-400">
                  {userStats.xp} <span className="text-white/20 text-xs font-bold">/ 500 XP</span>
                </span>
              </div>
              <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden ring-1 ring-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((userStats.xp % 500) / 5, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full"
                />
              </div>
            </div>

            {/* Conquistas */}
            <div className="mt-5 relative z-10">
              <p className="text-[9px] font-black uppercase text-white/15 tracking-widest mb-2.5">Conquistas</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { icon: "🏋️", label: "1º Treino"  },
                  { icon: "🔥", label: "7 dias"      },
                  { icon: "💪", label: "Evolução"    },
                  { icon: "⚡", label: "Elite"       },
                ].map(a => (
                  <div key={a.label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                    <span className="text-sm leading-none">{a.icon}</span>
                    <span className="text-[8px] font-black text-white/35 uppercase tracking-widest">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ABA SALVOS ────────────────────────────────────────────────────────── */}
      {activeTab === "salvos" && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-4">
          <div className="py-20 text-center opacity-20">
            <Bookmark size={36} className="mx-auto mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest">Nenhum post salvo ainda</p>
          </div>
        </motion.div>
      )}

      {/* ── FEED DE POSTS ─────────────────────────────────────────────────────── */}
      {(activeTab === "explorar" || activeTab === "seguindo") && (
        <div className="px-3 sm:px-4 py-3 space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {FILTROS_FEED.map(f => (
              <button key={f} onClick={() => setActiveFiltro(f)}
                className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3.5 py-2 rounded-full border transition-all
                  ${activeFiltro === f
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
                    : "border-white/10 text-white/25 hover:border-sky-500/25 hover:text-sky-400/60 bg-white/5"}`}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin text-sky-500 mx-auto" size={36} />
              <p className="text-[9px] font-black uppercase text-white/10 mt-4 tracking-widest animate-pulse">
                Sincronizando...
              </p>
            </div>
          ) : posts.length > 0 ? (
            <AnimatePresence>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  safeUser={safeUser}
                  isGuest={isGuest}
                  triggerXP={triggerXP}
                  onDelete={(id: number) => setPosts(prev => prev.filter(p => p.id !== id))}
                  onOpenUserProfile={onOpenUserProfile}
                  onOpenComments={handleOpenComments}
                  onRepost={handleRepost}
                  followedUsers={followedUsers}
                  onFollow={handleFollow}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-white/15 font-black uppercase text-[9px] tracking-[0.4em] mb-8 italic">
                {activeTab === "seguindo" ? "Siga atletas para ver o feed" : "Nenhum post ainda"}
              </p>
              <TransformationCard
                before="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
                after="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800"
              />
              <p className="text-[9px] font-black uppercase italic text-white/20 tracking-widest mt-5">
                Seja o primeiro a publicar no AtivoraFeed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
