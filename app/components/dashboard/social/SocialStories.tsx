"use client";

import React from "react";
import { Plus } from "lucide-react";
import Image from "next/image";

interface Story {
  id: number;
  username: string;
  media_url: string;
  role: string;
}

interface SocialStoriesProps {
  stories: Story[];
  onAddStory: () => void;
  canPost: boolean;
  currentUser: any;
}

export const SocialStories = ({ stories, onAddStory, canPost, currentUser }: SocialStoriesProps) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
      {/* Botão de Adicionar (Só aparece se canPost for true) */}
      {canPost && (
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={onAddStory}>
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center hover:border-sky-500 transition-all">
            <Plus className="text-sky-500" size={24} />
          </div>
          <span className="text-[9px] font-black uppercase text-white/40 italic">Seu Story</span>
        </div>
      )}

      {/* Lista de Stories da Matriz */}
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
          <div className={`w-16 h-16 rounded-2xl p-[2px] ${
            story.role !== 'aluno' 
            ? 'bg-gradient-to-tr from-sky-500 via-purple-500 to-amber-500 animate-pulse shadow-neon' 
            : 'bg-sky-500'
          }`}>
            <div className="w-full h-full rounded-[14px] bg-black overflow-hidden relative border-2 border-black">
              <Image src={story.media_url} alt={story.username} fill className="object-cover" unoptimized />
            </div>
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-tighter ${story.role !== 'aluno' ? 'text-sky-400' : 'text-white/60'}`}>
            {story.username.split('_')[0]}
          </span>
        </div>
      ))}
    </div>
  );
};