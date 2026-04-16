"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, Zap, X } from "lucide-react";
import { toast } from "sonner";
import {
  isGenericSocialNickname,
  isGenericSocialPost,
  isGenericSocialTag,
  isGenericSocialUser,
} from "@/lib/socialFilters";

// Layout & UI Components
import { SocialSidebar } from "./layout/SocialSidebar";
import { SocialRightRail } from "./layout/SocialRightRail";
import { SocialBottomNav } from "./layout/SocialBottomNav";
import { Stories } from "./feed/Stories";
import { Composer } from "./feed/Composer";
import { PostCard } from "./feed/PostCard";
import { SkeletonFeed } from "./feed/SkeletonFeed";
import { SearchModal } from "./modals/SearchModal";
import { NotificationDrawer } from "./modals/NotificationDrawer";
import { CommentDrawer } from "./modals/CommentDrawer";
import { SocialStoryViewer } from "./SocialStoryViewer";

// Types
type FeedTab = "explorar" | "tendencias" | "meu_perfil" | "salvos" | "seguindo";

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
  mediaUrl?: string | null;
  mediaUrls?: string[];
  mediaType?: string | null;
  type?: string;
  location?: string | null;
  is_poll?: boolean;
  poll_data?: any;
  timestamp?: string;
  is_closed?: boolean;
  isRepost?: boolean;
  originalPost?: any;
  reposts_count?: number;
  zaps?: number;
  nivel?: number;
}

const parseMediaValue = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(parseMediaValue);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return parseMediaValue(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(parseMediaValue);
  }

  return [];
};

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toOptionalNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toBoolean = (value: unknown) => value === true || value === 1 || value === "1";

const repairText = (value: unknown) => {
  if (typeof value !== "string") return value;
  if (!/[ÃÂâð]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded && !decoded.includes("�") ? decoded : value;
  } catch {
    return value;
  }
};

const formatTimestamp = (minutesAgo?: unknown, rawDate?: unknown) => {
  const minutes = Number(minutesAgo);

  if (Number.isFinite(minutes)) {
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${Math.floor(minutes)}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    return `${Math.floor(hours / 24)}d`;
  }

  if (typeof rawDate === "string" || rawDate instanceof Date) {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      const diffMinutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));
      return formatTimestamp(diffMinutes);
    }
  }

  return undefined;
};

const parsePollData = (value: unknown) => {
  if (!value || typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizePollData = (row: any) => {
  const parsed = parsePollData(row.poll_data);
  if (parsed && typeof parsed === "object") return parsed;

  if (!row.enquete_pergunta || !row.enquete_op1 || !row.enquete_op2) return null;

  const op1Votes = toNumber(row.enquete_op1_votos);
  const op2Votes = toNumber(row.enquete_op2_votos);

  return {
    question: repairText(row.enquete_pergunta),
    userVote: toOptionalNumber(row.enquete_voto_usuario) || null,
    totalVotes: op1Votes + op2Votes,
    options: [
      { id: 1, text: repairText(row.enquete_op1), votes: op1Votes },
      { id: 2, text: repairText(row.enquete_op2), votes: op2Votes },
    ],
  };
};

const normalizePost = (row: any): PostData => {
  const mediaUrls = Array.from(
    new Set(
      [
        ...parseMediaValue(row.mediaUrls),
        ...parseMediaValue(row.media_urls),
        ...parseMediaValue(row.media_url),
        ...parseMediaValue(row.mediaUrl),
        ...parseMediaValue(row.imagem_url),
      ].filter(Boolean)
    )
  );

  const pollData = normalizePollData(row);

  return {
    id: toNumber(row.id, Date.now()),
    user: String(row.nickname || row.user || row.usuario_nickname || "").replace(/^@/, ""),
    avatar: row.avatar || row.avatar_url || row.foto_url || null,
    role: row.role || undefined,
    is_verified: toBoolean(row.is_verified),
    content: repairText(row.content || row.conteudo || "") as string,
    likes: toNumber(row.likes ?? row.curtidas),
    comentarios_count: toNumber(row.comentarios_count ?? row.comments_count),
    hasLiked: toBoolean(row.hasLiked ?? row.has_liked),
    mediaUrl: mediaUrls[0] || null,
    mediaUrls,
    mediaType: row.media_type || row.mediaType || null,
    type: row.type || row.post_type || undefined,
    location: repairText(row.location || row.localizacao || null) as string | null,
    is_poll: toBoolean(row.is_poll) || Boolean(pollData),
    poll_data: pollData,
    timestamp: formatTimestamp(row.minutes_ago, row.criado_em || row.created_at),
    is_closed: toBoolean(row.is_closed),
    isRepost: toBoolean(row.isRepost),
    originalPost: row.originalPost,
    reposts_count: toOptionalNumber(row.reposts_count),
    zaps: toOptionalNumber(row.zaps),
    nivel: toOptionalNumber(row.nivel ?? row.nivel_int),
  };
};

const normalizeStory = (story: any) => ({
  ...story,
  id: String(story.id),
  user: story.user || story.username || story.nickname || "",
  avatar: story.avatar || story.avatar_url || null,
  mediaUrl: story.mediaUrl || story.media_url || "",
  mediaType: story.mediaType || story.media_type || "image",
  seen: toBoolean(story.seen),
});

const uploadStoryMedia = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Falha ao enviar story");
  }

  const data = await response.json();
  return data.url as string;
};

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
// XP GAIN ALERT
// ══════════════════════════════════════════════════════════════════════════════
function XPGainAlert({ amount, onComplete }: { amount: number; onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 40 }}
      animate={{ opacity: 1, scale: 1.15, y: -100 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 380 }}
      onAnimationComplete={onComplete}
      className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-[1500] pointer-events-none"
    >
      <div className="bg-sky-500 text-black font-black px-7 py-2.5 rounded-full border border-white/30 italic uppercase text-xs tracking-widest shadow-[0_0_30px_rgba(56,189,248,0.4)]">
        +{amount} XP
      </div>
    </motion.div>
  );
}

export const AtivoraFeed = ({
  currentUser,
  isGuest = false,
  onViewProfile,
  onOpenMessages,
  onOpenNotifications,
  onOpenUserProfile,
  onBack,
}: AtivoraFeedProps) => {
  // Main Feed State
  const [activeTab, setActiveTab] = useState<FeedTab>("explorar");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Panels State
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [showMobileComposer, setShowMobileComposer] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // User Stats & XP
  const [xpQueue, setXpQueue] = useState<{ id: number; amount: number }[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  
  // Current athlete profile helper
  const safeUser: UserProfile = currentUser ?? {
    username: "visitante",
    avatar: null,
    is_verified: false,
  };

  const triggerXP = useCallback((amount: number) => {
    setXpQueue(prev => [...prev, { id: Date.now(), amount }]);
  }, []);


  useEffect(() => {
    let mounted = true;

    const readArray = async (url: string) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`[AtivoraFeed] Falha ao carregar ${url}:`, error);
        return [];
      }
    };

    const loadFeed = async () => {
      setLoading(true);
      const current = encodeURIComponent(safeUser.username || "");

      try {
        const [postRows, savedRows, storyRows, trendRows, suggestionRows, followingRows] = await Promise.all([
          readArray(`/api/posts/listar?currentUser=${current}`),
          readArray(`/api/posts/listar_salvos?nickname=${current}`),
          readArray(`/api/social/stories?nickname=${current}`),
          readArray("/api/social/trending"),
          readArray(`/api/social/suggestions?currentUser=${current}`),
          readArray(`/api/social/following?nickname=${current}`),
        ]);

        if (!mounted) return;

        setPosts(postRows.map(normalizePost).filter((post) => post.user && !isGenericSocialPost(post)));
        setSavedPosts(savedRows.map(normalizePost).filter((post) => post.user && !isGenericSocialPost(post)));
        setStories(storyRows.map(normalizeStory).filter((story) => story.user && story.mediaUrl && !isGenericSocialNickname(story.user)));
        setTrendingTags(trendRows.map((trend) => ({ ...trend, tag: repairText(trend.tag) })).filter((trend) => trend.tag && !isGenericSocialTag(trend.tag)));
        setSuggestedUsers(suggestionRows.filter((user) => user?.username && !isGenericSocialUser(user)));
        setFollowedUsers(followingRows.filter(Boolean).map(String).filter((nickname) => !isGenericSocialNickname(nickname)));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadFeed();

    return () => {
      mounted = false;
    };
  }, [safeUser.username]);

  const loadNotifications = useCallback(async () => {
    if (!safeUser.username || safeUser.username === "visitante") {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch(`/api/social/notificacoes?username=${encodeURIComponent(safeUser.username)}`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[AtivoraFeed] Erro ao carregar notificacoes:", error);
    }
  }, [safeUser.username]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  // Handlers
  const handlePost = async (content: any) => {
    setIsPosting(true);

    try {
      const mediaPaths = Array.isArray(content.mediaPaths) ? content.mediaPaths : [];
      const mediaUrl = mediaPaths.length > 1 ? JSON.stringify(mediaPaths) : mediaPaths[0] || null;
      const poll = content.poll;
      const response = await fetch("/api/posts/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: safeUser.username,
          content: content.text,
          media_url: mediaUrl,
          media_type: content.mediaType || (mediaUrl ? "image" : "text"),
          role: safeUser.role,
          location: content.location,
          enquete_pergunta: poll?.question,
          enquete_op1: poll?.options?.[0],
          enquete_op2: poll?.options?.[1],
        }),
      });

      if (!response.ok) throw new Error("Falha ao salvar relato");

      const savedPost = await response.json();
      const newPost: PostData = {
        id: savedPost.id,
        user: safeUser.username,
        avatar: safeUser.avatar || safeUser.avatar_url || safeUser.foto_url || null,
        role: safeUser.role,
        is_verified: safeUser.is_verified,
        content: content.text,
        likes: 0,
        comentarios_count: 0,
        timestamp: "agora",
        mediaUrls: mediaPaths,
        mediaType: content.mediaType || null,
        location: content.location || null,
        is_poll: Boolean(poll),
        poll_data: poll
          ? {
              question: poll.question,
              userVote: null,
              totalVotes: 0,
              options: [
                { id: 1, text: poll.options[0], votes: 0 },
                { id: 2, text: poll.options[1], votes: 0 },
              ],
            }
          : null,
      };

      setPosts(prev => [newPost, ...prev]);
      triggerXP(10);
    } catch (error) {
      console.error("[AtivoraFeed] Erro ao postar:", error);
      throw error;
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateStory = async (file: File) => {
    setIsCreatingStory(true);

    try {
      const mediaUrl = await uploadStoryMedia(file);
      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      const response = await fetch("/api/social/stories/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: safeUser.username,
          mediaUrl,
          mediaType,
          role: safeUser.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Falha ao salvar story");
      }

      const newStory = {
        id: `local-${Date.now()}`,
        user: safeUser.username,
        avatar: safeUser.avatar || safeUser.avatar_url || safeUser.foto_url || null,
        mediaUrl,
        mediaType,
        seen: false,
      };

      setStories((current) => [newStory, ...current]);
      triggerXP(5);
    } catch (error) {
      console.error("[AtivoraFeed] Erro ao criar story:", error);
    } finally {
      setIsCreatingStory(false);
    }
  };

  const handleOpenComments = async (postId: number) => {
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/comentarios/listar?postId=${postId}`);
      if (res.ok) {
          const data = await res.json();
          const currentPost = posts.find((post) => post.id === postId);
          const canModerate = currentPost?.user === safeUser.username;

          setCommentsList(data.map((c: any) => ({
              id: c.id.toString(),
              user: c.nickname,
              avatar: c.avatar_url,
              text: repairText(c.conteudo) as string,
              timestamp: c.created_at ? formatTimestamp(undefined, c.created_at) || "agora" : "agora",
              likes: 0,
              canDelete: canModerate || c.nickname === safeUser.username,
          })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (text: string) => {
    if (!activeCommentsPostId) return;

    try {
      const response = await fetch("/api/posts/comentarios/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: activeCommentsPostId,
          nickname: safeUser.username,
          conteudo: text,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao salvar comentario");

      const newComment = {
        id: String(data.id || Date.now()),
        user: safeUser.username,
        avatar: safeUser.avatar || safeUser.avatar_url || safeUser.foto_url || "",
        text,
        timestamp: "agora",
        likes: 0,
        canDelete: true,
      };

      setCommentsList(prev => [...prev, newComment]);
      setPosts(prev => prev.map(p => p.id === activeCommentsPostId ? { ...p, comentarios_count: p.comentarios_count + 1 } : p));
      triggerXP(5);
    } catch (error) {
      console.error("[AtivoraFeed] Erro ao comentar:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activeCommentsPostId || isGuest) return;

    try {
      const response = await fetch(
        `/api/posts/comentarios/deletar?id=${encodeURIComponent(commentId)}&nickname=${encodeURIComponent(safeUser.username)}`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao apagar comentario");

      setCommentsList((current) => current.filter((comment) => comment.id !== commentId));
      setPosts((current) =>
        current.map((post) =>
          post.id === activeCommentsPostId
            ? { ...post, comentarios_count: Math.max(0, post.comentarios_count - 1) }
            : post
        )
      );
      toast.success("Comentario apagado.");
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel apagar o comentario.");
    }
  };

  const handleFollow = (nickname: string) => {
    setFollowedUsers(prev => prev.includes(nickname) ? prev.filter(u => u !== nickname) : [...prev, nickname]);
    triggerXP(5);
  };

  const handleDelete = async (id: number) => {
    if (isGuest) return;

    try {
      const response = await fetch(
        `/api/posts/deletar?id=${encodeURIComponent(String(id))}&nickname=${encodeURIComponent(safeUser.username)}`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao apagar post");

      setPosts(prev => prev.filter(p => p.id !== id));
      setSavedPosts(prev => prev.filter(p => p.id !== id));
      toast.success("Post apagado do Ativora Social.");
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel apagar o post.");
      throw error;
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!safeUser.username || safeUser.username === "visitante") return;

    try {
      await fetch("/api/social/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: safeUser.username }),
      });
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      console.error("[AtivoraFeed] Erro ao limpar notificacoes:", error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!safeUser.username || safeUser.username === "visitante") return;

    try {
      await fetch("/api/social/notificacoes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: safeUser.username }),
      });
      setNotifications([]);
    } catch (error) {
      console.error("[AtivoraFeed] Erro ao apagar notificacoes:", error);
    }
  };

  const handleOpenNotification = async (notification: any) => {
    if (!safeUser.username || safeUser.username === "visitante") return;

    setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item)
    );

    fetch("/api/social/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: safeUser.username, id: notification.id }),
    }).catch(() => null);

    setShowNotifPanel(false);

    if (notification.rawType === "message") {
      onOpenMessages();
      return;
    }

    if ((notification.rawType === "comment" || notification.rawType === "like") && notification.targetId) {
      const postId = Number(notification.targetId);
      if (Number.isFinite(postId)) handleOpenComments(postId);
    }
  };


  const challenges: any[] = [];
  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;
  const visiblePosts = activeTab === "salvos"
    ? savedPosts
    : activeTab === "seguindo"
      ? posts.filter((post) => followedUsers.includes(post.user))
      : activeTab === "tendencias"
        ? [...posts].sort((a, b) => (b.likes + b.comentarios_count) - (a.likes + a.comentarios_count))
        : posts;
  const showRightRail = trendingTags.length > 0 || suggestedUsers.length > 0 || challenges.length > 0;
  const feedGridClassName = showRightRail
    ? "grid w-full min-w-0 max-w-[1040px] grid-cols-1 gap-0 2xl:grid-cols-[minmax(0,680px)_minmax(280px,310px)] 2xl:gap-8"
    : "grid w-full min-w-0 max-w-[760px] grid-cols-1 gap-0";

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#010307] text-white">
      
      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] items-start">
        {/* ── SIDEBAR DESKTOP ─────────────────────────────────────────── */}
        <div className="hidden w-[232px] shrink-0 lg:block xl:w-[248px] 2xl:w-[260px]">
          <SocialSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            safeUser={safeUser}
            isGuest={isGuest}
            onOpenNotifications={() => setShowNotifPanel(true)}
            onOpenSearch={() => setShowSearch(true)}
            onBack={onBack}
            onOpenProfile={onViewProfile}
            onOpenMessages={onOpenMessages}
            notificationCount={unreadNotifications}
          />
        </div>

        {/* ── ÁREA PRINCIPAL DO FEED ───────────────────────────────────── */}
        <main className="min-h-dvh min-w-0 flex-1 overflow-x-hidden pb-28 lg:pb-10">
          <div className="flex w-full min-w-0 justify-center lg:px-4 xl:px-6">
            <div className={feedGridClassName}>
            
            {/* Feed Central */}
            <div className="min-h-dvh w-full min-w-0 pb-6">
              
              {/* Topo Mobile (Clean Axis Fix) */}
              <div className="sticky top-0 z-[100] flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#010307]/90 px-4 py-3 backdrop-blur-xl sm:px-5 lg:hidden">
                  <button
                    onClick={onBack}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/[0.55] transition-all active:scale-95"
                    aria-label="Voltar"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h1 className="text-xl font-bold tracking-tight text-white leading-none">Ativora <span className="text-sky-400">Social</span></h1>
                    <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-widest text-white/30">Compartilhe os seus resultados</span>
                  </div>
                  <button 
                    onClick={() => setShowSearch(true)} 
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/[0.55] shadow-xl transition-all active:scale-95"
                    aria-label="Buscar"
                  >
                    <Search size={18} strokeWidth={2} />
                  </button>
              </div>

              {/* Feed Content */}
              <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-4 lg:py-8 xl:px-6">
                 {/* Tabs Selection (Cleaned up) */}
                 <div className="scrollbar-none relative mb-4 flex gap-6 overflow-x-auto pb-px sm:mb-6 sm:gap-8">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.02]" />
                    <button 
                      onClick={() => setActiveTab("explorar")}
                      className={`relative whitespace-nowrap pb-3 text-[13px] font-bold tracking-tight transition-all
                        ${activeTab === "explorar" ? "text-white" : "text-white/30 hover:text-white/60"}`}
                    >
                      Descobrir
                      {activeTab === "explorar" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.3)]" />}
                    </button>
                    <button 
                      onClick={() => setActiveTab("seguindo")}
                      className={`relative whitespace-nowrap pb-3 text-[13px] font-bold tracking-tight transition-all
                        ${activeTab === "seguindo" ? "text-white" : "text-white/30 hover:text-white/60"}`}
                    >
                      Aliados
                      {activeTab === "seguindo" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.3)]" />}
                    </button>
                 </div>

                 {/* Stories (Premium Surface) */}
                 <Stories 
                   stories={stories} 
                   onOpenStory={(index) => setActiveStoryIndex(index)} 
                   onCreateStory={handleCreateStory}
                   canStory={true} 
                   isGuest={isGuest} 
                   isCreating={isCreatingStory}
                 />

                 {/* Composer (Premium Integration) */}
                 {!isGuest && activeTab === "explorar" && (
                   <div className="hidden lg:block">
                     <Composer 
                       safeUser={safeUser} 
                       onPost={handlePost} 
                       isPosting={isPosting} 
                     />
                   </div>
                 )}

                 {/* Feed List */}
                 <div className="space-y-3 sm:space-y-4">
                    {loading ? (
                      <SkeletonFeed />
                    ) : visiblePosts.length > 0 ? (
                      <AnimatePresence mode="popLayout">
                        {visiblePosts.map((post) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          >
                            <PostCard 
                              post={post}
                              safeUser={safeUser}
                              isGuest={isGuest}
                              onOpenComments={handleOpenComments}
                              onOpenUserProfile={onOpenUserProfile}
                              onDelete={handleDelete}
                              onFollow={handleFollow}
                              followedUsers={followedUsers}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="py-40 text-center">
                         <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.02]">
                            <Zap size={32} className="text-white/5" />
                         </div>
                         <p className="text-sm font-medium text-white/30 tracking-tight">
                            {activeTab === "salvos"
                              ? "Nenhum relato salvo ainda."
                              : activeTab === "seguindo"
                                ? "Nenhum relato dos seus aliados ainda."
                                : "Nenhum novo sinal detectado no radar."}<br/>
                            <span className="text-sky-500/50 mt-2 block">
                              {activeTab === "salvos"
                                ? "Salve relatos para consultar depois."
                                : activeTab === "seguindo"
                                  ? "Siga atletas para montar seu radar pessoal."
                                  : "Seja o primeiro a relatar sua evolução."}
                            </span>
                         </p>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            {/* ── COLUNA DIREITA ───────────────────────────────────────── */}
            {showRightRail && (
              <div className="hidden w-full max-w-[310px] shrink-0 2xl:block">
                <SocialRightRail 
                  trendingTags={trendingTags} 
                  suggestedUsers={suggestedUsers} 
                  challenges={challenges} 
                  onOpenUserProfile={onOpenUserProfile}
                />
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ── NAVEGAÇÃO MOBILE ─────────────────────────────────────────── */}
      <div className="lg:hidden">
        <SocialBottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          safeUser={safeUser}
          onOpenNotifications={() => setShowNotifPanel(true)}
          onOpenMessages={onOpenMessages}
          onOpenComposer={() => {
            if (!isGuest) setShowMobileComposer(true);
          }}
          onOpenProfile={onViewProfile}
          isGuest={isGuest}
          notificationCount={unreadNotifications}
        />
      </div>


      {/* ── MODAIS & PAINÉIS RESPONSIVOS ─────────────────────────────── */}
      
      {/* Mobile Composer (Premium Drawer) */}
      <AnimatePresence>
        {showMobileComposer && (
          <div className="fixed inset-0 z-[1000] lg:hidden flex flex-col justify-end">
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowMobileComposer(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             
             {/* Drawer */}
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg border-t border-white/10 bg-[#050B14] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
             >
                {/* Grab Handle */}
                <div className="w-full flex justify-center py-4">
                   <div className="h-1.5 w-12 rounded-full bg-white/10" />
                </div>

                <div className="flex items-center justify-between px-8 py-2">
                   <button 
                     onClick={() => setShowMobileComposer(false)} 
                     className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white"
                   >
                      <X size={20} />
                   </button>
                   <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-sky-500/80">Novo Relato</h2>
                   <div className="w-10 h-10" /> {/* Spacer */}
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
                   <Composer 
                     safeUser={safeUser} 
                     onPost={async (content) => {
                       await handlePost(content);
                       setShowMobileComposer(false);
                     }} 
                     isPosting={isPosting} 
                   />
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <SearchModal 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
        onSelectUser={onOpenUserProfile} 
        trendingTags={trendingTags}
      />

      <NotificationDrawer 
        isOpen={showNotifPanel} 
        onClose={() => setShowNotifPanel(false)} 
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDeleteAll={handleDeleteAllNotifications}
        onOpenNotification={handleOpenNotification}
      />

      <CommentDrawer 
        isOpen={activeCommentsPostId !== null}
        onClose={() => setActiveCommentsPostId(null)}
        postId={activeCommentsPostId}
        comments={commentsList}
        onSend={handleSendComment}
        onDelete={handleDeleteComment}
        currentUser={safeUser.username}
        isSending={false}
      />

      <AnimatePresence>
        {activeStoryIndex !== null && stories.length > 0 && (
          <SocialStoryViewer
            stories={stories.map((story) => ({
              username: story.user,
              avatar_url: story.avatar,
              media_url: story.mediaUrl,
              media_type: story.mediaType,
            }))}
            initialIndex={activeStoryIndex}
            onClose={() => setActiveStoryIndex(null)}
          />
        )}
      </AnimatePresence>

      {/* XP Gain Alerts */}
      <AnimatePresence>
        {xpQueue.map(xp => (
          <XPGainAlert 
            key={xp.id} 
            amount={xp.amount} 
            onComplete={() => setXpQueue(q => q.filter(i => i.id !== xp.id))} 
          />
        ))}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default AtivoraFeed;
