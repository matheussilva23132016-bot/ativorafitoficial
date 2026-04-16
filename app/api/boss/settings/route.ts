import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

export async function GET() {
  try {
    await requireBossAccess("can_manage_app");

    const [rows]: any = await db.execute(
      `SELECT setting_key, setting_value, setting_type, label, description, updated_by, updated_at
       FROM boss_app_settings
       ORDER BY label ASC`,
    );

    return NextResponse.json({ settings: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível carregar configurações.");
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_manage_app");
    const body = await req.json();
    const key = String(body.key || body.settingKey || "").trim();
    const value = body.value;

    if (!/^[a-z0-9_.-]{3,100}$/.test(key)) {
      return NextResponse.json({ error: "Chave de configuração inválida." }, { status: 400 });
    }

    const valueAsString =
      typeof value === "string" ? value : value === undefined ? "" : JSON.stringify(value);

    await db.execute(
      `UPDATE boss_app_settings
       SET setting_value = ?, updated_by = ?
       WHERE setting_key = ?`,
      [valueAsString, user.id, key],
    );

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "update_app_setting",
      details: { key, value: valueAsString.slice(0, 300) },
    });

    return NextResponse.json({ success: true, message: "Configuração atualizada." });
  } catch (error: any) {
    return jsonError(error, "Não foi possível salvar a configuração.");
  }
}
