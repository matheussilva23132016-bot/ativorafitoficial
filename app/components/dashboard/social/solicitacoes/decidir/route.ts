import { NextResponse } from "next/server";
import db from "../../../../../lib/db"; // 5 níveis para chegar na raiz

export async function POST(req: Request) {
  try {
    const { id, acao } = await req.json(); // acao: 'aceitar' ou 'recusar'

    if (!id || !acao) {
      return NextResponse.json({ error: "Parâmetros insuficientes" }, { status: 400 });
    }

    if (acao === 'aceitar') {
      // Atualiza o status para aceito na matriz social
      await db.execute("UPDATE seguidores SET status = 'aceito' WHERE id = ?", [id]);
      return NextResponse.json({ success: true, message: "Acesso concedido" });
    } else {
      // Remove a solicitação da matriz
      await db.execute("DELETE FROM seguidores WHERE id = ?", [id]);
      return NextResponse.json({ success: true, message: "Solicitação descartada" });
    }
  } catch (error: any) {
    console.error("ERRO NA DECISÃO TÁTICA:", error);
    return NextResponse.json({ error: "Erro ao processar decisão", details: error.message }, { status: 500 });
  }
}