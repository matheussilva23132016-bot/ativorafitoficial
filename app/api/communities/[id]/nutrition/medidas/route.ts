import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statusFromCommunityError } from "@/lib/communities/access";
import { ensureMemberOrNutritionManager, mapMedida } from "../_utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const alunoId = req.nextUrl.searchParams.get("alunoId") ?? "";
  const requesterId = req.nextUrl.searchParams.get("requesterId") ?? alunoId;

  try {
    if (!alunoId) return NextResponse.json({ error: "alunoId obrigatório" }, { status: 400 });
    await ensureMemberOrNutritionManager(communityId, requesterId, alunoId);
    const [rows] = await db.query(
      `
        SELECT *
        FROM medidas_corporais
        WHERE comunidade_id = ? AND user_id = ?
        ORDER BY data DESC, created_at DESC
      `,
      [communityId, alunoId],
    );
    return NextResponse.json({ medidas: (rows as any[]).map(mapMedida) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;

  try {
    const medida = await req.json();
    const alunoId = medida.alunoId ?? medida.user_id ?? "";
    const requesterId = medida.requesterId ?? alunoId;
    await ensureMemberOrNutritionManager(communityId, requesterId, alunoId);

    const medidaId = medida.id || `med-${Date.now()}`;
    await db.query(
      `
        INSERT INTO medidas_corporais (
          id, user_id, comunidade_id, data, peso_kg, altura_cm, cintura_cm,
          quadril_cm, pescoco_cm, imc, rcq, gordura_est, classificacao_rcq,
          metodo_calculo, sexo, objetivo, obs
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          peso_kg = VALUES(peso_kg),
          altura_cm = VALUES(altura_cm),
          cintura_cm = VALUES(cintura_cm),
          quadril_cm = VALUES(quadril_cm),
          pescoco_cm = VALUES(pescoco_cm),
          imc = VALUES(imc),
          rcq = VALUES(rcq),
          gordura_est = VALUES(gordura_est),
          classificacao_rcq = VALUES(classificacao_rcq),
          metodo_calculo = VALUES(metodo_calculo),
          sexo = VALUES(sexo),
          objetivo = VALUES(objetivo),
          obs = VALUES(obs)
      `,
      [
        medidaId,
        alunoId,
        communityId,
        String(medida.data ?? new Date().toISOString()).slice(0, 10),
        medida.peso ?? null,
        medida.altura ?? null,
        medida.cintura ?? null,
        medida.quadril ?? null,
        medida.pescoco ?? null,
        medida.imc ?? null,
        medida.rcq ?? null,
        medida.gorduraEst ?? null,
        medida.classificacaoRCQ ?? null,
        medida.metodoCalculo ?? null,
        medida.sexo === "feminino" ? "feminino" : "masculino",
        medida.objetivo ?? null,
        medida.obs ?? null,
      ],
    );

    return NextResponse.json({ success: true, medida: { ...medida, id: medidaId } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
