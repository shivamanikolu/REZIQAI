import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://reziqai.vercel.app'),
  title: {
    default: 'REZIQ — AI Resume Intelligence | Skill Gap Finder',
    template: '%s | REZIQ',
  },
  description:
    'REZIQ analyzes your resume against any job description. Get ATS scores, rejection risk analysis, skill gap reports, and a 21-day improvement roadmap. Land more interviews.',
  keywords: [
    'resume analyzer',
    'ATS score checker',
    'skill gap finder',
    'resume optimization',
    'job application tool',
    'AI resume analysis',
    'resume feedback',
    'career tools',
  ],
  authors: [{ name: 'REZIQ' }],
  creator: 'REZIQ',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reziqai.vercel.app',
    title: 'REZIQ — AI Resume Intelligence',
    description:
      'Stop applying blind. REZIQ gives you ATS scores, rejection risk analysis, and a skill gap roadmap in minutes.',
    siteName: 'REZIQ',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'REZIQ — AI Resume Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REZIQ — AI Resume Intelligence',
    description: 'Analyze your resume. Find skill gaps. Land more interviews.',
    images: ['/og-image.png'],
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
    google: 'ADD_YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE_HERE',
  },
  alternates: {
    canonical: 'https://reziqai.vercel.app',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

const schemaMarkup = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'REZIQ',
  url: 'https://reziqai.vercel.app',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered resume analysis platform with skill gap finder, ATS scoring, and 21-day improvement roadmap.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary selection:bg-accent-soft selection:text-text-primary">
        {children}
      </body>
    </html>
  );
}
