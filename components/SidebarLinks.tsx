"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLink = {
  href: string
  label: string
  icon: React.FC<{ active: boolean }>
  matchFn: (p: string) => boolean
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function CarIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2Z" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </svg>
  )
}

function WrenchIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function ChartBarIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

export default function SidebarLinks({ vehicleHref }: { vehicleHref: string }) {
  const pathname = usePathname()

  const links: NavLink[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: GridIcon,
      matchFn: p => p === "/",
    },
    {
      href: vehicleHref,
      label: "Vehicle",
      icon: CarIcon,
      matchFn: p => p.startsWith("/vehicle") && !p.includes("/maintenance") && !p.includes("/fuel"),
    },
    {
      href: vehicleHref ? `${vehicleHref}/maintenance` : "/vehicles",
      label: "Maintenance",
      icon: WrenchIcon,
      matchFn: p => p.startsWith("/vehicle") && p.includes("/maintenance"),
    },
    {
      href: "/",
      label: "Reports",
      icon: ChartBarIcon,
      matchFn: () => false,
    },
  ]

  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5">
      {links.map(({ href, label, icon: Icon, matchFn }) => {
        const active = matchFn(pathname)
        return (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-gray-100 text-gray-900"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className={active ? "text-green-500" : ""}>
              <Icon active={active} />
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
