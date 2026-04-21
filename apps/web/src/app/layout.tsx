import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cinema - Modern AI Booking",
  description: "Book your movie tickets with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
