import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Providers } from "./providers"; // ⭐ Use client providers here only

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

            {/* Navbar */}
            <header className="border-b bg-background/70 backdrop-blur-sm sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-xl font-bold hover:text-blue-600 transition"
                >
                  Smart Formify
                </Link>

                <nav className="flex gap-6 text-sm font-medium items-center">
                  <Link href="/" className="hover:text-blue-600 transition">
                    Home
                  </Link>
                  <Link href="/about" className="hover:text-blue-600 transition">
                    About
                  </Link>
                  <Link
                    href="/dashboard"
                    className="hover:text-blue-600 transition"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/contact"
                    className="hover:text-blue-600 transition"
                  >
                    Contact
                  </Link>
                  <ModeToggle />
                </nav>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t mt-12 bg-muted/30">
              <div className="max-w-7xl mx-auto px-6 py-6 text-center text-muted-foreground text-sm">
                © {new Date().getFullYear()} Smart Formify. All rights reserved.
              </div>
            </footer>

          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
