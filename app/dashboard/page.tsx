"use client";

import React, { useState, useEffect } from "react";
// Importes relativos blindados
import { WelcomeSlide } from "../components/dashboard/WelcomeSlide";
import { FitaoOnboarding } from "../components/dashboard/FitaoOnboarding";
import { MainDashboard } from "../components/dashboard/MainDashboard";

export default function DashboardPage() {
  const [stage, setStage] = useState<'welcome' | 'onboarding' | 'main'>('welcome');

  useEffect(() => {
    // Se o usuário já passou pelo onboarding antes, podemos pular direto (Opcional)
    const hasSeenOnboarding = localStorage.getItem('@ativora_onboarding_done');
    
    const timer = setTimeout(() => {
      if (hasSeenOnboarding) {
        setStage('main');
      } else {
        setStage('onboarding');
      }
    }, 3500); // Tempo do Welcome Slide

    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('@ativora_onboarding_done', 'true');
    setStage('main');
  };

  return (
    <div className="min-h-screen bg-[#010307]">
      {stage === 'welcome' && <WelcomeSlide />}
      
      {stage === 'onboarding' && (
        <FitaoOnboarding onComplete={handleOnboardingComplete} />
      )}
      
      {stage === 'main' && <MainDashboard />}
    </div>
  );
}