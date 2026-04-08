"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Camera, ArrowRight, ArrowLeft, Plus, Check } from "lucide-react";
import Image from "next/image";
// Importamos a interface oficial para evitar o erro de tipagem
import { UserProfileData } from "./AtivoraSocial";

interface OnboardingProps {
  onFinish: (profileData: UserProfileData) => void;
  onBack: () => void;
}

export const SocialOnboarding = ({ onFinish, onBack }: OnboardingProps) => {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleComplete = async () => {
    // Dados iniciais para o banco
    const finalData = {
      username,
      bio,
      description,
      avatar: imagePreview 
    };

    try {
      const response = await fetch('/api/perfil/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("O servidor não retornou um JSON válido:", responseText);
        alert(`Erro na resposta do servidor (Status ${response.status}).`);
        return; 
      }
      
      if (response.ok) {
        try {
          // IMPLEMENTAÇÃO ESSENCIAL: Adicionando role e is_verified para satisfazer o TypeScript
          const dataForCache: UserProfileData = {
            username: finalData.username,
            bio: finalData.bio,
            description: finalData.description,
            avatar: result.url,
            role: 'aluno', // Todo novo usuário começa como aluno
            is_verified: false
          };

          onFinish(dataForCache);
        } catch (finishError: unknown) {
          console.error("Erro na transição de tela:", finishError);
          alert("Erro na transição. Atualize a página.");
        }

      } else {
        alert(`Erro no banco de dados: ${result.details || result.error}`);
      }
      
    } catch (error: unknown) {
      console.error("Falha ao conectar com a API:", error);
      alert("A conexão com a API falhou.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto py-10 px-4"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-white/20 hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest italic text-left">Cancelar Ativação</span>
      </button>

      <div className="bg-white/5 p-8 lg:p-12 rounded-5xl border border-white/10 backdrop-blur-3xl shadow-2xl space-y-10">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white text-center">Ativar <span className="text-sky-500 shadow-neon">Perfil</span></h2>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 italic text-center">Defina sua identidade visual no ecossistema</p>
        </div>

        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="relative group" onClick={triggerFileInput}>
              <div className="w-32 h-32 rounded-4xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-sky-500 transition-all overflow-hidden cursor-pointer relative">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                ) : (
                  <Camera className="text-white/10 group-hover:text-sky-500 transition-colors" size={32} />
                )}
              </div>
              
              <div className="absolute -bottom-2 -right-2 bg-sky-500 p-2.5 rounded-xl text-black shadow-lg shadow-sky-500/20 cursor-pointer hover:scale-110 transition-transform">
                {imagePreview ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4 italic">@ Nome de Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: matheus_ativora" 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-sky-500 focus:border-sky-500/50 outline-none transition-all" 
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4 italic">Bio Curta</label>
              <input 
                type="text" 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Sua frase de impacto..." 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-sky-500/50 outline-none transition-all" 
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4 italic">Descrição da Jornada</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fale sobre seus objetivos..." 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-sky-500/50 outline-none transition-all h-28 resize-none" 
              />
            </div>
          </div>

          <button 
            onClick={handleComplete}
            disabled={!username || !imagePreview}
            className={`w-full py-5 font-black uppercase italic tracking-widest text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3
              {(!username || !imagePreview) 
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
                : 'bg-sky-500 text-black shadow-sky-500/20 hover:scale-[1.02] active:scale-95'}`}
          >
            Finalizar Ativação <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};