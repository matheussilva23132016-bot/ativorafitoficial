import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { CacheBuster } from './components/CacheBuster'; // Importando o protetor de cache
import { NextAuthProvider } from './components/providers/NextAuthProvider';
import { BetaNotice } from './components/BetaNotice';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ativorafit.online'),
  title: 'AtivoraFit | A Evolução na Palma da sua mão',
  description: 'A Evolução na Palma da sua mão! Treinos, nutrição, comunidades e resultados em um só app.',
  icons: {
    icon: [
      { url: '/logo.png?v=ativora-logo-3', type: 'image/png' },
    ],
    shortcut: '/logo.png?v=ativora-logo-3',
    apple: '/logo.png?v=ativora-logo-3',
  },
  openGraph: {
    title: 'AtivoraFit',
    description: 'A Evolução na Palma da sua mão!',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'AtivoraFit',
    description: 'A Evolução na Palma da sua mão!',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 antialiased`}>
        <NextAuthProvider>
          <Toaster theme="dark" position="top-right" richColors />
          {/* O CacheBuster roda em segundo plano garantindo o sangue novo do sistema */}
          <CacheBuster /> 
          <BetaNotice />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
