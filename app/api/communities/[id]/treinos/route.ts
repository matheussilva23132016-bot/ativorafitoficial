import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";

// GET — Lista treinos da comunidade
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    `, [params.id, userId ?? null]);

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
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { titulo, descricao, dia_semana, foco, status, alvo, alvo_user_id,
            exercicios, criado_por, gerado_por_ia } = await req.json();

    const treinoId = `tr-${Date.now()}`;

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`
        INSERT INTO treinos 
          (id, comunidade_id, criado_por, titulo, descricao, dia_semana, foco, 
           status, alvo, alvo_user_id, gerado_por_ia, ia_revisado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [treinoId, params.id, criado_por, titulo, descricao ?? null,
          dia_semana ?? "Livre", foco ?? "Livre", status ?? "draft",
          alvo ?? "todos", alvo_user_id ?? null,
          gerado_por_ia ? 1 : 0, gerado_por_ia ? 0 : 1]);

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
      if (status === "published") {
        const [membros] = await conn.query(`
          SELECT user_id FROM comunidade_membros 
          WHERE comunidade_id = ? AND status = 'aprovado'
            AND (? = 'todos' OR user_id = ?)
        `, [params.id, alvo ?? "todos", alvo_user_id ?? null]);

        for (const m of membros as any[]) {
          await criarNotificacao({
            userId:       m.user_id,
            comunidadeId: params.id,
            tipo:         "novo_treino",
            titulo:       "Novo Treino Disponível 💪",
            mensagem:     `${titulo} — ${dia_semana ?? "Livre"}`,
            payload:      { treinoId },
          });
        }
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
