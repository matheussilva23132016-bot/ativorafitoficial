"use client";

import React, { useState } from "react";
// Importes relativos para evitar erro de 'Module not found'
import { ProfileSelection } from "../components/ProfileSelection";
import { RegistrationFlow } from "../components/RegistrationFlow";

export default function CadastroPage() {
  const [step, setStep] = useState<'selection' | 'registration'>('selection');
  const [selectedRole, setSelectedRole] = useState<string>("");

  const handleProfileSelect = (role: string) => {
    setSelectedRole(role);
    setStep('registration');
  };

  const handleBack = () => {
    if (step === 'registration') {
      setStep('selection');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <main className="min-h-screen bg-[#010307]">
      {step === 'selection' ? (
        <ProfileSelection 
          onBack={handleBack} 
          onSelectProfile={handleProfileSelect} 
        />
      ) : (
        <RegistrationFlow 
          role={selectedRole} 
          onBack={handleBack} 
          onComplete={(data) => {
            console.log("Matriz Sincronizada:", data);
            // Os dados já são salvos no localStorage dentro do RegistrationFlow
          }} 
        />
      )}
    </main>
  );
}