"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageSquare, Flag } from "lucide-react";

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  canDelete?: boolean;
}

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  postId: number | null;
  onSend: (text: string) => void;
  onDelete?: (id: string) => Promise<void> | void;
  isSending: boolean;
  currentUser?: string;
}

const CommentItem = ({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete?: (id: string) => Promise<void> | void;
}) => (
  <div className="flex gap-4 p-4 md:p-6 hover:bg-white/[0.02] transition-colors rounded-lg group">
    <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/5">
       {comment.avatar ? <img src={comment.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white/20">@</div>}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-black uppercase text-white/80 italic">@{comment.user}</span>
        <span className="text-[9px] font-bold text-white/10">{comment.timestamp}</span>
      </div>
      <p className="text-[13px] text-white/60 leading-relaxed mb-3">{comment.text}</p>
      <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
        <button className="text-[9px] font-black uppercase text-white/40 hover:text-sky-500">Curtir</button>
        <button className="text-[9px] font-black uppercase text-white/40 hover:text-sky-500">Responder</button>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete?.(comment.id)}
            className="text-[9px] font-black uppercase text-white/40 hover:text-rose-500"
          >
            Apagar
          </button>
        )}
        <button className="ml-auto text-white/10 hover:text-rose-500 transition-colors"><Flag size={12} /></button>
      </div>
    </div>
  </div>
);

export const CommentDrawer = ({
  isOpen,
  onClose,
  comments,
  postId,
  onSend,
  onDelete,
  isSending,
  currentUser,
}: CommentDrawerProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-end md:items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
          />

          {/* Sheet / Drawer */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl h-[90vh] md:h-[600px] bg-[#050B14] md:border border-white/10 md:rounded-lg flex flex-col pointer-events-auto shadow-2xl overflow-hidden"
          >
            {/* Drag Handle (Mobile) */}
            <div className="md:hidden flex justify-center py-4">
               <div className="w-12 h-1.5 bg-white/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-8 pb-6 border-b border-white/5 flex items-center justify-between mt-2 md:mt-0 md:pt-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                    <MessageSquare size={18} className="text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase italic tracking-[0.2em] text-white">Sala de Briefing</h3>
                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mt-0.5">{comments.length} transmissões</p>
                  </div>
               </div>
               <button onClick={onClose} className="hidden md:flex p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-white/20" />
               </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-none">
               {comments.length > 0 ? (
                  comments.map(c => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      canDelete={Boolean(c.canDelete || c.user === currentUser)}
                      onDelete={async (id) => {
                        const confirmed = window.confirm("Apagar este comentario?");
                        if (!confirmed) return;
                        await onDelete?.(id);
                      }}
                    />
                  ))
               ) : (
                  <div className="py-20 text-center opacity-20">
                     <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">Eixo Silencioso</p>
                  </div>
               )}
            </div>

            {/* Input Base */}
            <div className="p-6 md:p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl pb-safe">
               <div className="flex gap-4">
                  <input 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Transmita seu comentário..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-[13px] font-medium text-white outline-none focus:border-sky-500/50 transition-all"
                  />
                  <button 
                    onClick={handleSubmit}
                    disabled={isSending || !text.trim()}
                    className="w-14 h-14 bg-sky-500 text-black rounded-lg flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-20 transition-all shrink-0"
                  >
                    {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
