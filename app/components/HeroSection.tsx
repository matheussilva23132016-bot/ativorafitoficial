"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020617] px-4 text-white sm:px-6 lg:px-8">
      {/* Background base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.20),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#06132a_45%,_#020617_100%)]" />

      {/* Glow 1 */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0EA5E9]/20 blur-3xl sm:h-[520px] sm:w-[520px] lg:h-[640px] lg:w-[640px]" />

      {/* Glow 2 */}
      <div className="absolute bottom-[-120px] left-[-80px] h-[240px] w-[240px] rounded-full bg-[#0284C7]/15 blur-3xl sm:h-[320px] sm:w-[320px]" />

      {/* Glow 3 */}
      <div className="absolute right-[-80px] top-[-100px] h-[240px] w-[240px] rounded-full bg-[#38BDF8]/10 blur-3xl sm:h-[320px] sm:w-[320px]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[1100px]">
        <div className="mx-auto flex min-h-[720px] w-full items-center justify-center">
          <div className="relative w-full max-w-[760px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 shadow-[0_20px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            {/* Card glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/70 to-transparent" />
            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-[#38BDF8]/10 blur-3xl" />

            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center rounded-full border border-[#38BDF8]/20 bg-[#0EA5E9]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7DD3FC] sm:text-xs">
                Plataforma fitness premium
              </span>
            </div>

            {/* Logo */}
            <div className="mb-6 flex justify-center sm:mb-8">
              <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-[24px] border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(14,165,233,0.18)] sm:h-[110px] sm:w-[110px]">
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#38BDF8]/10 to-transparent" />
                <Image
                  src="/logo.png"
                  alt="Logo AtivoraFit"
                  width={78}
                  height={78}
                  priority
                  className="relative z-10 h-auto w-[62px] object-contain sm:w-[74px]"
                />
              </div>
            </div>

            {/* Title */}
            <div className="mx-auto max-w-[620px] text-center">
              <h1 className="mb-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
                <span className="bg-gradient-to-r from-[#E0F2FE] via-[#38BDF8] to-[#0EA5E9] bg-clip-text text-transparent">
                  AtivoraFit
                </span>
              </h1>

              <p className="mx-auto mb-3 max-w-[520px] text-sm font-medium uppercase tracking-[0.24em] text-[#7DD3FC]/85 sm:text-[13px]">
                Evolução, performance e tecnologia
              </p>

              <p className="mx-auto max-w-[580px] text-base leading-relaxed text-slate-300 sm:text-lg lg:text-[20px]">
                A plataforma inteligente que une saúde, evolução física e
                experiência premium em um ecossistema moderno, responsivo e
                preparado para desktop e smartphone.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <button className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] px-8 text-base font-semibold text-white shadow-[0_12px_35px_rgba(14,165,233,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_16px_45px_rgba(14,165,233,0.42)] sm:w-auto sm:min-w-[220px]">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10">Começar agora</span>
              </button>

              <button className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-8 text-base font-semibold text-white/90 transition-all duration-300 hover:border-[#38BDF8]/35 hover:bg-white/[0.06] sm:w-auto sm:min-w-[220px]">
                Já tenho conta
              </button>
            </div>

            {/* Bottom highlights */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
                <p className="text-sm font-semibold text-white">Treinos</p>
                <p className="mt-1 text-xs text-slate-400">
                  Planejamento e evolução
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
                <p className="text-sm font-semibold text-white">Profissionais</p>
                <p className="mt-1 text-xs text-slate-400">
                  Conexão inteligente
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
                <p className="text-sm font-semibold text-white">Experiência</p>
                <p className="mt-1 text-xs text-slate-400">
                  Interface premium responsiva
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}