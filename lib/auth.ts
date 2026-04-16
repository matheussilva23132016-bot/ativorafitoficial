import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
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
        try {
          if (!credentials?.identificador || !credentials?.senha) {
            return null;
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
            return null;
          }

          const status = String(user.account_status || "active").toLowerCase();
          if (!["active", "ativo"].includes(status)) {
            throw new Error("AUTH_ACCOUNT_INACTIVE");
          }

          const isValid = await bcrypt.compare(credentials.senha, user.password_hash);

          if (!isValid) {
            await tryAuthUpdate(db.execute(
              `UPDATE ativora_users
               SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
               WHERE id = ?`,
              [user.id],
            ));
            return null;
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
        } catch (error) {
          console.error("[NEXTAUTH_AUTHORIZE_ERROR]", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nickname = user.nickname;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nickname = token.nickname;
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
  secret: process.env.NEXTAUTH_SECRET,
};
