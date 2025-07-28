import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amphore - Gestion de Stock",
  description: "Application SaaS pour la gestion de stock de boissons et vins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <ErrorBoundary>
          <div className="flex-1">
            {children}
          </div>
          <footer className="py-2 px-4 text-center">
            <p className="text-xs text-muted-foreground/50">
              Dany-Steven Manfoumbi Vassiliakos
            </p>
          </footer>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
