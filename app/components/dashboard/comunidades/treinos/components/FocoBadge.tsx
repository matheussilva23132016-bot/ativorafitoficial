// app/components/dashboard/comunidades/treinos/components/FocoBadge.tsx
"use client";

import type { FocoTreino } from "../types";
import { FOCOS_LIST } from "../constants";

interface FocoBadgeProps {
  foco: FocoTreino;
  size?: "xs" | "sm" | "md" | "lg";
}

export function FocoBadge({ foco, size = "sm" }: FocoBadgeProps) {
  const config = FOCOS_LIST.find(f => f.id === foco);
  if (!config) return null;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[7px] gap-1",
    sm: "px-2.5 py-1 text-[8px] gap-1.5",
    md: "px-3.5 py-1.5 text-[9px] gap-2",
    lg: "px-4 py-2 text-[10px] gap-2.5",
  };

  const iconSizes = { xs: 9, sm: 10, md: 12, lg: 14 };

  return (
    <span
      className={`inline-flex items-center font-black uppercase italic
        rounded-full border ${config.bg} ${config.border} ${config.cor}
        ${sizeClasses[size]}`}
    >
      <config.icon size={iconSizes[size]} />
      {config.label}
    </span>
  );
}
