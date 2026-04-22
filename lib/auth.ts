import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthOptions } from "next-auth";
import type { RowDataPacket } from "mysql2";

type AuthUserRow = RowDataPacket & {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  role: string | null;
  nickname: string | null;
  account_status: string | null;
};

const SIXTY_DAYS_IN_SECONDS = 60 * 24 * 60 * 60;
const BOSS_IMPERSONATION_TOKEN_TYPE = "boss_impersonation";
const AUTH_FALLBACK_SECRET = "ativorafit-dev-fallback-secret";
const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  AUTH_FALLBACK_SECRET;

async function tryAuthUpdate(operation: Promise<unknown>) {
  try {
    await operation;
  } catch (error) {
    console.warn("Atualizacao auxiliar de login ignorada:", error);
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identificador: { label: "E-mail ou Nickname", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identificador || !credentials?.senha) {
          throw new Error("Informe e-mail ou nickname e senha.");
        }

        const identificador = credentials.identificador.trim().toLowerCase();
        const [users] = await db.execute<AuthUserRow[]>(
          `SELECT id, email, password_hash, full_name, avatar_url, role, nickname, account_status
           FROM ativora_users
           WHERE email = ? OR nickname = ?
           LIMIT 1`,
          [identificador, identificador],
        );
        const user = users[0];

        if (!user) {
          throw new Error("Conta não encontrada. Verifique e-mail ou nickname.");
        }

        const status = String(user.account_status || "active").toLowerCase();
        if (!["active", "ativo"].includes(status)) {
          throw new Error("Conta sem acesso liberado. Verifique seu cadastro ou fale com o suporte.");
        }

        const isValid = await bcrypt.compare(credentials.senha, user.password_hash);

        if (!isValid) {
          await tryAuthUpdate(db.execute(
            `UPDATE ativora_users
             SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
             WHERE id = ?`,
            [user.id],
          ));
          throw new Error("Senha incorreta. Tente novamente ou use recuperação de senha.");
        }

        await tryAuthUpdate(db.execute(
          `UPDATE ativora_users
           SET failed_login_attempts = 0
           WHERE id = ?`,
          [user.id],
        ));

        await tryAuthUpdate(db.execute(
          `UPDATE ativora_users
           SET last_login_at = NOW()
           WHERE id = ?`,
          [user.id],
        ));

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          image: user.avatar_url,
          role: user.role,
          nickname: user.nickname,
        };
      },
    }),
    CredentialsProvider({
      id: "boss-impersonate",
      name: "Boss Impersonate",
      credentials: {
        token: { label: "Token de Impersonacao", type: "text" },
      },
      async authorize(credentials) {
        const rawToken = String(credentials?.token || "").trim();
        if (!rawToken) {
          throw new Error("Token de acesso ausente.");
        }

        const secret = process.env.BOSS_IMPERSONATE_SECRET || AUTH_SECRET;
        if (!secret) {
          throw new Error("Segredo de autenticação indisponível.");
        }

        let payload: any;
        try {
          payload = jwt.verify(rawToken, secret);
        } catch {
          throw new Error("Token de impersonação inválido ou expirado.");
        }

        if (!payload || payload.type !== BOSS_IMPERSONATION_TOKEN_TYPE || !payload.sub) {
          throw new Error("Token de impersonação inválido.");
        }

        const targetUserId = String(payload.sub || "").trim();
        const [users] = await db.execute<AuthUserRow[]>(
          `SELECT id, email, password_hash, full_name, avatar_url, role, nickname, account_status
           FROM ativora_users
           WHERE id = ?
           LIMIT 1`,
          [targetUserId],
        );
        const user = users[0];

        if (!user) {
          throw new Error("Conta alvo não encontrada.");
        }

        const status = String(user.account_status || "active").toLowerCase();
        if (!["active", "ativo"].includes(status)) {
          throw new Error("A conta alvo está sem acesso liberado.");
        }

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          image: user.avatar_url,
          role: user.role,
          nickname: user.nickname,
          impersonatedById: String(payload.actorId || ""),
          impersonatedByNickname: String(payload.actorNickname || ""),
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nickname = user.nickname;
        token.impersonatedById = user.impersonatedById || null;
        token.impersonatedByNickname = user.impersonatedByNickname || null;
        token.isImpersonating = Boolean(user.impersonatedById);
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nickname = token.nickname;
        session.user.impersonatedById = token.impersonatedById || null;
        session.user.impersonatedByNickname = token.impersonatedByNickname || null;
        session.user.isImpersonating = Boolean(token.isImpersonating);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SIXTY_DAYS_IN_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: SIXTY_DAYS_IN_SECONDS,
  },
  secret: AUTH_SECRET,
};
