"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

// Importações com caminhos absolutos (à prova de erros)
import { WelcomeSlide } from "@/app/components/dashboard/WelcomeSlide";
import { FitaoOnboarding } from "@/app/components/dashboard/FitaoOnboarding";
import { DashboardLayout } from "@/app/components/dashboard/DashboardLayout";

export default function DashboardPage() {
  const [flowState, setFlowState] = useState<'welcome' | 'fitao' | 'dashboard'>('welcome');

  useEffect(() => {
    if (flowState === 'welcome') {
      const timer = setTimeout(() => setFlowState('fitao'), 3500);
      return () => clearTimeout(timer);
    }
  }, [flowState]);

  return (
    <div className="relative min-h-dvh w-full bg-[#010307] overflow-hidden">
      <AnimatePresence mode="wait">
        {flowState === 'welcome' && (
          <WelcomeSlide key="welcome" />
        )}
        
        {flowState === 'fitao' && (
          <FitaoOnboarding key="fitao" onComplete={() => setFlowState('dashboard')} />
        )}

        {flowState === 'dashboard' && (
          <DashboardLayout key="dashboard" />
        )}
      </AnimatePresence>
    </div>
  );
}