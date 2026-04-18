"use client";

import React, { useRef, useState } from "react";
import { Loader2, Play, PlusCircle } from "lucide-react";

interface Story {
  id: string;
  user: string;
  avatar: string | null;
  mediaUrl?: string;
  mediaType?: string;
  seen: boolean;
}

interface StoriesProps {
  stories: Story[];
  onOpenStory: (index: number) => void;
  onCreateStory?: (file: File) => Promise<void> | void;
  canStory?: boolean;
  isGuest?: boolean;
  isCreating?: boolean;
}

function StoryPreview({ story }: { story: Story }) {
  const [fallbackToAvatar, setFallbackToAvatar] = useState(false);
  const [fallbackToInitial, setFallbackToInitial] = useState(false);

  const mediaUrl = String(story.mediaUrl || "").trim();
  const avatarUrl = String(story.avatar || "").trim();
  const mediaType = String(story.mediaType || "image").toLowerCase();
  const isVideoStory = mediaType === "video";

  if (mediaUrl && !fallbackToAvatar) {
    if (isVideoStory) {
      return (
        <div className="relative h-full w-full overflow-hidden">
          <video
            src={mediaUrl}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            onError={() => setFallbackToAvatar(true)}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-white/20 bg-black/45 p-1.5">
              <Play size={10} className="fill-white text-white" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <img
        src={mediaUrl}
        alt={story.user}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={() => setFallbackToAvatar(true)}
      />
    );
  }

  if (avatarUrl && !fallbackToInitial) {
    return (
      <img
        src={avatarUrl}
        alt={story.user}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={() => setFallbackToInitial(true)}
      />
    );
  }

  return <span className="text-xl font-bold capitalize text-white/10">{story.user?.[0] || "@"}</span>;
}

export const Stories = ({
  stories,
  onOpenStory,
  onCreateStory,
  canStory,
  isGuest,
  isCreating = false,
}: StoriesProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !onCreateStory) return;
    await onCreateStory(file);
  };

  return (
    <div className="mb-4 py-2 sm:mb-5">
      <div className="scrollbar-none flex snap-x gap-3 overflow-x-auto px-1 pb-3 sm:gap-4">
        {canStory && !isGuest && (
          <>
            <button
              type="button"
              disabled={isCreating}
              onClick={() => fileInputRef.current?.click()}
              className="group flex shrink-0 snap-start flex-col items-center gap-2 transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] shadow-xl transition-all group-hover:border-sky-500/70 group-hover:bg-sky-500/5 sm:h-[72px] sm:w-[72px]">
                {isCreating ? (
                  <Loader2 size={22} className="animate-spin text-sky-500" />
                ) : (
                  <PlusCircle size={22} className="text-white/25 transition-colors group-hover:text-sky-500" />
                )}
              </div>
              <span className="max-w-16 truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/20 transition-colors group-hover:text-sky-400">
                Relatar
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </>
        )}

        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpenStory(i)}
            className="group relative flex shrink-0 snap-start flex-col items-center gap-2 transition-all active:scale-95"
          >
            <div
              className={`h-16 w-16 rounded-lg p-[2px] transition-all sm:h-[72px] sm:w-[72px]
              ${s.seen
                ? "bg-white/[0.08]"
                : "bg-gradient-to-tr from-sky-400 via-emerald-500 to-rose-500 shadow-[0_0_25px_rgba(56,189,248,0.18)] group-hover:shadow-[0_0_35px_rgba(56,189,248,0.3)]"}`}
            >
                <div className="h-full w-full overflow-hidden rounded-[7px] bg-[#010307] p-[2px]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[6px] bg-white/[0.03]">
                    <StoryPreview story={s} />
                  </div>
                </div>
              </div>

            {!s.seen && (
              <div className="absolute right-0 top-0 flex h-4 w-4 translate-x-1 -translate-y-1 items-center justify-center rounded-full border-2 border-[#010307] bg-[#010307]">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
              </div>
            )}

            <span
              className={`max-w-20 truncate text-[11px] font-bold tracking-tight transition-colors
              ${s.seen ? "text-white/[0.18]" : "text-white/[0.65] group-hover:text-sky-400"}`}
            >
              {s.user}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
