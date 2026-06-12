import type { Metadata } from "next";
import { Literata, Inter } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const literata = Literata({ subsets: ["latin"], variable: "--font-serif" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Vibe-Reading",
  description: "Your AI reading buddy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${literata.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#faf6ee] text-[#2b2118] font-sans antialiased">
        <main className="mx-auto max-w-3xl px-6 py-10 pb-28">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
