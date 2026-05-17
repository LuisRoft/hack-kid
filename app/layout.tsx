import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-appearance';
import type { Metadata } from 'next';
import { DM_Sans, Encode_Sans_Condensed, Geist } from 'next/font/google';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const innovator = DM_Sans({
  variable: '--font-innovator',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const encodeSansCondensed = Encode_Sans_Condensed({
  variable: '--font-encode-condensed',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Nimbus — Anticipa el impacto del Fenómeno del Niño',
  description:
    'Convierte pronósticos climáticos en decisiones operativas para infraestructura, logística y salud. Actúa con días de ventaja, no cuando ya es tarde.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn("h-full", "bg-surface-base", "antialiased", innovator.variable, encodeSansCondensed.variable, "font-sans", geist.variable)}
    >
      <head>
        <link
          rel='preload'
          as='image'
          href='/hero-1280.webp'
          type='image/webp'
          fetchPriority='high'
        />
      </head>
      <body className='flex min-h-full flex-col bg-surface-base text-text-primary'>
        <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
