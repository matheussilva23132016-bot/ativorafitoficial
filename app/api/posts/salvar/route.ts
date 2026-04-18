import { NextResponse } from "next/server";
import db from "../../../lib/db";

let locationColumnChecked = false;
let canUseLocationColumn = false;
let pollDataColumnChecked = false;
let canUsePollDataColumn = false;

const ensureLocationColumn = async () => {
  if (locationColumnChecked) return canUseLocationColumn;

  try {
    const [columns]: any = await db.execute("SHOW COLUMNS FROM posts LIKE 'location'");
    if (!columns.length) {
      await db.execute("ALTER TABLE posts ADD COLUMN location VARCHAR(120) NULL");
    }
    canUseLocationColumn = true;
  } catch (error: any) {
    console.warn("[posts/salvar] local não sera persistido:", error.message);
    canUseLocationColumn = false;
  } finally {
    locationColumnChecked = true;
  }

  return canUseLocationColumn;
};

const ensurePollDataColumn = async () => {
  if (pollDataColumnChecked) return canUsePollDataColumn;

  try {
    const [columns]: any = await db.execute("SHOW COLUMNS FROM posts LIKE 'poll_data'");
    if (!columns.length) {
      await db.execute("ALTER TABLE posts ADD COLUMN poll_data JSON NULL");
    }
    canUsePollDataColumn = true;
  } catch (error: any) {
    console.warn("[posts/salvar] poll_data não sera persistido:", error.message);
    canUsePollDataColumn = false;
  } finally {
    pollDataColumnChecked = true;
  }

  return canUsePollDataColumn;
};

const sanitizePollPayload = (raw: unknown) => {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    const question = String(parsed?.question || "").trim();
    const options = Array.isArray(parsed?.options)
      ? parsed.options
          .map((item: any) => String(item?.text ?? item ?? "").trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];

    if (!question || options.length < 2) return null;
    return { question, options };
  } catch {
    return null;
  }
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
      poll_data,
      location,
    } = body;

    if (!nickname) {
      return NextResponse.json({ error: "Nickname obrigatório" }, { status: 400 });
    }

    const parsedPoll = sanitizePollPayload(poll_data);
    const normalizedPollQuestion = String(enquete_pergunta || parsedPoll?.question || "").trim();
    const normalizedPollOptionOne = String(enquete_op1 || parsedPoll?.options?.[0] || "").trim();
    const normalizedPollOptionTwo = String(enquete_op2 || parsedPoll?.options?.[1] || "").trim();
    const hasValidPoll = normalizedPollQuestion && normalizedPollOptionOne && normalizedPollOptionTwo;

    const finalType = media_url ? media_type || "image" : hasValidPoll ? "poll" : "text";
    const shouldSaveLocation = Boolean(location?.trim()) && (await ensureLocationColumn());
    const shouldSavePollData = Boolean(parsedPoll) && (await ensurePollDataColumn());

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
      normalizedPollQuestion || null,
      normalizedPollOptionOne || null,
      normalizedPollOptionTwo || null,
      0,
    ];

    if (shouldSaveLocation) {
      columns.splice(9, 0, "location");
      values.splice(9, 0, String(location).trim().slice(0, 120));
    }

    if (shouldSavePollData && parsedPoll) {
      const serializedPoll = JSON.stringify({
        question: parsedPoll.question,
        options: parsedPoll.options.map((text: string, index: number) => ({
          id: index + 1,
          text,
          votes: 0,
        })),
      });
      columns.splice(columns.length - 1, 0, "poll_data");
      values.splice(values.length - 1, 0, serializedPoll);
    }

    const [result]: any = await db.execute(
      `INSERT INTO posts (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      values,
    );

    await db.execute(
      "UPDATE ativora_users SET xp = COALESCE(xp, 0) + 10, xp_score = COALESCE(xp_score, 0) + 10 WHERE nickname = ?",
      [nickname],
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error("ERRO AO SALVAR POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
