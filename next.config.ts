import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Corrigindo a estrutura para o padrão que a Hostinger/Next.js exigem
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
    ],
  },
  /* Removi as chaves 'eslint' e 'typescript' que estavam dando erro no seu VS Code.
    O Next.js já tem valores padrão seguros para elas.
  */
};

export default nextConfig;