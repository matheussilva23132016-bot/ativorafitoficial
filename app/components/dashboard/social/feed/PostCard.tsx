"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Repeat2,
  Trash2,
  Zap,
} from "lucide-react";

interface PostCardProps {
  post: any;
  safeUser: any;
  isGuest: boolean;
  onOpenComments: (id: number) => void;
  onOpenUserProfile: (u: string) => void;
  onDelete: (id: number) => Promise<void> | void;
  onFollow: (u: string) => void;
  followedUsers: string[];
}

const ReactionIndicator = ({ active, count, icon: Icon, color, onClick }: any) => (
  <button
    onClick={onClick}
    className={`group/react flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 transition-all active:scale-95 sm:gap-2 sm:px-3
      ${active ? `${color} bg-white/5` : "text-white/30 hover:bg-white/5 hover:text-white"}`}
  >
    <div className={`transition-transform duration-300 group-hover/react:scale-110 ${active ? "animate-pulse" : ""}`}>
      <Icon size={17} fill={active ? "currentColor" : "none"} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className="text-[10px] font-black tabular-nums sm:text-[11px]">{count || 0}</span>
  </button>
);

const isVideoUrl = (url: string, mediaType?: string | null, mediaCount = 1) =>
  /\.(mp4|webm|ogg|mov)$/i.test(url.split("?")[0]) || (mediaCount === 1 && mediaType === "video");

export const PostCard = ({
  post,
  safeUser,
  isGuest,
  onOpenComments,
  onOpenUserProfile,
  onDelete,
}: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.hasLiked || false);
  const [likeCount, setLikeCount] = useState(Number(post.likes || 0));
  const [pollData, setPollData] = useState(post.poll_data);
  const [isVoting, setIsVoting] = useState(false);
  const [isPollClosed, setIsPollClosed] = useState(Boolean(post.is_closed));
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsLiked(Boolean(post.hasLiked));
    setLikeCount(Number(post.likes || 0));
    setPollData(post.poll_data);
    setIsPollClosed(Boolean(post.is_closed));
  }, [post.id, post.hasLiked, post.likes, post.poll_data, post.is_closed]);

  const handleToggleLike = async () => {
    if (isGuest) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

    try {
      const response = await fetch("/api/posts/curtir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, username: safeUser.username }),
      });

      if (!response.ok) throw new Error("Falha ao atualizar curtida");

      const data = await response.json();
      setIsLiked(Boolean(data.liked));
      setLikeCount((current) => {
        if (Boolean(data.liked) === nextLiked) return current;
        return Math.max(0, current + (data.liked ? 1 : -1));
      });
    } catch (error) {
      console.error("[PostCard] Erro ao curtir:", error);
      setIsLiked(!nextLiked);
      setLikeCount((current) => Math.max(0, current + (nextLiked ? -1 : 1)));
    }
  };

  const handlePollVote = async (optionId: number) => {
    if (isGuest || isVoting || isPollClosed || pollData?.userVote) return;

    const previousPoll = pollData;
    const nextPoll = {
      ...pollData,
      userVote: optionId,
      options: pollData.options.map((option: any) =>
        Number(option.id) === optionId
          ? { ...option, votes: Number(option.votes || 0) + 1 }
          : option
      ),
      totalVotes: Number(pollData.totalVotes || 0) + 1,
    };

    setPollData(nextPoll);
    setIsVoting(true);

    try {
      const response = await fetch("/api/posts/enquetes/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          nickname: safeUser.username,
          opcao: optionId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao votar");

      setPollData((current: any) => ({
        ...current,
        userVote: data.userVote,
        totalVotes: Number(data.votes?.total || current.totalVotes || 0),
        options: current.options.map((option: any) => ({
          ...option,
          votes: Number(data.votes?.[option.id] || 0),
        })),
      }));
    } catch (error) {
      console.error("[PostCard] Erro ao votar:", error);
      setPollData(previousPoll);
    } finally {
      setIsVoting(false);
    }
  };

  const handleClosePoll = async () => {
    if (isGuest || isPollClosed || safeUser.username !== post.user) return;

    setIsPollClosed(true);

    try {
      const response = await fetch("/api/posts/encerrar-enquete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, ownerNickname: safeUser.username }),
      });

      if (!response.ok) throw new Error("Falha ao encerrar enquete");
    } catch (error) {
      console.error("[PostCard] Erro ao encerrar enquete:", error);
      setIsPollClosed(false);
    }
  };

  const handleDeletePost = async () => {
    if (isGuest || safeUser.username !== post.user || isDeleting) return;
    const confirmed = window.confirm("Apagar este post do Ativora Social?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-lg border border-white/[0.06] bg-[#05080d]/80 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all hover:border-white/10 hover:bg-[#07101a]">
      <div className="p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={() => onOpenUserProfile(post.user)}
              className="relative h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-2xl transition-transform active:scale-90 sm:h-12 sm:w-12"
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[7px] bg-[#0c121d]">
                {post.avatar ? (
                  <img src={post.avatar} className="h-full w-full object-cover" alt={post.user} />
                ) : (
                  <span className="text-lg font-bold text-sky-500/30">@</span>
                )}
              </div>
              {typeof post.nivel === "number" && post.nivel > 0 && (
                <div className="absolute -bottom-1 -right-1 rounded-md border-2 border-[#010307] bg-sky-500 px-1.5 py-0.5 text-[8px] font-black text-black shadow-lg">
                  {post.nivel}
                </div>
              )}
            </button>

            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-[14px] font-bold tracking-tight text-white md:text-[15px]">
                  @{post.user}
                </p>
                {post.is_verified && <CheckCircle2 size={13} className="shrink-0 text-sky-400" />}
              </div>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                {post.role && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                    {post.role}
                  </span>
                )}
                {post.role && post.timestamp && <span className="h-1 w-1 rounded-full bg-white/10" />}
                {post.timestamp && (
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Clock size={11} className="text-sky-500/40" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {post.timestamp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {safeUser.username === post.user && !isGuest && (
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/25 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 disabled:cursor-wait disabled:opacity-40"
              aria-label="Apagar post"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className="sm:pl-16">
          {post.content && (
            <p className="mb-4 break-words text-[14px] font-medium leading-6 tracking-tight text-white/90 selection:bg-sky-500/30 sm:text-[15px] md:text-[16px] md:leading-7">
              {post.content}
            </p>
          )}

          {post.location && (
            <div className="mb-4 flex w-fit max-w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-white/45">
              <MapPin size={13} className="shrink-0 text-sky-400/70" />
              <span className="truncate">{post.location}</span>
            </div>
          )}

          {post.is_poll && pollData?.options?.length > 0 && (
            <div className="mb-5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
              {pollData.question && (
                <p className="mb-3 text-[13px] font-bold tracking-tight text-white/85 sm:text-[14px]">
                  {pollData.question}
                </p>
              )}

              <div className="space-y-2.5">
                {pollData.options.map((opt: any) => {
                  const totalVotes = Number(pollData.totalVotes || 0);
                  const votes = Number(opt.votes || 0);
                  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const isSelected = Number(pollData.userVote) === Number(opt.id);

                  return (
                    <button
                      key={opt.id}
                      disabled={isGuest || isVoting || isPollClosed || Boolean(pollData.userVote)}
                      onClick={() => handlePollVote(Number(opt.id))}
                      className={`group/poll relative h-12 w-full overflow-hidden rounded-lg border text-left transition-all active:scale-[0.99] sm:h-14
                        ${isSelected ? "border-sky-500/35 bg-sky-500/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"}`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-sky-500/10 transition-all group-hover/poll:bg-sky-500/15"
                        style={{ width: `${percent}%` }}
                      />
                      <div className="relative z-10 flex h-full items-center justify-between gap-3 px-4 sm:px-5">
                        <span className="truncate text-[13px] font-bold text-white/80 transition-colors group-hover/poll:text-white">
                          {opt.text}
                        </span>
                        <span className="text-[12px] font-black uppercase tabular-nums text-white/25 transition-colors group-hover/poll:text-sky-500">
                          {percent}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
                <span>{Number(pollData.totalVotes || 0)} votos</span>
                {isPollClosed ? <span>Encerrada</span> : pollData.userVote ? <span>Voto registrado</span> : <span>Toque para votar</span>}
              </div>
              {!isPollClosed && safeUser.username === post.user && (
                <button
                  type="button"
                  onClick={handleClosePoll}
                  className="mt-3 rounded-lg border border-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/35 transition-all hover:border-sky-500/25 hover:text-sky-400"
                >
                  Encerrar enquete
                </button>
              )}
            </div>
          )}

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className={`mb-5 grid overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] shadow-2xl ${post.mediaUrls.length > 1 ? "grid-cols-1 gap-1.5 sm:grid-cols-2" : "grid-cols-1"}`}>
              {post.mediaUrls.map((url: string, idx: number) => (
                <div key={idx} className="group/media relative aspect-[4/5] cursor-zoom-in overflow-hidden sm:aspect-video">
                  {isVideoUrl(url, post.mediaType, post.mediaUrls.length) ? (
                    <video src={url} className="h-full w-full object-cover" controls playsInline />
                  ) : (
                    <img src={url} className="h-full w-full object-cover transition-transform duration-1000 group-hover/media:scale-110" alt="" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-all duration-500 group-hover/media:opacity-100" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-white/[0.04] pt-3">
            <div className="-ml-1 flex min-w-0 flex-wrap items-center gap-1 sm:gap-2">
              <ReactionIndicator
                active={isLiked}
                count={likeCount}
                icon={Heart}
                color="text-rose-500"
                onClick={handleToggleLike}
              />
              <ReactionIndicator
                count={post.comentarios_count}
                icon={MessageCircle}
                onClick={() => onOpenComments(post.id)}
              />
              {typeof post.reposts_count === "number" && (
                <ReactionIndicator count={post.reposts_count} icon={Repeat2} color="text-emerald-500" />
              )}
              {typeof post.zaps === "number" && (
                <div className="hidden sm:block">
                  <ReactionIndicator count={post.zaps} icon={Zap} color="text-sky-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
