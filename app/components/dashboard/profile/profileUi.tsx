"use client";

import React from "react";

export function inputClass(extra = "") {
  return `w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/50 placeholder:text-white/20 ${extra}`;
}

export function labelClass() {
  return "text-[9px] font-black uppercase tracking-widest text-white/35";
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className={labelClass()}>{label}</span>
      {children}
    </label>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className={labelClass()}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black italic tracking-tighter text-white sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">{description}</p>}
    </div>
  );
}
