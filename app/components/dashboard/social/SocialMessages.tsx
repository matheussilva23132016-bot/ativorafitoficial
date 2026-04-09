"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Send, ShieldCheck, User } from "lucide-react";
import { UserProfileData } from "./AtivoraSocial";

interface Message {
  id: number;
  remetente_nickname: string;
  conteudo: string;
  created_at: string;
}

export const SocialMessages = ({ currentUser, onBack }: { currentUser: UserProfileData, onBack: () => void }) => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [contacts, setContacts] = useState<{ contato: string }[]>([]);

  // Carrega a lista de conversas (Inbox)
  useEffect(() => {
    const fetchInbox = async () => {
      const res = await fetch(`/api/social/mensagens?user=${currentUser.username}`);
      if (res.ok) setContacts(await res.json());
    };
    fetchInbox();
  }, [currentUser.username]);

  // Carrega mensagens do chat ativo
  useEffect(() => {
    if (activeChat) {
      const fetchChat = async () => {
        const res = await fetch(`/api/social/mensagens?user=${currentUser.username}&target=${activeChat}`);
        if (res.ok) setMessages(await res.json());
      };
      fetchChat();
      const interval = setInterval(fetchChat, 3000); // Polling básico de 3s
      return () => clearInterval(interval);
    }
  }, [activeChat, currentUser.username]);

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChat) return;
    const res = await fetch('/api/social/mensagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remetente: currentUser.username, destinatario: activeChat, conteudo: inputText })
    });
    if (res.ok) {
      setInputText("");
      // Atualiza localmente para feedback instantâneo
      setMessages([...messages, { id: Date.now(), remetente_nickname: currentUser.username, conteudo: inputText, created_at: new Date().toISOString() }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#010307] text-white">
      {/* Header do Direct */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4">
        <button onClick={activeChat ? () => setActiveChat(null) : onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-black italic uppercase tracking-widest text-sky-500">
          {activeChat ? `@${activeChat}` : "Canais de Direct"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeChat ? (
          /* LISTA DE CONTATOS */
          contacts.length > 0 ? contacts.map(c => (
            <div key={c.contato} onClick={() => setActiveChat(c.contato)} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:border-sky-500/50 transition-all">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
                <User size={24} />
              </div>
              <span className="font-bold">@{c.contato}</span>
            </div>
          )) : <div className="text-center py-20 text-white/20 font-black uppercase italic">Nenhuma transmissão ativa</div>
        ) : (
          /* CHAT ATIVO */
          messages.map(m => (
            <div key={m.id} className={`flex ${m.remetente_nickname === currentUser.username ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.remetente_nickname === currentUser.username ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>
                {m.conteudo}
              </div>
            </div>
          ))
        )}
      </div>

      {activeChat && (
        <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
          <input 
            type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Enviar protocolo..." className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500"
          />
          <button onClick={sendMessage} className="p-3 bg-sky-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all">
            <Send size={20} />
          </button>
        </div>
      )}
    </div>
  );
};