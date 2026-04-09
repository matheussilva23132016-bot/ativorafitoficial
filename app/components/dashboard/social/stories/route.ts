import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET() {
  try {
    // Busca stories das últimas 24 horas
    const [rows]: any = await db.execute(
      "SELECT id, username, media_url, media_type, role FROM stories WHERE created_at > NOW() - INTERVAL 24 HOUR ORDER BY created_at DESC"
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, media_url, media_type, role } = await req.json();
    await db.execute(
      "INSERT INTO stories (username, media_url, media_type, role) VALUES (?, ?, ?, ?)",
      [username, media_url, media_type, role]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}