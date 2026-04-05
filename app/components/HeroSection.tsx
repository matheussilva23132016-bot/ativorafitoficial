"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0b1b3a] to-[#020617]" />

      <div className="absolute h-[600px] w-[600px] rounded-full bg-[#0EA5E9]/20 blur-[120px]" />

      <div className="relative z-10 flex max-w-4xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="AtivoraFit"
            width={140}
            height={140}
            priority
            className="mx-auto"
          />
        </div>

        <h1 className="mb-6 bg-gradient-to-r from-[#38BDF8] to-[#0EA5E9] bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
          AtivoraFit
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-gray-300 md:text-xl">
          A evolução do fitness começa aqui. Uma plataforma inteligente para
          transformar sua jornada de saúde.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button className="rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] px-8 py-4 font-semibold shadow-lg shadow-[#0EA5E9]/20 transition-all duration-300 hover:opacity-90">
            Começar Agora
          </button>

          <button className="rounded-xl border border-white/20 px-8 py-4 transition-all duration-300 hover:bg-white/5">
            Já tenho conta
          </button>
        </div>
      </div>
    </section>
  );
}