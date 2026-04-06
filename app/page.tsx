"use client";

import { useState } from "react";
import { HeroSection } from "./components/HeroSection";
import { ProfileSelection } from "./components/ProfileSelection";
import { RegistrationFlow } from "./components/RegistrationFlow";

export default function Home() {
  // 1. O ESTADO QUE CONTROLA QUAL TELA APARECE
  const [telaAtual, setTelaAtual] = useState<"inicio" | "perfis" | "cadastro">("inicio");
  
  // 2. O ESTADO QUE GUARDA O PERFIL ESCOLHIDO
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>("");

  return (
    <main>
      {/* TELA 1: SLIDE INICIAL (HERO) */}
      {telaAtual === "inicio" && (
        <HeroSection onExplore={() => setTelaAtual("perfis")} />
      )}

      {/* TELA 2: SELETOR DE PERFIS */}
      {telaAtual === "perfis" && (
        <ProfileSelection 
          onBack={() => setTelaAtual("inicio")} 
          onSelectProfile={(perfil) => {
            // ESSA É A FUNÇÃO QUE O BOTÃO "AVANÇAR" CHAMA
            setPerfilSelecionado(perfil); // Salva se é aluno, personal, etc.
            setTelaAtual("cadastro");    // Pula para a tela de cadastro
          }}
        />
      )}

      {/* TELA 3: FLUXO DE CADASTRO (REGISTRATION) */}
      {telaAtual === "cadastro" && (
        <RegistrationFlow 
          role={perfilSelecionado} 
          onBack={() => setTelaAtual("perfis")}
          onComplete={(dados) => {
            console.log("Cadastro concluído com sucesso:", dados);
            // Futuramente: setTelaAtual("dashboard")
          }}
        />
      )}
    </main>
  );
}