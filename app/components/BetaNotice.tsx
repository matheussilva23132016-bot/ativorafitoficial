"use client";

export function BetaNotice() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[120] flex justify-center px-3 sm:top-3">
      <div className="max-w-[calc(100vw-24px)] rounded-full border border-sky-400/20 bg-black/55 px-3 py-1.5 text-center shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/55 sm:text-[9px]">
          Beta 1.0 <span className="text-sky-300">•</span> versão em evolução
        </p>
      </div>
    </div>
  );
}
