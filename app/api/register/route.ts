import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      senha,
      nomeCompleto,
      nickname,
      genero,
      cidadeEstado,
      dataNascimento,
      role
    } = body;

    if (!email || !senha || !nomeCompleto || !role) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const [userResult]: any = await conn.query(
        `INSERT INTO users (email, password_hash, accepted_terms_at, accepted_privacy_at)
         VALUES (?, ?, NOW(), NOW())`,
        [email.trim().toLowerCase(), passwordHash]
      );

      const userId = userResult.insertId;

      await conn.query(
        `INSERT INTO profiles (user_id, role, nome_completo, nickname, genero, cidade_estado, data_nascimento)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          role,
          nomeCompleto,
          nickname || null,
          genero || null,
          cidadeEstado || null,
          dataNascimento || null
        ]
      );

      if (role === "aluno") {
        await conn.query(
          `INSERT INTO student_profiles (user_id) VALUES (?)`,
          [userId]
        );
      }

      if (role === "personal") {
        await conn.query(
          `INSERT INTO personal_profiles (user_id) VALUES (?)`,
          [userId]
        );
      }

      if (role === "nutricionista") {
        await conn.query(
          `INSERT INTO nutritionist_profiles (user_id) VALUES (?)`,
          [userId]
        );
      }

      if (role === "estagiario") {
        await conn.query(
          `INSERT INTO intern_profiles (user_id) VALUES (?)`,
          [userId]
        );
      }

      if (role === "influencer") {
        await conn.query(
          `INSERT INTO influencer_profiles (user_id) VALUES (?)`,
          [userId]
        );
      }

      await conn.commit();

      return NextResponse.json({ success: true, userId }, { status: 201 });
    } catch (error) {
      await conn.rollback();
      console.error("Erro na transação:", error);
      return NextResponse.json(
        { error: "Erro ao salvar no banco" },
        { status: 500 }
      );
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Erro geral:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}