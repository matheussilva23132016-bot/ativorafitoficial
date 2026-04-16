"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
// CORREÇÃO: Alterado de lucide-center para lucide-react
import { Camera, ArrowRight, ArrowLeft, Plus, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { UserProfileData } from "./AtivoraSocial";

interface OnboardingProps {
  onFinish: (profileData: UserProfileData) => void;
  onBack: () => void;
}

export const SocialOnboarding = ({ onFinish, onBack }: OnboardingProps) => {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false); 
  
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
    if (isSaving) return;
    setIsSaving(true);

    const finalData = {
      username: username.trim().toLowerCase().replace(/\s+/g, '_'),
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
        console.error("Falha na interpretação da Matriz:", responseText);
        toast.error(`Erro na resposta do servidor (Status ${response.status}).`);
        setIsSaving(false);
        return; 
      }
      
      if (response.ok) {
        const dataForCache: UserProfileData = {
          username: finalData.username,
          bio: finalData.bio,
          description: finalData.description,
          avatar: result.url || imagePreview,
          role: 'aluno', 
          is_verified: false,
          is_private: false
        };

        toast.success("Matriz sincronizada com sucesso!");
        onFinish(dataForCache);

      } else {
        toast.error(`Erro na Matriz: ${result.details || result.error || "Tente outro nickname de operação"}`);
        setIsSaving(false);
      }
      
    } catch (error) {
      console.error("Falha ao conectar com o núcleo:", error);
      toast.error("A conexão com a API falhou.");
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto py-10 px-4"
    >
      <button 
        onClick={onBack} 
        disabled={isSaving}
        className="flex items-center gap-2 text-white/20 hover:text-sky-500 mb-8 transition-all group disabled:opacity-0"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest italic">Abortar Sincronização</span>
      </button>

      <div className="bg-white/5 p-8 lg:p-12 rounded-[40px] border border-white/10 backdrop-blur-3xl shadow-2xl space-y-10">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            Sincronizar <span className="text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.4)]">Identidade</span>
          </h2>
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 italic">Codifique sua presença no ecossistema AtivoraFit</p>
        </div>

        <div className="space-y-8">
          {/* Bio-Scanner (Avatar) */}
          <div className="flex justify-center">
            <div className="relative group" onClick={triggerFileInput}>
              {/* CORREÇÃO: rounded-[32px] alterado para rounded-4xl */}
              <div className="w-32 h-32 rounded-4xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-sky-500 transition-all overflow-hidden cursor-pointer relative">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="text-white/10 group-hover:text-sky-500 transition-colors" size={32} />
                    <span className="text-[8px] font-black text-white/5 uppercase">Bio-Scanner</span>
                  </div>
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
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4 italic">Nickname de Operação</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: matheus_elite_01" 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-sky-500 focus:border-sky-500/50 outline-none transition-all placeholder:text-white/5" 
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4 italic">Diretriz de Impacto (Bio)</label>
              <input 
                type="text" 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Sua missão tática no ecossistema..." 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-sky-500/50 outline-none transition-all placeholder:text-white/5" 
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-4 italic">Registro de Evolução (Jornada)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva seus protocolos de treino e metas de performance..." 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-sky-500/50 outline-none transition-all h-28 resize-none placeholder:text-white/5" 
              />
            </div>
          </div>

          <button 
            onClick={handleComplete}
            disabled={!username || !imagePreview || isSaving}
            className={`w-full py-5 font-black uppercase italic tracking-widest text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3
              ${(!username || !imagePreview || isSaving) 
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
                : 'bg-sky-500 text-black shadow-sky-500/20 hover:scale-[1.02] active:scale-95'}`}
          >
            {isSaving ? (
              <>Sincronizando Protocolo... <Loader2 size={18} className="animate-spin" /></>
            ) : (
              <>Ativar Núcleo Social <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};