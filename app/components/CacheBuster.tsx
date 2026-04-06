"use client";

import { useEffect } from "react";

export const CacheBuster = () => {
  useEffect(() => {
    // Mantemos apenas a verificação de entrada para garantir a versão nova
    const sistemaAtualizado = sessionStorage.getItem("ativora_sessao_v1");

    if (!sistemaAtualizado) {
      sessionStorage.setItem("ativora_sessao_v1", "true");
      // O reload acontece uma única vez por acesso, limpando o lixo inicial
      window.location.reload();
    }
    
    // REMOVEMOS o setInterval de 5 minutos que estava derrubando o servidor
  }, []);

  return null;
};