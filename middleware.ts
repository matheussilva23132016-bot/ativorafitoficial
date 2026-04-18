import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/communities/:path*",
    "/api/perfil",
    "/api/perfil/privacidade/:path*",
    "/api/perfil/salvar/:path*",
  ],
};
