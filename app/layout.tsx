import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { headers } from "next/headers"
import { ThemeProvider } from "@/components/ThemeProvider"
import Navbar from "@/components/Navbar"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Petro — Vehicle Manager",
  description: "Track your vehicles, fuel, and maintenance",
  icons: {
    icon: "/petro_app_icon.png",
    apple: "/petro_app_icon.png",
  },
}

const AUTH_ROUTES = ["/login", "/signup"]

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const showNavbar = !AUTH_ROUTES.includes(pathname)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {showNavbar && <Navbar />}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
