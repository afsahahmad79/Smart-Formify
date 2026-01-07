import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers"; // ⭐ Use client providers here only
import { ConditionalHeaderFooter } from "@/components/conditional-header-footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Formify",
  description: "Dynamic Form Builder with Real-Time Preview",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " bg-background text-foreground"}>
        {/* ⭐ All Clerk + Convex logic is inside Providers.tsx */}
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConditionalHeaderFooter>
              {children}
            </ConditionalHeaderFooter>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
