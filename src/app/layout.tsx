import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'KovrovLife — Тёмная социальная сеть',
  description: 'Современная минималистичная веб-соцсеть',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} bg-[#0a0a0a] text-zinc-100 antialiased selection:bg-violet-500/30 selection:text-violet-200`}>
        {children}
      </body>
    </html>
  );
}
