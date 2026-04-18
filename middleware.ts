import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Sessao expirada. Faca login novamente.",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/communities/:path*",
    "/api/perfil",
    "/api/perfil/privacidade/:path*",
    "/api/perfil/salvar/:path*",
  ],
};
