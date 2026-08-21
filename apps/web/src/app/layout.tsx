import type { Metadata } from 'next';
import { Manrope, Oswald } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
});

export const metadata: Metadata = {
  title: 'PickBros — Pronósticos y recompensas',
  description:
    'Haz tus picks, mantén tu racha y canjea recompensas en la plataforma web de PickBros.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX">
      <body className={`${manrope.variable} ${oswald.variable} antialiased`}>{children}</body>
    </html>
  );
}
