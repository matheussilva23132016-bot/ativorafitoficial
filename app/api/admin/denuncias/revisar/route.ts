import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function PUT(req: Request) {
  try {
    const { denunciaId } = await req.json();

    await db.execute(
      "UPDATE denuncias SET status = 'revisado' WHERE id = ?",
      [denunciaId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}