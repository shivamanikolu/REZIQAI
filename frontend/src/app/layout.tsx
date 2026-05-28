import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "REZIQ — Premium AI Career Intelligence Platform",
  description: "Recruiter-grade AI resume intelligence, ATS reverse-engineering, career roadmaps, and forensic skill gap analysis.",
  keywords: "AI resume analyzer, ATS checker, skill gap finder, career intelligence, FAANG recruiter review, resume optimization",
  authors: [{ name: "REZIQ Intelligence" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary selection:bg-accent-soft selection:text-text-primary">
        {children}
      </body>
    </html>
  );
}
