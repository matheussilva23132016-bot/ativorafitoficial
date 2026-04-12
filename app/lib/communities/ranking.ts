import { db } from "@/lib/db";
import { criarNotificacao } from "./notifications";
import { sendMail, emailTemplates } from "@/lib/mailer";

export function getSemanaAtual(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const dia  = hoje.getDay();
  const diff = dia === 0 ? 6 : dia - 1;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diff);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

export async function verificarESelos(userId: string, comunidadeId: string): Promise<void> {
  try {
    const { inicio, fim } = getSemanaAtual();
    const semanaStr = inicio.toISOString().split("T")[0];

    const [rankRows] = await db.query(`
      SELECT * FROM ranking_semanal
      WHERE comunidade_id = ? AND user_id = ? AND semana_inicio = ?
    `, [comunidadeId, userId, semanaStr]);

    const rank = (rankRows as any[])[0];
    if (!rank) return;

    const [selosRows] = await db.query(
      `SELECT * FROM selos WHERE tipo = 'automatico'`
    );
    const selos = selosRows as any[];

    for (const selo of selos) {
      const criterio =
        typeof selo.criterio === "string"
          ? JSON.parse(selo.criterio)
          : selo.criterio;

      let ganhou = false;

      switch (criterio.tipo) {
        case "ranking":
          if (criterio.posicao === 1 && rank.posicao_final === 1) ganhou = true;
          break;
        case "treino":
          if (criterio.semana) {
            const [tc] = await db.query(`
              SELECT COUNT(*) AS total FROM treino_execucoes te
              INNER JOIN treinos t ON t.id = te.treino_id
              WHERE te.user_id = ? AND t.comunidade_id = ?
                AND te.concluido = 1
                AND te.concluido_em BETWEEN ? AND ?
            `, [userId, comunidadeId, inicio, fim]);
            if ((tc as any[])[0]?.total > 0) ganhou = true;
          }
          break;
        case "desafios":
          if (criterio.aprovados === 100) {
            const taxa =
              rank.desafios_total > 0
                ? (rank.desafios_ok / rank.desafios_total) * 100
                : 0;
            if (taxa === 100 && rank.desafios_total >= 3) ganhou = true;
          }
          break;
        case "sequencia":
          if (criterio.dias) {
            const [sq] = await db.query(`
              SELECT COUNT(DISTINCT DATE(ed.created_at)) AS dias
              FROM entregas_desafios ed
              WHERE ed.user_id = ? AND ed.status = 'aprovado'
                AND ed.desafio_id IN (
                  SELECT id FROM desafios WHERE comunidade_id = ?
                )
                AND ed.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [userId, comunidadeId, criterio.dias]);
            if ((sq as any[])[0]?.dias >= criterio.dias) ganhou = true;
          }
          break;
      }

      if (ganhou) {
        const [jaTemRows] = await db.query(`
          SELECT id FROM usuario_selos
          WHERE user_id = ? AND comunidade_id = ? AND selo_id = ? AND semana_ref = ?
        `, [userId, comunidadeId, selo.id, semanaStr]);

        if (!(jaTemRows as any[]).length) {
          await db.query(`
            INSERT INTO usuario_selos (id, user_id, comunidade_id, selo_id, semana_ref)
            VALUES (UUID(), ?, ?, ?, ?)
          `, [userId, comunidadeId, selo.id, semanaStr]);

          await criarNotificacao({
            userId,
            comunidadeId,
            tipo:     "novo_selo",
            titulo:   `Selo Conquistado! ${selo.icone}`,
            mensagem: `Você ganhou o selo "${selo.nome}". ${selo.descricao}`,
            payload:  { seloId: selo.id, seloNome: selo.nome },
          });
        }
      }
    }
  } catch (err) {
    console.error("[SELOS_ERROR]", err);
  }
}

export async function fecharSemana(comunidadeId: string): Promise<void> {
  const { inicio } = getSemanaAtual();
  const semanaStr  = inicio.toISOString().split("T")[0];

  try {
    const [rows] = await db.query(`
      SELECT rs.*, u.email, u.nickname, u.full_name
      FROM ranking_semanal rs
      LEFT JOIN usuarios u ON u.id = rs.user_id
      WHERE rs.comunidade_id = ? AND rs.semana_inicio = ?
      ORDER BY rs.xp_total DESC, rs.desafios_ok DESC
    `, [comunidadeId, semanaStr]);

    const entries = rows as any[];
    if (!entries.length) return;

    // Busca nome da comunidade
    const [comRows] = await db.query(
      `SELECT nome FROM comunidades WHERE id = ?`, [comunidadeId]
    );
    const nomeComunidade = (comRows as any[])[0]?.nome ?? "Comunidade";

    for (let i = 0; i < entries.length; i++) {
      const isVencedor = i === 0;

      await db.query(`
        UPDATE ranking_semanal
        SET posicao_final = ?, vencedor = ?
        WHERE id = ?
      `, [i + 1, isVencedor ? 1 : 0, entries[i].id]);

      if (isVencedor) {
        await verificarESelos(entries[i].user_id, comunidadeId);

        await criarNotificacao({
          userId:       entries[i].user_id,
          comunidadeId,
          tipo:         "campeao_semana",
          titulo:       "🏆 Campeão da Semana!",
          mensagem:     `Você venceu o ranking de ${nomeComunidade} com ${entries[i].xp_total} XP!`,
          payload:      { semana: semanaStr, xp: entries[i].xp_total },
        });

        // Envia e-mail ao campeão
        if (entries[i].email) {
          const nome = entries[i].nickname || entries[i].full_name || "Atleta";
          const tpl  = emailTemplates.campeaoSemana(
            nome, nomeComunidade, entries[i].xp_total
          );
          sendMail({ to: entries[i].email, ...tpl }).catch(err =>
            console.error("[EMAIL_CAMPEAO_ERROR]", err)
          );
        }
      }
    }

    console.log(
      `[RANKING] Semana ${semanaStr} fechada — ${entries.length} atletas — Comunidade: ${nomeComunidade}`
    );
  } catch (err) {
    console.error("[FECHAMENTO_SEMANAL_ERROR]", err);
  }
}
