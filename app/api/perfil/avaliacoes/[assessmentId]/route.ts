import { NextResponse } from "next/server";
import {
  assertOwnAssessment,
  getSessionUser,
  loadAssessments,
  normalizeAssessmentPayload,
  saveAssessment,
} from "../_helpers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ assessmentId: string }> | { assessmentId: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { assessmentId } = await params;
    const assessments = await loadAssessments(user.id, assessmentId);
    if (!assessments[0]) return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });

    return NextResponse.json({ success: true, assessment: assessments[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível carregar avaliação." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { assessmentId } = await params;
    const owns = await assertOwnAssessment(user.id, assessmentId);
    if (!owns) return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });

    const body = await req.json();
    const payload = normalizeAssessmentPayload(body, user, assessmentId);
    const assessment = await saveAssessment(user.id, payload);

    return NextResponse.json({ success: true, assessment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível atualizar avaliação." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { assessmentId } = await params;
    const owns = await assertOwnAssessment(user.id, assessmentId);
    if (!owns) return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });

    await db.execute("DELETE FROM perfil_avaliacao_medidas WHERE avaliacao_id = ? AND user_id = ?", [assessmentId, user.id]);
    await db.execute("DELETE FROM perfil_avaliacao_resultados WHERE avaliacao_id = ? AND user_id = ?", [assessmentId, user.id]);
    await db.execute("DELETE FROM perfil_avaliacoes WHERE id = ? AND user_id = ?", [assessmentId, user.id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível remover avaliação." }, { status: 500 });
  }
}
