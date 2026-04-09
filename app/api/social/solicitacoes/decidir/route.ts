import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { id, acao } = await req.json();

    if (acao === 'aceitar') {
      // Muda status para 'aceito' e o seguidor passa a ver os posts privados
      await db.execute("UPDATE seguidores SET status = 'aceito' WHERE id = ?", [id]);
      
      // Opcional: Aqui poderíamos disparar uma notificação para quem foi aceito
      
      return NextResponse.json({ success: true, message: "Acesso concedido." });
    } else {
      // Se recusar, removemos o registro da tabela para ele poder tentar seguir de novo no futuro
      await db.execute("DELETE FROM seguidores WHERE id = ?", [id]);
      return NextResponse.json({ success: true, message: "Solicitação removida." });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}