import { NextRequest, NextResponse } from "next/server";
import { statusFromCommunityError } from "@/lib/communities/access";
import {
  RequestChatError,
  listRequestChat,
  postRequestChatMessage,
} from "@/lib/communities/request-chat";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> | { id: string; requestId: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const requestId = resolvedParams.requestId;
  const userId = req.nextUrl.searchParams.get("userId") ?? "";

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio." }, { status: 400 });
  }

  try {
    const result = await listRequestChat({
      kind: "treino",
      communityId,
      requestId,
      userId,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    const status =
      error instanceof RequestChatError
        ? error.status
        : statusFromCommunityError(error);
    return NextResponse.json({ error: error?.message || "Falha ao carregar chat." }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> | { id: string; requestId: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const requestId = resolvedParams.requestId;

  try {
    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const userName = String(body?.userName || "").trim();
    const message = String(body?.message || "");

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatorio." }, { status: 400 });
    }

    const savedMessage = await postRequestChatMessage({
      kind: "treino",
      communityId,
      requestId,
      userId,
      userName,
      message,
    });

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (error: any) {
    const status =
      error instanceof RequestChatError
        ? error.status
        : statusFromCommunityError(error);
    return NextResponse.json({ error: error?.message || "Falha ao enviar mensagem." }, { status });
  }
}

