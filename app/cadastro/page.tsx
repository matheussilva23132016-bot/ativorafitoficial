"use client";

import React, { useState } from "react";
import { ProfileSelection } from "@/app/components/ProfileSelection";
import { RegistrationFlow } from "@/app/components/RegistrationFlow";
import { AnimatePresence, motion } from "framer-motion";

export default function CadastroPage() {
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [selectedRole, setSelectedRole] = useState<string>("");

  const handleProfileSelect = (role: string) => {
    setSelectedRole(role);
    setStep('form');
  };

  return (
    <main className="min-h-dvh w-full bg-[#010307] overflow-x-hidden">
      <AnimatePresence mode="wait">
        {step === 'selection' ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            {/* CORREÇÃO AQUI: 
                Mudamos de 'onSelect' para 'onSelectProfile' 
                para casar com o componente 
            */}
            <ProfileSelection 
              onBack={() => window.history.back()} 
              onSelectProfile={handleProfileSelect} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full"
          >
            <RegistrationFlow 
              role={selectedRole} 
              onBack={() => setStep('selection')} 
              onComplete={(data) => console.log("Cadastro finalizado:", data)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}