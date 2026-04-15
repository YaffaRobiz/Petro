"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicles" },
]

export default function NavLinks() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label }) =>
        isActive(href) ? (
          <span
            key={href}
            className="text-sm font-semibold text-gray-900 dark:text-white px-3 py-1.5 rounded-lg border-b-2 border-gray-900 dark:border-white"
          >
            {label}
          </span>
        ) : (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {label}
          </Link>
        )
      )}
    </nav>
  )
}
