/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isso força o Next.js a gerar headers que desativam o cache agressivo no HTML
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;