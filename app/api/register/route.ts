import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

type Role = "aluno" | "personal" | "nutricionista" | "estagiario" | "influencer";

interface RegisterBody {
  role: string;
  nomeCompleto: string;
  email: string;
  senha: string;
  confirmarSenha?: string;

  nickname?: string;
  genero?: string;
  cidadeEstado?: string;
  dataNascimento?: string;
  fotoUrl?: string | null;

  objetivoPlataforma?: string[];
  interesses?: string[];

  objetivoPrincipal?: string;
  nivelExperiencia?: string;
  pesoKg?: number | string | null;
  alturaCm?: number | string | null;
  restricoesLesoes?: string | null;

  nomeProfissional?: string | null;
  areaAtuacao?: string | null;
  cref?: string | null;
  crn?: string | null;
  modoAtendimento?: string | null;
  bioProfissional?: string | null;

  areaEstagio?: string | null;
  faculdade?: string | null;
  periodoAtual?: string | null;
  supervisorLocal?: string | null;
  miniApresentacao?: string | null;

  nomeCriador?: string | null;
  nichoPrincipal?: string | null;
  plataformas?: string | null;
  seguidoresTotal?: number | string | null;
  tipoConteudo?: string | null;
  miniBio?: string | null;

  aceitouTermos?: boolean;
  aceitouPrivacidade?: boolean;
  exibirNoAtivoraDirect?: boolean;

  // nomes alternativos do front, aceitos para evitar erro
  aceitoTermos?: boolean;
  aceitoPrivacidade?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  termos?: boolean;
  privacidade?: boolean;

  documentoTipo?: string | null;
  documentoNomeArquivo?: string | null;
  documentoUrl?: string | null;
  documentoMimeType?: string | null;
  documentoTamanhoBytes?: number | string | null;
  documentoObservacao?: string | null;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

function normalizeNickname(nickname?: string | null): string | null {
  if (!nickname) return null;
  const value = String(nickname).trim().toLowerCase();
  return value || null;
}

function normalizeRole(role: string): Role | null {
  const value = String(role || "").trim().toLowerCase();

  if (value === "aluno") return "aluno";
  if (value === "personal") return "personal";
  if (value === "nutri" || value === "nutricionista") return "nutricionista";
  if (value === "estagiario") return "estagiario";
  if (value === "influencer") return "influencer";

  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function cleanPrefixedValue(value?: string | null): string | null {
  if (!value) return null;
  return String(value)
    .replace(/^Objetivo:\s*/i, "")
    .replace(/^Nível:\s*/i, "")
    .replace(/^Nivel:\s*/i, "")
    .replace(/^Atendimento:\s*/i, "")
    .trim();
}

function mapObjetivoPlataforma(items?: string[]): string[] {
  if (!Array.isArray(items)) return [];

  const map: Record<string, string> = {
    treinar: "Treinar",
    "encontrar alunos": "Encontrar Alunos",
    "captar clientes": "Captar Clientes",
    "divulgar trabalho": "Divulgar Trabalho",
    "crescer profissionalmente": "Crescer Profissionalmente",
  };

  return items
    .map((item) => map[String(item).trim().toLowerCase()] || String(item).trim())
    .filter(Boolean);
}

function mapInteresses(items: string[] | undefined, role: Role): string[] {
  if (!Array.isArray(items)) return [];

  const base = items.map((item) => String(item).trim()).filter(Boolean);

  const roleMaps: Record<Role, Record<string, string>> = {
    aluno: {
      emagrecimento: "Emagrecimento",
      hipertrofia: "Hipertrofia",
      saúde: "Saúde",
      saude: "Saúde",
      performance: "Performance",
    },
    personal: {
      hipertrofia: "Hipertrofia",
      funcional: "Funcional",
      emagrecimento: "Emagrecimento",
      idosos: "Idosos",
      atletas: "Atletas",
    },
    nutricionista: {
      emagrecimento: "Emagrecimento",
      esportiva: "Esportiva",
      clínica: "Clínica",
      clinica: "Clínica",
      reeducação: "Reeducação",
      reeducacao: "Reeducação",
    },
    estagiario: {
      musculação: "Musculação",
      musculacao: "Musculação",
      atendimento: "Atendimento",
      avaliação: "Avaliação",
      avaliacao: "Avaliação",
      acompanhamento: "Acompanhamento",
    },
    influencer: {
      fitness: "Fitness",
      lifestyle: "Lifestyle",
      motivação: "Motivação",
      motivacao: "Motivação",
      dicas: "Dicas",
      receitas: "Receitas",
    },
  };

  return base.map((item) => {
    const key = item.toLowerCase();
    return roleMaps[role][key] || item;
  });
}

function getBooleanFromBody(...values: unknown[]): boolean {
  return values.some((value) => value === true || value === "true" || value === 1 || value === "1");
}

async function getMinAge(conn: mysql.PoolConnection): Promise<number> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT valor FROM app_settings WHERE chave = 'idade_minima_cadastro' LIMIT 1"
  );

  if (!rows.length) return 18;

  const value = Number(rows[0].valor);
  return Number.isFinite(value) ? value : 18;
}

async function getConsentTypeMap(conn: mysql.PoolConnection) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id, nome FROM consent_types
     WHERE nome IN ('termos_de_uso', 'politica_privacidade', 'exibir_no_ativora_direct')`
  );

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(String(row.nome), Number(row.id));
  }
  return map;
}

async function findObjectiveId(conn: mysql.PoolConnection, nome: string): Promise<number | null> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM objectives WHERE LOWER(nome) = LOWER(?) LIMIT 1",
    [nome]
  );

  return rows.length ? Number(rows[0].id) : null;
}

async function findInterestId(conn: mysql.PoolConnection, nome: string): Promise<number | null> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM interests WHERE LOWER(nome) = LOWER(?) LIMIT 1",
    [nome]
  );

  return rows.length ? Number(rows[0].id) : null;
}

export async function POST(req: Request) {
  let emailForLog: string | null = null;
  let nicknameForLog: string | null = null;
  let conn: mysql.PoolConnection | null = null;

  try {
    const body = (await req.json()) as RegisterBody;

    console.log("BODY RECEBIDO REGISTER:", body);

    const role = normalizeRole(body.role);
    const email = normalizeEmail(body.email);
    const nickname = normalizeNickname(body.nickname);

    emailForLog = email;
    nicknameForLog = nickname;

    const nomeCompleto = toNullableString(body.nomeCompleto);
    const senha = String(body.senha || "");
    const confirmarSenha = String(body.confirmarSenha || "");
    const genero = toNullableString(body.genero);
    const cidadeEstado = toNullableString(body.cidadeEstado);
    const dataNascimento = toNullableString(body.dataNascimento);
    const fotoUrl = toNullableString(body.fotoUrl);

    const aceitouTermos = getBooleanFromBody(
      body.aceitouTermos,
      body.aceitoTermos,
      body.acceptedTerms,
      body.termos
    );

    const aceitouPrivacidade = getBooleanFromBody(
      body.aceitouPrivacidade,
      body.aceitoPrivacidade,
      body.acceptedPrivacy,
      body.privacidade
    );

    const exibirNoAtivoraDirect = getBooleanFromBody(body.exibirNoAtivoraDirect);

    console.log("aceitouTermos:", aceitouTermos);
    console.log("aceitouPrivacidade:", aceitouPrivacidade);
    console.log("exibirNoAtivoraDirect:", exibirNoAtivoraDirect);

    if (!role) {
      return NextResponse.json({ error: "Tipo de perfil inválido." }, { status: 400 });
    }

    if (!nomeCompleto || nomeCompleto.length < 3) {
      return NextResponse.json({ error: "Nome completo inválido." }, { status: 400 });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    if (!senha || !isStrongPassword(senha)) {
      return NextResponse.json(
        {
          error:
            "A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.",
        },
        { status: 400 }
      );
    }

    if (confirmarSenha && senha !== confirmarSenha) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
    }

    if (!aceitouTermos || !aceitouPrivacidade) {
      return NextResponse.json(
        { error: "É obrigatório aceitar os termos e a política de privacidade." },
        { status: 400 }
      );
    }

    if (!cidadeEstado) {
      return NextResponse.json({ error: "Cidade/Estado é obrigatório." }, { status: 400 });
    }

    if (!dataNascimento) {
      return NextResponse.json({ error: "Data de nascimento é obrigatória." }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const minAge = await getMinAge(conn);

    if (calculateAge(dataNascimento) < minAge) {
      await conn.query(
        "INSERT INTO signup_attempts (email, nickname, success, motivo) VALUES (?, ?, 0, ?)",
        [email, nickname, "idade_invalida"]
      );

      await conn.rollback();

      return NextResponse.json(
        { error: `É necessário ter pelo menos ${minAge} anos.` },
        { status: 400 }
      );
    }

    if (nickname) {
      if (nickname.length < 3 || !/^[a-z0-9_.]+$/.test(nickname)) {
        await conn.query(
          "INSERT INTO signup_attempts (email, nickname, success, motivo) VALUES (?, ?, 0, ?)",
          [email, nickname, "nickname_invalido"]
        );

        await conn.rollback();

        return NextResponse.json({ error: "Nickname inválido." }, { status: 400 });
      }

      const [reservedRows] = await conn.query<mysql.RowDataPacket[]>(
        "SELECT id FROM reserved_usernames WHERE LOWER(username) = LOWER(?) LIMIT 1",
        [nickname]
      );

      if (reservedRows.length > 0) {
        await conn.query(
          "INSERT INTO signup_attempts (email, nickname, success, motivo) VALUES (?, ?, 0, ?)",
          [email, nickname, "nickname_reservado"]
        );

        await conn.rollback();

        return NextResponse.json({ error: "Este nickname é reservado." }, { status: 400 });
      }
    }

    const [existingUserRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUserRows.length > 0) {
      await conn.query(
        "INSERT INTO signup_attempts (email, nickname, success, motivo) VALUES (?, ?, 0, ?)",
        [email, nickname, "email_duplicado"]
      );

      await conn.rollback();

      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 400 });
    }

    if (nickname) {
      const [existingNicknameRows] = await conn.query<mysql.RowDataPacket[]>(
        "SELECT id FROM profiles WHERE nickname = ? LIMIT 1",
        [nickname]
      );

      if (existingNicknameRows.length > 0) {
        await conn.query(
          "INSERT INTO signup_attempts (email, nickname, success, motivo) VALUES (?, ?, 0, ?)",
          [email, nickname, "nickname_duplicado"]
        );

        await conn.rollback();

        return NextResponse.json({ error: "Este nickname já está em uso." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(senha, 10);

    const [userResult] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO users (
        email,
        password_hash,
        email_verified,
        account_status,
        failed_login_attempts,
        locked_until,
        last_login_at,
        accepted_terms_at,
        accepted_privacy_at,
        created_at,
        updated_at
      ) VALUES (?, ?, 0, 'pending', 0, NULL, NULL, NOW(), NOW(), NOW(), NOW())`,
      [email, passwordHash]
    );

    const userId = userResult.insertId;

    await conn.query(
      `INSERT INTO profiles (
        user_id,
        role,
        nome_completo,
        nickname,
        foto_url,
        genero,
        cidade_estado,
        data_nascimento,
        bio,
        perfil_publico,
        exibir_marketplace,
        onboarding_concluido,
        ativo,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        role,
        nomeCompleto,
        nickname,
        fotoUrl,
        genero,
        cidadeEstado,
        dataNascimento,
        null,
        exibirNoAtivoraDirect ? 1 : 0,
        exibirNoAtivoraDirect ? 1 : 0,
        1,
        1,
      ]
    );

    if (role === "aluno") {
      await conn.query(
        `INSERT INTO student_profiles (
          user_id,
          objetivo_principal,
          nivel_experiencia,
          peso_kg,
          altura_cm,
          restricoes_lesoes,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          cleanPrefixedValue(body.objetivoPrincipal),
          cleanPrefixedValue(body.nivelExperiencia),
          toNullableNumber(body.pesoKg),
          toNullableNumber(body.alturaCm),
          toNullableString(body.restricoesLesoes),
        ]
      );
    }

    if (role === "personal") {
      await conn.query(
        `INSERT INTO personal_profiles (
          user_id,
          nome_profissional,
          area_atuacao,
          cref,
          modo_atendimento,
          bio_profissional,
          verificado,
          status_verificacao,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'pendente', NOW(), NOW())`,
        [
          userId,
          toNullableString(body.nomeProfissional),
          toNullableString(body.areaAtuacao),
          toNullableString(body.cref),
          cleanPrefixedValue(body.modoAtendimento),
          toNullableString(body.bioProfissional),
        ]
      );
    }

    if (role === "nutricionista") {
      await conn.query(
        `INSERT INTO nutritionist_profiles (
          user_id,
          nome_profissional,
          area_atuacao,
          crn,
          modo_atendimento,
          bio_profissional,
          verificado,
          status_verificacao,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'pendente', NOW(), NOW())`,
        [
          userId,
          toNullableString(body.nomeProfissional),
          toNullableString(body.areaAtuacao),
          toNullableString(body.crn),
          cleanPrefixedValue(body.modoAtendimento),
          toNullableString(body.bioProfissional),
        ]
      );
    }

    if (role === "estagiario") {
      await conn.query(
        `INSERT INTO intern_profiles (
          user_id,
          area_estagio,
          faculdade,
          periodo_atual,
          supervisor_local,
          mini_apresentacao,
          status_validacao,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pendente', NOW(), NOW())`,
        [
          userId,
          toNullableString(body.areaEstagio),
          toNullableString(body.faculdade),
          toNullableString(body.periodoAtual),
          toNullableString(body.supervisorLocal),
          toNullableString(body.miniApresentacao),
        ]
      );
    }

    if (role === "influencer") {
      await conn.query(
        `INSERT INTO influencer_profiles (
          user_id,
          nome_criador,
          nicho_principal,
          plataformas,
          seguidores_total,
          tipo_conteudo,
          mini_bio,
          perfil_verificado,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          userId,
          toNullableString(body.nomeCriador),
          toNullableString(body.nichoPrincipal),
          toNullableString(body.plataformas),
          toNullableNumber(body.seguidoresTotal) ?? 0,
          toNullableString(body.tipoConteudo),
          toNullableString(body.miniBio),
        ]
      );
    }

    const objetivos = mapObjetivoPlataforma(body.objetivoPlataforma);

    for (const objetivo of objetivos) {
      const objectiveId = await findObjectiveId(conn, objetivo);

      if (objectiveId) {
        await conn.query(
          "INSERT IGNORE INTO user_objectives (user_id, objective_id, created_at) VALUES (?, ?, NOW())",
          [userId, objectiveId]
        );
      }
    }

    const interesses = mapInteresses(body.interesses, role);

    for (const interesse of interesses) {
      const interestId = await findInterestId(conn, interesse);

      if (interestId) {
        await conn.query(
          "INSERT IGNORE INTO user_interests (user_id, interest_id, created_at) VALUES (?, ?, NOW())",
          [userId, interestId]
        );
      }
    }

    const consentTypeMap = await getConsentTypeMap(conn);

    await conn.query(
      `INSERT INTO consents (
        user_id,
        consent_type_id,
        tipo_consentimento,
        aceito,
        data_aceite,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, 1, NOW(), NULL, NULL)`,
      [userId, consentTypeMap.get("termos_de_uso") || null, "termos_de_uso"]
    );

    await conn.query(
      `INSERT INTO consents (
        user_id,
        consent_type_id,
        tipo_consentimento,
        aceito,
        data_aceite,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, 1, NOW(), NULL, NULL)`,
      [userId, consentTypeMap.get("politica_privacidade") || null, "politica_privacidade"]
    );

    await conn.query(
      `INSERT INTO consents (
        user_id,
        consent_type_id,
        tipo_consentimento,
        aceito,
        data_aceite,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, NOW(), NULL, NULL)`,
      [
        userId,
        consentTypeMap.get("exibir_no_ativora_direct") || null,
        "exibir_no_ativora_direct",
        exibirNoAtivoraDirect ? 1 : 0,
      ]
    );

    if (body.documentoUrl && body.documentoNomeArquivo && body.documentoTipo) {
      const [documentResult] = await conn.query<mysql.ResultSetHeader>(
        `INSERT INTO documents (
          user_id,
          tipo_documento,
          nome_arquivo,
          arquivo_url,
          mime_type,
          tamanho_bytes,
          status_verificacao,
          observacao,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, NOW(), NOW())`,
        [
          userId,
          toNullableString(body.documentoTipo),
          toNullableString(body.documentoNomeArquivo),
          toNullableString(body.documentoUrl),
          toNullableString(body.documentoMimeType),
          toNullableNumber(body.documentoTamanhoBytes),
          toNullableString(body.documentoObservacao),
        ]
      );

      await conn.query(
        `INSERT INTO document_verifications (
          document_id,
          status,
          verificado_por,
          observacao,
          verificado_em,
          created_at
        ) VALUES (?, 'pendente', NULL, NULL, NULL, NOW())`,
        [documentResult.insertId]
      );
    }

    await conn.query(
      `INSERT INTO signup_attempts (
        email,
        nickname,
        success,
        motivo,
        ip_address,
        user_agent,
        created_at
      ) VALUES (?, ?, 1, 'cadastro_realizado', NULL, NULL, NOW())`,
      [email, nickname]
    );

    await conn.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso.",
        user: {
          id: userId,
          email,
          role,
          nomeCompleto,
          nickname,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no cadastro:", error);

    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error("Erro ao desfazer transação:", rollbackError);
      }
    }

    try {
      if (emailForLog || nicknameForLog) {
        const logConn = conn ?? (await pool.getConnection());

        await logConn.query(
          `INSERT INTO signup_attempts (
            email,
            nickname,
            success,
            motivo,
            ip_address,
            user_agent,
            created_at
          ) VALUES (?, ?, 0, 'erro_interno', NULL, NULL, NOW())`,
          [emailForLog, nicknameForLog]
        );

        if (logConn !== conn) {
          logConn.release();
        }
      }
    } catch (logError) {
      console.error("Erro ao registrar tentativa de cadastro:", logError);
    }

    return NextResponse.json({ error: "Erro interno ao criar conta." }, { status: 500 });
  } finally {
    if (conn) {
      conn.release();
    }
  }
}
