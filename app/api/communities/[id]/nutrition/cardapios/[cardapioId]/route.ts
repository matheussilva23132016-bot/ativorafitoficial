import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cardapioId: string }> | { id: string; cardapioId: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const cardapioId = resolvedParams.cardapioId;
  const requesterId = req.nextUrl.searchParams.get("requesterId") ?? "";

  try {
    if (!requesterId) return NextResponse.json({ error: "requesterId obrigatório" }, { status: 400 });
    await ensureCommunityPermission(communityId, requesterId, "nutri:manage");
    await db.query(
      "UPDATE cardapios SET status = 'arquivado' WHERE id = ? AND comunidade_id = ?",
      [cardapioId, communityId],
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
