import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const FORBIDDEN_PATTERN =
  /\b(drop|truncate|grant|revoke|shutdown|outfile|infile|dumpfile|load_file|set\s+global|create\s+user|alter\s+user|rename\s+user|kill|flush|handler)\b/i;

const ALLOWED_START_PATTERN =
  /^(select|show|describe|desc|explain|create|alter|insert|update|delete|replace)\b/i;

function splitSqlStatements(sql: string) {
  const statements: string[] = [];
  let current = "";
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (const char of sql) {
    current += char;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) quote = null;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === ";") {
      const statement = current.slice(0, -1).trim();
      if (statement) statements.push(statement);
      current = "";
    }
  }

  const finalStatement = current.trim();
  if (finalStatement) statements.push(finalStatement);

  return statements;
}

function validateStatement(statement: string) {
  const clean = statement.trim();

  if (!clean) return "SQL vazio.";
  if (clean.length > 20000) return "Uma das instruções SQL está muito grande.";
  if (!ALLOWED_START_PATTERN.test(clean)) {
    return "Este console permite SELECT, SHOW, DESCRIBE, EXPLAIN, CREATE, ALTER, INSERT, UPDATE, DELETE e REPLACE.";
  }
  if (FORBIDDEN_PATTERN.test(clean)) {
    return "Comando bloqueado por segurança. Use phpMyAdmin para ações destrutivas extremas.";
  }

  return null;
}

const serializeRows = (rows: any) => {
  if (!Array.isArray(rows)) return rows;
  return rows.slice(0, 100).map((row) => {
    if (!row || typeof row !== "object") return row;

    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === "bigint" ? value.toString() : value instanceof Date ? value.toISOString() : value,
      ]),
    );
  });
};

export async function POST(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_run_sql");
    const body = await req.json();
    const sql = String(body.sql || "").trim();
    const dryRun = Boolean(body.dryRun);

    if (!sql) {
      return NextResponse.json({ error: "Digite uma SQL para executar." }, { status: 400 });
    }

    const statements = splitSqlStatements(sql);

    if (statements.length === 0) {
      return NextResponse.json({ error: "Nenhuma instrução SQL encontrada." }, { status: 400 });
    }

    if (statements.length > 25) {
      return NextResponse.json({ error: "Execute no máximo 25 instruções por vez." }, { status: 400 });
    }

    const errors = statements
      .map((statement, index) => ({ index: index + 1, error: validateStatement(statement) }))
      .filter((item) => item.error);

    if (errors.length) {
      return NextResponse.json({ error: errors[0].error, details: errors }, { status: 400 });
    }

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: dryRun ? "sql_validate" : "sql_execute",
      details: { dryRun, statements: statements.length, preview: sql.slice(0, 1000) },
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        statements: statements.map((statement, index) => ({ index: index + 1, sql: statement })),
      });
    }

    const results = [];

    for (let index = 0; index < statements.length; index += 1) {
      const statement = statements[index];
      const [rows, fields]: any = await db.query(statement);
      const isRows = Array.isArray(rows);

      results.push({
        index: index + 1,
        type: isRows ? "rows" : "result",
        rowCount: isRows ? rows.length : rows?.affectedRows ?? 0,
        affectedRows: rows?.affectedRows,
        insertId: rows?.insertId ? String(rows.insertId) : undefined,
        columns: Array.isArray(fields) ? fields.map((field: any) => field.name) : [],
        rows: isRows ? serializeRows(rows) : undefined,
        truncated: isRows && rows.length > 100,
      });
    }

    return NextResponse.json({ success: true, statements: statements.length, results });
  } catch (error: any) {
    if (error instanceof BossAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: error?.message || "Não foi possível executar a SQL." },
      { status: 500 },
    );
  }
}
