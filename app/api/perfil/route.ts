import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

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

async function persistAvatarIfBase64(input: unknown) {
  if (typeof input !== "string") return input;
  const raw = input.trim();
  if (!raw) return undefined;
  if (!raw.startsWith("data:image/") || !raw.includes("base64,")) return raw;

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

export async function GET() {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const user = await prisma.ativora_users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nickname: true,
        full_name: true,
        bio: true,
        avatar_url: true,
        xp: true,
        nivel_int: true,
        current_streak: true,
        is_verified: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
    }

    // Busca contagem real de seguidores e seguindo
    const [followerCount, followingCount] = await Promise.all([
      prisma.seguidores.count({
        where: { seguido_nickname: user.nickname || "" }
      }),
      prisma.seguidores.count({
        where: { seguidor_nickname: user.nickname || "", status: 'aceito' }
      })
    ]);

    return NextResponse.json({
      ...user,
      followers: followerCount,
      following: followingCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as any;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bio, avatar_url, nickname, avatar_focus_x, avatar_focus_y } = body;
    const parsedAvatar = parseAvatarInput(avatar_url);
    const hasFocusPayload = avatar_focus_x !== undefined || avatar_focus_y !== undefined;
    const focusX = hasFocusPayload ? clampFocus(avatar_focus_x) : parsedAvatar.x;
    const focusY = hasFocusPayload ? clampFocus(avatar_focus_y) : parsedAvatar.y;
    const normalizedAvatarUrl = await persistAvatarIfBase64(parsedAvatar.src);
    const avatarUrlWithFocus =
      typeof normalizedAvatarUrl === "string" && normalizedAvatarUrl.trim()
        ? (hasFocusPayload || parsedAvatar.hasFocus
          ? applyAvatarFocus(normalizedAvatarUrl, focusX, focusY)
          : normalizedAvatarUrl)
        : undefined;
    const normalizedNickname = typeof nickname === "string"
      ? nickname.trim().replace(/^@/, "").toLowerCase()
      : undefined;

    const updatedUser = await prisma.ativora_users.update({
      where: { id: session.user.id },
      data: {
        bio: typeof bio === "string" ? bio.trim() : bio ?? undefined,
        avatar_url: avatarUrlWithFocus ?? undefined,
        nickname: normalizedNickname || undefined,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        nickname: updatedUser.nickname,
        bio: updatedUser.bio,
        avatar_url: updatedUser.avatar_url
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Este nickname já está em uso." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
