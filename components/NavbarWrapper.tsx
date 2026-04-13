"use client"

import { usePathname } from "next/navigation"
import Navbar from "./Navbar"

const AUTH_ROUTES = ["/login", "/signup"]

export default function NavbarWrapper() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return null
  return <Navbar />
}
