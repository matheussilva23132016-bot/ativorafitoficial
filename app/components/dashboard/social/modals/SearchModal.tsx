"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Hash, TrendingUp, Zap, ChevronRight, Loader2 } from "lucide-react";

interface SearchResult {
  username: string;
  full_name?: string | null;
  avatar?: string | null;
  role?: string | null;
  nivel?: number | null;
  followers?: number | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (u: string) => void;
  trendingTags?: Array<{ tag: string; posts?: number }>;
}

export const SearchModal = ({ isOpen, onClose, onSelectUser, trendingTags = [] }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedQuery = query.trim();
  const visibleTags = useMemo(
    () => trendingTags.filter((item) => item?.tag).slice(0, 8),
    [trendingTags]
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (normalizedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/social/search?q=${encodeURIComponent(normalizedQuery)}&type=users`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) throw new Error("Falha ao buscar atletas");

        const data = await response.json();
        setResults(Array.isArray(data) ? data.filter((item) => item?.username) : []);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("[SearchModal] Erro ao buscar usuários:", error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, normalizedQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-[1000] flex items-start justify-center p-0 pt-0 md:p-6 md:pt-24 lg:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="pointer-events-auto absolute inset-0 bg-black/95 backdrop-blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="pointer-events-auto relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#050B14] shadow-[0_0_100px_rgba(0,0,0,0.9)] md:h-auto md:max-h-[85vh] md:rounded-lg md:border md:border-white/10"
          >
            <div className="flex items-center gap-3 border-b border-white/5 p-4 sm:p-6 md:p-8">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all focus-within:border-sky-500/50 sm:gap-4 sm:px-5 sm:py-4">
                <Search size={20} className="shrink-0 text-white/20" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar atletas na Ativora..."
                  className="min-w-0 flex-1 border-none bg-transparent text-base font-bold text-white outline-none placeholder:text-white/15 sm:text-lg"
                />
              </div>
              <button
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/35 shadow-xl transition-all hover:bg-rose-500/10 hover:text-rose-500 sm:h-12 sm:w-12"
                aria-label="Fechar busca"
              >
                <X size={22} />
              </button>
            </div>

            <div className="scrollbar-none flex-1 space-y-8 overflow-y-auto p-4 pb-20 sm:p-6 md:p-8">
              {normalizedQuery.length > 0 && (
                <div className="space-y-4">
                  <h4 className="flex items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/25">
                    Resultados encontrados
                  </h4>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-white/25">
                      <Loader2 size={22} className="animate-spin" />
                    </div>
                  ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {results.map((user) => (
                        <button
                          key={user.username}
                          onClick={() => {
                            onSelectUser(user.username);
                            onClose();
                          }}
                          className="group flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.05] sm:gap-4 sm:p-4"
                        >
                          <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-sky-400 to-emerald-500 p-[1.5px] shadow-lg">
                            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[7px] bg-[#0c121d]">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                              ) : (
                                <span className="font-bold text-sky-500">@</span>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-bold tracking-tight text-white">
                              @{user.username}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-widest text-white/25">
                              {user.full_name || user.role || (user.nivel ? `Nível ${user.nivel}` : "Atleta Ativora")}
                            </p>
                          </div>
                          <ChevronRight size={16} className="shrink-0 text-white/10 transition-colors group-hover:text-sky-500" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm font-medium text-white/35">
                      Nenhum atleta encontrado para "{normalizedQuery}".
                    </div>
                  )}
                </div>
              )}

              {normalizedQuery.length === 0 && (
                <>
                  <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/35">
                    Digite pelo menos 2 letras para buscar atletas cadastrados.
                  </p>

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.28em] text-sky-500/45">
                      <TrendingUp size={14} /> Assuntos em alta
                    </h4>
                    {visibleTags.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {visibleTags.map((item) => (
                          <div
                            key={item.tag}
                            className="group flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Hash size={17} className="shrink-0 text-sky-500/45 transition-colors group-hover:text-sky-400" />
                              <span className="truncate text-[14px] font-bold tracking-tight text-white/65 transition-colors group-hover:text-white">
                                #{item.tag}
                              </span>
                            </div>
                            <Zap size={14} className="shrink-0 text-white/10" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/30">
                        Os assuntos em alta aparecem aqui quando houver relatos com hashtags.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
