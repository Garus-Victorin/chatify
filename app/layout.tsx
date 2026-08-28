import type { Metadata } from "next";
import { Inter } from "next/font/google";
import DBProvider from "@/components/DBProvider";
import ErrorToast from "@/components/ErrorToast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Chatify — Votre assistant conversationnel",
  description: "Assistant IA qui répond à vos questions, cherche les infos sur internet, se souvient de vos discussions et s'adapte à votre style — gratuit et sans installation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-theme="grok" suppressHydrationWarning>
      <body className="bg-white text-[#0a0a0a] antialiased">
        <DBProvider>
          {children}
          <ErrorToast />
        </DBProvider>
      </body>
    </html>
  );
}
