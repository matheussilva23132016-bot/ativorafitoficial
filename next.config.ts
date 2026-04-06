/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1, stale-while-revalidate=59', 
            // Explicação: O servidor entrega rápido, mas checa atualizações em background
          },
        ],
      },
    ];
  },
};

export default nextConfig;