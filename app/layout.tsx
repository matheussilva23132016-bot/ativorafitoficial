import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}