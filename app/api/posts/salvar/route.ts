import { NextResponse } from 'next/server';
import db from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Destruturando os campos (incluindo o media_url_before da evolução)
    const { nickname, content, media_url, media_type, role, media_url_before } = data;

    console.log("RECEBIDO NA MATRIZ:", data);

    if (!nickname) {
      return NextResponse.json({ error: "Nickname ausente." }, { status: 400 });
    }

    // --- PROTOCOLO DE STREAK E XP ---
    try {
      const hoje = new Date();
      const dataHoje = hoje.toISOString().split('T')[0];

      const [userRows]: any = await db.execute(
        "SELECT streak, ultima_atividade FROM usuarios WHERE nickname = ?", 
        [nickname]
      );

      if (userRows.length > 0) {
        let novoStreak = userRows[0].streak || 0;
        const ultimaAtividade = userRows[0].ultima_atividade;

        if (!ultimaAtividade) {
          novoStreak = 1; 
        } else {
          const ultima = new Date(ultimaAtividade).toISOString().split('T')[0];
          
          if (ultima !== dataHoje) {
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);
            const dataOntem = ontem.toISOString().split('T')[0];

            if (ultima === dataOntem) {
              novoStreak += 1; 
            } else {
              novoStreak = 1; 
            }
          }
        }

        // NOVO: Bônus de XP - Evolução vale 50 XP, post comum vale 10 XP
        const ganhoXP = media_url_before ? 50 : 10;

        await db.execute(
          "UPDATE usuarios SET streak = ?, ultima_atividade = ?, xp = xp + ? WHERE nickname = ?",
          [novoStreak, dataHoje, ganhoXP, nickname]
        );
      }
    } catch (streakErr) {
      console.error("FALHA NO MOTOR DE STREAK/XP:", streakErr);
    }

    // --- FUNÇÃO AUXILIAR PARA NOTIFICAR MENÇÕES ---
    const processarMencoes = async (texto: string) => {
      const mencoes = texto.match(/@\w+/g);
      if (mencoes) {
        for (const mencao of mencoes) {
          const alvo = mencao.substring(1);
          if (alvo.toLowerCase() !== nickname.toLowerCase()) {
            await db.execute(
              "INSERT INTO notificacoes (usuario_target, remetente_nickname, tipo, mensagem) VALUES (?, ?, 'mencao', ?)",
              [alvo, nickname, media_url_before ? "mencionou você em uma evolução!" : "mencionou você em um post."]
            );
          }
        }
      }
    };

    // --- INSERÇÃO DO POST (COM SUPORTE A ANTES E DEPOIS) ---
    try {
      // Adicionado media_url_before na query principal
      const [result]: any = await db.execute(
        "INSERT INTO posts (nickname, content, media_url, media_url_before, media_type, role) VALUES (?, ?, ?, ?, ?, ?)",
        [nickname, content || '', media_url || null, media_url_before || null, media_type || 'image', role || 'aluno']
      );
      
      if (content) await processarMencoes(content);
      return NextResponse.json({ success: true, postId: result.insertId });
    } catch (sqlError: any) {
      if (sqlError.message.includes("Unknown column 'content'")) {
        // Fallback para coluna 'conteudo' com suporte a evolução
        const [result]: any = await db.execute(
          "INSERT INTO posts (nickname, conteudo, media_url, media_url_before, media_type, role) VALUES (?, ?, ?, ?, ?, ?)",
          [nickname, content || '', media_url || null, media_url_before || null, media_type || 'image', role || 'aluno']
        );
        
        if (content) await processarMencoes(content);
        return NextResponse.json({ success: true, postId: result.insertId });
      }
      throw sqlError;
    }

  } catch (error: any) {
    console.error("ERRO CRÍTICO NA MATRIZ:", error.message);
    return NextResponse.json({ 
      error: "Falha no núcleo de dados.", 
      detalhes: error.message 
    }, { status: 500 });
  }
}