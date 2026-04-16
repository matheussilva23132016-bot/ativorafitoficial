import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from 'bcryptjs';

const VALID_ROLES = ["aluno", "personal", "instrutor", "nutri", "influencer", "adm"] as const;
type AuthRole = (typeof VALID_ROLES)[number];
type ExistingUserRow = { id: string };

function normalizeRole(value: unknown): AuthRole | null {
  const role = String(value || "").trim().toLowerCase();

  if (role === "nutricionista") return "nutri";
  if (VALID_ROLES.includes(role as AuthRole)) return role as AuthRole;

  return null;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function validatePassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      nomeCompleto, email, senha, nickname, role, termos, privacidade,
      genero, dataNascimento, cidadeEstado, interesses,
      nivel, freq, peso, altura, registro, exp, modalidade, 
      especialidade, seguidores, nicho, rede 
    } = body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedNickname = String(nickname || "").trim().toLowerCase();
    const normalizedRole = normalizeRole(role);
    const birthDate = dataNascimento ? new Date(dataNascimento) : null;

    if (!String(nomeCompleto || "").trim() || String(nomeCompleto).trim().length < 3) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 });
    }

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    }

    if (!validatePassword(String(senha || ""))) {
      return NextResponse.json({ error: 'Use uma senha com 8 caracteres, maiúscula, número e símbolo.' }, { status: 400 });
    }

    if (!/^[a-z0-9_.]{3,30}$/.test(normalizedNickname)) {
      return NextResponse.json({ error: 'Use um nickname com 3 a 30 letras, números, ponto ou underline.' }, { status: 400 });
    }

    if (!normalizedRole) {
      return NextResponse.json({ error: 'Perfil inválido para cadastro.' }, { status: 400 });
    }

    if (birthDate && Number.isNaN(birthDate.getTime())) {
      return NextResponse.json({ error: 'Data de nascimento inválida.' }, { status: 400 });
    }

    if (!termos || !privacidade) {
      return NextResponse.json({ error: 'Aceite os termos e autorize o uso dos dados essenciais.' }, { status: 400 });
    }

    // 1. Verifica duplicidade sem depender do enum gerado no Prisma Client.
    const existing = await prisma.$queryRaw<ExistingUserRow[]>`
      SELECT id
      FROM ativora_users
      WHERE email = ${normalizedEmail} OR nickname = ${normalizedNickname}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'E-mail ou nickname já cadastrado.' }, { status: 400 });
    }

    // 2. Criptografia da senha
    const hashedPassword = await bcrypt.hash(senha, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const fullName = String(nomeCompleto).trim();
    const interessesPayload = Array.isArray(interesses) ? JSON.stringify(interesses) : cleanText(interesses);

    // 3. Inserção parametrizada para permitir o role instrutor mesmo antes do Prisma Client ser regenerado.
    await prisma.$executeRaw`
      INSERT INTO ativora_users (
        id, email, password_hash, full_name, nickname, role, genero,
        data_nascimento, cidade_estado, interesses, nivel, freq,
        peso, altura, registro, exp, modalidade, especialidade,
        seguidores, nicho, rede, xp, nivel_int, account_status
      ) VALUES (
        ${userId}, ${normalizedEmail}, ${hashedPassword}, ${fullName}, ${normalizedNickname}, ${normalizedRole}, ${cleanText(genero)},
        ${birthDate}, ${cleanText(cidadeEstado)}, ${interessesPayload}, ${cleanText(nivel)}, ${cleanText(freq)},
        ${cleanText(peso)}, ${cleanText(altura)}, ${cleanText(registro)}, ${cleanText(exp)}, ${cleanText(modalidade)}, ${cleanText(especialidade)},
        ${cleanText(seguidores)}, ${cleanText(nicho)}, ${cleanText(rede)}, ${0}, ${1}, ${"active"}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      user: { id: userId, full_name: fullName, nickname: normalizedNickname, role: normalizedRole } 
    });

  } catch (error: any) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Não foi possível concluir o cadastro. Verifique se a tabela ativora_users está atualizada.' }, { status: 500 });
  }
}
