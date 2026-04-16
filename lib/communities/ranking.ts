import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { emailTemplates, sendMail } from "@/lib/mailer";

export function getSemanaAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diff = dia === 0 ? 6 : dia - 1;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diff);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  return { inicio, fim };
}

function parseCriterio(raw: unknown): any | null {
  if (!raw) return null;
  if (typeof raw !== "string") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const [rows] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [tableName, columnName],
    );
    return Number((rows as any[])[0]?.total ?? 0) > 0;
  } catch {
    return false;
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const [rows] = await db.query(
      `
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
      `,
      [tableName],
    );
    return Number((rows as any[])[0]?.total ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function verificarESelos(userId: string, comunidadeId: string): Promise<void> {
  try {
    const { inicio, fim } = getSemanaAtual();
    const semanaStr = inicio.toISOString().split("T")[0];

    const [rankRows] = await db.query(
      `SELECT *
         FROM ranking_semanal
        WHERE comunidade_id = ?
          AND user_id = ?
          AND semana_inicio = ?`,
      [comunidadeId, userId, semanaStr],
    );

    const rank = (rankRows as any[])[0];
    if (!rank) return;

    const [selosRows] = await db.query(
      `SELECT *
         FROM selos
        WHERE tipo = 'automatico'`,
    );

    for (const selo of selosRows as any[]) {
      const criterio = parseCriterio(selo.criterio);
      if (!criterio?.tipo) continue;

      let ganhou = false;

      switch (criterio.tipo) {
        case "ranking":
          ganhou = criterio.posicao === 1 && rank.posicao_final === 1;
          break;

        case "treino": {
          if (!criterio.semana) break;
          const [tc] = await db.query(
            `SELECT COUNT(*) AS total
               FROM treino_execucoes te
               INNER JOIN treinos t ON t.id = te.treino_id
              WHERE te.user_id = ?
                AND t.comunidade_id = ?
                AND te.concluido = 1
                AND te.concluido_em BETWEEN ? AND ?`,
            [userId, comunidadeId, inicio, fim],
          );
          ganhou = ((tc as any[])[0]?.total ?? 0) > 0;
          break;
        }

        case "desafios": {
          if (criterio.aprovados !== 100) break;
          const taxa =
            rank.desafios_total > 0
              ? (rank.desafios_ok / rank.desafios_total) * 100
              : 0;
          ganhou = taxa === 100 && rank.desafios_total >= 3;
          break;
        }

        case "sequencia": {
          if (!criterio.dias) break;
          const [sq] = await db.query(
            `SELECT COUNT(DISTINCT DATE(ed.created_at)) AS dias
               FROM entregas_desafios ed
              WHERE ed.user_id = ?
                AND ed.status = 'aprovado'
                AND ed.desafio_id IN (
                  SELECT id FROM desafios WHERE comunidade_id = ?
                )
                AND ed.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [userId, comunidadeId, criterio.dias],
          );
          ganhou = ((sq as any[])[0]?.dias ?? 0) >= criterio.dias;
          break;
        }
      }

      if (!ganhou) continue;

      const [jaTemRows] = await db.query(
        `SELECT id
           FROM usuario_selos
          WHERE user_id = ?
            AND comunidade_id = ?
            AND selo_id = ?
            AND semana_ref = ?`,
        [userId, comunidadeId, selo.id, semanaStr],
      );

      if ((jaTemRows as any[]).length) continue;

      await db.query(
        `INSERT INTO usuario_selos (id, user_id, comunidade_id, selo_id, semana_ref)
         VALUES (UUID(), ?, ?, ?, ?)`,
        [userId, comunidadeId, selo.id, semanaStr],
      );

      await criarNotificacao({
        userId,
        comunidadeId,
        tipo: "novo_selo",
        titulo: `Selo Conquistado! ${selo.icone ?? ""}`.trim(),
        mensagem: `Você ganhou o selo "${selo.nome}". ${selo.descricao ?? ""}`.trim(),
        payload: { seloId: selo.id, seloNome: selo.nome },
      });
    }
  } catch (err) {
    console.error("[SELOS_ERROR]", err);
  }
}

export async function fecharSemana(comunidadeId: string): Promise<void> {
  const { inicio } = getSemanaAtual();
  const semanaStr = inicio.toISOString().split("T")[0];

  try {
    const hasReprovacoes = await columnExists("ranking_semanal", "reprovacoes");
    const hasUltimaAprovacao = await columnExists("ranking_semanal", "ultima_aprovacao_em");
    const hasFechado = await columnExists("ranking_semanal", "fechado");
    const hasFechamentos = await tableExists("ranking_fechamentos_semanais");

    const orderParts = [
      "rs.xp_total DESC",
      "rs.desafios_ok DESC",
      hasReprovacoes ? "rs.reprovacoes ASC" : null,
      hasUltimaAprovacao ? "rs.ultima_aprovacao_em ASC" : null,
      "rs.updated_at ASC",
    ].filter(Boolean).join(", ");

    const [rows] = await db.query(
      `SELECT rs.*,
              au.email AS email,
              COALESCE(au.nickname, u.nickname, 'Atleta') AS nickname
         FROM ranking_semanal rs
         LEFT JOIN ativora_users au ON au.id = rs.user_id
         LEFT JOIN usuarios u ON u.id = CAST(rs.user_id AS UNSIGNED)
        WHERE rs.comunidade_id = ?
          AND rs.semana_inicio = ?
        ORDER BY ${orderParts}`,
      [comunidadeId, semanaStr],
    );

    const entries = rows as any[];
    if (!entries.length) return;

    const [comRows] = await db.query(
      `SELECT nome FROM comunidades WHERE id = ?`,
      [comunidadeId],
    );
    const nomeComunidade = (comRows as any[])[0]?.nome ?? "Comunidade";

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isVencedor = i === 0;

      await db.query(
        `UPDATE ranking_semanal
            SET posicao_final = ?,
                vencedor = ?
                ${hasFechado ? ", fechado = 1" : ""}
          WHERE id = ?`,
        [i + 1, isVencedor ? 1 : 0, entry.id],
      );

      if (!isVencedor) continue;

      await verificarESelos(entry.user_id, comunidadeId);

      await criarNotificacao({
        userId: entry.user_id,
        comunidadeId,
        tipo: "campeao_semana",
        titulo: "Campeao da Semana!",
        mensagem: `Você venceu o ranking de ${nomeComunidade} com ${entry.xp_total} XP!`,
        payload: { semana: semanaStr, xp: entry.xp_total },
      });

      if (entry.email) {
        const nome = entry.nickname || "Atleta";
        const tpl = emailTemplates.campeaoSemana(nome, nomeComunidade, entry.xp_total);
        sendMail({ to: entry.email, ...tpl }).catch((err) =>
          console.error("[EMAIL_CAMPEAO_ERROR]", err),
        );
      }
    }

    if (hasFechamentos) {
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + 6);
      const fimStr = fim.toISOString().split("T")[0];
      const vencedor = entries[0];

      await db.query(
        `
          INSERT INTO ranking_fechamentos_semanais
            (id, comunidade_id, semana_inicio, semana_fim, vencedor_user_id, total_participantes, snapshot_json)
          VALUES (UUID(), ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            vencedor_user_id = VALUES(vencedor_user_id),
            total_participantes = VALUES(total_participantes),
            snapshot_json = VALUES(snapshot_json),
            fechado_em = CURRENT_TIMESTAMP
        `,
        [
          comunidadeId,
          semanaStr,
          fimStr,
          vencedor?.user_id ?? null,
          entries.length,
          JSON.stringify(entries.map((entry, index) => ({
            posicao: index + 1,
            user_id: entry.user_id,
            nickname: entry.nickname,
            xp_total: entry.xp_total,
            desafios_ok: entry.desafios_ok,
            desafios_total: entry.desafios_total,
            reprovacoes: entry.reprovacoes ?? 0,
            ultima_aprovacao_em: entry.ultima_aprovacao_em ?? null,
          }))),
        ],
      );
    }

    console.log(
      `[RANKING] Semana ${semanaStr} fechada - ${entries.length} atletas - Comunidade: ${nomeComunidade}`,
    );
  } catch (err) {
    console.error("[FECHAMENTO_SEMANAL_ERROR]", err);
  }
}
