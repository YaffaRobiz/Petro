import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { headers } from "next/headers"
import { ThemeProvider } from "@/components/ThemeProvider"
import Sidebar from "@/components/Sidebar"
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
  const showSidebar = !AUTH_ROUTES.includes(pathname)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {showSidebar ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="ml-[220px] flex-1 min-h-screen bg-[#f0efe8] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                {children}
              </div>
            </div>
          ) : (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
              {children}
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
