"use client";

import React, { useState } from "react";
import { ProfileSelection } from "@/app/components/ProfileSelection";
import { RegistrationFlow } from "@/app/components/RegistrationFlow";
import { AnimatePresence, motion } from "framer-motion";

export default function CadastroPage() {
  // Estado para controlar se estamos escolhendo o perfil ou preenchendo os dados
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [selectedRole, setSelectedRole] = useState<string>("");

  // Função chamada quando o usuário escolhe um perfil (Aluno, Personal, etc)
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
            <ProfileSelection onSelect={handleProfileSelect} />
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