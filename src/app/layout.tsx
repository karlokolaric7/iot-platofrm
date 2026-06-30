import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IoT Dashboard Platform",
  description: "A comprehensive IoT Device Management and Data Visualization platform",
};

import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { LanguageProvider } from "@/context/language-context";
import { MapSyncProvider } from "@/context/map-sync-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <LanguageProvider>
              <MapSyncProvider>
                <TooltipProvider delay={0}>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </MapSyncProvider>
            </LanguageProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
