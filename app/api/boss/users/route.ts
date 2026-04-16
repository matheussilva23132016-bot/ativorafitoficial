import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import {
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["aluno", "personal", "instrutor", "nutri", "influencer", "adm"] as const;
type BossCreateRole = (typeof VALID_ROLES)[number];

const normalizeRole = (value: unknown): BossCreateRole => {
  const role = String(value || "aluno").trim().toLowerCase();
  if (role === "nutricionista") return "nutri";
  if (VALID_ROLES.includes(role as BossCreateRole)) return role as BossCreateRole;
  return "aluno";
};

const cleanNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "").toLowerCase();

const cleanEmail = (value: unknown) => String(value || "").trim().toLowerCase();

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

export async function GET(req: Request) {
  try {
    await requireBossAccess();

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();
    const like = `%${q}%`;

    const [rows]: any = await db.execute(
      `SELECT
        id,
        email,
        full_name,
        nickname,
        role,
        account_status,
        avatar_url,
        created_at
       FROM ativora_users
       WHERE (? = '' OR email LIKE ? OR nickname LIKE ? OR full_name LIKE ?)
       ORDER BY created_at DESC
       LIMIT 40`,
      [q, like, like, like],
    );

    return NextResponse.json({ users: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível listar usuários.");
  }
}

export async function POST(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_create_users");
    const body = await req.json();

    const fullName = String(body.fullName || body.nomeCompleto || "").trim();
    const email = cleanEmail(body.email);
    const nickname = cleanNickname(body.nickname);
    const password = String(body.password || body.senha || "");
    const role = normalizeRole(body.role);
    const status = String(body.status || "active").trim().toLowerCase();

    if (fullName.length < 3) {
      return NextResponse.json({ error: "Informe o nome completo." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    if (!/^[a-z0-9_.]{3,30}$/.test(nickname)) {
      return NextResponse.json(
        { error: "Use um nickname com 3 a 30 letras, números, ponto ou underline." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha inicial precisa ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const [existing]: any = await db.execute(
      "SELECT id FROM ativora_users WHERE email = ? OR nickname = ? LIMIT 1",
      [email, nickname],
    );

    if (existing?.length) {
      return NextResponse.json({ error: "E-mail ou nickname já cadastrado." }, { status: 409 });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO ativora_users
        (id, email, password_hash, full_name, nickname, role, account_status, xp, nivel_int, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, NOW())`,
      [userId, email, hashedPassword, fullName, nickname, role, status === "inactive" ? "inactive" : "active"],
    );

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "create_user",
      targetUserId: userId,
      targetNickname: nickname,
      details: { role, status },
    });

    return NextResponse.json({
      success: true,
      user: { id: userId, email, full_name: fullName, nickname, role, account_status: status },
    });
  } catch (error: any) {
    return jsonError(error, "Não foi possível criar a conta.");
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, access } = await requireBossAccess();
    const body = await req.json();
    const id = String(body.id || body.userId || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Informe o ID do usuário." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      "SELECT id, nickname, email, role, account_status FROM ativora_users WHERE id = ? LIMIT 1",
      [id],
    );
    const target = rows?.[0];

    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (String(target.id) === String(user.id) && body.status && String(body.status).toLowerCase() !== "active") {
      return NextResponse.json({ error: "Você não pode bloquear a própria conta." }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];
    const details: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!access.canCreateUsers && access.level !== "owner") {
        return NextResponse.json({ error: "Seu acesso não permite alterar perfil." }, { status: 403 });
      }
      const role = normalizeRole(body.role);
      updates.push("role = ?");
      params.push(role);
      details.role = role;
    }

    if (body.status !== undefined) {
      if (!access.canBanUsers && access.level !== "owner") {
        return NextResponse.json({ error: "Seu acesso não permite alterar status." }, { status: 403 });
      }
      const status = String(body.status || "active").trim().toLowerCase();
      const normalizedStatus = ["active", "inactive", "banned"].includes(status) ? status : "active";
      updates.push("account_status = ?");
      params.push(normalizedStatus);
      details.status = normalizedStatus;
    }

    if (body.password) {
      if (!access.canCreateUsers && access.level !== "owner") {
        return NextResponse.json({ error: "Seu acesso não permite redefinir senha." }, { status: 403 });
      }
      const password = String(body.password);
      if (password.length < 8) {
        return NextResponse.json({ error: "A nova senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password_hash = ?");
      params.push(hashedPassword);
      details.passwordReset = true;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nenhuma alteração enviada." }, { status: 400 });
    }

    params.push(id);

    await db.execute(
      `UPDATE ativora_users
       SET ${updates.join(", ")}
       WHERE id = ?`,
      params,
    );

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "update_user",
      targetUserId: target.id,
      targetNickname: target.nickname,
      details,
    });

    return NextResponse.json({ success: true, message: "Usuário atualizado." });
  } catch (error: any) {
    return jsonError(error, "Não foi possível atualizar o usuário.");
  }
}
