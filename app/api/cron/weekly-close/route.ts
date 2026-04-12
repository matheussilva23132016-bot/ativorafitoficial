import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fecharSemana } from "@/lib/communities/ranking";

// Configurar no vercel.json ou chamar via cron externo todo domingo 23:59
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [comunidades] = await db.query(`
      SELECT id FROM comunidades WHERE status = 'ativa'
    `);

    const results = [];
    for (const com of comunidades as any[]) {
      await fecharSemana(com.id);
      results.push(com.id);
    }

    return NextResponse.json({
      success: true,
      fechadas: results.length,
      comunidades: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
