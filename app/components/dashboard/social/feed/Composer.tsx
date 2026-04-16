"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Image as ImageIcon,
  Loader2,
  MapPin,
  X,
  Zap,
} from "lucide-react";

interface ComposerProps {
  safeUser: any;
  onPost: (content: any) => Promise<void> | void;
  isPosting: boolean;
}

interface MediaDraft {
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

const MAX_MEDIA_ITEMS = 4;

const ComposerToolBtn = ({ icon: Icon, label, onClick, active }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`group/tool flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 transition-all active:scale-95
      ${active ? "border-sky-500/25 bg-sky-500/10 text-sky-400" : "border-white/[0.06] bg-white/[0.03] text-white/[0.45] hover:border-white/[0.12] hover:text-white"}`}
  >
    <Icon size={17} className={active ? "" : "transition-transform group-hover/tool:scale-105"} />
    <span className="text-[10px] font-black uppercase tracking-widest sm:text-[11px]">{label}</span>
  </button>
);

const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Falha ao enviar mídia");
  }

  const data = await response.json();
  return data.url as string;
};

export const Composer = ({ safeUser, onPost, isPosting }: ComposerProps) => {
  const [text, setText] = useState("");
  const [mediaDrafts, setMediaDrafts] = useState<MediaDraft[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionOne, setPollOptionOne] = useState("");
  const [pollOptionTwo, setPollOptionTwo] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaDraftsRef = useRef<MediaDraft[]>([]);

  useEffect(() => {
    mediaDraftsRef.current = mediaDrafts;
  }, [mediaDrafts]);

  useEffect(() => {
    return () => {
      mediaDraftsRef.current.forEach((media) => URL.revokeObjectURL(media.previewUrl));
    };
  }, []);

  const hasValidPoll =
    showPoll &&
    pollQuestion.trim().length > 0 &&
    pollOptionOne.trim().length > 0 &&
    pollOptionTwo.trim().length > 0;
  const hasContent = text.trim().length > 0 || mediaDrafts.length > 0 || hasValidPoll;
  const isBusy = isPosting || isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = Math.max(0, MAX_MEDIA_ITEMS - mediaDrafts.length);
    const selected = files.slice(0, remainingSlots).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" as const : "image" as const,
    }));

    setMediaDrafts((current) => [...current, ...selected]);
    e.target.value = "";
  };

  const removeMedia = (idx: number) => {
    setMediaDrafts((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const resetComposer = () => {
    mediaDrafts.forEach((media) => URL.revokeObjectURL(media.previewUrl));
    setText("");
    setMediaDrafts([]);
    setShowPoll(false);
    setPollQuestion("");
    setPollOptionOne("");
    setPollOptionTwo("");
    setShowLocation(false);
    setLocation("");
  };

  const handlePost = async () => {
    if (!hasContent || isBusy) return;

    setIsUploading(true);
    try {
      const uploadedMedia = await Promise.all(mediaDrafts.map((media) => uploadMedia(media.file)));

      await onPost({
        text: text.trim(),
        mediaPaths: uploadedMedia,
        mediaType: mediaDrafts.some((media) => media.type === "video") ? "video" : uploadedMedia.length ? "image" : "text",
        location: showLocation ? location.trim() : "",
        poll: hasValidPoll
          ? {
              question: pollQuestion.trim(),
              options: [pollOptionOne.trim(), pollOptionTwo.trim()],
            }
          : null,
      });

      resetComposer();
    } catch (error) {
      console.error("[Composer] Erro ao publicar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative mb-5 overflow-hidden rounded-lg border border-white/[0.08] bg-[#05080d]/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5 md:mb-6 md:p-6">
      <div className="relative z-10 flex gap-3 sm:gap-4">
        <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-xl sm:h-12 sm:w-12">
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[7px] bg-[#0c121d]">
            {safeUser.avatar || safeUser.avatar_url || safeUser.foto_url ? (
              <img src={safeUser.avatar || safeUser.avatar_url || safeUser.foto_url} className="h-full w-full object-cover" alt="" />
            ) : (
              <span className="text-xl font-bold text-sky-500">@</span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="No que você está pensando, atleta?"
            className="custom-scrollbar h-20 w-full resize-none border-none bg-transparent pt-1 text-base font-medium text-white outline-none selection:bg-sky-500/30 placeholder:text-white/20 sm:h-24 sm:text-lg"
          />

          {mediaDrafts.length > 0 && (
            <div className="scrollbar-none mt-4 flex snap-x gap-3 overflow-x-auto pb-3">
              {mediaDrafts.map((media, idx) => (
                <div key={media.previewUrl} className="group/preview relative h-32 w-32 shrink-0 snap-start overflow-hidden rounded-lg border border-white/10 shadow-2xl sm:h-40 sm:w-40">
                  {media.type === "video" ? (
                    <video src={media.previewUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={media.previewUrl} className="h-full w-full object-cover" alt="" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute right-2 top-2 flex h-8 w-8 scale-90 items-center justify-center rounded-lg bg-black/80 text-white opacity-0 backdrop-blur-md transition-all group-hover/preview:scale-100 group-hover/preview:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showPoll && (
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Pergunta da enquete"
                className="mb-3 h-11 w-full rounded-lg border border-white/[0.06] bg-[#010307]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-sky-500/40"
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={pollOptionOne}
                  onChange={(e) => setPollOptionOne(e.target.value)}
                  placeholder="Opção 1"
                  className="h-11 rounded-lg border border-white/[0.06] bg-[#010307]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-sky-500/40"
                />
                <input
                  value={pollOptionTwo}
                  onChange={(e) => setPollOptionTwo(e.target.value)}
                  placeholder="Opção 2"
                  className="h-11 rounded-lg border border-white/[0.06] bg-[#010307]/70 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-sky-500/40"
                />
              </div>
            </div>
          )}

          {showLocation && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <MapPin size={16} className="shrink-0 text-sky-400/70" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Adicionar local"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/20"
              />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 border-t border-white/[0.05] pt-4 md:flex-row md:items-center md:justify-between">
            <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <ComposerToolBtn icon={ImageIcon} label="Mídia" onClick={() => fileInputRef.current?.click()} active={mediaDrafts.length > 0} />
              <ComposerToolBtn icon={BarChart2} label="Enquete" onClick={() => setShowPoll(!showPoll)} active={showPoll} />
              <ComposerToolBtn icon={MapPin} label="Local" onClick={() => setShowLocation(!showLocation)} active={showLocation} />
            </div>

            <button
              type="button"
              disabled={isBusy || !hasContent}
              onClick={handlePost}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-sky-500 px-6 text-sm font-bold tracking-tight text-black shadow-[0_10px_30px_rgba(56,189,248,0.2)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(56,189,248,0.35)] md:w-auto"
            >
              {isBusy ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Postar <Zap size={16} fill="currentColor" strokeWidth={0} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple hidden accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
};
