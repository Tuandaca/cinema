import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QueryProvider from "@/providers/QueryProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { FloatingChatbot } from "@/components/ai/FloatingChatbot";

export const metadata: Metadata = {
  title: "CoiCine | Premium Cinematic Experience",
  description: "Next-gen AI Cinema Booking Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground`}>
        <QueryProvider>
          <SocketProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <FloatingChatbot />
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
