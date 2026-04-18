import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import db from "../../../lib/db";
import { authOptions } from "@/lib/auth";

const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const AVATAR_FOCUS_PREFIX = "atv-focus=";

function clampFocus(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function parseAvatarInput(value: unknown) {
  if (typeof value !== "string") {
    return { src: undefined as string | undefined, hasFocus: false, x: 50, y: 50 };
  }

  const raw = value.trim();
  if (!raw) {
    return { src: undefined as string | undefined, hasFocus: false, x: 50, y: 50 };
  }

  const hashIndex = raw.indexOf("#");
  if (hashIndex === -1) {
    return { src: raw, hasFocus: false, x: 50, y: 50 };
  }

  const src = raw.slice(0, hashIndex) || raw;
  const hash = raw.slice(hashIndex + 1);
  const focusEntry = hash
    .split("&")
    .map(item => item.trim())
    .find(item => item.startsWith(AVATAR_FOCUS_PREFIX));

  if (!focusEntry) {
    return { src, hasFocus: false, x: 50, y: 50 };
  }

  const [xRaw, yRaw] = focusEntry.slice(AVATAR_FOCUS_PREFIX.length).split(",");

  return {
    src,
    hasFocus: true,
    x: clampFocus(xRaw),
    y: clampFocus(yRaw),
  };
}

function applyAvatarFocus(src: string, x: unknown, y: unknown) {
  const cleanSrc = String(src || "").split("#")[0];
  if (!cleanSrc) return cleanSrc;
  return `${cleanSrc}#${AVATAR_FOCUS_PREFIX}${clampFocus(x)},${clampFocus(y)}`;
}

function normalizeNickname(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/^@/, "").toLowerCase();
  return normalized || undefined;
}

async function resolveAvatarUrl(input: unknown) {
  if (typeof input !== "string") return undefined;
  const raw = input.trim();
  if (!raw) return undefined;

  if (!raw.startsWith("data:image/") || !raw.includes("base64,")) {
    return raw;
  }

  const mimeMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (!mimeMatch) throw new Error("Formato de avatar inválido.");

  const base64Data = raw.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  if (!buffer.length) throw new Error("Avatar vazio.");
  if (buffer.length > MAX_AVATAR_BYTES) throw new Error("Avatar muito grande. Limite: 8MB.");

  const extension = mimeMatch[1].split("/")[1]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `profile-${Date.now()}-${crypto.randomUUID()}.${extension.slice(0, 8)}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, fileName), buffer);

  return `/uploads/${fileName}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const nickname = normalizeNickname(body.username);
    const avatarInput = body.avatar_url ?? body.avatar;
    const parsedAvatar = parseAvatarInput(avatarInput);
    const hasFocusPayload = body.avatar_focus_x !== undefined || body.avatar_focus_y !== undefined;
    const focusX = hasFocusPayload ? clampFocus(body.avatar_focus_x) : parsedAvatar.x;
    const focusY = hasFocusPayload ? clampFocus(body.avatar_focus_y) : parsedAvatar.y;
    const normalizedAvatarUrl = await resolveAvatarUrl(parsedAvatar.src);
    const avatarUrl =
      typeof normalizedAvatarUrl === "string" && normalizedAvatarUrl.trim()
        ? hasFocusPayload || parsedAvatar.hasFocus
          ? applyAvatarFocus(normalizedAvatarUrl, focusX, focusY)
          : normalizedAvatarUrl
        : normalizedAvatarUrl;

    const updates: string[] = [];
    const values: any[] = [];

    if (nickname) {
      updates.push("nickname = ?");
      values.push(nickname);
    }

    if (body.bio !== undefined) {
      updates.push("bio = ?");
      values.push(body.bio ? String(body.bio).trim().slice(0, 500) : null);
    }

    if (body.description !== undefined) {
      updates.push("descricao = ?");
      values.push(body.description ? String(body.description).trim() : null);
    }

    if (typeof body.is_private === "boolean") {
      updates.push("is_private = ?");
      values.push(body.is_private ? 1 : 0);
    }

    if (avatarUrl !== undefined) {
      updates.push("avatar_url = ?");
      values.push(avatarUrl);
    }

    if (!updates.length) {
      return NextResponse.json({ success: true, message: "Sem alteracoes." }, { status: 200 });
    }

    values.push(session.user.id);
    await db.execute(
      `UPDATE ativora_users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [rows]: any = await db.execute(
      `SELECT nickname, bio, descricao, avatar_url, is_private
       FROM ativora_users
       WHERE id = ?
       LIMIT 1`,
      [session.user.id],
    );

    const updated = rows?.[0] || null;

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso.",
      url: updated?.avatar_url ?? null,
      user: updated,
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Este nickname já está em uso." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error?.message || "Falha ao salvar perfil." },
      { status: 500 },
    );
  }
}
