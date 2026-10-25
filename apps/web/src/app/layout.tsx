import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import QueryProvider from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
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
      <body className="antialiased bg-background text-foreground font-body">
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
              <FloatingChatbot />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
