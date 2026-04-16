import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; solicitacaoId: string }> | { id: string; solicitacaoId: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const solicitacaoId = resolvedParams.solicitacaoId;

  try {
    const { status, obs, requesterId } = await req.json();
    await ensureCommunityPermission(communityId, requesterId, "nutri:manage");
    await db.query(
      `
        UPDATE solicitacoes_nutricionais
        SET status = ?, obs = ?, respondido_por = ?, respondido_em = NOW()
        WHERE id = ? AND comunidade_id = ?
      `,
      [status, obs ?? null, requesterId, solicitacaoId, communityId],
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; solicitacaoId: string }> | { id: string; solicitacaoId: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const solicitacaoId = resolvedParams.solicitacaoId;
  const requesterId = req.nextUrl.searchParams.get("requesterId") ?? "";

  try {
    await ensureCommunityPermission(communityId, requesterId, "nutri:manage");
    await db.query(
      "UPDATE solicitacoes_nutricionais SET status = 'rejeitada' WHERE id = ? AND comunidade_id = ?",
      [solicitacaoId, communityId],
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
