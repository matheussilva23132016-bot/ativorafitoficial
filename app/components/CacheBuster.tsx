"use client";

import { useEffect } from "react";

export const CacheBuster = () => {
  useEffect(() => {
    // 1. Lógica para recarregar assim que entrar (apenas uma vez por sessão)
    const foiLimpoNestaSessao = sessionStorage.getItem("ativora_cache_limpo");

    if (!foiLimpoNestaSessao) {
      sessionStorage.setItem("ativora_cache_limpo", "true");
      // Força um reload buscando do servidor, ignorando o cache do navegador
      window.location.reload();
    }

    // 2. Lógica para atualizar de 5 em 5 minutos automaticamente
    const intervalo = setInterval(() => {
      console.log("Sincronizando nova versão do sistema...");
      window.location.reload();
    }, 5 * 60 * 1000); // 5 minutos em milissegundos

    return () => clearInterval(intervalo);
  }, []);

  return null; // Componente invisível, apenas lógica
};