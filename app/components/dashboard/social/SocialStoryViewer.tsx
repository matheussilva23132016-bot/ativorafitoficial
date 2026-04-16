"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export const SocialStoryViewer = ({ stories, initialIndex, onClose }: { 
  stories: any[], 
  initialIndex: number, 
  onClose: () => void 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const story = stories[currentIndex];
  const username = story?.username || "ativora";

  // Auto-avanço: 5 segundos por story
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  if (!story) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] bg-black flex flex-col items-center justify-center"
    >
      {/* Barra de Progresso */}
      <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-10">
        {stories.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-sky-500"
              initial={{ width: 0 }}
              animate={{ width: i === currentIndex ? "100%" : (i < currentIndex ? "100%" : "0%") }}
              transition={{ duration: i === currentIndex ? 5 : 0, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      {/* Header do Story */}
      <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-sky-500 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
              {story.avatar_url ? <Image src={story.avatar_url} alt={username} fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-xs font-black">{username[0]}</div>}
            </div>
          </div>
          <span className="font-bold text-white text-sm shadow-lg">@{username}</span>
        </div>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white"><X size={24} /></button>
      </div>

      {/* Mídia principal */}
      <div className="relative w-full h-full max-w-lg overflow-hidden">
        {story.media_type === 'video' ? (
          <video src={story.media_url} autoPlay muted playsInline controls className="w-full h-full object-contain" />
        ) : story.media_url ? (
          <Image src={story.media_url} alt="Story" fill className="object-contain" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-8 text-center text-sm font-bold text-white/35">
            Este story não possui mídia disponível.
          </div>
        )}
      </div>

      {/* Controles de Navegação Invisíveis */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} />
        <div className="flex-1" onClick={() => currentIndex < stories.length - 1 ? setCurrentIndex(currentIndex + 1) : onClose()} />
      </div>
    </motion.div>
  );
};
