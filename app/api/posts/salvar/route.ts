import { NextResponse } from "next/server";
import db from "../../../lib/db";

let locationColumnChecked = false;
let canUseLocationColumn = false;

const ensureLocationColumn = async () => {
  if (locationColumnChecked) return canUseLocationColumn;

  try {
    const [columns]: any = await db.execute("SHOW COLUMNS FROM posts LIKE 'location'");

    if (!columns.length) {
      await db.execute("ALTER TABLE posts ADD COLUMN location VARCHAR(120) NULL");
    }

    canUseLocationColumn = true;
  } catch (error: any) {
    console.warn("[posts/salvar] Local não será persistido:", error.message);
    canUseLocationColumn = false;
  } finally {
    locationColumnChecked = true;
  }

  return canUseLocationColumn;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nickname,
      content,
      media_url,
      media_url_before,
      media_type,
      role,
      enquete_pergunta,
      enquete_op1,
      enquete_op2,
      location,
    } = body;

    if (!nickname) {
      return NextResponse.json({ error: "Nickname obrigatório" }, { status: 400 });
    }

    const finalType = media_url ? media_type || "image" : enquete_pergunta ? "poll" : "text";
    const shouldSaveLocation = Boolean(location?.trim()) && (await ensureLocationColumn());
    const columns = [
      "nickname",
      "content",
      "media_url",
      "media_url_before",
      "media_type",
      "role",
      "enquete_pergunta",
      "enquete_op1",
      "enquete_op2",
      "comentarios_count",
    ];
    const values = [
      nickname,
      content || "",
      media_url || null,
      media_url_before || null,
      finalType,
      role || "atleta",
      enquete_pergunta || null,
      enquete_op1 || null,
      enquete_op2 || null,
      0,
    ];

    if (shouldSaveLocation) {
      columns.splice(9, 0, "location");
      values.splice(9, 0, location.trim().slice(0, 120));
    }

    const [result]: any = await db.execute(
      `INSERT INTO posts (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      values
    );

    await db.execute(
      "UPDATE ativora_users SET xp = COALESCE(xp, 0) + 10, xp_score = COALESCE(xp_score, 0) + 10 WHERE nickname = ?",
      [nickname]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error("ERRO AO SALVAR POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
