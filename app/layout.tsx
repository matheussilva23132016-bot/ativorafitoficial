import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CacheBuster } from './components/CacheBuster'; // Importando o protetor de cache

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AtivoraFit | A Evolução do Fitness',
  description: 'A evolução do fitness em um único ecossistema inteligente. Treino, nutrição e performance em nível global.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 antialiased`}>
        {/* O CacheBuster roda em segundo plano garantindo o sangue novo do sistema */}
        <CacheBuster /> 
        {children}
      </body>
    </html>
  );
}