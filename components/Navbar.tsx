import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import NavLinks from "./NavLinks"
import DarkModeToggle from "./DarkModeToggle"

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 w-full">
      <div className="w-full px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Image
              src="/petro_app_icon.png"
              alt="Petro"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </Link>
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
            {user?.user_metadata?.username ?? user?.email}
          </span>
          <DarkModeToggle />
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
