// app/components/dashboard/comunidades/nutricao/CommunityNutricao.tsx
"use client";

import { useMemo, useState } from "react";
import { useNutricao } from "./hooks/useNutricao";
import { AlunoNutricao } from "./components/AlunoNutricao";
import { ProfNutricao  } from "./components/ProfNutricao";
import type { CommunityNutricaoProps } from "./types";
import { UtensilsCrossed, Users } from "lucide-react";

export function CommunityNutricao({
  currentUser,
  userTags,
}: CommunityNutricaoProps) {
  const communityId = currentUser?.activeCommunityId ?? "";
  const userId      = currentUser?.id ?? "";

  const tagsNorm = useMemo(
    () => userTags.map(t => t.toLowerCase()),
    [userTags]
  );

  const powerLevel = useMemo(() => {
    if (tagsNorm.includes("dono")      || tagsNorm.includes("owner"))        return 5;
    if (tagsNorm.includes("adm")       || tagsNorm.includes("admin"))        return 4;
    if (tagsNorm.includes("nutri")     || tagsNorm.includes("nutritionist")) return 3;
    if (tagsNorm.includes("instrutor") || tagsNorm.includes("trainer"))      return 2;
    return 1;
  }, [tagsNorm]);

  const isProfessional = powerLevel >= 2;

  // Profissionais podem alternar entre visão de prof e visão de aluno
  const [visao, setVisao] = useState<"prof" | "aluno">("prof");

  const hook = useNutricao(communityId, userId);

  return (
    <div className="space-y-4">

      {/* Toggle de visão — só aparece para profissionais */}
      {isProfessional && (
        <div className="flex gap-2">
          <button
            onClick={() => setVisao("prof")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-[9px] font-black uppercase tracking-widest transition-all
              ${visao === "prof"
                ? "bg-white/10 text-white border border-white/10"
                : "text-white/25 hover:text-white/50"
              }`}
          >
            <Users size={11} /> Gerenciar Alunos
          </button>
          <button
            onClick={() => setVisao("aluno")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl
              text-[9px] font-black uppercase tracking-widest transition-all
              ${visao === "aluno"
                ? "bg-white/10 text-white border border-white/10"
                : "text-white/25 hover:text-white/50"
              }`}
          >
            <UtensilsCrossed size={11} /> Minha Nutrição
          </button>
        </div>
      )}

      {/* Renderiza conforme visão selecionada */}
      {isProfessional && visao === "prof" ? (
        <ProfNutricao
          currentUser={currentUser}
          communityId={communityId}
          hook={hook}
          userTags={tagsNorm}
        />
      ) : (
        <AlunoNutricao
          currentUser={currentUser}
          communityId={communityId}
          hook={hook}
        />
      )}

    </div>
  );
}
