// app/components/dashboard/comunidades/nutricao/CommunityNutricao.tsx
"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Sparkles,
  Target,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useNutricao } from "./hooks/useNutricao";
import { AlunoNutricao } from "./components/AlunoNutricao";
import { ProfNutricao } from "./components/ProfNutricao";
import type { CommunityNutricaoProps } from "./types";

type VisaoNutri = "resumo" | "prof" | "aluno";

const statusSolicitacao: Record<string, string> = {
  pendente: "Aguardando profissional",
  em_andamento: "Em andamento",
  concluida: "Cardapio concluído",
  rejeitada: "solicitação rejeitada",
};

export function CommunityNutricao({
  communityId: communityIdProp,
  currentUser,
  userTags,
}: CommunityNutricaoProps) {
  const communityId = communityIdProp ?? currentUser?.activeCommunityId ?? "";
  const userId = currentUser?.id ?? "";

  const tagsNorm = useMemo(() => userTags.map(tag => tag.toLowerCase()), [userTags]);

  const powerLevel = useMemo(() => {
    if (tagsNorm.includes("dono") || tagsNorm.includes("owner")) return 5;
    if (tagsNorm.includes("adm") || tagsNorm.includes("admin")) return 4;
    if (
      tagsNorm.includes("nutri") ||
      tagsNorm.includes("nutricionista") ||
      tagsNorm.includes("nutritionist") ||
      tagsNorm.includes("personal")
    ) {
      return 3;
    }
    if (tagsNorm.includes("instrutor") || tagsNorm.includes("trainer")) return 2;
    return 1;
  }, [tagsNorm]);

  const isProfessional = powerLevel >= 2;
  const [visao, setVisao] = useState<VisaoNutri>("resumo");

  const hook = useNutricao(
    communityId,
    userId,
    currentUser?.name ?? currentUser?.full_name ?? currentUser?.nickname ?? "Você",
  );

  const acaoPrincipal = useMemo(() => {
    if (isProfessional && hook.solicitacoesPendentes.length > 0) {
      return {
        titulo: "Existem pedidos aguardando revisão",
        descricao: `${hook.solicitacoesPendentes.length} solicitação(oes) pendente(s) para responder.`,
        alvo: "prof" as VisaoNutri,
        botao: "Abrir area profissional",
      };
    }

    if (!isProfessional && !hook.meuCardapio && !hook.minhaSolicitacao) {
      return {
        titulo: "Solicite seu cardápio personalizado",
        descricao: "Preencha objetivo, restrições e medidas para acelerar sua entrega.",
        alvo: "aluno" as VisaoNutri,
        botao: "Abrir minha nutrição",
      };
    }

    if (!isProfessional && hook.meuCardapio) {
      return {
        titulo: "Seu cardápio está ativo",
        descricao: "Acesse as refeições do dia e marque o que já foi concluído.",
        alvo: "aluno" as VisaoNutri,
        botao: "Abrir cardápio",
      };
    }

    return {
      titulo: "Painel nutricional organizado",
      descricao: "Use o resumo para entrar no fluxo certo com menos toques.",
      alvo: isProfessional ? ("prof" as VisaoNutri) : ("aluno" as VisaoNutri),
      botao: "Abrir agora",
    };
  }, [isProfessional, hook.solicitacoesPendentes.length, hook.meuCardapio, hook.minhaSolicitacao]);

  const resumoCards = [
    {
      id: "pendencias",
      label: "Pendencias",
      value: String(hook.solicitacoesPendentes.length),
      detail: "solicitações aguardando",
      icon: Clock3,
      tone: "text-amber-300",
    },
    {
      id: "publicados",
      label: "Publicados",
      value: String(hook.cardapiosPublicados.length),
      detail: "cardápios ativos",
      icon: UtensilsCrossed,
      tone: "text-emerald-300",
    },
    {
      id: "minha-nutri",
      label: "Minha nutrição",
      value: hook.meuCardapio ? "Ativa" : "Pendente",
      detail: hook.meuCardapio ? "cardápio disponível" : "aguardando cardápio",
      icon: Target,
      tone: "text-sky-300",
    },
    {
      id: "solicitacao",
      label: "Solicitacao",
      value: hook.minhaSolicitacao ? statusSolicitacao[hook.minhaSolicitacao.status] || "Em andamento" : "Sem solicitação",
      detail: hook.ultimaMedida ? "medidas registradas" : "sem medidas salvas",
      icon: ClipboardList,
      tone: "text-white/70",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Nutrição da comunidade</p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Painel objetivo para agir rápido no mobile
            </h2>
            <p className="mt-2 max-w-2xl break-words text-xs leading-relaxed text-white/40 [overflow-wrap:anywhere]">
              Informações essenciais, linguagem clara e atalho direto para cada fluxo sem poluição visual.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/55">
            <Sparkles size={12} className="text-sky-300" />
            {isProfessional ? "Modo profissional" : "Modo aluno"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {resumoCards.map(card => {
            const Icon = card.icon;
            return (
              <article key={card.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                <Icon size={16} className={card.tone} />
                <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
                <p className="mt-1 text-sm font-black text-white">{card.value}</p>
                <p className="mt-1 text-[10px] text-white/35">{card.detail}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-[8px] font-black uppercase tracking-widest text-white/35">Ação recomendada</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{acaoPrincipal.titulo}</p>
              <p className="mt-1 text-[10px] text-white/40">{acaoPrincipal.descricao}</p>
            </div>
            <button
              type="button"
              onClick={() => setVisao(acaoPrincipal.alvo)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500/20"
            >
              {acaoPrincipal.botao}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => setVisao("resumo")}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
            visao === "resumo"
              ? "border border-white/10 bg-white/10 text-white"
              : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
          }`}
        >
          <Target size={12} />
          Resumo
        </button>

        {isProfessional && (
          <button
            type="button"
            onClick={() => setVisao("prof")}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
              visao === "prof"
                ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
            }`}
          >
            <Users size={12} />
            Area profissional
          </button>
        )}

        <button
          type="button"
          onClick={() => setVisao("aluno")}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
            visao === "aluno"
              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
              : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
          }`}
        >
          <UtensilsCrossed size={12} />
          Minha nutrição
        </button>
      </section>

      {visao === "resumo" && (
        <section className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setVisao("aluno")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/[0.08]"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Fluxo aluno</p>
            <h3 className="mt-2 text-lg font-black italic text-white">
              Cardapio, pedido e medidas
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Acesso rápido ao que mais importa no dia: refeições, status do pedido e atualizacao corporal.
            </p>
          </button>

          {isProfessional ? (
            <button
              type="button"
              onClick={() => setVisao("prof")}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/[0.08]"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Fluxo profissional</p>
              <h3 className="mt-2 text-lg font-black italic text-white">
                Pedidos, edicao e publicacao
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                Priorize pendências e publique cardápios com menos passos, sem telas excessivas.
              </p>
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Seu progresso</p>
              <h3 className="mt-2 text-lg font-black italic text-white">
                {hook.ultimaMedida ? "Ultima medida registrada" : "Sem medida registrada"}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                {hook.ultimaMedida
                  ? `IMC ${hook.ultimaMedida.imc?.toFixed(1) ?? "-"} e RFM estimado ${hook.ultimaMedida.gorduraEst?.toFixed(1) ?? "-"}%.`
                  : "Preencha suas medidas para melhorar a precisao do plano alimentar."}
              </p>
            </div>
          )}
        </section>
      )}

      {isProfessional && visao === "prof" ? (
        <ProfNutricao
          currentUser={currentUser}
          communityId={communityId}
          hook={hook}
          userTags={tagsNorm}
        />
      ) : null}

      {visao === "aluno" ? (
        <AlunoNutricao
          currentUser={currentUser}
          communityId={communityId}
          hook={hook}
        />
      ) : null}

      {hook.erro && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-200">
          <CheckCircle2 size={12} />
          {hook.erro}
        </div>
      )}
    </div>
  );
}
