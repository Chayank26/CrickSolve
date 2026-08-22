import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CrickSolve 🏏 - Daily Cricketer Guessing Game',
  description: 'Guess the mystery cricketer in 7 tries with attribute unlocking, numeric stat hints, silhouette reveals, and daily leaderboards.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'CrickSolve 🏏 - Daily Cricketer Guessing Game',
    description: 'Guess the mystery cricketer in 7 tries. Test your cricket knowledge with attribute unlocking and stat hints!',
    url: 'https://cricksolve.vercel.app',
    siteName: 'CrickSolve',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>{children}</body>
    </html>
  );
}
