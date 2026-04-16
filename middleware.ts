export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/communities/:path*",
    "/api/perfil",
    "/api/perfil/privacidade/:path*",
    "/api/perfil/salvar/:path*",
  ],
};
