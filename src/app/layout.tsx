import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientScripts from "@/components/ClientScripts";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "ToolkitHub - Neural Core AI Workspace",
  description: "Professional AI-powered neural core workspace for modern businesses. Advanced AI capabilities with animated neural network interface for content creation, automation, and productivity.",
  manifest: '/manifest.json',
  icons: {
    icon: '/neural-web-icon.svg',
    apple: '/neural-web-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="d5b472f9-e3af-4737-aef5-6261b4342892"
        />
        <ThemeProvider>
          <AuthProvider>
            <ClientScripts />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
