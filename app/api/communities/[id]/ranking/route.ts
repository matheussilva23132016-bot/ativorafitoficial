import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const semana = req.nextUrl.searchParams.get("semana") ?? "atual";

  try {
    let dateFilter = "";
    if (semana === "atual") {
      const hoje  = new Date();
      const dia   = hoje.getDay();
      const diff  = dia === 0 ? 6 : dia - 1;
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - diff);
      dateFilter = `AND rs.semana_inicio = '${inicio.toISOString().split("T")[0]}'`;
    }

    const [rows] = await db.query(`
      SELECT 
        rs.*,
        u.nickname,
        u.avatar_url,
        u.full_name,
        GROUP_CONCAT(DISTINCT ct.nome ORDER BY ct.nivel_poder DESC SEPARATOR ',') AS tags
      FROM ranking_semanal rs
      LEFT JOIN usuarios u ON u.id = rs.user_id
      LEFT JOIN comunidade_membros cm 
        ON cm.comunidade_id = rs.comunidade_id AND cm.user_id = rs.user_id
      LEFT JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      LEFT JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE rs.comunidade_id = ? ${dateFilter}
      GROUP BY rs.id
      ORDER BY rs.xp_total DESC, rs.desafios_ok DESC
    `, [params.id]);

    const ranking = (rows as any[]).map((r, idx) => ({
      ...r,
      posicao: idx + 1,
      tags:    r.tags ? r.tags.split(",") : ["Participante"],
    }));

    return NextResponse.json({ ranking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
