"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Star,
  BarChart2,
  X,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"


const NAV_LINKS = [
  { href: "/",         label: "Home",      icon: LayoutDashboard },
  { href: "/watchlist",label: "Watchlist", icon: Star },
  { href: "/compare",  label: "Compare",   icon: BarChart2 },
]


function MobileMenu() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const [prevPathname, setPrevPathname] = React.useState(pathname)

  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="md:hidden flex items-center justify-center w-8 h-8 text-ink-muted hover:text-ink transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-ink/20 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-paper border-b border-rule z-50 md:hidden animate-slide-up">
            <nav className="p-4 space-y-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-sans font-medium transition-colors",
                    pathname === href
                      ? "bg-ink text-paper"
                      : "text-ink-muted hover:text-ink hover:bg-paper-alt"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}

            </nav>
          </div>
        </>
      )}
    </>
  )
}

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 w-full bg-paper/90 backdrop-blur-sm border-b border-rule-dashed">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="font-serif text-xl text-ink tracking-tighter">Ledger</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-sans font-bold uppercase tracking-widest transition-colors",
                pathname === href
                  ? "bg-ink text-paper"
                  : "text-ink-muted hover:text-ink hover:bg-paper-alt"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
