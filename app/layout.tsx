import type { Metadata } from "next";
import { Inter } from "next/font/google";
import DBProvider from "@/components/DBProvider";
import ErrorToast from "@/components/ErrorToast";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Chatify — Votre assistant conversationnel",
  description: "Assistant IA qui répond à vos questions, cherche les infos sur internet, se souvient de vos discussions et s'adapte à votre style — gratuit et sans installation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} data-theme="grok" suppressHydrationWarning>
      <body className="antialiased" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
        <ThemeProvider>
          <DBProvider>
            {children}
            <ErrorToast />
          </DBProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
