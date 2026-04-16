import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateProfileProgress,
  cleanText,
  ensureProfileTables,
  mapProfile,
  mapUser,
} from "@/lib/profile/storage";
import type { PerfilComplementar } from "@/lib/profile/types";

export const dynamic = "force-dynamic";

async function getSessionUser() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.id) return null;

  const [rows] = await db.execute(
    `SELECT id, email, full_name, nickname, avatar_url, role, genero, data_nascimento
     FROM ativora_users
     WHERE id = ?
     LIMIT 1`,
    [session.user.id],
  );

  return (rows as any[])[0] ? mapUser((rows as any[])[0]) : null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    await ensureProfileTables();

    const [rows] = await db.execute(
      "SELECT * FROM perfil_complementar WHERE user_id = ? LIMIT 1",
      [user.id],
    );
    const profile = mapProfile((rows as any[])[0], user);

    return NextResponse.json({ success: true, user, profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível carregar o perfil." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    await ensureProfileTables();

    const body = await req.json();
    const dadosCargo = body?.dadosCargo && typeof body.dadosCargo === "object" ? body.dadosCargo : {};
    const profile: PerfilComplementar = {
      userId: user.id,
      role: cleanText(body?.role || user.role, 50) || "aluno",
      objetivoPrincipal: cleanText(body?.objetivoPrincipal, 180),
      nivel: cleanText(body?.nivel, 60),
      frequencia: cleanText(body?.frequencia, 80),
      restricoes: cleanText(body?.restricoes),
      disponibilidade: cleanText(body?.disponibilidade),
      preferenciasTreino: cleanText(body?.preferenciasTreino),
      preferenciasNutricao: cleanText(body?.preferenciasNutricao),
      privacidadeDados: ["privado", "profissionais", "comunidade"].includes(body?.privacidadeDados)
        ? body.privacidadeDados
        : "privado",
      dadosCargo: Object.fromEntries(
        Object.entries(dadosCargo).map(([key, value]) => [cleanText(key, 80), cleanText(value, 1200)]),
      ),
      progresso: 0,
    };
    profile.progresso = calculateProfileProgress(profile);
    const id = cleanText(body?.id, 36) || randomUUID();

    await db.execute(
      `
        INSERT INTO perfil_complementar (
          id, user_id, role, objetivo_principal, nivel, frequencia,
          restricoes, disponibilidade, preferencias_treino, preferencias_nutricao,
          privacidade_dados, dados_cargo_json, progresso
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          role = VALUES(role),
          objetivo_principal = VALUES(objetivo_principal),
          nivel = VALUES(nivel),
          frequencia = VALUES(frequencia),
          restricoes = VALUES(restricoes),
          disponibilidade = VALUES(disponibilidade),
          preferencias_treino = VALUES(preferencias_treino),
          preferencias_nutricao = VALUES(preferencias_nutricao),
          privacidade_dados = VALUES(privacidade_dados),
          dados_cargo_json = VALUES(dados_cargo_json),
          progresso = VALUES(progresso),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        id,
        user.id,
        profile.role,
        profile.objetivoPrincipal || null,
        profile.nivel || null,
        profile.frequencia || null,
        profile.restricoes || null,
        profile.disponibilidade || null,
        profile.preferenciasTreino || null,
        profile.preferenciasNutricao || null,
        profile.privacidadeDados,
        JSON.stringify(profile.dadosCargo),
        profile.progresso,
      ],
    );

    const [rows] = await db.execute(
      "SELECT * FROM perfil_complementar WHERE user_id = ? LIMIT 1",
      [user.id],
    );

    return NextResponse.json({ success: true, user, profile: mapProfile((rows as any[])[0], user) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Não foi possível salvar o perfil." }, { status: 500 });
  }
}
