"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroSection } from "./components/HeroSection";
import { ProfileSelection } from "./components/ProfileSelection";

/**
 * ATIVORAFIT - ORQUESTRAÇÃO DE TELAS
 * Gerencia a transição entre o Slide Inicial e a Seleção de Perfis.
 */
export default function Home() {
  // Estados: 'hero' | 'profiles'
  const [currentView, setCurrentView] = useState<'hero' | 'profiles'>('hero');

  return (
    <main className="bg-[#010307] min-h-dvh w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'hero' ? (
          <HeroSection key="hero" onExplore={() => setCurrentView('profiles')} />
        ) : (
          <ProfileSelection key="profiles" onBack={() => setCurrentView('hero')} />
        )}
      </AnimatePresence>
    </main>
  );
}