import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/lib/db";
import {
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const BOSS_IMPERSONATION_TOKEN_TYPE = "boss_impersonation";
const BOSS_IMPERSONATION_TTL = "5m";
const AUTH_FALLBACK_SECRET = "ativorafit-dev-fallback-secret";
const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  AUTH_FALLBACK_SECRET;

const normalizeNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "").toLowerCase();

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

export async function POST(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_create_users");
    const body = await req.json();
    const targetIdentifier = String(
      body?.targetUserId || body?.userId || body?.nickname || body?.email || "",
    ).trim();

    if (!targetIdentifier) {
      return NextResponse.json({ error: "Informe o usuário alvo." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      `SELECT id, email, nickname, full_name, role, account_status
       FROM ativora_users
       WHERE id = ?
          OR LOWER(nickname) = LOWER(?)
          OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [targetIdentifier, targetIdentifier, targetIdentifier],
    );

    const target = rows?.[0];
    if (!target) {
      return NextResponse.json({ error: "Usuário alvo não encontrado." }, { status: 404 });
    }

    const targetUserId = String(target.id || "").trim();
    const targetNickname = normalizeNickname(target.nickname);
    const targetRole = String(target.role || "").trim().toLowerCase();
    const targetStatus = String(target.account_status || "active").trim().toLowerCase();

    if (!["active", "ativo"].includes(targetStatus)) {
      return NextResponse.json(
        { error: "A conta alvo está sem acesso liberado no momento." },
        { status: 400 },
      );
    }

    if (targetUserId === String(user.id || "")) {
      return NextResponse.json(
        { error: "Você já está usando esta conta." },
        { status: 400 },
      );
    }

    if (targetRole === "adm") {
      return NextResponse.json(
        { error: "Impersonação liberada apenas para usuários normais." },
        { status: 403 },
      );
    }

    const [bossRows]: any = await db.execute(
      `SELECT id
       FROM boss_access
       WHERE active = 1
         AND (user_id = ? OR LOWER(nickname) = LOWER(?))
       LIMIT 1`,
      [targetUserId, targetNickname],
    );
    if (bossRows?.length) {
      return NextResponse.json(
        { error: "Impersonação liberada apenas para usuários normais." },
        { status: 403 },
      );
    }

    const secret = process.env.BOSS_IMPERSONATE_SECRET || AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Segredo de autenticação não configurado." },
        { status: 500 },
      );
    }

    const token = jwt.sign(
      {
        sub: targetUserId,
        type: BOSS_IMPERSONATION_TOKEN_TYPE,
        actorId: String(user.id || ""),
        actorNickname: access.nickname,
      },
      secret,
      { expiresIn: BOSS_IMPERSONATION_TTL },
    );

    await writeBossAudit({
      actorUserId: String(user.id || ""),
      actorNickname: access.nickname,
      action: "impersonate_user",
      targetUserId,
      targetNickname,
      details: {
        targetRole,
      },
    });

    return NextResponse.json({
      success: true,
      token,
      target: {
        id: targetUserId,
        nickname: targetNickname,
        email: String(target.email || ""),
      },
    });
  } catch (error: any) {
    return jsonError(error, "Não foi possível entrar como este usuário.");
  }
}
