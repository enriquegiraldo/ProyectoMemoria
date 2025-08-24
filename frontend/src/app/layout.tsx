import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Memoria Eterna - Preserva tus recuerdos para siempre',
  description: 'Plataforma digital para preservar y compartir recuerdos, fotos y momentos especiales de manera segura y eterna.',
  keywords: 'memoria, recuerdos, fotos, preservación, familia, historia',
  authors: [{ name: 'Memoria Eterna Team' }],
  creator: 'Memoria Eterna',
  publisher: 'Memoria Eterna',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Memoria Eterna - Preserva tus recuerdos para siempre',
    description: 'Plataforma digital para preservar y compartir recuerdos, fotos y momentos especiales de manera segura y eterna.',
    url: '/',
    siteName: 'Memoria Eterna',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Memoria Eterna',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memoria Eterna - Preserva tus recuerdos para siempre',
    description: 'Plataforma digital para preservar y compartir recuerdos, fotos y momentos especiales de manera segura y eterna.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div id="root" className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
