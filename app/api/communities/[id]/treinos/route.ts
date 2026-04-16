import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

// GET — Lista treinos da comunidade
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  const userId = req.nextUrl.searchParams.get("userId");

  try {
    const [rows] = await db.query(`
      SELECT t.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', e.id, 'ordem', e.ordem, 'nome', e.nome,
            'series', e.series, 'reps', e.reps, 'descanso', e.descanso,
            'cadencia', e.cadencia, 'rpe', e.rpe, 'video_url', e.video_url, 'obs', e.obs
          )
        ) AS exercicios
      FROM treinos t
      LEFT JOIN exercicios_treino e ON e.treino_id = t.id
      WHERE t.comunidade_id = ?
        AND t.status = 'published'
        AND (t.alvo = 'todos' OR t.alvo_user_id = ?)
      GROUP BY t.id
      ORDER BY FIELD(t.dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo','Livre')
    `, [paramsId, userId ?? null]);

    const treinos = (rows as any[]).map(t => ({
      ...t,
      exercicios: t.exercicios ? JSON.parse(t.exercicios).filter((e: any) => e.id) : [],
    }));

    return NextResponse.json({ treinos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Criar treino
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { id, titulo, descricao, dia_semana, foco, status, alvo, alvo_user_id, aluno_id, obs, solicitacao_id,
            exercicios, criado_por, gerado_por_ia } = await req.json();

    await ensureCommunityPermission(paramsId, criado_por, "treino:manage");

    const treinoId = id || `tr-${Date.now()}`;

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [previousRows] = await conn.query(
        "SELECT status FROM treinos WHERE id = ? AND comunidade_id = ? LIMIT 1",
        [treinoId, paramsId],
      );
      const previousStatus = (previousRows as any[])[0]?.status;

      await conn.query(`
        INSERT INTO treinos
          (id, comunidade_id, criado_por, titulo, descricao, dia_semana, foco,
           status, alvo, alvo_user_id, aluno_id, solicitacao_id, obs, gerado_por_ia, ia_revisado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          titulo = VALUES(titulo),
          descricao = VALUES(descricao),
          dia_semana = VALUES(dia_semana),
          foco = VALUES(foco),
          status = VALUES(status),
          alvo = VALUES(alvo),
          alvo_user_id = VALUES(alvo_user_id),
          aluno_id = VALUES(aluno_id),
          solicitacao_id = VALUES(solicitacao_id),
          obs = VALUES(obs),
          gerado_por_ia = VALUES(gerado_por_ia),
          ia_revisado = VALUES(ia_revisado)
      `, [treinoId, paramsId, criado_por, titulo, descricao ?? null,
          dia_semana ?? "Livre", foco ?? "hipertrofia", status ?? "draft",
          alvo ?? "todos", alvo_user_id ?? null, aluno_id ?? alvo_user_id ?? null,
          solicitacao_id ?? null, obs ?? null, gerado_por_ia ? 1 : 0, gerado_por_ia ? 0 : 1]);

      await conn.query("DELETE FROM exercicios_treino WHERE treino_id = ?", [treinoId]);
      if (exercicios?.length) {
        for (let i = 0; i < exercicios.length; i++) {
          const ex = exercicios[i];
          const exId = `ex-${Date.now()}-${i}`;
          await conn.query(`
            INSERT INTO exercicios_treino 
              (id, treino_id, ordem, nome, series, reps, descanso, cadencia, rpe, video_url, obs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [exId, treinoId, i + 1, ex.nome, ex.series ?? 3, ex.reps ?? "12",
              ex.descanso ?? "60s", ex.cadencia ?? "2020", ex.rpe ?? 7,
              ex.video_url ?? null, ex.obs ?? null]);
        }
      }

      // Se publicado, notifica membros
      if (status === "published" && previousStatus !== "published") {
        const [membros] = await conn.query(`
          SELECT user_id FROM comunidade_membros 
          WHERE comunidade_id = ? AND status = 'aprovado'
            AND (? = 'todos' OR user_id = ?)
        `, [paramsId, alvo ?? "todos", alvo_user_id ?? null]);

        for (const m of membros as any[]) {
          await criarNotificacao({
            userId:       m.user_id,
            comunidadeId: paramsId,
            tipo:         "novo_treino",
            titulo:       "Novo Treino Disponível 💪",
            mensagem:     `${titulo} — ${dia_semana ?? "Livre"}`,
            payload:      { treinoId },
          });
        }
      }

      if (status === "published" && solicitacao_id) {
        await conn.query(
          `
            UPDATE solicitacoes_treino
            SET status = 'concluida', treino_gerado = ?, respondido_por = ?, respondido_em = NOW()
            WHERE id = ? AND comunidade_id = ?
          `,
          [treinoId, criado_por, solicitacao_id, paramsId],
        );
      }

      await conn.commit();
      conn.release();
      return NextResponse.json({ success: true, treinoId });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}
