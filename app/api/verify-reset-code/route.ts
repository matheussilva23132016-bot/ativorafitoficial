import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../lib/db"; // 3 níveis para chegar na raiz/lib

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // 1. BUSCA O CÓDIGO MAIS RECENTE NA MATRIZ
    // CORREÇÃO: Usando 'id DESC' em vez de 'criado_em', pois o maior ID é sempre o mais novo
    const [rows]: any = await db.execute(
      "SELECT * FROM password_resets WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Nenhum código ativo encontrado para este e-mail." }, { status: 400 });
    }

    const reset = rows[0];

    // 2. VALIDAÇÃO DE TEMPO (Fuso Horário da Hostinger)
    const agora = new Date();
    const expiracao = new Date(reset.expires_at);

    if (agora > expiracao) {
      return NextResponse.json({ error: "Este código já expirou (limite de 15 min)." }, { status: 400 });
    }

    // 3. COMPARAÇÃO DO CÓDIGO (Bcrypt)
    // Comparamos o código digitado com o hash que salvamos no banco
    const isMatch = await bcrypt.compare(code, reset.code_hash);

    if (!isMatch) {
      return NextResponse.json({ error: "Código de verificação incorreto." }, { status: 400 });
    }

    // 4. SUCESSO
    return NextResponse.json({ 
      success: true, 
      message: "Identidade confirmada. Acesso liberado para troca de senha." 
    });

  } catch (error: any) {
    console.error("ERRO NA VALIDAÇÃO:", error);
    return NextResponse.json(
      { error: `Erro na Matriz: ${error.message || "Tente novamente"}` }, 
      { status: 500 }
    );
  }
}