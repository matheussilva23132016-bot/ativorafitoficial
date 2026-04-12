import { db } from "@/lib/db";

interface CriarNotificacaoParams {
  usuarioId:     string;
  comunidadeId:  string;
  tipo:          string;
  titulo:        string;
  mensagem:      string;
  referenciaId?: string | null;
}

/**
 * Cria uma notificação para um usuário dentro de uma comunidade.
 */
export async function criarNotificacao({
  usuarioId,
  comunidadeId,
  tipo,
  titulo,
  mensagem,
  referenciaId = null,
}: CriarNotificacaoParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO notificacoes
         (usuario_id, comunidade_id, tipo, titulo, mensagem, referencia_id, lida, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, false, NOW())`,
      [usuarioId, comunidadeId, tipo, titulo, mensagem, referenciaId]
    );
  } catch (err) {
    console.error("[criarNotificacao] Erro:", err);
  }
}

/**
 * Marca todas as notificações de um usuário em uma comunidade como lidas.
 */
export async function marcarTodasComoLidas(
  usuarioId:    string,
  comunidadeId: string
): Promise<void> {
  try {
    await db.query(
      `UPDATE notificacoes
          SET lida = true
        WHERE usuario_id = ?
          AND comunidade_id = ?
          AND lida = false`,
      [usuarioId, comunidadeId]
    );
  } catch (err) {
    console.error("[marcarTodasComoLidas] Erro:", err);
  }
}

/**
 * Retorna o total de notificações não lidas de um usuário em uma comunidade.
 */
export async function contarNaoLidas(
  usuarioId:    string,
  comunidadeId: string
): Promise<number> {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
         FROM notificacoes
        WHERE usuario_id = ?
          AND comunidade_id = ?
          AND lida = false`,
      [usuarioId, comunidadeId]
    ) as any[];

    return (rows as any[])[0]?.total ?? 0;
  } catch {
    return 0;
  }
}
