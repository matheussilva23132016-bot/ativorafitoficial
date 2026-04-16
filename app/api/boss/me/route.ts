import { NextResponse } from "next/server";
import { BossAccessError, getBossAccess } from "@/lib/boss/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await getBossAccess();

    return NextResponse.json({
      canAccess: Boolean(access),
      access,
    });
  } catch (error: any) {
    if (error instanceof BossAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error?.message || "Não foi possível verificar o acesso Boss." },
      { status: 500 },
    );
  }
}
