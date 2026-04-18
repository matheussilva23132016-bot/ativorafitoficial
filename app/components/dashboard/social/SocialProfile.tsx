"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Grid,
  PlaySquare,
  Bookmark,
  ShieldCheck,
  Settings,
  Save,
  X,
  Camera,
  Trash2,
  Lock,
  Globe,
  UserPlus,
  UserCheck,
  Zap,
  Link as LinkIcon,
  Flame,
  Award,
  CheckCircle,
  Check,
  Clock,
  Trophy,
  Medal,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { UserProfileData } from "./AtivoraSocial";

interface PostItem {
  id: number;
  media_url: string;
  media_type: "image" | "video";
}

interface Solicitacao {
  id: number;
  username: string;
  avatar_url: string | null;
}

const DEFAULT_SOCIAL_AVATAR = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=240";
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const AVATAR_FOCUS_PREFIX = "atv-focus=";
const DEFAULT_AVATAR_FOCUS = { x: 50, y: 50 };
const MAX_SOCIAL_BIO = 120;
const MAX_SOCIAL_DESC = 280;

function clampFocus(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeAvatarSrc(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_SOCIAL_AVATAR;
  if (raw.startsWith("uploads/")) return `/${raw}`;
  return raw;
}

function parseAvatarWithFocus(value?: string | null) {
  const normalized = normalizeAvatarSrc(value);
  const hashIndex = normalized.indexOf("#");
  if (hashIndex === -1) {
    return { src: normalized, focus: { ...DEFAULT_AVATAR_FOCUS } };
  }

  const src = normalized.slice(0, hashIndex) || normalized;
  const hash = normalized.slice(hashIndex + 1);
  const focusEntry = hash
    .split("&")
    .map(item => item.trim())
    .find(item => item.startsWith(AVATAR_FOCUS_PREFIX));

  if (!focusEntry) {
    return { src, focus: { ...DEFAULT_AVATAR_FOCUS } };
  }

  const [xRaw, yRaw] = focusEntry.slice(AVATAR_FOCUS_PREFIX.length).split(",");
  return {
    src,
    focus: {
      x: clampFocus(xRaw),
      y: clampFocus(yRaw),
    },
  };
}

function stripAvatarFocus(value?: string | null) {
  return normalizeAvatarSrc(value).split("#")[0];
}

function buildAvatarWithFocus(src: string, focus: { x: number; y: number }) {
  const cleanSrc = stripAvatarFocus(src);
  return `${cleanSrc}#${AVATAR_FOCUS_PREFIX}${clampFocus(focus.x)},${clampFocus(focus.y)}`;
}

function normalizeUsername(value?: string | null) {
  return String(value ?? "").trim().replace(/^@/, "").toLowerCase();
}

function validateUsername(value: string) {
  if (!value) return "Informe um @ para continuar.";
  if (value.length < 3) return "Use pelo menos 3 caracteres no @.";
  if (!/^[a-z0-9_.]+$/.test(value)) return "Use apenas letras, numeros, _ ou .";
  return "";
}

const BADGE_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  pioneiro: { icon: <Zap size={12} />, label: "Pioneiro", color: "text-sky-400", bg: "bg-sky-400/10" },
  constante: { icon: <Flame size={12} />, label: "Imparavel", color: "text-orange-500", bg: "bg-orange-500/10" },
  monstro: { icon: <Trophy size={12} />, label: "Monstro", color: "text-purple-500", bg: "bg-purple-500/10" },
  viciado: { icon: <Medal size={12} />, label: "Elite", color: "text-amber-400", bg: "bg-amber-400/10" },
};

interface SocialProfileProps {
  profileData: UserProfileData;
  onBack: () => void;
  startInEditMode?: boolean;
  onProfileUpdate: (data: UserProfileData) => void;
  isOwnProfile?: boolean;
  onPrivacyToggle?: (isPrivate: boolean) => Promise<void>;
  loggedUserNickname?: string;
}

export const SocialProfile = ({
  profileData,
  onBack,
  startInEditMode,
  onProfileUpdate,
  isOwnProfile: isOwnProfileProp,
  onPrivacyToggle,
  loggedUserNickname,
}: SocialProfileProps) => {
  const initialAvatar = parseAvatarWithFocus(profileData.avatar || profileData.avatar_url || profileData.foto_url);

  const [isEditing, setIsEditing] = useState(startInEditMode || false);
  const [currentProfile, setCurrentProfile] = useState(profileData);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [editingError, setEditingError] = useState<string | null>(null);

  const [editUsername, setEditUsername] = useState(profileData.username || "");
  const [editBio, setEditBio] = useState(profileData.bio || "");
  const [editDesc, setEditDesc] = useState(profileData.description || "");
  const [isPrivate, setIsPrivate] = useState(profileData.is_private || false);
  const [editAvatarSrc, setEditAvatarSrc] = useState(initialAvatar.src);
  const [editAvatarFocus, setEditAvatarFocus] = useState<{ x: number; y: number }>({ ...initialAvatar.focus });
  const [avatarFallback, setAvatarFallback] = useState(false);
  const [editBaseline, setEditBaseline] = useState(() => ({
    username: normalizeUsername(profileData.username),
    bio: profileData.bio || "",
    description: profileData.description || "",
    isPrivate: profileData.is_private || false,
    avatarSrc: initialAvatar.src,
    avatarFocus: { ...initialAvatar.focus },
  }));

  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [conquistas, setConquistas] = useState<any[]>([]);
  const [followStatus, setFollowStatus] = useState<"aceito" | "pendente" | "nenhum">("nenhum");
  const [followersCount, setFollowersCount] = useState(profileData.followers || 0);
  const [followingCount, setFollowingCount] = useState(profileData.following || 0);
  const [streak, setStreak] = useState(profileData.streak || 0);
  const [xp, setXp] = useState(profileData.xp || 0);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = isOwnProfileProp ?? (loggedUserNickname === currentProfile.username);

  const levelInfo = useMemo(() => {
    const level = Math.floor(Math.sqrt((xp || 0) / 10)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * 10;
    const nextLevelXP = Math.pow(level, 2) * 10;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return { level, progress: Math.min(progress, 100) };
  }, [xp]);

  const profileAvatar = useMemo(
    () => parseAvatarWithFocus(currentProfile.avatar || currentProfile.avatar_url || currentProfile.foto_url),
    [currentProfile.avatar, currentProfile.avatar_url, currentProfile.foto_url],
  );

  const hasProfileAvatar = Boolean(
    String(currentProfile.avatar || currentProfile.avatar_url || currentProfile.foto_url || "").trim(),
  );

  const normalizedEditUsername = useMemo(() => normalizeUsername(editUsername), [editUsername]);
  const usernameValidation = useMemo(() => validateUsername(normalizedEditUsername), [normalizedEditUsername]);

  const editDirty = useMemo(
    () =>
      normalizedEditUsername !== editBaseline.username ||
      editBio.trim() !== editBaseline.bio.trim() ||
      editDesc.trim() !== editBaseline.description.trim() ||
      isPrivate !== editBaseline.isPrivate ||
      stripAvatarFocus(editAvatarSrc) !== stripAvatarFocus(editBaseline.avatarSrc) ||
      editAvatarFocus.x !== editBaseline.avatarFocus.x ||
      editAvatarFocus.y !== editBaseline.avatarFocus.y,
    [
      editAvatarFocus.x,
      editAvatarFocus.y,
      editAvatarSrc,
      editBaseline.avatarFocus.x,
      editBaseline.avatarFocus.y,
      editBaseline.avatarSrc,
      editBaseline.bio,
      editBaseline.description,
      editBaseline.isPrivate,
      editBaseline.username,
      editBio,
      editDesc,
      isPrivate,
      normalizedEditUsername,
    ],
  );

  const fetchProfileData = useCallback(async () => {
    try {
      const [resPosts, resProfile, resConquistas] = await Promise.all([
        fetch(`/api/posts/listar?nickname=${profileData.username}`),
        fetch(`/api/perfil/publico?nickname=${profileData.username}&viewer=${loggedUserNickname || ""}`),
        fetch(`/api/social/conquistas?username=${profileData.username}`),
      ]);

      if (resPosts.ok) setUserPosts(await resPosts.json());
      if (resConquistas.ok) setConquistas(await resConquistas.json());

      if (resProfile.ok) {
        const data = await resProfile.json();
        setCurrentProfile(previous => ({
          ...previous,
          ...data,
          username: data.username || previous.username,
          avatar: data.avatar || data.avatar_url || previous.avatar,
          avatar_url: data.avatar_url || data.avatar || previous.avatar_url,
        }));

        if (data.streak !== undefined) setStreak(data.streak);
        if (data.xp !== undefined) setXp(data.xp);
        if (data.followers !== undefined) setFollowersCount(data.followers);
        if (data.following !== undefined) setFollowingCount(data.following);

        const status = data.follow_status || (data.is_following ? "aceito" : "nenhum");
        setFollowStatus(status);
      }

      if (isOwnProfile) {
        const resSol = await fetch(`/api/social/solicitacoes?username=${profileData.username}`);
        if (resSol.ok) setSolicitacoes(await resSol.json());
      }
    } catch {
      console.error("Erro ao sincronizar dados do perfil social.");
    }
  }, [profileData.username, loggedUserNickname, isOwnProfile]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    if (isEditing) return;

    const parsedAvatar = parseAvatarWithFocus(
      currentProfile.avatar || currentProfile.avatar_url || currentProfile.foto_url,
    );

    const baseline = {
      username: normalizeUsername(currentProfile.username),
      bio: currentProfile.bio || "",
      description: currentProfile.description || "",
      isPrivate: Boolean(currentProfile.is_private),
      avatarSrc: parsedAvatar.src,
      avatarFocus: { ...parsedAvatar.focus },
    };

    setEditUsername(baseline.username);
    setEditBio(baseline.bio);
    setEditDesc(baseline.description);
    setIsPrivate(baseline.isPrivate);
    setEditAvatarSrc(baseline.avatarSrc);
    setEditAvatarFocus({ ...baseline.avatarFocus });
    setAvatarFallback(false);
    setEditingError(null);
    setShowValidation(false);
    setEditBaseline(baseline);
  }, [
    currentProfile.avatar,
    currentProfile.avatar_url,
    currentProfile.bio,
    currentProfile.description,
    currentProfile.foto_url,
    currentProfile.is_private,
    currentProfile.username,
    isEditing,
  ]);

  const openEditMode = () => {
    const parsedAvatar = parseAvatarWithFocus(
      currentProfile.avatar || currentProfile.avatar_url || currentProfile.foto_url,
    );

    const baseline = {
      username: normalizeUsername(currentProfile.username),
      bio: currentProfile.bio || "",
      description: currentProfile.description || "",
      isPrivate: Boolean(currentProfile.is_private),
      avatarSrc: parsedAvatar.src,
      avatarFocus: { ...parsedAvatar.focus },
    };

    setEditUsername(baseline.username);
    setEditBio(baseline.bio);
    setEditDesc(baseline.description);
    setIsPrivate(baseline.isPrivate);
    setEditAvatarSrc(baseline.avatarSrc);
    setEditAvatarFocus({ ...baseline.avatarFocus });
    setAvatarFallback(false);
    setEditingError(null);
    setShowValidation(false);
    setEditBaseline(baseline);
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    setEditingError(null);
    setShowValidation(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditingError("Selecione uma imagem valida para a foto de perfil.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setEditingError("A foto deve ter no máximo 8MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setEditingError("Não foi possível processar a imagem selecionada.");
        return;
      }
      setEditAvatarSrc(result);
      setEditAvatarFocus({ ...DEFAULT_AVATAR_FOCUS });
      setAvatarFallback(false);
      setEditingError(null);
    };
    reader.onerror = () => setEditingError("Não foi possível processar a imagem selecionada.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleFollowToggle = async () => {
    if (!loggedUserNickname) return toast.warning("Identifique-se para seguir este perfil.");

    try {
      const res = await fetch("/api/social/seguir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerNickname: loggedUserNickname,
          followingNickname: currentProfile.username,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFollowStatus(data.status || "nenhum");
        setFollowersCount(prev =>
          data.status === "aceito" ? prev + 1 : data.following === false ? prev - 1 : prev,
        );
        toast.success(data.status === "aceito" ? "Agora você segue este perfil." : "solicitação enviada.");
      }
    } catch {
      toast.error("Não foi possível concluir está ação agora.");
    }
  };

  const handleDecisao = async (id: number, acao: "aceitar" | "recusar") => {
    try {
      const res = await fetch("/api/social/solicitacoes/decidir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, acao }),
      });

      if (res.ok) {
        setSolicitacoes(prev => prev.filter(s => s.id !== id));
        if (acao === "aceitar") setFollowersCount(prev => prev + 1);
        toast.success(acao === "aceitar" ? "solicitação aceita." : "solicitação removida.");
      }
    } catch {
      toast.error("Não foi possível processar está solicitação.");
    }
  };

  const handleSaveProfile = async () => {
    const safeUsername = normalizeUsername(editUsername);
    const usernameError = validateUsername(safeUsername);
    const bioValue = editBio.trim().slice(0, MAX_SOCIAL_BIO);
    const descValue = editDesc.trim().slice(0, MAX_SOCIAL_DESC);
    const avatarBase = stripAvatarFocus(editAvatarSrc);
    const avatarWithFocus = buildAvatarWithFocus(avatarBase, editAvatarFocus);

    setShowValidation(true);
    setEditingError(null);

    if (usernameError) {
      setEditingError(usernameError);
      return;
    }

    setIsSaving(true);
    try {
      if (onPrivacyToggle && isPrivate !== profileData.is_private) {
        await onPrivacyToggle(isPrivate);
      }

      const res = await fetch("/api/perfil/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: safeUsername,
          bio: bioValue || null,
          description: descValue || null,
          is_private: isPrivate,
          avatar_url: avatarBase,
          avatar_focus_x: editAvatarFocus.x,
          avatar_focus_y: editAvatarFocus.y,
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível atualizar seu perfil.");
      }

      const parsedSavedAvatar = parseAvatarWithFocus(data?.user?.avatar_url || avatarWithFocus);
      const persistedAvatar = buildAvatarWithFocus(parsedSavedAvatar.src, parsedSavedAvatar.focus);
      const updatedData: UserProfileData = {
        ...currentProfile,
        username: safeUsername,
        bio: bioValue || null,
        description: descValue || null,
        is_private: isPrivate,
        avatar: parsedSavedAvatar.src,
        avatar_url: persistedAvatar,
        foto_url: persistedAvatar,
      };

      setCurrentProfile(updatedData);
      onProfileUpdate(updatedData);
      setEditBaseline({
        username: safeUsername,
        bio: bioValue,
        description: descValue,
        isPrivate,
        avatarSrc: parsedSavedAvatar.src,
        avatarFocus: { ...parsedSavedAvatar.focus },
      });
      setIsEditing(false);
      setShowValidation(false);
      setEditingError(null);
      toast.success("Perfil atualizado com sucesso.");
    } catch (error: any) {
      const message = error?.message || "Não foi possível salvar as alteracoes do perfil.";
      setEditingError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirm1 = confirm("Você está prestes a excluir sua conta. Deseja continuar?");
    if (confirm1 && confirm("confirmação final: todos os seus dados serao removidos.")) {
      localStorage.removeItem("@ativora_profile");
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-4xl px-3 pb-20 pt-4 sm:px-5 lg:px-0">
      <div className="mb-4 flex items-center justify-between py-4">
        <button onClick={onBack} className="p-2 text-white transition-colors hover:text-sky-500">
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black uppercase tracking-widest text-white">{currentProfile.username}</span>
          {(currentProfile.role === "personal" || currentProfile.role === "nutri") && (
            <CheckCircle size={14} className="fill-sky-500/20 text-sky-500" />
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5">
              <Flame size={12} className="fill-orange-500 text-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-500">{streak}</span>
            </div>
          )}
        </div>

        {isOwnProfile ? (
          <button
            onClick={() => (isEditing ? cancelEditMode() : openEditMode())}
            className={`${isEditing ? "text-sky-500" : "text-white"} p-2 transition-colors hover:text-sky-500`}
          >
            <Settings size={24} />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {isOwnProfile && solicitacoes.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mx-2 mb-6 overflow-hidden rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4"
            >
              <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-sky-500">
                solicitações de acesso ({solicitacoes.length})
              </h4>
              <div className="space-y-3">
                {solicitacoes.map(sol => (
                  <div key={sol.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/5">
                        {sol.avatar_url && <Image src={sol.avatar_url} alt="User" fill className="object-cover" unoptimized />}
                      </div>
                      <span className="text-xs font-bold text-white">@{sol.username}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecisao(sol.id, "aceitar")}
                        className="rounded-lg bg-sky-500 p-2 text-black transition-all hover:scale-105"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => handleDecisao(sol.id, "recusar")}
                        className="rounded-lg bg-white/5 p-2 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-4 py-4 shadow-2xl sm:px-5">
          <div className="mb-2 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-sky-500" />
              <span className="text-xs font-black uppercase text-white italic">Nivel {levelInfo.level}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{xp || 0} XP acumulado</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            />
          </div>

          {conquistas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {conquistas.map(c => {
                const meta = BADGE_ICONS[c.tipo_badge];
                if (!meta) return null;
                return (
                  <div key={c.id} className={`flex items-center gap-1.5 rounded-full border border-white/5 px-2.5 py-1 ${meta.bg} ${meta.color}`}>
                    {meta.icon}
                    <span className="text-[9px] font-black uppercase italic tracking-tighter">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-[#05080d]/80 p-4 sm:p-6">
          <div className="flex items-center gap-5 lg:gap-10">
            <div className="relative shrink-0">
              <div
                className={`h-24 w-24 rounded-full p-1 lg:h-32 lg:w-32 ${
                  currentProfile.role && currentProfile.role !== "aluno"
                    ? "bg-gradient-to-tr from-sky-500 via-purple-500 to-sky-300 shadow-neon"
                    : "bg-white/10"
                }`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-[#010307] bg-[#010307]">
                  {hasProfileAvatar ? (
                    <Image
                      src={profileAvatar.src}
                      alt="Profile"
                      fill
                      className="object-cover"
                      style={{ objectPosition: `${profileAvatar.focus.x}% ${profileAvatar.focus.y}%` }}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black uppercase text-white/20">
                      {String(currentProfile.username || "A").charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {currentProfile.role && currentProfile.role !== "aluno" && (
                <div className="absolute bottom-0 right-2 rounded-full border-2 border-[#010307] bg-sky-500 p-1.5 text-black">
                  <ShieldCheck size={14} strokeWidth={3} />
                </div>
              )}
            </div>

            <div className="flex flex-1 justify-around text-center lg:justify-start lg:gap-12 lg:text-left">
              <div>
                <span className="block text-xl font-black text-white lg:text-2xl">{userPosts.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Posts</span>
              </div>
              <div>
                <span className="block text-xl font-black text-white lg:text-2xl">{followersCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Seguidores</span>
              </div>
              <div>
                <span className="block text-xl font-black text-white lg:text-2xl">{followingCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Seguindo</span>
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="mt-5 space-y-4">
              <div className="space-y-1 text-left">
                <h2 className="flex items-center gap-2 text-base font-black text-white lg:text-lg">
                  {currentProfile.username}
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase italic text-sky-500">
                    {currentProfile.role === "aluno" ? "Atleta" : currentProfile.role}
                  </span>
                </h2>
                <p className="text-sm leading-relaxed text-white">{currentProfile.bio}</p>
                <p className="text-xs italic text-white/40">{currentProfile.description}</p>
                {currentProfile.role && currentProfile.role !== "aluno" && (
                  <div className="flex cursor-pointer items-center gap-2 pt-2 text-xs font-bold text-sky-500 hover:underline">
                    <LinkIcon size={14} />
                    <span>ativorafit.online/expert/{currentProfile.username}</span>
                  </div>
                )}
              </div>

              {!isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={handleFollowToggle}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      followStatus === "aceito"
                        ? "border border-white/10 bg-white/5 text-white/40"
                        : followStatus === "pendente"
                        ? "border border-orange-500/20 bg-orange-500/20 text-orange-500"
                        : "bg-sky-500 text-black shadow-neon"
                    }`}
                  >
                    {followStatus === "aceito" ? (
                      <>
                        <UserCheck size={16} /> Seguindo
                      </>
                    ) : followStatus === "pendente" ? (
                      <>
                        <Clock size={16} /> Solicitado
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} /> Seguir atleta
                      </>
                    )}
                  </button>

                  {(currentProfile.role === "personal" || currentProfile.role === "nutri") && (
                    <button
                      onClick={() => toast.info("Em breve: consultoria direta pelo perfil.")}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02]"
                    >
                      <Zap size={16} className="fill-current" />
                      Consultoria
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing && isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-sky-500">Editar perfil</h3>
              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                  editDirty
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                    : "border-white/10 bg-black/20 text-white/45"
                }`}
              >
                {editDirty ? "Alteracoes pendentes" : "Sem alteracoes"}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-[112px_1fr]">
              <div className="space-y-2.5">
                <div className="mx-auto h-28 w-28 rounded-2xl border border-white/10 bg-black/35 p-1.5">
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-black/30">
                    {avatarFallback ? (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black uppercase text-white/40">
                        {normalizedEditUsername.charAt(0) || "A"}
                      </div>
                    ) : (
                      <img
                        src={editAvatarSrc}
                        alt="Avatar em edicao"
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${editAvatarFocus.x}% ${editAvatarFocus.y}%` }}
                        onError={() => {
                          setAvatarFallback(true);
                          setEditAvatarSrc(DEFAULT_SOCIAL_AVATAR);
                          setEditAvatarFocus({ ...DEFAULT_AVATAR_FOCUS });
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 text-[9px] font-black uppercase tracking-widest text-white/70 transition hover:text-white"
                  >
                    <Camera size={12} />
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAvatarFocus({ ...DEFAULT_AVATAR_FOCUS });
                      setAvatarFallback(false);
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-black/25 px-2 text-[9px] font-black uppercase tracking-widest text-white/70 transition hover:text-white"
                  >
                    Centralizar
                  </button>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-sky-500">@ do perfil</label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 focus-within:border-sky-500/50">
                    <span className="text-sm font-black text-sky-400">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={event => {
                        setEditUsername(event.target.value);
                        setEditingError(null);
                      }}
                      className="w-full bg-transparent text-sm font-black text-white outline-none placeholder:text-white/25"
                      placeholder="seu_usuario"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </div>
                  {showValidation && usernameValidation && (
                    <p className="text-xs font-bold text-rose-400">{usernameValidation}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-sky-500">Bio curta</label>
                    <span className="text-[10px] font-bold text-white/30">
                      {editBio.length}/{MAX_SOCIAL_BIO}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editBio}
                    onChange={event => {
                      setEditBio(event.target.value.slice(0, MAX_SOCIAL_BIO));
                      setEditingError(null);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white outline-none focus:border-sky-500/50"
                    placeholder="Resumo rápido sobre você"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-sky-500">Descrição</label>
                    <span className="text-[10px] font-bold text-white/30">
                      {editDesc.length}/{MAX_SOCIAL_DESC}
                    </span>
                  </div>
                  <textarea
                    value={editDesc}
                    onChange={event => {
                      setEditDesc(event.target.value.slice(0, MAX_SOCIAL_DESC));
                      setEditingError(null);
                    }}
                    className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white outline-none focus:border-sky-500/50"
                    placeholder="Conte mais sobre sua jornada, objetivos e especialidade."
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/45">
                  <span>Ajuste horizontal</span>
                  <span>{editAvatarFocus.x}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editAvatarFocus.x}
                  onChange={event => setEditAvatarFocus(current => ({ ...current, x: clampFocus(event.target.value) }))}
                  className="h-1.5 w-full cursor-pointer accent-sky-500"
                />
              </label>

              <label className="space-y-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/45">
                  <span>Ajuste vertical</span>
                  <span>{editAvatarFocus.y}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editAvatarFocus.y}
                  onChange={event => setEditAvatarFocus(current => ({ ...current, y: clampFocus(event.target.value) }))}
                  className="h-1.5 w-full cursor-pointer accent-sky-500"
                />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-3">
              <div className="flex items-center gap-2.5">
                {isPrivate ? <Lock size={16} className="text-amber-400" /> : <Globe size={16} className="text-emerald-400" />}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">
                    {isPrivate ? "Conta privada" : "Conta pública"}
                  </p>
                  <p className="text-[11px] text-white/45">
                    {isPrivate ? "Aprovação obrigatória para novos seguidores." : "Qualquer usuário pode seguir seu perfil."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isPrivate ? "bg-sky-500" : "bg-slate-700"}`}
              >
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${isPrivate ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-500">Previa do perfil</p>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-xl border border-white/10 bg-black/35">
                  <img
                    src={editAvatarSrc}
                    alt="Previa do avatar"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: `${editAvatarFocus.x}% ${editAvatarFocus.y}%` }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">@{normalizedEditUsername || "usuário"}</p>
                  <p className="truncate text-xs text-white/45">{editBio.trim() || "Adicione uma bio curta."}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">
                  {isPrivate ? "Privado" : "Publico"}
                </span>
              </div>
            </div>

            {editingError && (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300">
                {editingError}
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={cancelEditMode}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 px-4 text-[10px] font-black uppercase tracking-widest text-white/70 transition hover:text-white"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!editDirty || isSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition disabled:opacity-40"
              >
                {isSaving ? "Salvando..." : <><Save size={14} /> Salvar alteracoes</>}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-rose-300"
            >
              <Trash2 size={14} />
              Excluir conta
            </button>
          </motion.div>
        )}

        <div className="mt-8 border-t border-white/10">
          <div className="mb-4 flex justify-around text-white/30">
            <button className="flex flex-1 justify-center border-t border-sky-500 py-4 text-sky-500 transition-all">
              <Grid size={24} />
            </button>
            <button className="flex flex-1 justify-center py-4 transition-colors hover:text-white">
              <PlaySquare size={24} />
            </button>
            <button className="flex flex-1 justify-center py-4 transition-colors hover:text-white">
              <Bookmark size={24} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 px-1 lg:gap-2">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <div key={post.id} className="group relative aspect-square cursor-pointer overflow-hidden rounded-md border border-white/5 bg-white/5">
                  {post.media_type === "image" ? (
                    <Image
                      src={post.media_url}
                      alt="Post"
                      fill
                      className="object-cover transition-all duration-500 group-hover:scale-110"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black/40">
                      <PlaySquare size={32} className="text-white/20 transition-colors group-hover:text-sky-500" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 flex flex-col items-center py-20 text-center text-white/10">
                <Camera size={32} className="mb-4" />
                <h3 className="text-xl font-black uppercase italic">Sem registros</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
