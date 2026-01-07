"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ModeToggle } from "@/components/ui/mode-toggle"

export function ConditionalHeaderFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboardRoute = pathname?.startsWith("/dashboard")

  return (
    <>
      {/* Hide header and footer on dashboard routes */}
      {!isDashboardRoute && (
        <>
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
        </>
      )}

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {!isDashboardRoute && (
        <footer className="border-t mt-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Smart Formify. All rights reserved.
          </div>
        </footer>
      )}
    </>
  )
}
