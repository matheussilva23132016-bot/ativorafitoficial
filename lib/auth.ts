import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";

type AuthUserRow = {
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
        if (!credentials?.identificador || !credentials?.senha) {
          throw new Error("Informe e-mail ou nickname e senha.");
        }

        const identificador = credentials.identificador.trim().toLowerCase();
        const users = await prisma.$queryRaw<AuthUserRow[]>`
          SELECT id, email, password_hash, full_name, avatar_url, role, nickname, account_status
          FROM ativora_users
          WHERE email = ${identificador} OR nickname = ${identificador}
          LIMIT 1
        `;
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
          await tryAuthUpdate(prisma.$executeRaw`
            UPDATE ativora_users
            SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
            WHERE id = ${user.id}
          `);
          throw new Error("Senha incorreta. Tente novamente ou use recuperação de senha.");
        }

        await tryAuthUpdate(prisma.$executeRaw`
          UPDATE ativora_users
          SET failed_login_attempts = 0
          WHERE id = ${user.id}
        `);

        await tryAuthUpdate(prisma.$executeRaw`
          UPDATE ativora_users
          SET last_login_at = NOW()
          WHERE id = ${user.id}
        `);

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
