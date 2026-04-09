import { NextResponse } from "next/server";
import db from "../../../../lib/db"; // CAMINHO RELATIVO BLINDADO (4 níveis)

export async function POST(req: Request) {
  try {
    const { followerNickname, followingNickname } = await req.json();

    if (!followerNickname || !followingNickname) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // 1. VERIFICA SE O ALVO É UMA CONTA PRIVADA
    const [targetUser]: any = await db.execute(
      "SELECT conta_privada FROM usuarios WHERE username = ? LIMIT 1",
      [followingNickname]
    );

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "Atleta não encontrado na matriz" }, { status: 404 });
    }

    const isPrivate = targetUser[0].conta_privada === 1;

    // 2. CHECA SE JÁ EXISTE UMA CONEXÃO (PARA FAZER O TOGGLE)
    const [existingFollow]: any = await db.execute(
      "SELECT id FROM seguidores WHERE seguidor_nickname = ? AND seguido_nickname = ? LIMIT 1",
      [followerNickname, followingNickname]
    );

    if (existingFollow.length > 0) {
      // SE JÁ EXISTE, O USUÁRIO QUER "PARAR DE SEGUIR"
      await db.execute(
        "DELETE FROM seguidores WHERE seguidor_nickname = ? AND seguido_nickname = ?",
        [followerNickname, followingNickname]
      );

      return NextResponse.json({ 
        success: true, 
        following: false, 
        message: "Conexão encerrada" 
      });
    } else {
      // SE NÃO EXISTE, VAMOS "SOLICITAR/SEGUIR"
      const status = isPrivate ? 'pendente' : 'aceito';

      await db.execute(
        "INSERT INTO seguidores (seguidor_nickname, seguido_nickname, status) VALUES (?, ?, ?)",
        [followerNickname, followingNickname, status]
      );

      // --- GATILHO DE NOTIFICAÇÃO (SINAL DE ALERTA) ---
      // Registra na matriz que o destinatário recebeu uma nova interação de 'follow'
      await db.execute(
        "INSERT INTO notificacoes (destinatario_nickname, remetente_nickname, tipo) VALUES (?, ?, ?)",
        [followingNickname, followerNickname, 'follow']
      );

      return NextResponse.json({ 
        success: true, 
        following: !isPrivate, 
        status: status,
        message: isPrivate ? "Solicitação enviada para a matriz" : "Seguindo atleta" 
      });
    }

  } catch (error: any) {
    console.error("FALHA NA CONEXÃO SOCIAL:", error);
    return NextResponse.json({ 
      error: "Erro ao processar conexão social", 
      details: error.message 
    }, { status: 500 });
  }
}