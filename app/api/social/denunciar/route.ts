import { NextResponse } from "next/server";
import db from "../../../../lib/db"; // CORRIGIDO: 4 níveis para chegar na raiz

export async function POST(req: Request) {
  try {
    const { postId, denunciante, motivo } = await req.json();

    if (!postId || !denunciante || !motivo) {
      return NextResponse.json({ error: "Dados incompletos para denúncia." }, { status: 400 });
    }

    // Protocolo de Segurança: Registra a denúncia na matriz
    await db.execute(
      "INSERT INTO denuncias (post_id, denunciante_nickname, motivo) VALUES (?, ?, ?)",
      [postId, denunciante, motivo]
    );

    return NextResponse.json({ 
      success: true, 
      message: "ALERTA RECEBIDO: O núcleo irá revisar o conteúdo." 
    });
  } catch (error: any) {
    console.error("FALHA NO PROTOCOLO DE DENÚNCIA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}