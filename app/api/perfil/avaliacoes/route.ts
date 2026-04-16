import { NextResponse } from "next/server";
import {
  getSessionUser,
  loadAssessments,
  normalizeAssessmentPayload,
  saveAssessment,
} from "./_helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const assessments = await loadAssessments(user.id);
    return NextResponse.json({ success: true, assessments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível carregar avaliações." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const body = await req.json();
    const payload = normalizeAssessmentPayload(body, user);
    const assessment = await saveAssessment(user.id, payload);

    return NextResponse.json({ success: true, assessment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível salvar avaliação." }, { status: 500 });
  }
}
