import { db } from "@/lib/db";

interface NotifPayload {
  userId:       string;
  comunidadeId?: string;
  tipo:         string;
  titulo:       string;
  mensagem:     string;
  payload?:     Record<string, any>;
}

export async function criarNotificacao(data: NotifPayload): Promise<void> {
  try {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await db.query(`
      INSERT INTO notificacoes_comunidade 
        (id, comunidade_id, user_id, tipo, titulo, mensagem, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.comunidadeId ?? null,
      data.userId,
      data.tipo,
      data.titulo,
      data.mensagem,
      data.payload ? JSON.stringify(data.payload) : null,
    ]);
  } catch (err) {
    // Notificação nunca deve quebrar o fluxo principal
    console.error("[NOTIF_ERROR]", err);
  }
}

// Tipos de notificação por perfil
export const NOTIF_TARGETS: Record<string, string[]> = {
  solicitacao_treino:    ["Instrutor", "Personal", "ADM", "Dono"],
  solicitacao_nutricao:  ["Nutri", "ADM", "Dono"],
  entrega_desafio:       ["ADM", "Dono"],
  solicitacao_entrada:   ["ADM", "Dono"],
  novo_treino:           ["Participante"],
  novo_cardapio:         ["Participante"],
  novo_desafio:          ["Participante"],
  entrada_aprovada:      ["Participante"],
  entrada_recusada:      ["Participante"],
  desafio_aprovado:      ["Participante"],
  desafio_reprovado:     ["Participante"],
  subiu_ranking:         ["Participante"],
  novo_selo:             ["Participante"],
};
