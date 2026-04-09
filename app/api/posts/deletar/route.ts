import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(req: Request) {
  try {
    const { postId, username, mediaUrl } = await req.json();

    // 1. Segurança: Verifica se o post realmente pertence ao usuário
    const [post]: any = await db.execute(
      "SELECT id FROM posts WHERE id = ? AND nickname = ?",
      [postId, username]
    );

    if (post.length === 0) {
      return NextResponse.json({ error: "Ação não autorizada na matriz." }, { status: 403 });
    }

    // 2. Deleta o registro no Banco de Dados
    await db.execute("DELETE FROM posts WHERE id = ?", [postId]);

    // 3. Limpeza Física: Se houver mídia, apaga o arquivo na Hostinger
    if (mediaUrl && mediaUrl.startsWith("/uploads/")) {
      try {
        const filePath = join(process.cwd(), "public", mediaUrl);
        await unlink(filePath);
      } catch (e) {
        console.error("Arquivo físico não encontrado ou já removido.");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}